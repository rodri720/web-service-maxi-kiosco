import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../lib/api';

export default function Login() {
  const [username, setU] = useState('admin');
  const [password, setP] = useState('admin123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      setToken(r.token); setUser(r.user); nav('/');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 w-96">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-slate-800">Maxi Kiosco</div>
          <div className="text-sm text-slate-500">Sistema de Gestion</div>
        </div>
        {err && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">{err}</div>}
        <div className="mb-3">
          <label className="label">Usuario</label>
          <input className="input mt-1" value={username} onChange={e => setU(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="label">Contrasena</label>
          <input type="password" className="input mt-1" value={password} onChange={e => setP(e.target.value)} />
        </div>
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Ingresando...' : 'Ingresar'}</button>
        <div className="text-xs text-slate-500 mt-4 text-center">
          Demo: admin/admin123 - cajero/cajero123
        </div>
      </form>
    </div>
  );
}
