const sql = require('../../db');

async function getAll() {
  return await sql`SELECT * FROM categories ORDER BY name`;
}

async function getById(id) {
  const rows = await sql`SELECT * FROM categories WHERE id = ${id}`;
  return rows[0] || null;
}

async function create(cat) {
  const rows = await sql`
    INSERT INTO categories (name, section)
    VALUES (${cat.name}, ${cat.section || 'kiosco'})
    RETURNING *
  `;
  return rows[0];
}

async function update(id, cat) {
  const rows = await sql`
    UPDATE categories
    SET name = ${cat.name}, section = ${cat.section || 'kiosco'}
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
