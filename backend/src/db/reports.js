
const sql = require('../../db');

// Ventas de hoy: total y cantidad
async function getTodaySales() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql`
    SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
    FROM sales
    WHERE DATE(created_at) = ${today}
  `;
  return { total: parseFloat(rows[0].total), count: parseInt(rows[0].count) };
}

// Ventas de los últimos N días (total)
async function getSalesLastDays(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const fromDate = date.toISOString().slice(0, 10);
  const rows = await sql`
    SELECT COALESCE(SUM(total), 0) as total
    FROM sales
    WHERE DATE(created_at) >= ${fromDate}
  `;
  return parseFloat(rows[0].total);
}

// Cantidad total de productos activos
async function getProductCount() {
  const rows = await sql`SELECT COUNT(*) as count FROM products WHERE active = 1`;
  return parseInt(rows[0].count);
}

// Cantidad de productos con stock bajo (stock <= stock_min)
async function getLowStockCount() {
  const rows = await sql`
    SELECT COUNT(*) as count FROM products
    WHERE active = 1 AND stock <= stock_min AND stock_min > 0
  `;
  return parseInt(rows[0].count);
}

// Ventas por día en un rango (para gráfico)
async function salesByDay(from, to) {
  return await sql`
    SELECT DATE(created_at) as day,
           COUNT(*) as total_sales,
           SUM(total) as total_amount
    FROM sales
    WHERE created_at >= ${from} AND created_at <= ${to}
    GROUP BY day
    ORDER BY day DESC
  `;
}

// Top productos por cantidad vendida y monto total
async function topProducts(limit = 10) {
  return await sql`
    SELECT p.id, p.name,
           SUM(si.qty) as qty,
           SUM(si.subtotal) as total
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    GROUP BY p.id, p.name
    ORDER BY total DESC
    LIMIT ${limit}
  `;
}

// Productos con stock bajo (detalle)
async function lowStock() {
  return await sql`
    SELECT * FROM products
    WHERE active = 1 AND stock <= stock_min AND stock_min > 0
    ORDER BY stock ASC
  `;
}

module.exports = {
  getTodaySales,
  getSalesLastDays,
  getProductCount,
  getLowStockCount,
  salesByDay,
  topProducts,
  lowStock
};
