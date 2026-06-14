import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Sales() {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api('/sales');
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const data = await api(`/sales/${id}`);
      setDetail(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Función para enviar factura a ARCA (simulado o real)
  const submitToArca = async (saleId) => {
    try {
      const result = await api(`/invoices/submit-to-arca/${saleId}`, { method: 'POST' });
      alert(result.message + '\nCAE: ' + result.cae);
      // Recargar lista para mostrar datos fiscales si los hubiera
      loadSales();
      if (detail && detail.id === saleId) {
        const updated = await api(`/sales/${saleId}`);
        setDetail(updated);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Función para generar PDF (factura visual)
  const generateInvoice = (saleId) => {
    window.open(`/api/invoices/generate/${saleId}`, '_blank');
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📋 Historial de Ventas</h2>
        <button className="btn btn-outline-primary btn-sm" onClick={loadSales}>🔄 Actualizar</button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Método</th>
                <th className="text-end">Total</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(sale => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>{sale.user_name || '—'}</td>
                  <td><span className="badge bg-secondary">{sale.payment_method}</span></td>
                  <td className="text-end fw-bold">{money(sale.total)}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => openDetail(sale.id)}
                      title="Ver detalles"
                    >
                      👁️ Ver
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => generateInvoice(sale.id)}
                      title="Factura PDF"
                    >
                      🧾 PDF
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => submitToArca(sale.id)}
                      title="Enviar a ARCA"
                    >
                      📡 ARCA
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No hay ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalle de venta */}
      {detail && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Venta #{detail.id}</h5>
                <button type="button" className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Fecha:</strong> {new Date(detail.created_at).toLocaleString()}
                  </div>
                  <div className="col-md-6">
                    <strong>Método de pago:</strong> {detail.payment_method}
                  </div>
                  <div className="col-md-6">
                    <strong>Cliente:</strong> {detail.customer_name || 'Consumidor Final'}
                  </div>
                  {detail.cae && (
                    <div className="col-md-6">
                      <strong>CAE:</strong> {detail.cae} <br />
                      <small className="text-muted">Vto: {detail.cae_due}</small>
                    </div>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items && detail.items.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>{money(item.price)}</td>
                          <td>{money(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <td colSpan="3" className="text-end fw-bold">Total:</td>
                        <td className="fw-bold">{money(detail.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => generateInvoice(detail.id)}>
                  🧾 Descargar Factura
                </button>
                <button className="btn btn-success" onClick={() => submitToArca(detail.id)}>
                  📡 Enviar a ARCA
                </button>
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}