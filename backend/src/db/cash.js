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

async function addMovement(register_id, type, amount, reason, reference_id = null) {
  const rows = await sql`
    INSERT INTO cash_movements (register_id, type, amount, reason, reference_id)
    VALUES (${register_id}, ${type}, ${amount}, ${reason}, ${reference_id})
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

async function getSummary(register_id) {
  const movements = await getMovements(register_id);
  const ventas = movements.filter(m => m.type === 'venta').reduce((s, m) => s + parseFloat(m.amount), 0);
  const gastos = movements.filter(m => m.type === 'gasto').reduce((s, m) => s + parseFloat(m.amount), 0);
  const retiros = movements.filter(m => m.type === 'retiro').reduce((s, m) => s + parseFloat(m.amount), 0);
  const ingresosExtra = movements.filter(m => m.type === 'ingreso_extra').reduce((s, m) => s + parseFloat(m.amount), 0);
  return { ventas, gastos, retiros, ingresosExtra, movements };
}

async function closeRegisterWithCount(id, closing_amount, notes = '') {
  const registerRows = await sql`SELECT * FROM cash_registers WHERE id = ${id} AND status = 'abierta'`;
  if (registerRows.length === 0) throw new Error('Caja no encontrada o ya cerrada');
  const register = registerRows[0];
  const summary = await getSummary(id);
  const opening = parseFloat(register.opening_amount);
  const expected = opening + summary.ventas + summary.ingresosExtra - summary.gastos - summary.retiros;
  const difference = closing_amount - expected;
  const rows = await sql`
    UPDATE cash_registers
    SET closed_at = NOW(),
        closing_amount = ${closing_amount},
        expected_amount = ${expected},
        difference = ${difference},
        notes = ${notes},
        status = 'cerrada'
    WHERE id = ${id} AND status = 'abierta'
    RETURNING *
  `;
  return rows[0];
}

module.exports = {
  getCurrentRegister,
  openRegister,
  addMovement,
  getMovements,
  getSummary,
  closeRegisterWithCount
};