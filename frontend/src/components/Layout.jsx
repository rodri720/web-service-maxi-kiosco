import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken, getUser } from '../lib/api';

const items = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/pos', label: 'Punto de Venta', icon: 'M3 7h18M3 12h18M3 17h18' },
  { to: '/products', label: 'Productos', icon: 'M20 7l-8-4-8 4 8 4 8-4z' },
  { to: '/stock', label: 'Stock', icon: 'M4 6h16M4 12h16M4 18h16' },
  { to: '/cash', label: 'Caja', icon: 'M12 8c-1.5 0-3 .67-3 2s1.5 2 3 2 3 .67 3 2-1.5 2-3 2' },
  { to: '/sales', label: 'Ventas', icon: 'M3 3v18h18' },
  { to: '/reports', label: 'Reportes', icon: 'M3 3v18h18M7 14l3-3 3 3 5-5' },
];

export default function Layout({ children }) {
  const user = getUser();
  const nav = useNavigate();
  const logout = () => { clearToken(); nav('/login'); };

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="text-xl font-bold">Maxi Kiosco</div>
          <div className="text-xs text-slate-400">Sistema de Gestion</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'
                }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={i.icon} />
              </svg>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 text-sm">
          <div className="font-medium">{user?.name}</div>
          <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          <button onClick={logout} className="mt-2 w-full text-xs bg-slate-800 hover:bg-slate-700 py-1.5 rounded">
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
