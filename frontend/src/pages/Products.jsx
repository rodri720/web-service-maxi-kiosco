import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    stock_min: '',
    unit: 'un',
    category_id: '',
    active: 1
  });
  const [categories, setCategories] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Cargar productos y categorías
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api('/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api('/categories');
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Filtrar productos por nombre o código
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  // Abrir modal para crear/editar
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        stock_min: product.stock_min || '',
        unit: product.unit || 'un',
        category_id: product.category_id || '',
        active: product.active !== undefined ? product.active : 1
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        price: '',
        cost: '',
        stock: '',
        stock_min: '',
        unit: 'un',
        category_id: '',
        active: 1
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProduct = async () => {
    try {
      if (editingProduct) {
        await api(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await api('/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  const confirmDelete = (product) => {
    setDeleteConfirm(product);
  };

  const deleteProduct = async () => {
    if (!deleteConfirm) return;
    try {
      await api(`/products/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📦 Productos</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo Producto
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✖</button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de productos en cards (mejor visual) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredProducts.map(product => (
            <div className="col-sm-6 col-md-4 col-lg-3" key={product.id}>
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title text-truncate">{product.name}</h5>
                  <p className="card-text text-muted small">
                    {product.barcode ? `Código: ${product.barcode}` : 'Sin código'}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-primary">{money(product.price)}</span>
                    <span className={`badge ${product.stock <= product.stock_min ? 'bg-danger' : 'bg-success'}`}>
                      Stock: {product.stock} {product.unit}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mt-3">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openModal(product)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => confirmDelete(product)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No hay productos que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Código de barras</label>
                    <input
                      type="text"
                      className="form-control"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Precio de venta</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Costo</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="cost"
                        value={formData.cost}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock actual</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock mínimo</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        name="stock_min"
                        value={formData.stock_min}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Unidad</label>
                      <input
                        type="text"
                        className="form-control"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                      >
                        <option value="">Sin categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="active"
                      checked={formData.active === 1}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                    />
                    <label className="form-check-label">Activo</label>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={saveProduct}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar eliminación</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteConfirm(null)}></button>
              </div>
              <div className="modal-body">
                ¿Estás seguro de que deseas eliminar el producto <strong>{deleteConfirm.name}</strong>?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={deleteProduct}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}