// Servicio de facturacion AFIP/ARCA - Factura C (Monotributo)
// Soporta dos modos: 'simulado' (CAE falso para desarrollo) y 'afip' (real, requiere cert+key+CUIT)
const fs = require('fs');
const path = require('path');
const settings = require('../db/settings');
const sql = require('../../db'); // para consultar último número en modo simulado

const TIPO_FACTURA_C = 11;
const DOC_DNI = 96;
const DOC_CUIT = 80;
const DOC_CF = 99;

let afipInstance = null;

async function getAfip() {
  if (afipInstance) return afipInstance;
  const Afip = require('@afipsdk/afip.js');
  const cuit = parseInt(await settings.get('company_cuit'), 10);
  const certPath = await settings.get('afip_cert');
  const keyPath = await settings.get('afip_key');
  const production = (await settings.get('afip_production')) === '1';
  if (!cuit || !certPath || !keyPath) throw new Error('Faltan credenciales AFIP (CUIT/cert/key)');
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath))
    throw new Error('Cert o key no existen en disco');
  afipInstance = new Afip({
    CUIT: cuit,
    cert: fs.readFileSync(certPath, 'utf8'),
    key: fs.readFileSync(keyPath, 'utf8'),
    production,
  });
  return afipInstance;
}

function fmtDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
function fmtIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function buildAfipQR({ cuit, fecha, ptoVta, tipoCmp, nroCmp, importe, docTipo, docNro, cae }) {
  const data = {
    ver: 1, fecha, cuit: parseInt(cuit, 10),
    ptoVta: parseInt(ptoVta, 10), tipoCmp, nroCmp,
    importe: Number(importe), moneda: 'PES', ctz: 1,
    tipoDocRec: docTipo, nroDocRec: parseInt(docNro, 10) || 0,
    tipoCodAut: 'E', codAut: parseInt(cae, 10) || 0,
  };
  const b64 = Buffer.from(JSON.stringify(data)).toString('base64');
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}

async function getNextNumber(ptoVta, tipoCmp) {
  const mode = await settings.get('afip_mode', 'simulado');
  if (mode === 'simulado') {
    const rows = await sql`
      SELECT MAX(cbte_nro) AS n
      FROM sales
      WHERE pto_vta = ${ptoVta} AND invoice_type = 'C'
    `;
    return (rows[0]?.n || 0) + 1;
  }
  const afip = await getAfip();
  const last = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipoCmp);
  return (last || 0) + 1;
}

async function emitFacturaC({ saleTotal, customer }) {
  const ptoVta = parseInt(await settings.get('pto_vta', '1'), 10);
  const cuit = await settings.get('company_cuit');
  const mode = await settings.get('afip_mode', 'simulado');

  let docTipo = DOC_CF, docNro = 0;
  if (customer && customer.doc_number && parseInt(customer.doc_number, 10) > 0) {
    if (customer.doc_type === 'CUIT') { docTipo = DOC_CUIT; docNro = customer.doc_number; }
    else { docTipo = DOC_DNI; docNro = customer.doc_number; }
  }

  const cbteNro = await getNextNumber(ptoVta, TIPO_FACTURA_C);
  const fecha = fmtDate();
  const importe = +Number(saleTotal).toFixed(2);

  if (mode === 'simulado') {
    const fakeCAE = '7' + Date.now().toString().slice(-13);
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 10);
    const due = fmtDate(dueDate);
    const qr = buildAfipQR({
      cuit, fecha: fmtIso(), ptoVta, tipoCmp: TIPO_FACTURA_C,
      nroCmp: cbteNro, importe, docTipo, docNro, cae: fakeCAE,
    });
    return {
      simulated: true,
      pto_vta: ptoVta, cbte_nro: cbteNro,
      cae: fakeCAE, cae_due: due,
      qr, total: importe,
    };
  }

  // Modo real AFIP
  const afip = await getAfip();
  const data = {
    CantReg: 1, PtoVta: ptoVta, CbteTipo: TIPO_FACTURA_C, Concepto: 1,
    DocTipo: docTipo, DocNro: parseInt(docNro, 10) || 0,
    CbteDesde: cbteNro, CbteHasta: cbteNro, CbteFch: parseInt(fecha, 10),
    ImpTotal: importe, ImpTotConc: 0, ImpNeto: importe, ImpOpEx: 0, ImpIVA: 0, ImpTrib: 0,
    MonId: 'PES', MonCotiz: 1,
  };
  const res = await afip.ElectronicBilling.createVoucher(data);
  const qr = buildAfipQR({
    cuit, fecha: fmtIso(), ptoVta, tipoCmp: TIPO_FACTURA_C,
    nroCmp: cbteNro, importe, docTipo, docNro, cae: res.CAE,
  });
  return {
    simulated: false,
    pto_vta: ptoVta, cbte_nro: cbteNro,
    cae: res.CAE, cae_due: res.CAEFchVto,
    qr, total: importe,
  };
}

module.exports = { emitFacturaC, buildAfipQR, TIPO_FACTURA_C };