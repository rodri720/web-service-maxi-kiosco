const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY section, name').all());
});

router.post('/', requireRole('admin'), (req, res) => {
  const { name, section } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const r = db.prepare('INSERT INTO categories (name,section) VALUES (?,?)')
      .run(name, section || 'kiosco');
    res.json({ id: r.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const { name, section } = req.body;
  db.prepare('UPDATE categories SET name=?, section=? WHERE id=?')
    .run(name, section || 'kiosco', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
