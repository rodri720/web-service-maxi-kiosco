
const sql = require('../../db');

async function getAll() {
  return await sql`SELECT * FROM categories ORDER BY name`;
}

async function getById(id) {
  const rows = await sql`SELECT * FROM categories WHERE id = ${id}`;
  return rows[0] || null;
}

async function create(data) {
  const rows = await sql`
    INSERT INTO categories (name, section)
    VALUES (${data.name}, ${data.section || 'kiosco'})
    RETURNING *
  `;
  return rows[0];
}

async function update(id, data) {
  const rows = await sql`
    UPDATE categories
    SET name = ${data.name}, section = ${data.section || 'kiosco'}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

async function remove(id) {
  const result = await sql`DELETE FROM categories WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

module.exports = { getAll, getById, create, update, remove };
