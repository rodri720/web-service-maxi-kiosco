const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET, auth } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciales invalidas' });
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

router.get('/me', auth, (req, res) => res.json(req.user));

module.exports = router;
