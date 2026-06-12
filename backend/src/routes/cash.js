
const express = require('express');
const router = express.Router();
const cash = require('../db/cash');

router.get('/register', async (req, res, next) => {
  try {
    const register = await cash.getCurrentRegister();
    res.json(register || { status: 'cerrada' });
  } catch (err) { next(err); }
});

router.post('/close', async (req, res, next) => {
  try {
    const { id, closing_amount, expected_amount, difference, notes } = req.body;
    if (!id || closing_amount === undefined) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    const closed = await cash.closeRegister(id, closing_amount, expected_amount, difference, notes);
    if (!closed) return res.status(404).json({ error: 'Caja no encontrada o ya cerrada' });
    res.json(closed);
  } catch (err) { next(err); }
});

router.post('/open', async (req, res, next) => {
  try {
    const { user_id, opening_amount, notes } = req.body;
    if (!user_id || opening_amount === undefined)
      return res.status(400).json({ error: 'Faltan datos' });
    const newRegister = await cash.openRegister(user_id, opening_amount, notes);
    res.status(201).json(newRegister);
  } catch (err) { next(err); }
});

router.post('/close', async (req, res, next) => {
  try {
    const { id, closing_amount, expected_amount, difference, notes } = req.body;
    if (!id || closing_amount === undefined)
      return res.status(400).json({ error: 'Faltan datos' });
    const closed = await cash.closeRegister(id, closing_amount, expected_amount, difference, notes);
    if (!closed) return res.status(404).json({ error: 'Caja no encontrada o ya cerrada' });
    res.json(closed);
  } catch (err) { next(err); }
});

router.post('/movement', async (req, res, next) => {
  try {
    const { register_id, type, amount, reason } = req.body;
    if (!register_id || !type || amount === undefined)
      return res.status(400).json({ error: 'Faltan datos' });
    const mov = await cash.addMovement(register_id, type, amount, reason);
    res.status(201).json(mov);
  } catch (err) { next(err); }
});

router.get('/movements/:register_id', async (req, res, next) => {
  try {
    const movements = await cash.getMovements(req.params.register_id);
    res.json(movements);
  } catch (err) { next(err); }
});

module.exports = router;
