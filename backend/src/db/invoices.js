const sql = require('../../db');

async function getNextInvoiceNumber(type, ptoVta) {
  // Ejemplo simple, depende de tu lógica AFIP
  const rows = await sql`
    SELECT COALESCE(MAX(cbte_nro), 0) + 1 as next
    FROM sales
    WHERE invoice_type = ${type} AND pto_vta = ${ptoVta}
  `;
  return rows[0].next;
}

async function createInvoice(saleId) {
  // Aquí iría la llamada a AFIP o generación de comprobante
  return { ok: true, message: 'Implementar integración AFIP' };
}

module.exports = { getNextInvoiceNumber, createInvoice };
