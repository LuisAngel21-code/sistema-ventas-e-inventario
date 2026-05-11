import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ventasAPI, vendedoresAPI } from '../services/api';

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadVentas() {
    setLoading(true);
    try {
      const params = {};
      if (filtroVendedor) params.vendedor_id = filtroVendedor;
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const data = await ventasAPI.getAll(params);
      setVentas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    vendedoresAPI.getAll().then(setVendedores).catch(console.error);
    loadVentas();
  }, []);

  async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta? Esta acción es irreversible.')) return;
    try { await ventasAPI.remove(id); loadVentas(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ventas</h3>
        <Link to="/ventas/nueva" className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
          + Nueva Venta
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Vendedor</label>
            <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900">
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
          </div>
          <div className="flex items-end">
            <button onClick={loadVentas}
              className="w-full bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendedor</th>
                  <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Total</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 text-gray-500 font-mono">#{v.id}</td>
                    <td className="py-3 px-5 text-gray-700">{new Date(v.fecha).toLocaleString('es-PE')}</td>
                    <td className="py-3 px-5 text-gray-700">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                    <td className="py-3 px-5 text-right font-medium text-gray-900">S/ {Number(v.total).toFixed(2)}</td>
                    <td className="py-3 px-5 text-center">
                      <Link to={`/ventas/${v.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium mx-1.5">Ver</Link>
                      <button onClick={() => eliminarVenta(v.id)} className="text-red-600 hover:text-red-800 text-sm font-medium mx-1.5">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No hay ventas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
