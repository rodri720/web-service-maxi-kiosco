const sql = require('../../db');
const cash = require('./cash'); // Importa el modelo de caja (ajusta la ruta si es necesario)

async function getAll() {
  return await sql`
    SELECT s.*, c.name as customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC
  `;
}

async function getById(id) {
  const rows = await sql`SELECT * FROM sales WHERE id = ${id}`;
  if (!rows[0]) return null;
  const sale = rows[0];
  sale.items = await sql`SELECT * FROM sale_items WHERE sale_id = ${id}`;
  return sale;
}

async function create(saleData, items) {
  // Insertar la venta
  const saleRows = await sql`
    INSERT INTO sales (register_id, user_id, customer_id, total, payment_method, invoice_type, pto_vta, cbte_nro, cae, cae_due, afip_qr)
    VALUES (${saleData.register_id || null}, ${saleData.user_id || null}, ${saleData.customer_id || null}, ${saleData.total}, ${saleData.payment_method || 'efectivo'}, ${saleData.invoice_type || 'X'}, ${saleData.pto_vta || null}, ${saleData.cbte_nro || null}, ${saleData.cae || null}, ${saleData.cae_due || null}, ${saleData.afip_qr || null})
    RETURNING *
  `;
  const sale = saleRows[0];

  for (const item of items) {
    await sql`
      INSERT INTO sale_items (sale_id, product_id, qty, price, subtotal)
      VALUES (${sale.id}, ${item.product_id}, ${item.qty}, ${item.price}, ${item.subtotal})
    `;
    await sql`
      UPDATE products SET stock = stock - ${item.qty} WHERE id = ${item.product_id}
    `;
  }

  // Registrar movimiento de caja si es efectivo y hay register_id
  if (saleData.payment_method === 'efectivo' && saleData.register_id) {
    await cash.addMovement(saleData.register_id, 'venta', saleData.total, `Venta #${sale.id}`);
  }

  return sale;
}

async function update(id, saleData) {
  const rows = await sql`
    UPDATE sales
    SET customer_id = ${saleData.customer_id || null},
        payment_method = ${saleData.payment_method},
        invoice_type = ${saleData.invoice_type},
        pto_vta = ${saleData.pto_vta || null},
        cbte_nro = ${saleData.cbte_nro || null},
        cae = ${saleData.cae || null},
        cae_due = ${saleData.cae_due || null},
        afip_qr = ${saleData.afip_qr || null}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

async function remove(id) {
  const result = await sql`DELETE FROM sales WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

module.exports = { getAll, getById, create, update, remove };