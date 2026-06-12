const express = require('express');
const router = express.Router();
const { emitFacturaC } = require('../services/afip');
const salesModel = require('../db/sales');
const customersModel = require('../db/customers');
const settingsModel = require('../db/settings');
const { buildInvoicePDF } = require('../services/pdf');

// --------------------------------------------------------------
// Funciones auxiliares (si no están en salesModel)
// --------------------------------------------------------------
const getItemsBySaleId = async (saleId) => {
  const sql = require('../../db');
  const rows = await sql`
    SELECT si.*, p.name
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ${saleId}
  `;
  return rows;
};

const updateInvoiceData = async (saleId, data) => {
  const sql = require('../../db');
  await sql`
    UPDATE sales
    SET invoice_type = ${data.invoice_type},
        pto_vta = ${data.pto_vta},
        cbte_nro = ${data.cbte_nro},
        cae = ${data.cae},
        cae_due = ${data.cae_due},
        afip_qr = ${data.afip_qr}
    WHERE id = ${saleId}
  `;
};

// --------------------------------------------------------------
// GET /generate/:saleId  → descarga PDF
// --------------------------------------------------------------
router.get('/generate/:saleId', async (req, res, next) => {
  const { saleId } = req.params;
  try {
    const sale = await salesModel.getById(saleId);
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });

    let customer = null;
    if (sale.customer_id) customer = await customersModel.getById(sale.customer_id);

    const company = await settingsModel.getAll();
    const items = await getItemsBySaleId(saleId);
    const invoiceData = await emitFacturaC({ saleTotal: sale.total, customer });

    await updateInvoiceData(saleId, {
      invoice_type: 'C',
      pto_vta: invoiceData.pto_vta,
      cbte_nro: invoiceData.cbte_nro,
      cae: invoiceData.cae,
      cae_due: invoiceData.cae_due,
      afip_qr: invoiceData.qr,
    });

    const fullSale = { ...sale, ...invoiceData };
    const pdfBuffer = await buildInvoicePDF({ sale: fullSale, items, customer, company });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura_${saleId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// --------------------------------------------------------------
// POST /submit-to-arca/:saleId  → envía a ARCA (modo simulado o real)
// --------------------------------------------------------------
router.post('/submit-to-arca/:saleId', async (req, res, next) => {
  const { saleId } = req.params;
  try {
    const sale = await salesModel.getById(saleId);
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });

    let customer = null;
    if (sale.customer_id) customer = await customersModel.getById(sale.customer_id);

    const invoiceData = await emitFacturaC({ saleTotal: sale.total, customer });

    await updateInvoiceData(saleId, {
      invoice_type: 'C',
      pto_vta: invoiceData.pto_vta,
      cbte_nro: invoiceData.cbte_nro,
      cae: invoiceData.cae,
      cae_due: invoiceData.cae_due,
      afip_qr: invoiceData.qr,
    });

    res.json({
      success: true,
      message: invoiceData.simulated
        ? '✅ Factura SIMULADA (no enviada a ARCA real). CAE generado para pruebas.'
        : '✅ Factura enviada a ARCA correctamente. CAE real obtenido.',
      cae: invoiceData.cae,
      cae_due: invoiceData.cae_due,
      qr: invoiceData.qr,
      simulated: invoiceData.simulated || false,
    });
  } catch (error) {
    console.error('Error al enviar a ARCA:', error);
    res.status(500).json({ error: error.message || 'Error al emitir factura' });
  }
});

module.exports = router;