// Impresion ESC/POS para impresoras termicas (red TCP o USB)
// Tipos soportados: epson, star
const settings = require('../db/settings');

function money(n) { return '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pad(n, w) { return String(n).padStart(w, '0'); }

async function printTicket({ sale, items, customer, company }) {
  const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
  const type = (settings.get('printer_type', 'browser') || '').toLowerCase();
  const iface = settings.get('printer_interface', '');
  if (!iface) throw new Error('Configura la interfaz de la impresora (tcp://ip:9100 o printer:NOMBRE)');

  const printer = new ThermalPrinter({
    type: type === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON,
    interface: iface,
    width: 42,
    characterSet: 'PC850_MULTILINGUAL',
    removeSpecialCharacters: false,
  });

  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) throw new Error(`No se pudo conectar a la impresora (${iface})`);

  printer.alignCenter();
  printer.bold(true); printer.setTextDoubleHeight();
  printer.println(company.company_name || 'Maxi Kiosco');
  printer.bold(false); printer.setTextNormal();
  if (company.company_address) printer.println(company.company_address);
  printer.println(`CUIT: ${company.company_cuit || '-'}   ${company.company_iva || ''}`);
  printer.drawLine();

  printer.alignLeft();
  if (sale.cae) {
    printer.bold(true);
    printer.println(`FACTURA ${sale.invoice_type || 'C'}  ${pad(sale.pto_vta, 4)}-${pad(sale.cbte_nro, 8)}`);
    printer.bold(false);
  } else {
    printer.println(`TICKET INTERNO #${sale.id}`);
  }
  printer.println(`Fecha: ${new Date(sale.created_at).toLocaleString('es-AR')}`);
  printer.println(`Cliente: ${customer ? customer.name : 'Consumidor Final'}`);
  if (customer) printer.println(`${customer.doc_type}: ${customer.doc_number}`);
  printer.drawLine();

  for (const it of items) {
    printer.tableCustom([
      { text: `${it.qty} x ${it.name}`.slice(0, 26), align: 'LEFT', width: 0.65 },
      { text: money(it.subtotal), align: 'RIGHT', width: 0.35 },
    ]);
  }
  printer.drawLine();

  printer.alignRight(); printer.bold(true); printer.setTextDoubleWidth();
  printer.println(`TOTAL ${money(sale.total)}`);
  printer.setTextNormal(); printer.bold(false);
  printer.alignLeft();
  printer.println(`Pago: ${sale.payment_method}`);

  if (sale.cae) {
    printer.drawLine();
    printer.println(`CAE: ${sale.cae}`);
    printer.println(`Vto: ${sale.cae_due || '-'}`);
    if (sale.afip_qr) { try { await printer.printQR(sale.afip_qr, { cellSize: 6 }); } catch {} }
  }

  printer.alignCenter();
  printer.newLine();
  printer.println('Gracias por su compra!');
  printer.cut();

  await printer.execute();
  return { ok: true };
}

module.exports = { printTicket };
