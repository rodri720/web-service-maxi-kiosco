const sql = require('../../db');  // conexión a Neon

async function getAll() {
  const rows = await sql`SELECT key, value FROM settings`;
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

async function get(key, def = null) {
  const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return rows.length ? rows[0].value : def;
}

async function set(key, value) {
  const val = value == null ? '' : String(value);
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${val})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

async function setMany(obj) {
  await sql.begin(async (tx) => {
    for (const [k, v] of Object.entries(obj)) {
      const val = v == null ? '' : String(v);
      await tx`
        INSERT INTO settings (key, value) VALUES (${k}, ${val})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
  });
}

module.exports = { getAll, get, set, setMany };
