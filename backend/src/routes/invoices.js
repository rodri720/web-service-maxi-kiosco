
const express = require('express');
const router = express.Router();
const invoices = require('../db/invoices');

router.post('/generate/:saleId', async (req, res, next) => {
  try {
    const result = await invoices.createInvoice(req.params.saleId);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
