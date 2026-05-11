import { useState, useEffect } from 'react';
import { vendedoresAPI } from '../services/api';

export default function ReportesPage() {
  const [vendedores, setVendedores] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vendedoresAPI.getAll().then(setVendedores).catch(console.error);
  }, []);

  function descargarPDF(url, filename) {
    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error al generar reporte');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }

  function generarReporteVendedor() {
    if (!vendedorId) { alert('Seleccione un vendedor'); return; }
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const qs = params.toString();
    descargarPDF(`/api/reportes/vendedor/${vendedorId}${qs ? '?' + qs : ''}`, `reporte_vendedor_${vendedorId}.pdf`);
  }

  function generarReporteGeneral() {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const qs = params.toString();
    descargarPDF(`/api/reportes/general${qs ? '?' + qs : ''}`, 'reporte_general.pdf');
  }

  function generarReporteInventario() {
    descargarPDF('/api/reportes/inventario', 'reporte_inventario.pdf');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reportes</h2>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Fecha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Reporte por Vendedor</h3>
          <p className="text-sm text-gray-500 mb-4">
            Genera un PDF con todas las ventas de un vendedor, incluyendo comisiones, sobreprecios y total a pagar.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Vendedor</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2">
              <option value="">Seleccionar...</option>
              {vendedores.filter(v => v.activo).map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
          <button onClick={generarReporteVendedor} disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
            {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Reporte General</h3>
          <p className="text-sm text-gray-500 mb-4">
            Genera un PDF con todas las ventas del sistema, resumen por vendedor y totales generales.
          </p>
          <button onClick={generarReporteGeneral} disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400">
            {loading ? 'Generando...' : 'Generar PDF General'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Reporte de Inventario</h3>
          <p className="text-sm text-gray-500 mb-4">
            Genera un PDF con el estado actual del inventario, stock disponible y alertas de stock bajo.
          </p>
          <button onClick={generarReporteInventario} disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-400">
            {loading ? 'Generando...' : 'Generar PDF Inventario'}
          </button>
        </div>
      </div>
    </div>
  );
}
