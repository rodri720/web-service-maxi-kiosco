const sql = require('../../db');

async function getCurrentRegister() {
  const rows = await sql`
    SELECT * FROM cash_registers
    WHERE status = 'abierta'
    ORDER BY opened_at DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

async function openRegister(user_id, opening_amount, notes = '') {
  const rows = await sql`
    INSERT INTO cash_registers (user_id, opening_amount, notes, status)
    VALUES (${user_id}, ${opening_amount}, ${notes}, 'abierta')
    RETURNING *
  `;
  return rows[0];
}

async function closeRegister(id, closing_amount, expected_amount, difference, notes = '') {
  const rows = await sql`
    UPDATE cash_registers
    SET closed_at = NOW(),
        closing_amount = ${closing_amount},
        expected_amount = ${expected_amount},
        difference = ${difference},
        notes = ${notes},
        status = 'cerrada'
    WHERE id = ${id} AND status = 'abierta'
    RETURNING *
  `;
  return rows[0] || null;
}

async function addMovement(register_id, type, amount, reason) {
  const rows = await sql`
    INSERT INTO cash_movements (register_id, type, amount, reason)
    VALUES (${register_id}, ${type}, ${amount}, ${reason})
    RETURNING *
  `;
  return rows[0];
}

async function getMovements(register_id) {
  return await sql`
    SELECT * FROM cash_movements
    WHERE register_id = ${register_id}
    ORDER BY created_at DESC
  `;
}

module.exports = { getCurrentRegister, openRegister, closeRegister, addMovement, getMovements };
