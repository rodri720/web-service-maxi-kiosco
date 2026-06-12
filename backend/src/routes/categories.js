
const express = require('express');
const router = express.Router();
const categories = require('../db/categories');

router.get('/', async (req, res, next) => {
  try {
    const items = await categories.getAll();
    res.json(items);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await categories.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(item);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const newItem = await categories.create(req.body);
    res.status(201).json(newItem);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await categories.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await categories.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
