const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (q) { sql += ' AND (name LIKE ? OR doc_number LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY name LIMIT 100';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { doc_type, doc_number, name, address, email, iva_condition } = req.body;
  if (!name || !doc_number) return res.status(400).json({ error: 'Nombre y documento requeridos' });
  const r = db.prepare(`INSERT INTO customers (doc_type,doc_number,name,address,email,iva_condition)
    VALUES (?,?,?,?,?,?)`).run(doc_type || 'DNI', doc_number, name, address || '', email || '', iva_condition || 'CF');
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { doc_type, doc_number, name, address, email, iva_condition } = req.body;
  db.prepare(`UPDATE customers SET doc_type=?,doc_number=?,name=?,address=?,email=?,iva_condition=? WHERE id=?`)
    .run(doc_type, doc_number, name, address, email, iva_condition, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
