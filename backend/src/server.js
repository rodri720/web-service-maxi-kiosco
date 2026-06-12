require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'maxi-kiosco' }));

app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
 app.use('/api/customers', require('./routes/customers'));
 app.use('/api/sales', require('./routes/sales'));
 app.use('/api/cash', require('./routes/cash'));
 app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
 app.use('/api/invoices', require('./routes/invoices'));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Maxi Kiosco escuchando en :${PORT}`));
