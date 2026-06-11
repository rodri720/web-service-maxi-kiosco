const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'maxi.db');
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function ensureColumn(table, col, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find(c => c.name === col)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
}

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cajero',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      section TEXT NOT NULL DEFAULT 'kiosco'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER,
      cost REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      stock_min REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'un',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      opening_amount REAL NOT NULL DEFAULT 0,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'abierta',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL DEFAULT 'DNI',
      doc_number TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      email TEXT,
      iva_condition TEXT DEFAULT 'CF',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER,
      user_id INTEGER NOT NULL,
      customer_id INTEGER,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'efectivo',
      invoice_type TEXT NOT NULL DEFAULT 'X',
      pto_vta INTEGER,
      cbte_nro INTEGER,
      cae TEXT,
      cae_due TEXT,
      afip_qr TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (register_id) REFERENCES cash_registers(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      qty REAL NOT NULL,
      reason TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (register_id) REFERENCES cash_registers(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Migraciones para DB existentes
  ensureColumn('sales', 'customer_id', 'INTEGER');
  ensureColumn('sales', 'invoice_type', "TEXT DEFAULT 'X'");
  ensureColumn('sales', 'pto_vta', 'INTEGER');
  ensureColumn('sales', 'cbte_nro', 'INTEGER');
  ensureColumn('sales', 'cae', 'TEXT');
  ensureColumn('sales', 'cae_due', 'TEXT');
  ensureColumn('sales', 'afip_qr', 'TEXT');

  // Settings por defecto
  const defaults = {
    company_cuit: '20000000001',
    company_name: 'Maxi Kiosco Demo',
    company_address: 'Calle Falsa 123',
    company_iva: 'Monotributo',
    pto_vta: '1',
    afip_mode: 'simulado',
    afip_production: '0',
    afip_cert: '',
    afip_key: '',
    printer_type: 'browser',
    printer_interface: 'tcp://192.168.0.100:9100',
  };
  const ins = db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)');
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v);
}

init();

module.exports = db;
