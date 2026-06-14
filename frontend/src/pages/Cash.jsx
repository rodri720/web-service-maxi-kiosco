import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Cash() {
  const [register, setRegister] = useState(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [msg, setMsg] = useState('');
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({ ventas: 0, gastos: 0, retiros: 0, ingresosExtra: 0 });
  const [newMovement, setNewMovement] = useState({ type: 'gasto', amount: 0, reason: '' });
  const [closingAmount, setClosingAmount] = useState(0);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('movimientos');

  const loadRegister = async () => {
    try {
      const data = await api('/cash/register');
      setRegister(data || null);
      if (data && data.id) {
        await loadMovements(data.id);
        await loadSummary(data.id);
      }
    } catch (err) {
      setRegister(null);
    }
  };

  const loadMovements = async (registerId) => {
    try {
      const data = await api(`/cash/movements/${registerId}`);
      setMovements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSummary = async (registerId) => {
    try {
      const data = await api(`/cash/summary/${registerId}`);
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRegister();
    const interval = setInterval(() => {
      if (register && register.status === 'abierta') {
        loadMovements(register.id);
        loadSummary(register.id);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [register]);

  const openRegister = async () => {
    if (openingAmount < 0) {
      setMsg('El monto de apertura no puede ser negativo');
      return;
    }
    setLoading(true);
    try {
      await api('/cash/open', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          opening_amount: openingAmount,
          notes: 'Apertura desde interfaz'
        })
      });
      setMsg('✅ Caja abierta correctamente');
      loadRegister();
      setOpeningAmount(0);
    } catch (err) {
      setMsg('❌ Error al abrir caja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMovement = async () => {
    if (!register) return;
    if (newMovement.amount <= 0) {
      setMsg('El monto debe ser mayor a cero');
      return;
    }
    if (!newMovement.reason) {
      setMsg('Debe ingresar una razón o descripción');
      return;
    }
    setLoading(true);
    try {
      await api('/cash/movement', {
        method: 'POST',
        body: JSON.stringify({
          register_id: register.id,
          type: newMovement.type,
          amount: newMovement.amount,
          reason: newMovement.reason
        })
      });
      setMsg('✅ Movimiento registrado');
      setNewMovement({ type: 'gasto', amount: 0, reason: '' });
      await loadMovements(register.id);
      await loadSummary(register.id);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeRegister = async () => {
    if (closingAmount < 0) {
      setMsg('El monto de cierre no puede ser negativo');
      return;
    }
    setLoading(true);
    try {
      const result = await api('/cash/close', {
        method: 'POST',
        body: JSON.stringify({
          id: register.id,
          closing_amount: closingAmount,
          notes: 'Cierre manual'
        })
      });
      setMsg(`✅ Caja cerrada. Diferencia: ${money(result.difference)}`);
      setShowCloseModal(false);
      loadRegister();
    } catch (err) {
      setMsg('❌ Error al cerrar caja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const expectedTotal = register ? (parseFloat(register.opening_amount) + summary.ventas + summary.ingresosExtra - summary.gastos - summary.retiros) : 0;

  // Caja cerrada
  if (!register) {
    return (
      <div className="container mt-4">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Abrir Caja</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Monto de apertura ($)</label>
              <input
                type="number"
                className="form-control"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <button className="btn btn-primary w-100" onClick={openRegister} disabled={loading}>
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
            {msg && <div className="alert alert-info mt-3">{msg}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Caja abierta
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Caja #{register.id} - Abierta</h5>
            </div>
            <div className="card-body">
              <p><strong>Apertura:</strong> {money(register.opening_amount)}</p>
              <p><strong>Fecha apertura:</strong> {new Date(register.opened_at).toLocaleString()}</p>
              <hr />
              <h6>Resumen del día</h6>
              <ul className="list-unstyled">
                <li>💰 Ventas: {money(summary.ventas || 0)}</li>
                <li>📉 Gastos: {money(summary.gastos || 0)}</li>
                <li>💸 Retiros: {money(summary.retiros || 0)}</li>
                <li>📈 Ingresos extra: {money(summary.ingresosExtra || 0)}</li>
                <li className="fw-bold mt-2">Efectivo esperado: {money(expectedTotal)}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'movimientos' ? 'active' : ''}`} onClick={() => setActiveTab('movimientos')}>
                    Movimientos
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'nuevo' ? 'active' : ''}`} onClick={() => setActiveTab('nuevo')}>
                    Registrar Gasto/Retiro
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'cierre' ? 'active' : ''}`} onClick={() => setActiveTab('cierre')}>
                    Cierre de Caja
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'movimientos' && (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Razón</th></tr>
                    </thead>
                    <tbody>
                      {movements.map(m => (
                        <tr key={m.id}>
                          <td>{new Date(m.created_at).toLocaleTimeString()}</td>
                          <td>
                            <span className={`badge ${m.type === 'venta' ? 'bg-success' : m.type === 'gasto' ? 'bg-danger' : m.type === 'retiro' ? 'bg-warning' : 'bg-info'}`}>
                              {m.type === 'venta' ? 'Venta' : m.type === 'gasto' ? 'Gasto' : m.type === 'retiro' ? 'Retiro' : 'Ingreso extra'}
                            </span>
                          </td>
                          <td>{money(m.amount)}</td>
                          <td>{m.reason}</td>
                        </tr>
                      ))}
                      {movements.length === 0 && <tr><td colSpan="4" className="text-center">Sin movimientos</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'nuevo' && (
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={newMovement.type} onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}>
                      <option value="gasto">Gasto (pago a proveedor, servicio, etc.)</option>
                      <option value="retiro">Retiro (dinero sacado de caja)</option>
                      <option value="ingreso_extra">Ingreso extra (no ventas)</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Monto ($)</label>
                    <input type="number" step="0.01" className="form-control" value={newMovement.amount} onChange={(e) => setNewMovement({ ...newMovement, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Razón / Descripción</label>
                    <input type="text" className="form-control" value={newMovement.reason} onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary" onClick={addMovement} disabled={loading}>
                      Registrar Movimiento
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'cierre' && (
                <div>
                  <div className="alert alert-warning">
                    <strong>⚠️ Importante:</strong> Antes de cerrar, asegúrate de tener registrados todos los gastos, retiros e ingresos extra del día.
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Efectivo declarado (arqueo) ($)</label>
                      <input type="number" step="0.01" className="form-control" value={closingAmount} onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Efectivo esperado</label>
                      <input type="text" className="form-control" value={money(expectedTotal)} disabled />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-danger" onClick={() => setShowCloseModal(true)}>Cerrar Caja</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info mt-3">{msg}</div>}

      {/* Modal de confirmación de cierre */}
      {showCloseModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar cierre de caja</h5>
                <button type="button" className="btn-close" onClick={() => setShowCloseModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Monto declarado:</strong> {money(closingAmount)}</p>
                <p><strong>Monto esperado:</strong> {money(expectedTotal)}</p>
                <p className={`fw-bold ${closingAmount !== expectedTotal ? 'text-danger' : 'text-success'}`}>
                  Diferencia: {money(closingAmount - expectedTotal)}
                </p>
                <p>¿Deseas cerrar la caja?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>Cancelar</button>
                <button className="btn btn-danger" onClick={closeRegister}>Cerrar Caja</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}