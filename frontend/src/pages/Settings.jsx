import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { api('/settings').then(setS); }, []);

  async function save() {
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify(s) });
      setMsg('Guardado'); setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg('Error: ' + e.message); }
  }
  if (!s) return <div className="p-8">Cargando...</div>;

  const set = (k, v) => setS({ ...s, [k]: v });

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Configuracion</h1>
      {msg && <div className="bg-emerald-100 text-emerald-800 p-2 rounded text-sm">{msg}</div>}

      <div className="card">
        <h2 className="font-semibold mb-3">Empresa</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Razon Social</label>
            <input className="input mt-1" value={s.company_name || ''} onChange={e => set('company_name', e.target.value)} /></div>
          <div><label className="label">CUIT</label>
            <input className="input mt-1" value={s.company_cuit || ''} onChange={e => set('company_cuit', e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Domicilio fiscal</label>
            <input className="input mt-1" value={s.company_address || ''} onChange={e => set('company_address', e.target.value)} /></div>
          <div><label className="label">Condicion IVA</label>
            <select className="input mt-1" value={s.company_iva || 'Monotributo'} onChange={e => set('company_iva', e.target.value)}>
              <option>Monotributo</option><option>Responsable Inscripto</option><option>Exento</option>
            </select></div>
          <div><label className="label">Punto de Venta</label>
            <input className="input mt-1" value={s.pto_vta || '1'} onChange={e => set('pto_vta', e.target.value)} /></div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-1">ARCA / AFIP - Factura C (Monotributo)</h2>
        <p className="text-xs text-slate-500 mb-3">
          Modo simulado emite CAE de prueba (no fiscal). Modo AFIP requiere certificado digital y CUIT habilitado para facturacion electronica.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Modo</label>
            <select className="input mt-1" value={s.afip_mode || 'simulado'} onChange={e => set('afip_mode', e.target.value)}>
              <option value="simulado">Simulado (desarrollo)</option>
              <option value="afip">AFIP real</option>
            </select></div>
          <div><label className="label">Entorno</label>
            <select className="input mt-1" value={s.afip_production || '0'} onChange={e => set('afip_production', e.target.value)}>
              <option value="0">Homologacion</option>
              <option value="1">Produccion</option>
            </select></div>
          <div className="col-span-2"><label className="label">Ruta certificado (.crt)</label>
            <input className="input mt-1" placeholder="C:\\certs\\afip.crt" value={s.afip_cert || ''} onChange={e => set('afip_cert', e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Ruta clave privada (.key)</label>
            <input className="input mt-1" placeholder="C:\\certs\\afip.key" value={s.afip_key || ''} onChange={e => set('afip_key', e.target.value)} /></div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-1">Impresora termica</h2>
        <p className="text-xs text-slate-500 mb-3">
          Modo navegador imprime el ticket 80mm con el dialogo del SO. Modo ESC/POS imprime directo a impresora de red o USB compartida.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tipo</label>
            <select className="input mt-1" value={s.printer_type || 'browser'} onChange={e => set('printer_type', e.target.value)}>
              <option value="browser">Navegador (HTML 80mm)</option>
              <option value="epson">ESC/POS Epson</option>
              <option value="star">ESC/POS Star</option>
            </select></div>
          <div><label className="label">Interfaz</label>
            <input className="input mt-1" placeholder="tcp://192.168.0.100:9100  o  printer:POS80"
              value={s.printer_interface || ''} onChange={e => set('printer_interface', e.target.value)} /></div>
        </div>
      </div>

      <button onClick={save} className="btn-primary">Guardar configuracion</button>
    </div>
  );
}
