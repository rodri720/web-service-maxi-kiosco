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
    const fetchRegister = () => {
      api('/cash/register')
        .then(data => data?.id ? setRegister(data) : setRegister(null))
        .catch(() => setRegister(null));
    };
    fetchRegister();
    const interval = setInterval(fetchRegister, 5000);
    inputRef.current?.focus();
    return () => clearInterval(interval);
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
      const saleData = {
        user_id: null,
        register_id: register.id,
        total,
        payment_method: payment,
        invoice_type: 'X',
      };
      const items = cart.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        price: i.price,
        subtotal: i.price * i.qty
      }));
      const r = await api('/sales', {
        method: 'POST',
        body: JSON.stringify({ sale: saleData, items }),
      });
      setMsg(`Venta #${r.id} registrada - Total ${money(r.total)}`);
      setCart([]);
      load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e) {
      console.error(e);
      setMsg('Error: ' + (e.message || 'No se pudo registrar la venta'));
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 p-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-6">🧾 Punto de Venta</h1>
        </div>
        <div className="col-auto">
          {register ? (
            <span className="badge bg-success fs-6">✅ Caja #{register.id} abierta</span>
          ) : (
            <span className="badge bg-danger fs-6">🔴 Caja cerrada - abrí una</span>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Panel izquierdo: productos y buscador */}
        <div className="col-md-7 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">🔍 Buscar producto</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Código de barras o nombre (Enter para agregar)"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={onSearchKey}
                  autoFocus
                />
              </div>

              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                {filtered.map(p => (
                  <div className="col" key={p.id}>
                    <div
                      className="card h-100 shadow-sm border-0 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => addToCart(p)}
                    >
                      <div className="card-body">
                        <div className="text-muted small">{p.category || 'Sin categoría'}</div>
                        <h6 className="card-title">{p.name}</h6>
                        <div className="d-flex justify-content-between align-items-end mt-2">
                          <span className="text-primary fw-bold">{money(p.price)}</span>
                          <span className="text-secondary small">Stock: {p.stock} {p.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-12 text-center text-muted py-5">
                    No se encontraron productos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: carrito y pago */}
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-sm sticky-top" style={{ top: '1rem' }}>
            <div className="card-header bg-white">
              <h5 className="mb-0">🛒 Carrito ({cart.length})</h5>
            </div>
            <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <p className="text-muted text-center">Carrito vacío</p>
              ) : (
                cart.map(i => (
                  <div key={i.product_id} className="border rounded p-2 mb-2">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">{i.name}</span>
                      <button className="btn-close btn-sm" onClick={() => remove(i.product_id)}></button>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => changeQty(i.product_id, -1)}>-</button>
                      <input
                        type="number"
                        step="0.001"
                        value={i.qty}
                        onChange={e => setQty(i.product_id, e.target.value)}
                        className="form-control form-control-sm w-25 text-center"
                      />
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => changeQty(i.product_id, 1)}>+</button>
                      <span className="text-muted ms-2">{i.unit}</span>
                      <span className="ms-auto fw-semibold">{money(i.price * i.qty)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="card-footer bg-white">
              {msg && <div className="alert alert-warning alert-sm py-2">{msg}</div>}
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold">TOTAL</span>
                <span className="fs-4 fw-bold text-primary">{money(total)}</span>
              </div>
              <select className="form-select mb-3" value={payment} onChange={e => setPayment(e.target.value)}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="debito">💳 Débito</option>
                <option value="credito">💳 Crédito</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="qr">📱 QR / Mercado Pago</option>
              </select>
              <button
                className="btn btn-primary w-100 py-2 mb-2"
                onClick={checkout}
                disabled={!cart.length || !register}
              >
                Cobrar
              </button>
              <button className="btn btn-outline-secondary w-100" onClick={() => setCart([])}>
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}