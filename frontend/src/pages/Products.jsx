import { useEffect, useState } from 'react';
import { api, money, getUser } from '../lib/api';

const empty = { barcode: '', name: '', category_id: '', cost: 0, price: 0, stock: 0, stock_min: 5, unit: 'un', active: 1 };

export default function Products() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const isAdmin = getUser()?.role === 'admin';

  const load = () => api('/products' + (q ? `?q=${encodeURIComponent(q)}` : '')).then(setItems);
  useEffect(() => { load(); api('/categories').then(setCats); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);

  async function save() {
    const body = { ...edit, category_id: edit.category_id || null };
    if (edit.id) await api(`/products/${edit.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/products', { method: 'POST', body: JSON.stringify(body) });
    setEdit(null); load();
  }
  async function remove(id) {
    if (!confirm('Eliminar producto?')) return;
    await api(`/products/${id}`, { method: 'DELETE' }); load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        {isAdmin && <button onClick={() => setEdit({ ...empty })} className="btn-primary">+ Nuevo</button>}
      </div>
      <input className="input mb-4" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Codigo</th><th>Nombre</th><th>Categoria</th>
              <th className="text-right">Costo</th><th className="text-right">Precio</th>
              <th className="text-right">Stock</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2 text-slate-500">{p.barcode || '-'}</td>
                <td className="font-medium">{p.name}</td>
                <td>{p.category || '-'}</td>
                <td className="text-right">{money(p.cost)}</td>
                <td className="text-right font-semibold">{money(p.price)}</td>
                <td className={`text-right ${p.stock <= p.stock_min ? 'text-red-600 font-bold' : ''}`}>
                  {p.stock} {p.unit}
                </td>
                <td className="text-right space-x-2">
                  {isAdmin && <>
                    <button onClick={() => setEdit({ ...p })} className="text-indigo-600 text-xs">Editar</button>
                    <button onClick={() => remove(p.id)} className="text-red-600 text-xs">Borrar</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[480px] max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">{edit.id ? 'Editar' : 'Nuevo'} producto</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nombre</label>
                <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><label className="label">Codigo de barras</label>
                <input className="input" value={edit.barcode || ''} onChange={e => setEdit({ ...edit, barcode: e.target.value })} /></div>
              <div><label className="label">Categoria</label>
                <select className="input" value={edit.category_id || ''} onChange={e => setEdit({ ...edit, category_id: e.target.value })}>
                  <option value="">- ninguna -</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.section} / {c.name}</option>)}
                </select></div>
              <div><label className="label">Costo</label>
                <input type="number" step="0.01" className="input" value={edit.cost} onChange={e => setEdit({ ...edit, cost: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Precio</label>
                <input type="number" step="0.01" className="input" value={edit.price} onChange={e => setEdit({ ...edit, price: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Stock</label>
                <input type="number" step="0.001" className="input" value={edit.stock} onChange={e => setEdit({ ...edit, stock: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Stock minimo</label>
                <input type="number" step="0.001" className="input" value={edit.stock_min} onChange={e => setEdit({ ...edit, stock_min: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="label">Unidad</label>
                <select className="input" value={edit.unit} onChange={e => setEdit({ ...edit, unit: e.target.value })}>
                  <option value="un">unidad</option><option value="kg">kg</option><option value="lt">litro</option>
                </select></div>
              <div><label className="label">Activo</label>
                <select className="input" value={edit.active ? 1 : 0} onChange={e => setEdit({ ...edit, active: +e.target.value })}>
                  <option value="1">Si</option><option value="0">No</option>
                </select></div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setEdit(null)} className="btn-ghost">Cancelar</button>
              <button onClick={save} className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
