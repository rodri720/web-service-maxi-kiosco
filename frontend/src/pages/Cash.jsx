import { useEffect, useState } from 'react';
import { api, money } from '../lib/api';

export default function Cash() {
  const [reg, setReg] = useState(null);
  const [opening, setOpening] = useState(0);
  const [closing, setClosing] = useState(0);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [mov, setMov] = useState({ type: 'ingreso', amount: 0, reason: '' });
  const [closeResult, setCloseResult] = useState(null);

  const load = () => {
    api('/cash/current').then(r => {
      setReg(r);
      if (r) api(`/cash/${r.id}/summary`).then(setSummary);
    });
    api('/cash').then(setHistory);
  };
  useEffect(load, []);

  async function open() {
    await api('/cash/open', { method: 'POST', body: JSON.stringify({ opening_amount: parseFloat(opening) || 0 }) });
    setOpening(0); load();
  }
  async function addMov() {
    await api(`/cash/${reg.id}/movement`, { method: 'POST', body: JSON.stringify({ ...mov, amount: parseFloat(mov.amount) }) });
    setMov({ type: 'ingreso', amount: 0, reason: '' }); load();
  }
  async function close() {
    if (!confirm('Cerrar caja?')) return;
    const r = await api(`/cash/${reg.id}/close`, { method: 'POST', body: JSON.stringify({ closing_amount: parseFloat(closing) || 0 }) });
    setCloseResult(r); setClosing(0); load();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Caja</h1>

      {!reg && (
        <div className="card max-w-md">
          <h2 className="font-semibold mb-3">Abrir caja</h2>
          <label className="label">Monto inicial</label>
          <input type="number" className="input mt-1 mb-3" value={opening} onChange={e => setOpening(e.target.value)} />
          <button onClick={open} className="btn-primary w-full">Abrir caja</button>
        </div>
      )}

      {reg && summary && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Caja #{reg.id} abierta</h2>
              <span className="text-xs text-slate-500">{new Date(reg.opened_at).toLocaleString()}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Apertura:</span><b>{money(reg.opening_amount)}</b></div>
              <div className="flex justify-between"><span>Total ventas:</span><b>{money(summary.totalSales)}</b></div>
              <div className="border-t pt-2">
                <div className="label mb-1">Por metodo</div>
                {summary.byMethod.map(m => (
                  <div key={m.payment_method} className="flex justify-between">
                    <span className="capitalize">{m.payment_method}</span>
                    <span>{m.qty} - {money(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-4 pt-3">
              <div className="label mb-2">Movimientos manuales</div>
              <div className="grid grid-cols-3 gap-2">
                <select className="input" value={mov.type} onChange={e => setMov({ ...mov, type: e.target.value })}>
                  <option value="ingreso">Ingreso</option><option value="egreso">Egreso</option>
                </select>
                <input type="number" placeholder="Monto" className="input" value={mov.amount}
                  onChange={e => setMov({ ...mov, amount: e.target.value })} />
                <button onClick={addMov} className="btn-primary">Agregar</button>
              </div>
              <input className="input mt-2" placeholder="Motivo" value={mov.reason}
                onChange={e => setMov({ ...mov, reason: e.target.value })} />
              <div className="mt-3 max-h-40 overflow-auto text-sm">
                {summary.movements.map(m => (
                  <div key={m.id} className="flex justify-between border-b py-1">
                    <span className={m.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}>
                      {m.type === 'ingreso' ? '+' : '-'} {money(m.amount)}
                    </span>
                    <span className="text-slate-500 text-xs">{m.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-3">Cierre de caja</h2>
            <p className="text-sm text-slate-600 mb-3">
              Ingresa el efectivo contado. El sistema calcula la diferencia con lo esperado.
            </p>
            <label className="label">Efectivo en caja al cierre</label>
            <input type="number" className="input mt-1 mb-3" value={closing} onChange={e => setClosing(e.target.value)} />
            <button onClick={close} className="btn-danger w-full">Cerrar caja</button>
            {closeResult && (
              <div className="mt-4 bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Esperado:</span><b>{money(closeResult.expected)}</b></div>
                <div className="flex justify-between">
                  <span>Diferencia:</span>
                  <b className={closeResult.difference < 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {money(closeResult.difference)}
                  </b>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Historial de cajas</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr><th className="py-2">#</th><th>Usuario</th><th>Apertura</th><th>Cierre</th>
              <th className="text-right">Esperado</th><th className="text-right">Contado</th>
              <th className="text-right">Diferencia</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} className="border-b last:border-0">
                <td className="py-2">{h.id}</td>
                <td>{h.user_name}</td>
                <td className="text-xs">{new Date(h.opened_at).toLocaleString()}</td>
                <td className="text-xs">{h.closed_at ? new Date(h.closed_at).toLocaleString() : '-'}</td>
                <td className="text-right">{h.expected_amount != null ? money(h.expected_amount) : '-'}</td>
                <td className="text-right">{h.closing_amount != null ? money(h.closing_amount) : '-'}</td>
                <td className={`text-right ${h.difference < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {h.difference != null ? money(h.difference) : '-'}
                </td>
                <td><span className={`text-xs px-2 py-0.5 rounded ${h.status === 'abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200'}`}>{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
