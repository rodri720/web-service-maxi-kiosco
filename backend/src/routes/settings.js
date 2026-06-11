const router = require('express').Router();
const settings = require('../db/settings');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => {
  const all = settings.getAll();
  // No exponer paths sensibles directamente como secreto
  res.json(all);
});

router.put('/', requireRole('admin'), (req, res) => {
  const allowed = [
    'company_cuit','company_name','company_address','company_iva',
    'pto_vta','afip_mode','afip_production','afip_cert','afip_key',
    'printer_type','printer_interface',
  ];
  const data = {};
  for (const k of allowed) if (k in req.body) data[k] = req.body[k];
  settings.setMany(data);
  res.json({ ok: true });
});

module.exports = router;
