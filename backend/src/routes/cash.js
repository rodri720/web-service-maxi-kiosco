const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/current', (req, res) => {
  const reg = db.prepare(`SELECT * FROM cash_registers WHERE user_id=? AND status='abierta'
    ORDER BY id DESC LIMIT 1`).get(req.user.id);
  res.json(reg || null);
});

router.post('/open', (req, res) => {
  const exists = db.prepare(`SELECT id FROM cash_registers WHERE user_id=? AND status='abierta'`)
    .get(req.user.id);
  if (exists) return res.status(400).json({ error: 'Ya tenes una caja abierta' });
  const { opening_amount, notes } = req.body;
  const r = db.prepare(`INSERT INTO cash_registers (user_id,opening_amount,notes) VALUES (?,?,?)`)
    .run(req.user.id, opening_amount || 0, notes || '');
  res.json({ id: r.lastInsertRowid });
});

router.post('/:id/movement', (req, res) => {
  const { type, amount, reason } = req.body;
  const reg = db.prepare(`SELECT * FROM cash_registers WHERE id=? AND status='abierta'`).get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Caja no encontrada o cerrada' });
  db.prepare(`INSERT INTO cash_movements (register_id,type,amount,reason) VALUES (?,?,?,?)`)
    .run(req.params.id, type, amount, reason || '');
  res.json({ ok: true });
});

router.post('/:id/close', (req, res) => {
  const { closing_amount, notes } = req.body;
  const reg = db.prepare('SELECT * FROM cash_registers WHERE id=?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'No encontrada' });
  if (reg.status === 'cerrada') return res.status(400).json({ error: 'Ya esta cerrada' });

  const sales = db.prepare(`SELECT COALESCE(SUM(total),0) AS t FROM sales
    WHERE register_id=? AND payment_method='efectivo'`).get(req.params.id).t;
  const ingresos = db.prepare(`SELECT COALESCE(SUM(amount),0) AS t FROM cash_movements
    WHERE register_id=? AND type='ingreso'`).get(req.params.id).t;
  const egresos = db.prepare(`SELECT COALESCE(SUM(amount),0) AS t FROM cash_movements
    WHERE register_id=? AND type='egreso'`).get(req.params.id).t;
  const expected = +(reg.opening_amount + sales + ingresos - egresos).toFixed(2);
  const diff = +((closing_amount || 0) - expected).toFixed(2);

  db.prepare(`UPDATE cash_registers SET closing_amount=?, expected_amount=?, difference=?,
    closed_at=CURRENT_TIMESTAMP, status='cerrada', notes=COALESCE(?,notes) WHERE id=?`)
    .run(closing_amount || 0, expected, diff, notes, req.params.id);
  res.json({ expected, difference: diff, sales, ingresos, egresos });
});

router.get('/:id/summary', (req, res) => {
  const reg = db.prepare('SELECT * FROM cash_registers WHERE id=?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'No encontrada' });
  const byMethod = db.prepare(`SELECT payment_method, COUNT(*) AS qty, SUM(total) AS total
    FROM sales WHERE register_id=? GROUP BY payment_method`).all(req.params.id);
  const movements = db.prepare(`SELECT * FROM cash_movements WHERE register_id=? ORDER BY id`)
    .all(req.params.id);
  const totalSales = db.prepare(`SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE register_id=?`)
    .get(req.params.id).t;
  res.json({ register: reg, byMethod, movements, totalSales });
});

router.get('/', (req, res) => {
  res.json(db.prepare(`SELECT cr.*, u.name AS user_name FROM cash_registers cr
    LEFT JOIN users u ON u.id=cr.user_id ORDER BY cr.id DESC LIMIT 100`).all());
});

module.exports = router;
