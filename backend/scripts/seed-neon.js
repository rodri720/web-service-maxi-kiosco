require('dotenv').config();
const bcrypt = require('bcryptjs');
const sql = require('../db');

const users = [
  { username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
  { username: 'cajero', password: 'cajero123', name: 'Cajero Demo', role: 'cajero' },
];

const categories = [
  { name: 'Golosinas', section: 'kiosco' },
  { name: 'Bebidas', section: 'kiosco' },
  { name: 'Cigarrillos', section: 'kiosco' },
  { name: 'Galletitas', section: 'kiosco' },
  { name: 'Panaderia', section: 'panaderia' },
  { name: 'Facturas', section: 'panaderia' },
  { name: 'Fiambres', section: 'fiambreria' },
  { name: 'Quesos', section: 'fiambreria' },
  { name: 'Limpieza', section: 'limpieza' },
  { name: 'Higiene', section: 'limpieza' },
  { name: 'Almacen', section: 'almacen' },
];

const products = [
  { barcode: '7790001000011', name: 'Coca Cola 500ml', cat: 'Bebidas', cost: 600, price: 900, stock: 24, unit: 'un' },
  { barcode: '7790001000028', name: 'Agua Mineral 500ml', cat: 'Bebidas', cost: 300, price: 500, stock: 30, unit: 'un' },
  { barcode: '7790001000035', name: 'Cerveza Quilmes 1L', cat: 'Bebidas', cost: 1200, price: 1800, stock: 18, unit: 'un' },
  { barcode: '7790002000012', name: 'Chocolate Milka 100g', cat: 'Golosinas', cost: 800, price: 1300, stock: 40, unit: 'un' },
  { barcode: '7790002000029', name: 'Chicles Beldent', cat: 'Golosinas', cost: 200, price: 400, stock: 60, unit: 'un' },
  { barcode: '7790003000013', name: 'Marlboro Box 20', cat: 'Cigarrillos', cost: 2200, price: 2800, stock: 25, unit: 'un' },
  { barcode: '7790004000014', name: 'Galletitas Oreo', cat: 'Galletitas', cost: 700, price: 1100, stock: 35, unit: 'un' },
  { barcode: null, name: 'Pan Frances', cat: 'Panaderia', cost: 800, price: 1500, stock: 10, unit: 'kg' },
  { barcode: null, name: 'Medialunas', cat: 'Facturas', cost: 200, price: 400, stock: 50, unit: 'un' },
  { barcode: null, name: 'Jamon Cocido', cat: 'Fiambres', cost: 4000, price: 6500, stock: 5, unit: 'kg' },
  { barcode: null, name: 'Salame', cat: 'Fiambres', cost: 5000, price: 8000, stock: 4, unit: 'kg' },
  { barcode: null, name: 'Queso Cremoso', cat: 'Quesos', cost: 3500, price: 5500, stock: 6, unit: 'kg' },
  { barcode: '7790005000015', name: 'Lavandina 1L', cat: 'Limpieza', cost: 500, price: 900, stock: 20, unit: 'un' },
  { barcode: '7790005000022', name: 'Detergente 750ml', cat: 'Limpieza', cost: 700, price: 1200, stock: 18, unit: 'un' },
  { barcode: '7790006000016', name: 'Jabon Tocador', cat: 'Higiene', cost: 300, price: 550, stock: 30, unit: 'un' },
  { barcode: '7790006000023', name: 'Papel Higienico x4', cat: 'Higiene', cost: 1200, price: 1900, stock: 22, unit: 'un' },
  { barcode: '7790007000017', name: 'Aceite Girasol 900ml', cat: 'Almacen', cost: 1500, price: 2300, stock: 15, unit: 'un' },
  { barcode: '7790007000024', name: 'Arroz 1kg', cat: 'Almacen', cost: 800, price: 1300, stock: 25, unit: 'un' },
  { barcode: '7790007000031', name: 'Fideos 500g', cat: 'Almacen', cost: 600, price: 1000, stock: 30, unit: 'un' },
  { barcode: '7790007000048', name: 'Azucar 1kg', cat: 'Almacen', cost: 700, price: 1200, stock: 20, unit: 'un' },
];

async function seed() {
  try {
    console.log('🌱 Iniciando seed en Neon...');

    // 1. Insertar usuarios (si no existen)
    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, 10);
      await sql`
        INSERT INTO users (username, password, name, role)
        VALUES (${u.username}, ${hash}, ${u.name}, ${u.role})
        ON CONFLICT (username) DO NOTHING
      `;
    }
    console.log('✅ Usuarios insertados');

    // 2. Insertar categorías
    for (const c of categories) {
      await sql`
        INSERT INTO categories (name, section)
        VALUES (${c.name}, ${c.section})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log('✅ Categorías insertadas');

    // 3. Obtener map de categoría -> id
    const catRows = await sql`SELECT id, name FROM categories`;
    const catMap = Object.fromEntries(catRows.map(c => [c.name, c.id]));

    // 4. Insertar productos
    for (const p of products) {
      const categoryId = catMap[p.cat] || null;
      await sql`
        INSERT INTO products (barcode, name, category_id, cost, price, stock, stock_min, unit)
        VALUES (${p.barcode || null}, ${p.name}, ${categoryId}, ${p.cost}, ${p.price}, ${p.stock}, 5, ${p.unit})
        ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name
      `;
    }
    console.log('✅ Productos insertados');
    console.log('🎉 Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
}

seed();
