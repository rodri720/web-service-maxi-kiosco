const db = require('./index');

function getAll() {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
function get(key, def = null) {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  return r ? r.value : def;
}
function set(key, value) {
  db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, value == null ? '' : String(value));
}
function setMany(obj) {
  const tx = db.transaction(() => { for (const [k, v] of Object.entries(obj)) set(k, v); });
  tx();
}

module.exports = { getAll, get, set, setMany };
