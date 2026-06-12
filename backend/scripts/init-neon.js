require('dotenv').config();
const sql = require('../db');

const createTables = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cajero',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla users creada (o ya existe)');

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        section TEXT NOT NULL DEFAULT 'kiosco'
      );
    `;
    console.log('✅ Tabla categories creada');

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        barcode TEXT UNIQUE,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock_min DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'un',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla products creada');

    await sql`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        closing_amount DECIMAL(10,2),
        expected_amount DECIMAL(10,2),
        difference DECIMAL(10,2),
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'abierta'
      );
    `;
    console.log('✅ Tabla cash_registers creada');

    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        doc_type TEXT NOT NULL DEFAULT 'DNI',
        doc_number TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        email TEXT,
        iva_condition TEXT DEFAULT 'CF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla customers creada');

    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        register_id INTEGER REFERENCES cash_registers(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        customer_id INTEGER REFERENCES customers(id),
        total DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'efectivo',
        invoice_type TEXT NOT NULL DEFAULT 'X',
        pto_vta INTEGER,
        cbte_nro INTEGER,
        cae TEXT,
        cae_due TEXT,
        afip_qr TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla sales creada');

    await sql`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        qty DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      );
    `;
    console.log('✅ Tabla sale_items creada');

    await sql`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        type TEXT NOT NULL,
        qty DECIMAL(10,2) NOT NULL,
        reason TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla stock_movements creada');

    await sql`
      CREATE TABLE IF NOT EXISTS cash_movements (
        id SERIAL PRIMARY KEY,
        register_id INTEGER NOT NULL REFERENCES cash_registers(id),
        type TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Tabla cash_movements creada');

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;
    console.log('✅ Tabla settings creada');

    // Insertar settings por defecto
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
    for (const [key, value] of Object.entries(defaults)) {
      await sql`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${value})
        ON CONFLICT (key) DO NOTHING
      `;
    }
    console.log('✅ Settings por defecto insertados');

  } catch (err) {
    console.error('❌ Error al crear tablas:', err);
  }
};

createTables();
