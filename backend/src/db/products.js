const sql = require('../../db');

async function getAll() {
  const rows = await sql`SELECT * FROM products ORDER BY name`;
  return rows;
}

async function getById(id) {
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  return rows[0] || null;
}

async function getByBarcode(barcode) {
  const rows = await sql`SELECT * FROM products WHERE barcode = ${barcode}`;
  return rows[0] || null;
}

async function create(product) {
  const { barcode, name, category_id, cost, price, stock, stock_min, unit, active } = product;
  const rows = await sql`
    INSERT INTO products (barcode, name, category_id, cost, price, stock, stock_min, unit, active)
    VALUES (${barcode || null}, ${name}, ${category_id || null}, ${cost || 0}, ${price || 0}, ${stock || 0}, ${stock_min || 0}, ${unit || 'un'}, ${active !== undefined ? active : 1})
    RETURNING *
  `;
  return rows[0];
}

async function update(id, product) {
  const { barcode, name, category_id, cost, price, stock, stock_min, unit, active } = product;
  const rows = await sql`
    UPDATE products
    SET barcode = ${barcode || null},
        name = ${name},
        category_id = ${category_id || null},
        cost = ${cost || 0},
        price = ${price || 0},
        stock = ${stock || 0},
        stock_min = ${stock_min || 0},
        unit = ${unit || 'un'},
        active = ${active !== undefined ? active : 1}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

async function remove(id) {
  const result = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

async function updateStock(id, qty) {
  const rows = await sql`
    UPDATE products
    SET stock = stock + ${qty}
    WHERE id = ${id}
    RETURNING stock
  `;
  return rows[0] ? rows[0].stock : null;
}

module.exports = { getAll, getById, getByBarcode, create, update, remove, updateStock };
