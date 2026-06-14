import { Link, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getUser } from '../lib/api';

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Maxi Kiosco</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item"><Link className="nav-link" to="/pos">Punto de Venta</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/ventas">Ventas</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/caja">Caja</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/productos">Productos</Link></li>
              
            </ul>
            <span className="navbar-text me-3">👤 {user?.name || 'Usuario'}</span>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>Salir</button>
          </div>
        </div>
      </nav>
      <div className="container-fluid mt-3">
        <Outlet />
      </div>
    </div>
  );
}