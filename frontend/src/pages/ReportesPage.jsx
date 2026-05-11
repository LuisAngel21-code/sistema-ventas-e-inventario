import { useState, useEffect } from 'react';
import { vendedoresAPI } from '../services/api';

export default function ReportesPage() {
  const [vendedores, setVendedores] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { vendedoresAPI.getAll().then(setVendedores).catch(console.error); }, []);

  function descargar(url, filename) {
    setLoading(true);
    fetch(url)
      .then(res => { if (!res.ok) throw new Error('Error al generar reporte'); return res.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }

  function generarVendedor() {
    if (!vendedorId) { alert('Seleccione un vendedor'); return; }
    const p = new URLSearchParams();
    if (desde) p.append('desde', desde);
    if (hasta) p.append('hasta', hasta);
    descargar(`/api/reportes/vendedor/${vendedorId}${p.toString() ? '?' + p.toString() : ''}`, `reporte_vendedor_${vendedorId}.pdf`);
  }

  function generarGeneral() {
    const p = new URLSearchParams();
    if (desde) p.append('desde', desde);
    if (hasta) p.append('hasta', hasta);
    descargar(`/api/reportes/general${p.toString() ? '?' + p.toString() : ''}`, 'reporte_general.pdf');
  }

  function generarInventario() { descargar('/api/reportes/inventario', 'reporte_inventario.pdf'); }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Reportes</h3>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Filtros de Fecha</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Reporte por Vendedor</h4>
          <p className="text-xs text-gray-500 mb-4">PDF con ventas de un vendedor, comisiones, sobreprecios y total a pagar.</p>
          <div className="mb-3">
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900">
              <option value="">Seleccionar vendedor...</option>
              {vendedores.filter(v => v.activo).map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
          <button onClick={generarVendedor} disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
            {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Reporte General</h4>
          <p className="text-xs text-gray-500 mb-4">PDF con todas las ventas, resumen por vendedor y totales generales.</p>
          <button onClick={generarGeneral} disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
            {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Reporte de Inventario</h4>
          <p className="text-xs text-gray-500 mb-4">PDF con stock actual, precios y alertas de productos con stock bajo.</p>
          <button onClick={generarInventario} disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
            {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
