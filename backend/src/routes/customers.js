
const express = require('express');
const router = express.Router();
const customers = require('../db/customers');

router.get('/', async (req, res, next) => {
  try {
    const items = await customers.getAll();
    res.json(items);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await customers.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(item);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const newItem = await customers.create(req.body);
    res.status(201).json(newItem);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await customers.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await customers.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
