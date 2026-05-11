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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [vData] = await Promise.all([vendedoresAPI.getAll()]);
        setVendedores(vData);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  useEffect(() => {
    loadVentas();
  }, []);

  async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta? Esta acción es irreversible.')) return;
    try {
      await ventasAPI.remove(id);
      loadVentas();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ventas</h2>
        <Link
          to="/ventas/nueva"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nueva Venta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Vendedor</label>
            <select
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadVentas}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Vendedor</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">#{v.id}</td>
                    <td className="py-3 px-4">{new Date(v.fecha).toLocaleString('es-PE')}</td>
                    <td className="py-3 px-4">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                    <td className="py-3 px-4 text-right font-medium">S/ {Number(v.total).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/ventas/${v.id}`}
                        className="text-indigo-600 hover:text-indigo-800 mx-2"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => eliminarVenta(v.id)}
                        className="text-red-600 hover:text-red-800 mx-2"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
