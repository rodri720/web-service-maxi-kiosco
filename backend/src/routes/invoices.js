const router = require('express').Router();
const db = require('../db');
const settings = require('../db/settings');
const { auth } = require('../middleware/auth');
const { emitFacturaC } = require('../services/afip');
const { buildInvoicePDF } = require('../services/pdf');
const { printTicket } = require('../services/printer');

router.use(auth);

function loadSale(id) {
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(id);
  if (!sale) return null;
  const items = db.prepare(`SELECT si.*, p.name FROM sale_items si
    JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`).all(id);
  const customer = sale.customer_id ? db.prepare('SELECT * FROM customers WHERE id=?').get(sale.customer_id) : null;
  return { sale, items, customer };
}

// Emitir Factura C contra ARCA/AFIP (o simulado)
router.post('/sales/:id/issue', async (req, res) => {
  try {
    const data = loadSale(req.params.id);
    if (!data) return res.status(404).json({ error: 'Venta no encontrada' });
    if (data.sale.cae) return res.status(400).json({ error: 'La venta ya tiene CAE' });

    const { customer_id } = req.body;
    if (customer_id) {
      const c = db.prepare('SELECT * FROM customers WHERE id=?').get(customer_id);
      if (!c) return res.status(400).json({ error: 'Cliente invalido' });
      data.customer = c;
      db.prepare('UPDATE sales SET customer_id=? WHERE id=?').run(customer_id, req.params.id);
    }

    const r = await emitFacturaC({ saleTotal: data.sale.total, customer: data.customer });
    db.prepare(`UPDATE sales SET invoice_type='C', pto_vta=?, cbte_nro=?, cae=?, cae_due=?, afip_qr=?
      WHERE id=?`).run(r.pto_vta, r.cbte_nro, r.cae, r.cae_due, r.qr, req.params.id);

    res.json({ ok: true, ...r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// PDF de factura/ticket interno
router.get('/sales/:id/pdf', async (req, res) => {
  const data = loadSale(req.params.id);
  if (!data) return res.status(404).json({ error: 'Venta no encontrada' });
  const company = settings.getAll();
  const pdf = await buildInvoicePDF({ sale: data.sale, items: data.items, customer: data.customer, company });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="venta-${data.sale.id}.pdf"`);
  res.send(pdf);
});

// Imprimir en impresora termica configurada
router.post('/sales/:id/print', async (req, res) => {
  try {
    const data = loadSale(req.params.id);
    if (!data) return res.status(404).json({ error: 'Venta no encontrada' });
    const company = settings.getAll();
    const r = await printTicket({ sale: data.sale, items: data.items, customer: data.customer, company });
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HTML imprimible para ticket 80mm (fallback navegador)
router.get('/sales/:id/ticket', (req, res) => {
  const data = loadSale(req.params.id);
  if (!data) return res.status(404).send('No encontrada');
  const company = settings.getAll();
  const { sale, items, customer } = data;
  const money = n => '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const itemsHtml = items.map(i => `
    <div class="row"><span>${i.qty} x ${i.name}</span><b>${money(i.subtotal)}</b></div>`).join('');
  const fiscal = sale.cae ? `
    <div class="line"></div>
    <div>FACTURA ${sale.invoice_type} ${String(sale.pto_vta).padStart(4,'0')}-${String(sale.cbte_nro).padStart(8,'0')}</div>
    <div>CAE: ${sale.cae}</div>
    <div>Vto CAE: ${sale.cae_due || '-'}</div>
    ${sale.afip_qr ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(sale.afip_qr)}" />` : ''}
  ` : `<div>TICKET INTERNO #${sale.id}</div>`;

  res.send(`<!doctype html><html><head><meta charset="utf-8">
  <title>Ticket ${sale.id}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body { font-family: 'Courier New', monospace; font-size: 11px; width: 74mm; }
    h1 { font-size: 13px; text-align: center; margin: 2px 0; }
    .center { text-align: center; }
    .row { display: flex; justify-content: space-between; gap: 4px; }
    .line { border-top: 1px dashed #000; margin: 4px 0; }
    .total { font-size: 16px; font-weight: bold; text-align: right; }
    img { display: block; margin: 4px auto; max-width: 50mm; }
    @media print { button { display: none; } }
  </style></head><body>
    <h1>${company.company_name || 'Maxi Kiosco'}</h1>
    <div class="center">${company.company_address || ''}</div>
    <div class="center">CUIT: ${company.company_cuit} - ${company.company_iva}</div>
    <div class="line"></div>
    <div>${new Date(sale.created_at).toLocaleString('es-AR')}</div>
    <div>Cliente: ${customer ? customer.name : 'Consumidor Final'}</div>
    ${customer ? `<div>${customer.doc_type}: ${customer.doc_number}</div>` : ''}
    <div class="line"></div>
    ${itemsHtml}
    <div class="line"></div>
    <div class="total">TOTAL ${money(sale.total)}</div>
    <div>Pago: ${sale.payment_method}</div>
    ${fiscal}
    <div class="line"></div>
    <div class="center">Gracias por su compra!</div>
    <button onclick="window.print()" style="margin-top:10px;width:100%;padding:8px">Imprimir</button>
    <script>setTimeout(() => window.print(), 300);</script>
  </body></html>`);
});

module.exports = router;
