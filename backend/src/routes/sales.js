const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', (req, res) => {
  const { items, payment_method, customer_id } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Sin items' });

  const reg = db.prepare(`SELECT * FROM cash_registers WHERE user_id=? AND status='abierta' ORDER BY id DESC LIMIT 1`)
    .get(req.user.id);
  if (!reg) return res.status(400).json({ error: 'No hay caja abierta. Abri una caja primero.' });

  const tx = db.transaction(() => {
    let total = 0;
    const itemRows = [];
    for (const it of items) {
      const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.product_id);
      if (!p) throw new Error('Producto invalido');
      if (p.stock < it.qty) throw new Error(`Stock insuficiente: ${p.name}`);
      const subtotal = +(p.price * it.qty).toFixed(2);
      total += subtotal;
      itemRows.push({ product_id: p.id, qty: it.qty, price: p.price, subtotal });
    }
    total = +total.toFixed(2);
    const r = db.prepare(`INSERT INTO sales (register_id,user_id,customer_id,total,payment_method) VALUES (?,?,?,?,?)`)
      .run(reg.id, req.user.id, customer_id || null, total, payment_method || 'efectivo');
    const saleId = r.lastInsertRowid;
    const insItem = db.prepare(`INSERT INTO sale_items (sale_id,product_id,qty,price,subtotal) VALUES (?,?,?,?,?)`);
    const updStock = db.prepare('UPDATE products SET stock=stock-? WHERE id=?');
    const insMov = db.prepare(`INSERT INTO stock_movements (product_id,type,qty,reason,user_id) VALUES (?,?,?,?,?)`);
    for (const it of itemRows) {
      insItem.run(saleId, it.product_id, it.qty, it.price, it.subtotal);
      updStock.run(it.qty, it.product_id);
      insMov.run(it.product_id, 'venta', -it.qty, `Venta #${saleId}`, req.user.id);
    }
    return { id: saleId, total };
  });

  try {
    const result = tx();
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/', (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT s.*, u.name AS user_name FROM sales s LEFT JOIN users u ON u.id=s.user_id WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND s.created_at >= ?'; params.push(from); }
  if (to) { sql += ' AND s.created_at <= ?'; params.push(to); }
  sql += ' ORDER BY s.id DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'No encontrada' });
  const items = db.prepare(`SELECT si.*, p.name FROM sale_items si
    JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`).all(req.params.id);
  res.json({ ...sale, items });
});

module.exports = router;
