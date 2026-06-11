const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  const { q, category_id, low } = req.query;
  let sql = `SELECT p.*, c.name AS category, c.section
             FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.active=1`;
  const params = [];
  if (q) { sql += ' AND (p.name LIKE ? OR p.barcode LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (category_id) { sql += ' AND p.category_id=?'; params.push(category_id); }
  if (low === '1') sql += ' AND p.stock <= p.stock_min';
  sql += ' ORDER BY p.name';
  res.json(db.prepare(sql).all(...params));
});

router.get('/barcode/:code', (req, res) => {
  const p = db.prepare(`SELECT p.*, c.name AS category FROM products p
    LEFT JOIN categories c ON c.id=p.category_id WHERE p.barcode=? AND p.active=1`).get(req.params.code);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  res.json(p);
});

router.post('/', requireRole('admin'), (req, res) => {
  const { barcode, name, category_id, cost, price, stock, stock_min, unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const r = db.prepare(`INSERT INTO products (barcode,name,category_id,cost,price,stock,stock_min,unit)
    VALUES (?,?,?,?,?,?,?,?)`).run(barcode || null, name, category_id || null,
      cost || 0, price || 0, stock || 0, stock_min || 0, unit || 'un');
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const { barcode, name, category_id, cost, price, stock, stock_min, unit, active } = req.body;
  db.prepare(`UPDATE products SET barcode=?,name=?,category_id=?,cost=?,price=?,stock=?,stock_min=?,unit=?,active=?
    WHERE id=?`).run(barcode || null, name, category_id || null, cost, price, stock, stock_min, unit,
      active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('UPDATE products SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/stock', requireRole('admin', 'cajero'), (req, res) => {
  const { qty, type, reason } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const delta = type === 'salida' ? -Math.abs(qty) : Math.abs(qty);
  db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(delta, req.params.id);
  db.prepare(`INSERT INTO stock_movements (product_id,type,qty,reason,user_id) VALUES (?,?,?,?,?)`)
    .run(req.params.id, type || 'ingreso', delta, reason || '', req.user.id);
  res.json({ ok: true });
});

module.exports = router;
