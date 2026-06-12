const express = require('express');
const router = express.Router();
const settings = require('../db/settings');  // ahora apunta al nuevo modelo Neon

// Eliminado: auth middleware

router.get('/', async (req, res, next) => {
  try {
    const all = await settings.getAll();
    res.json(all);
  } catch (err) { next(err); }
});

router.get('/:key', async (req, res, next) => {
  try {
    const value = await settings.get(req.params.key);
    if (value === null) return res.status(404).json({ error: 'No encontrado' });
    res.json({ [req.params.key]: value });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const allowed = [
      'company_cuit','company_name','company_address','company_iva',
      'pto_vta','afip_mode','afip_production','afip_cert','afip_key',
      'printer_type','printer_interface',
    ];
    const data = {};
    for (const k of allowed) if (k in req.body) data[k] = req.body[k];
    await settings.setMany(data);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
