# Maxi Kiosco - Sistema de Gestion

Sistema web completo para administrar un Maxi Kiosco con secciones de **kiosco, panaderia, fiambreria, limpieza y almacen**. Incluye:

- Punto de venta (POS) con busqueda por codigo de barras o nombre
- Control de stock con alertas de stock minimo y movimientos (ingreso/salida/merma)
- Apertura y cierre de caja con calculo de diferencia
- Multiples metodos de pago (efectivo, debito, credito, transferencia, QR)
- Reportes: ventas por dia, ventas por seccion, top productos, stock bajo
- Roles de usuario: **admin** (todo) y **cajero** (POS y caja)
- Historial de ventas con detalle por venta

## Stack
- **Backend:** Node.js, Express, SQLite (better-sqlite3), JWT, bcrypt
- **Frontend:** React 18, Vite, React Router, TailwindCSS

## Estructura
```
.
├── backend/        API REST (puerto 4000)
│   ├── src/
│   │   ├── db/             Esquema y seed
│   │   ├── routes/         auth, products, categories, sales, cash, reports
│   │   ├── middleware/     JWT auth
│   │   └── server.js
│   └── data/               (se crea solo) base SQLite
└── frontend/       React (puerto 5173)
    └── src/
        ├── pages/          Login, Dashboard, POS, Products, Stock, Cash, Sales, Reports
        ├── components/     Layout
        └── lib/api.js
```

## Instalacion

```bash
npm run install:all
```

Configurar variables (opcional, ver `backend/env.sample`):
```
PORT=4000
JWT_SECRET=cambia_esto_en_produccion
DB_FILE=./data/maxi.db
```

Cargar datos demo (usuarios, categorias y productos):
```bash
npm run seed
```

## Ejecutar en desarrollo

En dos terminales:
```bash
npm run dev:backend
npm run dev:frontend
```

Abri http://localhost:5173

**Usuarios demo:**
- `admin` / `admin123` (acceso total)
- `cajero` / `cajero123` (POS, caja, stock)

## Flujo de uso
1. Login.
2. Ir a **Caja** y abrir caja con monto inicial.
3. Ir a **Punto de Venta**, buscar productos (texto o codigo de barras), agregar al carrito y cobrar.
4. Movimientos manuales (ingreso/egreso) y cierre de caja con calculo de diferencia.
5. Ver **Reportes** y **Ventas** para analisis.

## API principal
- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/products`
- `POST /api/products/:id/stock` - movimiento de stock
- `GET/POST /api/sales`
- `GET /api/cash/current`, `POST /api/cash/open`, `POST /api/cash/:id/close`
- `GET /api/reports/dashboard`, `/sales-by-day`, `/top-products`, `/sales-by-section`, `/low-stock`

## Build de produccion (frontend)
```bash
cd frontend && npm run build
```
Servir `frontend/dist/` con cualquier static server y apuntar `/api` al backend.
