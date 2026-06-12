require('dotenv').config();
const bcrypt = require('bcryptjs');
const sql = require('../db');

async function createAdmin() {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  try {
    await sql`
      INSERT INTO users (username, password, name, role)
      VALUES ('admin', ${hashedPassword}, 'Administrador', 'admin')
      ON CONFLICT (username) DO NOTHING
    `;
    console.log('✅ Usuario admin creado (o ya existía)');
  } catch (err) {
    console.error('❌ Error al crear admin:', err);
  }
}

createAdmin();
