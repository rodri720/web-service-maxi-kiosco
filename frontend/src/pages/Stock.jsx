import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Stock() {
  const [items, setItems] = useState([]);
  const [low, setLow] = useState(false);
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState(1);
  const [type, setType] = useState('ingreso');
  const [reason, setReason] = useState('');

  const load = () => api('/products' + (low ? '?low=1' : '')).then(setItems);
  useEffect(() => { load(); }, [low]);

  async function move() {
    if (!sel) return;
    await api(`/products/${sel.id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ qty: parseFloat(qty), type, reason }),
    });
    setSel(null); setQty(1); setReason(''); load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Control de Stock</h1>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={low} onChange={e => setLow(e.target.checked)} />
          Solo stock bajo
        </label>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr><th className="py-2">Producto</th><th>Categoria</th>
              <th className="text-right">Stock</th><th className="text-right">Minimo</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{p.name}</td>
                <td>{p.category || '-'}</td>
                <td className={`text-right ${p.stock <= p.stock_min ? 'text-red-600 font-bold' : ''}`}>
                  {p.stock} {p.unit}
                </td>
                <td className="text-right">{p.stock_min}</td>
                <td className="text-right">
                  <button onClick={() => setSel(p)} className="text-indigo-600 text-xs">Mover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96">
            <h2 className="text-lg font-bold mb-1">Movimiento de stock</h2>
            <div className="text-sm text-slate-600 mb-4">{sel.name}</div>
            <div className="space-y-3">
              <div><label className="label">Tipo</label>
                <select className="input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="ingreso">Ingreso</option>
                  <option value="salida">Salida / Merma</option>
                </select></div>
              <div><label className="label">Cantidad</label>
                <input type="number" step="0.001" className="input" value={qty} onChange={e => setQty(e.target.value)} /></div>
              <div><label className="label">Motivo</label>
                <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Compra, ajuste, rotura..." /></div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setSel(null)} className="btn-ghost">Cancelar</button>
              <button onClick={move} className="btn-primary">Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
