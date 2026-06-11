import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Sales() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => { api('/sales').then(setItems); }, []);

  async function open(id) {
    const d = await api(`/sales/${id}`); setDetail(d);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Historial de Ventas</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr><th className="py-2">#</th><th>Fecha</th><th>Usuario</th><th>Metodo</th>
              <th className="text-right">Total</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">{s.id}</td>
                <td className="text-xs">{new Date(s.created_at).toLocaleString()}</td>
                <td>{s.user_name}</td>
                <td className="capitalize">{s.payment_method}</td>
                <td className="text-right font-semibold">{money(s.total)}</td>
                <td className="text-right"><button onClick={() => open(s.id)} className="text-indigo-600 text-xs">Ver</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="text-slate-500 py-4 text-center">Sin ventas</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[480px]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Venta #{detail.id}</h2>
                <div className="text-xs text-slate-500">{new Date(detail.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-500">X</button>
            </div>
            <table className="w-full text-sm mb-4">
              <thead className="border-b text-slate-500 text-left">
                <tr><th className="py-1">Producto</th><th>Cant</th><th className="text-right">Precio</th><th className="text-right">Subt.</th></tr>
              </thead>
              <tbody>
                {detail.items.map(i => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-1">{i.name}</td><td>{i.qty}</td>
                    <td className="text-right">{money(i.price)}</td>
                    <td className="text-right">{money(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-lg font-bold">
              <span>Total ({detail.payment_method})</span>
              <span className="text-indigo-700">{money(detail.total)}</span>
            </div>
            <button onClick={() => window.print()} className="btn-ghost w-full mt-4">Imprimir</button>
          </div>
        </div>
      )}
    </div>
  );
}
