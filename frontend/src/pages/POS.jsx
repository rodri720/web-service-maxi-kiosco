import { useEffect, useRef, useState } from 'react';
import { api, money } from '../lib/api';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [register, setRegister] = useState(null);
  const [payment, setPayment] = useState('efectivo');
  const [msg, setMsg] = useState('');
  const inputRef = useRef(null);

  const load = () => api('/products').then(setProducts);
  useEffect(() => {
    load();
    api('/cash/current').then(setRegister);
    inputRef.current?.focus();
  }, []);

  const filtered = products.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.barcode || '').includes(q)
  ).slice(0, 60);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id);
      if (ex) return prev.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product_id: p.id, name: p.name, price: p.price, qty: 1, unit: p.unit, stock: p.stock }];
    });
  }

  function changeQty(id, delta) {
    setCart(prev => prev.map(i => i.product_id === id ? { ...i, qty: Math.max(0.001, +(i.qty + delta).toFixed(3)) } : i));
  }
  function setQty(id, qty) {
    setCart(prev => prev.map(i => i.product_id === id ? { ...i, qty: Math.max(0.001, parseFloat(qty) || 0) } : i));
  }
  function remove(id) { setCart(prev => prev.filter(i => i.product_id !== id)); }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function onSearchKey(e) {
    if (e.key === 'Enter' && q) {
      const exact = products.find(p => p.barcode === q);
      if (exact) { addToCart(exact); setQ(''); return; }
      if (filtered.length === 1) { addToCart(filtered[0]); setQ(''); }
    }
  }

  async function checkout() {
    if (!cart.length) return;
    if (!register) { setMsg('Debes abrir caja primero'); return; }
    try {
      const r = await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product_id, qty: i.qty })),
          payment_method: payment,
        }),
      });
      setMsg(`Venta #${r.id} registrada - Total ${money(r.total)}`);
      setCart([]); load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e) { setMsg('Error: ' + e.message); }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">Punto de Venta</h1>
          {register
            ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Caja abierta #{register.id}</span>
            : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Caja cerrada - abri una</span>}
        </div>
        <input
          ref={inputRef}
          autoFocus
          className="input mb-4"
          placeholder="Buscar por nombre o codigo de barras (Enter para agregar)..."
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={onSearchKey}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className="card text-left hover:border-indigo-500 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="text-xs text-slate-500">{p.category || 'Sin categoria'}</div>
              <div className="font-medium text-sm leading-tight">{p.name}</div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-indigo-600 font-bold">{money(p.price)}</span>
                <span className="text-xs text-slate-500">Stk: {p.stock} {p.unit}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="text-slate-500 col-span-full">Sin resultados</div>}
        </div>
      </div>

      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Carrito ({cart.length})</h2>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 && <div className="text-sm text-slate-500">Carrito vacio</div>}
          {cart.map(i => (
            <div key={i.product_id} className="border rounded-lg p-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{i.name}</span>
                <button onClick={() => remove(i.product_id)} className="text-red-500 text-xs">X</button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => changeQty(i.product_id, -1)} className="px-2 bg-slate-100 rounded">-</button>
                <input type="number" step="0.001" value={i.qty}
                  onChange={e => setQty(i.product_id, e.target.value)}
                  className="w-20 px-2 py-1 border rounded text-center text-sm" />
                <button onClick={() => changeQty(i.product_id, 1)} className="px-2 bg-slate-100 rounded">+</button>
                <span className="text-xs text-slate-500">{i.unit}</span>
                <span className="ml-auto font-semibold text-sm">{money(i.price * i.qty)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-slate-50 space-y-3">
          {msg && <div className="text-sm bg-amber-100 text-amber-800 p-2 rounded">{msg}</div>}
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL</span><span className="text-indigo-700">{money(total)}</span>
          </div>
          <select className="input" value={payment} onChange={e => setPayment(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="debito">Debito</option>
            <option value="credito">Credito</option>
            <option value="transferencia">Transferencia</option>
            <option value="qr">QR / Mercado Pago</option>
          </select>
          <button onClick={checkout} disabled={!cart.length || !register}
            className="btn-primary w-full text-lg disabled:opacity-50">
            Cobrar
          </button>
          <button onClick={() => setCart([])} className="btn-ghost w-full text-sm">Vaciar carrito</button>
        </div>
      </aside>
    </div>
  );
}
