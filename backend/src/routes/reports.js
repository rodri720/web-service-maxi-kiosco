
const express = require('express');
const router = express.Router();
const reports = require('../db/reports');

// Dashboard: devuelve datos para el panel principal
router.get('/dashboard', async (req, res, next) => {
  try {
    const [today, week, month, productCount, lowStockCount] = await Promise.all([
      reports.getTodaySales(),
      reports.getSalesLastDays(7),
      reports.getSalesLastDays(30),
      reports.getProductCount(),
      reports.getLowStockCount()
    ]);
    res.json({
      today: { total: today.total, count: today.count },
      week: week,
      month: month,
      productCount: productCount,
      lowStock: lowStockCount
    });
  } catch (err) { next(err); }
});

// Ventas por día en un rango (para gráfico)
router.get('/sales-by-day', async (req, res, next) => {
  try {
    let { from, to } = req.query;
    if (!from || !to) {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 30);
      from = lastWeek.toISOString().split('T')[0];
      to = today.toISOString().split('T')[0];
    }
    const data = await reports.salesByDay(from, to);
    res.json(data.map(d => ({ day: d.day, total: parseFloat(d.total_amount) })));
  } catch (err) { next(err); }
});

// Top productos
router.get('/top-products', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const data = await reports.topProducts(limit);
    res.json(data);
  } catch (err) { next(err); }
});

// Productos con stock bajo (detalle)
router.get('/low-stock', async (req, res, next) => {
  try {
    const data = await reports.lowStock();
    res.json(data);
  } catch (err) { next(err); }
});

// (Opcional) Mantenemos compatibilidad con endpoints anteriores
router.get('/sales/day', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Faltan fechas' });
    const data = await reports.salesByDay(from, to);
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
