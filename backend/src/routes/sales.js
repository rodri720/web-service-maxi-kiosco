const express = require('express');
const router = express.Router();
const sales = require('../db/sales');

router.get('/', async (req, res, next) => {
  try {
    const items = await sales.getAll();
    res.json(items);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await sales.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(item);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { sale, items } = req.body;
    if (!sale || !items || !items.length)
      return res.status(400).json({ error: 'Datos incompletos' });
    const newSale = await sales.create(sale, items);
    res.status(201).json(newSale);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await sales.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await sales.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Venta no encontrada' });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
