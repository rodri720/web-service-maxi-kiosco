import { useEffect, useState } from 'react';
import { api, money, getUser } from '../lib/api';

function Stat({ label, value, hint, color = 'indigo' }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className={`text-3xl font-bold mt-1 text-${color}-600`}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [top, setTop] = useState([]);
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    api('/reports/dashboard').then(setData).catch(() => {});
    api('/reports/sales-by-day').then(setByDay).catch(() => {});
    api('/reports/top-products').then(setTop).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Hola, {user?.name}</h1>
        <p className="text-slate-600">Tu rol es <b>{user?.role}</b>. Anda al Punto de Venta para empezar a vender.</p>
      </div>
    );
  }

  if (!data) return <div className="p-8">Cargando...</div>;

  const max = Math.max(...byDay.map(d => d.total || 0), 1);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Ventas hoy" value={money(data.today.total)} hint={`${data.today.count} ventas`} />
        <Stat label="Ultimos 7 dias" value={money(data.week)} color="emerald" />
        <Stat label="Ultimos 30 dias" value={money(data.month)} color="emerald" />
        <Stat label="Productos" value={data.productCount} color="slate" />
        <Stat label="Stock bajo" value={data.lowStock} color="red" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Ventas por dia (30d)</h2>
          <div className="space-y-1">
            {byDay.length === 0 && <div className="text-sm text-slate-500">Sin datos</div>}
            {byDay.map(d => (
              <div key={d.day} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-slate-500">{d.day}</span>
                <div className="flex-1 bg-slate-100 rounded h-5 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(d.total / max) * 100}%` }} />
                </div>
                <span className="w-24 text-right font-medium">{money(d.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Top productos (30d)</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b">
              <th className="py-1">Producto</th><th>Cant.</th><th className="text-right">Total</th>
            </tr></thead>
            <tbody>
              {top.map((p, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5">{p.name}</td>
                  <td>{p.qty}</td>
                  <td className="text-right">{money(p.total)}</td>
                </tr>
              ))}
              {top.length === 0 && <tr><td colSpan="3" className="text-slate-500 py-2">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
