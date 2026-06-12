const express = require('express');
const router = express.Router();
const products = require('../db/products');

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const items = await products.getAll();
    res.json(items);
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await products.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(item);
  } catch (err) { next(err); }
});

// GET /api/products/barcode/:barcode
router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const item = await products.getByBarcode(req.params.barcode);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(item);
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const newProduct = await products.create(req.body);
    res.status(201).json(newProduct);
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await products.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await products.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(204).send();
  } catch (err) { next(err); }
});

// PATCH /api/products/:id/stock (para ajustar stock)
router.patch('/:id/stock', async (req, res, next) => {
  try {
    const { qty } = req.body;
    if (qty === undefined) return res.status(400).json({ error: 'Falta cantidad (qty)' });
    const newStock = await products.updateStock(req.params.id, qty);
    if (newStock === null) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ stock: newStock });
  } catch (err) { next(err); }
});

module.exports = router;
