const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalToday = db.prepare(`SELECT COALESCE(SUM(total),0) AS t, COUNT(*) AS c
    FROM sales WHERE date(created_at)=date(?)`).get(today);
  const week = db.prepare(`SELECT COALESCE(SUM(total),0) AS t FROM sales
    WHERE created_at >= datetime('now','-7 days')`).get();
  const month = db.prepare(`SELECT COALESCE(SUM(total),0) AS t FROM sales
    WHERE created_at >= datetime('now','-30 days')`).get();
  const lowStock = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE stock <= stock_min AND active=1`).get();
  const productCount = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE active=1`).get();
  res.json({
    today: { total: totalToday.t, count: totalToday.c },
    week: week.t,
    month: month.t,
    lowStock: lowStock.c,
    productCount: productCount.c,
  });
});

router.get('/sales-by-day', (req, res) => {
  const rows = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS qty, SUM(total) AS total
    FROM sales WHERE created_at >= datetime('now','-30 days')
    GROUP BY date(created_at) ORDER BY day`).all();
  res.json(rows);
});

router.get('/top-products', (req, res) => {
  const rows = db.prepare(`SELECT p.name, SUM(si.qty) AS qty, SUM(si.subtotal) AS total
    FROM sale_items si JOIN products p ON p.id=si.product_id
    JOIN sales s ON s.id=si.sale_id
    WHERE s.created_at >= datetime('now','-30 days')
    GROUP BY p.id ORDER BY qty DESC LIMIT 10`).all();
  res.json(rows);
});

router.get('/sales-by-section', (req, res) => {
  const rows = db.prepare(`SELECT c.section, SUM(si.subtotal) AS total
    FROM sale_items si
    JOIN products p ON p.id=si.product_id
    LEFT JOIN categories c ON c.id=p.category_id
    JOIN sales s ON s.id=si.sale_id
    WHERE s.created_at >= datetime('now','-30 days')
    GROUP BY c.section ORDER BY total DESC`).all();
  res.json(rows);
});

router.get('/low-stock', (req, res) => {
  res.json(db.prepare(`SELECT p.*, c.name AS category FROM products p
    LEFT JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 AND p.stock <= p.stock_min ORDER BY p.stock`).all());
});

module.exports = router;
