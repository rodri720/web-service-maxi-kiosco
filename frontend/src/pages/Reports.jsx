import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Reports() {
  const [byDay, setByDay] = useState([]);
  const [top, setTop] = useState([]);
  const [section, setSection] = useState([]);
  const [low, setLow] = useState([]);

  useEffect(() => {
    api('/reports/sales-by-day').then(setByDay).catch(() => {});
    api('/reports/top-products').then(setTop).catch(() => {});
    api('/reports/sales-by-section').then(setSection).catch(() => {});
    api('/reports/low-stock').then(setLow).catch(() => {});
  }, []);

  const maxDay = Math.max(...byDay.map(d => d.total || 0), 1);
  const maxSec = Math.max(...section.map(s => s.total || 0), 1);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Ventas por dia (30d)</h2>
          {byDay.map(d => (
            <div key={d.day} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-20 text-slate-500">{d.day}</span>
              <div className="flex-1 bg-slate-100 rounded h-5"><div className="bg-indigo-500 h-full rounded" style={{ width: `${(d.total / maxDay) * 100}%` }} /></div>
              <span className="w-24 text-right font-medium">{money(d.total)}</span>
            </div>
          ))}
          {byDay.length === 0 && <div className="text-sm text-slate-500">Sin datos</div>}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Ventas por seccion (30d)</h2>
          {section.map(s => (
            <div key={s.section || 'sin'} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-24 capitalize">{s.section || 'sin categoria'}</span>
              <div className="flex-1 bg-slate-100 rounded h-5"><div className="bg-emerald-500 h-full rounded" style={{ width: `${(s.total / maxSec) * 100}%` }} /></div>
              <span className="w-24 text-right font-medium">{money(s.total)}</span>
            </div>
          ))}
          {section.length === 0 && <div className="text-sm text-slate-500">Sin datos</div>}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Top 10 productos</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b"><tr><th>Producto</th><th>Cant.</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {top.map((p, i) => (
                <tr key={i} className="border-b last:border-0"><td className="py-1">{p.name}</td><td>{p.qty}</td><td className="text-right">{money(p.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Stock bajo</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b"><tr><th>Producto</th><th>Categoria</th><th className="text-right">Stock</th><th className="text-right">Min</th></tr></thead>
            <tbody>
              {low.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-1">{p.name}</td><td>{p.category || '-'}</td>
                  <td className="text-right text-red-600 font-bold">{p.stock} {p.unit}</td>
                  <td className="text-right">{p.stock_min}</td>
                </tr>
              ))}
              {low.length === 0 && <tr><td colSpan="4" className="text-sm text-slate-500 py-2">Sin productos en alerta</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
