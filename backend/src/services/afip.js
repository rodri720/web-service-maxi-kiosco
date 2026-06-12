// backend/src/services/afip.js
const fs = require('fs');
const settings = require('../db/settings');
const sql = require('../../db');

const TIPO_FACTURA_C = 11;
const DOC_CF = 99; // Consumidor Final

// ----------------------------------------------------------------------
// Funciones auxiliares de fechas y QR
// ----------------------------------------------------------------------
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
    ver: 1,
    fecha,
    cuit: parseInt(cuit, 10),
    ptoVta: parseInt(ptoVta, 10),
    tipoCmp,
    nroCmp,
    importe: Number(importe),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: docTipo,
    nroDocRec: parseInt(docNro, 10) || 0,
    tipoCodAut: 'E',
    codAut: parseInt(cae, 10) || 0,
  };
  const b64 = Buffer.from(JSON.stringify(data)).toString('base64');
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}

// ----------------------------------------------------------------------
// Obtener próximo número de comprobante
// ----------------------------------------------------------------------
async function getNextNumber(ptoVta) {
  const mode = await settings.get('afip_mode', 'simulado');
  if (mode === 'simulado') {
    const rows = await sql`
      SELECT MAX(cbte_nro) AS n
      FROM sales
      WHERE pto_vta = ${ptoVta} AND invoice_type = 'C'
    `;
    return (rows[0]?.n || 0) + 1;
  }
  // Modo real: usar SDK para obtener último número
  const afip = await getAfip();
  const last = await afip.ElectronicBilling.getLastVoucher(ptoVta, TIPO_FACTURA_C);
  return (last || 0) + 1;
}

// ----------------------------------------------------------------------
// Instancia de AFIP (modo real)
// ----------------------------------------------------------------------
let afipInstance = null;

async function getAfip() {
  if (afipInstance) return afipInstance;
  const Afip = require('@afipsdk/afip.js');

  const cuit = await settings.get('company_cuit');
  const isProduction = (await settings.get('afip_production')) === '1';
  const mode = await settings.get('afip_mode', 'simulado');

  // Si es simulado, no necesitamos crear la instancia real
  if (mode === 'simulado') {
    throw new Error('No se debe llamar a getAfip() en modo simulado');
  }

  const options = {
    CUIT: isProduction ? cuit : '20409378472', // CUIT de homologación
    production: isProduction,
  };

  if (!isProduction) {
    // Modo pruebas (homologación) no requiere certificado
    options.cert = '';
    options.key = '';
  } else {
    const certPath = await settings.get('afip_cert');
    const keyPath = await settings.get('afip_key');
    if (!certPath || !keyPath) throw new Error('Faltan credenciales AFIP (cert/key)');
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath))
      throw new Error('Cert o key no existen en disco');
    options.cert = fs.readFileSync(certPath, 'utf8');
    options.key = fs.readFileSync(keyPath, 'utf8');
  }

  afipInstance = new Afip(options);
  return afipInstance;
}

// ----------------------------------------------------------------------
// Emisión de factura tipo C (principal)
// ----------------------------------------------------------------------
async function emitFacturaC({ saleTotal, customer }) {
  console.log('[AFIP] Iniciando emisión. Modo:', await settings.get('afip_mode'));
  console.log('[AFIP] Total:', saleTotal, 'Cliente:', customer?.name || 'Consumidor Final');

  const ptoVta = parseInt(await settings.get('pto_vta', '1'), 10);
  const cuit = await settings.get('company_cuit');
  const mode = await settings.get('afip_mode', 'simulado');

  const cbteNro = await getNextNumber(ptoVta);
  console.log('[AFIP] Pto.Vta:', ptoVta, 'Nro comprobante:', cbteNro);

  // Datos del receptor
  let docTipo = DOC_CF;
  let docNro = 0;
  if (customer && customer.doc_number && parseInt(customer.doc_number, 10) > 0) {
    if (customer.doc_type === 'CUIT') docTipo = 80;
    else docTipo = 96; // DNI
    docNro = parseInt(customer.doc_number, 10);
  }

  const importe = +Number(saleTotal).toFixed(2);
  const fechaISO = fmtIso();
  const fecha = fmtDate();

  if (mode === 'simulado') {
    console.log('[AFIP] Modo SIMULADO: generando CAE falso');
    const fakeCAE = '7' + Date.now().toString().slice(-13);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const caeDue = fmtDate(dueDate);
    const qr = buildAfipQR({
      cuit,
      fecha: fechaISO,
      ptoVta,
      tipoCmp: TIPO_FACTURA_C,
      nroCmp: cbteNro,
      importe,
      docTipo,
      docNro,
      cae: fakeCAE,
    });
    console.log('[AFIP] CAE simulado:', fakeCAE);
    return {
      simulated: true,
      pto_vta: ptoVta,
      cbte_nro: cbteNro,
      cae: fakeCAE,
      cae_due: caeDue,
      qr,
      total: importe,
    };
  }

  // Modo real (requiere certificado y @afipsdk/afip.js instalado)
  console.log('[AFIP] Modo REAL: consultando ARCA...');
  const afip = await getAfip();
  const payload = {
    CantReg: 1,
    PtoVta: ptoVta,
    CbteTipo: TIPO_FACTURA_C,
    Concepto: 1,
    DocTipo: docTipo,
    DocNro: docNro,
    CbteDesde: cbteNro,
    CbteHasta: cbteNro,
    CbteFch: parseInt(fecha, 10),
    ImpTotal: importe,
    ImpTotConc: 0,
    ImpNeto: importe,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1,
  };
  console.log('[AFIP] Payload enviado a ARCA:', JSON.stringify(payload, null, 2));
  const response = await afip.ElectronicBilling.createVoucher(payload);
  console.log('[AFIP] Respuesta de ARCA:', JSON.stringify(response, null, 2));

  const qr = buildAfipQR({
    cuit,
    fecha: fechaISO,
    ptoVta,
    tipoCmp: TIPO_FACTURA_C,
    nroCmp: cbteNro,
    importe,
    docTipo,
    docNro,
    cae: response.CAE,
  });

  return {
    simulated: false,
    pto_vta: ptoVta,
    cbte_nro: cbteNro,
    cae: response.CAE,
    cae_due: response.CAEFchVto,
    qr,
    total: importe,
  };
}

module.exports = { emitFacturaC, buildAfipQR, TIPO_FACTURA_C };