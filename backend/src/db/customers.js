const sql = require('../../db');

async function getAll() {
  return await sql`SELECT * FROM customers ORDER BY name`;
}

async function getById(id) {
  const rows = await sql`SELECT * FROM customers WHERE id = ${id}`;
  return rows[0] || null;
}

async function getByDoc(docType, docNumber) {
  const rows = await sql`
    SELECT * FROM customers
    WHERE doc_type = ${docType} AND doc_number = ${docNumber}
  `;
  return rows[0] || null;
}

async function create(data) {
  const rows = await sql`
    INSERT INTO customers (doc_type, doc_number, name, address, email, iva_condition)
    VALUES (${data.doc_type || 'DNI'}, ${data.doc_number}, ${data.name}, ${data.address || null}, ${data.email || null}, ${data.iva_condition || 'CF'})
    RETURNING *
  `;
  return rows[0];
}

async function update(id, data) {
  const rows = await sql`
    UPDATE customers
    SET doc_type = ${data.doc_type || 'DNI'},
        doc_number = ${data.doc_number},
        name = ${data.name},
        address = ${data.address || null},
        email = ${data.email || null},
        iva_condition = ${data.iva_condition || 'CF'}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

async function remove(id) {
  const result = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

module.exports = { getAll, getById, getByDoc, create, update, remove };
