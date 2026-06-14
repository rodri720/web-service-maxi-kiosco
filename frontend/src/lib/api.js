const BASE = 'http://localhost:4000/api';

export function getToken() { return localStorage.getItem('token'); }
export function setToken(t) { localStorage.setItem('token', t); }
export function clearToken() { localStorage.removeItem('token'); localStorage.removeItem('user'); }
export function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
export function setUser(u) { localStorage.setItem('user', JSON.stringify(u)); }

export async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  // const token = getToken();
  // if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

export const money = (n) => '$' + (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });