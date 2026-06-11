const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

function pad(n, w) { return String(n).padStart(w, '0'); }
function money(n) { return '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

async function buildInvoicePDF({ sale, items, customer, company }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  const done = new Promise(res => doc.on('end', () => res(Buffer.concat(chunks))));

  const isFiscal = !!sale.cae;
  const letra = sale.invoice_type || 'X';

  // Encabezado con caja de letra
  doc.rect(40, 40, 515, 90).stroke();
  doc.moveTo(297, 40).lineTo(297, 130).stroke();
  // Letra
  doc.rect(270, 50, 55, 50).stroke();
  doc.fontSize(36).font('Helvetica-Bold').text(letra, 270, 58, { width: 55, align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`COD. 011`, 270, 105, { width: 55, align: 'center' });

  // Empresa (izquierda)
  doc.fontSize(14).font('Helvetica-Bold').text(company.company_name || '-', 50, 50);
  doc.fontSize(9).font('Helvetica');
  doc.text(`Domicilio: ${company.company_address || '-'}`, 50, 70);
  doc.text(`Cond. IVA: ${company.company_iva || 'Monotributo'}`, 50, 84);
  doc.text(`CUIT: ${company.company_cuit || '-'}`, 50, 98);

  // Comprobante (derecha)
  doc.fontSize(14).font('Helvetica-Bold').text(
    isFiscal ? `FACTURA ${letra}` : `TICKET INTERNO`, 340, 50, { width: 215 });
  doc.fontSize(10).font('Helvetica');
  if (isFiscal) {
    doc.text(`Pto. Vta: ${pad(sale.pto_vta, 5)}   Comp. Nro: ${pad(sale.cbte_nro, 8)}`, 340, 70);
  } else {
    doc.text(`Nro. interno: ${pad(sale.id, 8)}`, 340, 70);
  }
  doc.text(`Fecha: ${new Date(sale.created_at).toLocaleString('es-AR')}`, 340, 86);

  // Cliente
  doc.rect(40, 140, 515, 50).stroke();
  doc.fontSize(9).font('Helvetica-Bold').text('Cliente:', 50, 148);
  doc.font('Helvetica');
  if (customer) {
    doc.text(`${customer.name}`, 100, 148);
    doc.text(`${customer.doc_type}: ${customer.doc_number}    Cond IVA: ${customer.iva_condition || 'CF'}`, 50, 165);
    if (customer.address) doc.text(`Domicilio: ${customer.address}`, 50, 178);
  } else {
    doc.text('Consumidor Final', 100, 148);
    doc.text('DNI: 0    Cond IVA: Consumidor Final', 50, 165);
  }

  // Items
  let y = 210;
  doc.rect(40, y, 515, 20).fill('#eeeeee').stroke();
  doc.fillColor('black').fontSize(9).font('Helvetica-Bold');
  doc.text('Cant', 48, y + 6, { width: 40 });
  doc.text('Descripcion', 95, y + 6, { width: 280 });
  doc.text('P. Unit', 380, y + 6, { width: 70, align: 'right' });
  doc.text('Subtotal', 460, y + 6, { width: 90, align: 'right' });
  y += 22;
  doc.font('Helvetica').fontSize(9);
  for (const it of items) {
    if (y > 700) { doc.addPage(); y = 50; }
    doc.text(String(it.qty), 48, y, { width: 40 });
    doc.text(it.name, 95, y, { width: 280 });
    doc.text(money(it.price), 380, y, { width: 70, align: 'right' });
    doc.text(money(it.subtotal), 460, y, { width: 90, align: 'right' });
    y += 16;
  }

  // Totales
  y += 10;
  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 10;
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', 380, y, { width: 70, align: 'right' });
  doc.text(money(sale.total), 460, y, { width: 90, align: 'right' });
  y += 14;
  doc.fontSize(9).font('Helvetica');
  doc.text(`Forma de pago: ${sale.payment_method}`, 40, y);

  // CAE + QR
  if (isFiscal) {
    y += 30;
    doc.rect(40, y, 515, 90).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text(`CAE: ${sale.cae}`, 50, y + 10);
    doc.font('Helvetica').fontSize(9).text(`Vencimiento CAE: ${sale.cae_due || '-'}`, 50, y + 28);
    doc.text('Comprobante autorizado por AFIP', 50, y + 46);
    if (sale.afip_qr) {
      const qrBuf = await QRCode.toBuffer(sale.afip_qr, { margin: 1, width: 200 });
      doc.image(qrBuf, 460, y + 5, { width: 80, height: 80 });
    }
  } else {
    y += 30;
    doc.fontSize(9).fillColor('#666').text(
      'Documento NO valido como factura. Para emision fiscal completar datos AFIP en Configuracion.',
      40, y, { width: 515, align: 'center' });
  }

  doc.end();
  return done;
}

module.exports = { buildInvoicePDF };
