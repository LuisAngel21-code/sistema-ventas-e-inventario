import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, productosAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ ventas: 0, vendedores: 0, productos: 0, stockBajo: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ventas, vendedores, productos] = await Promise.all([
          ventasAPI.getAll(),
          vendedoresAPI.getAll(),
          productosAPI.getAll(true),
        ]);
        const stockBajo = productos.filter(p => p.stock <= p.stock_minimo).length;
        setStats({
          ventas: ventas.length,
          vendedores: vendedores.length,
          productos: productos.length,
          stockBajo,
        });
        setUltimasVentas(ventas.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Ventas Totales', value: stats.ventas, color: 'bg-blue-600' },
    { label: 'Vendedores', value: stats.vendedores, color: 'bg-emerald-600' },
    { label: 'Productos', value: stats.productos, color: 'bg-violet-600' },
    { label: 'Stock Bajo', value: stats.stockBajo, color: 'bg-red-600' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen General</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200">
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`h-1 rounded-b-lg ${card.color}`} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Últimas Ventas</h3>
          <Link to="/ventas" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendedor</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map((v, i) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5 text-gray-500">{i + 1}</td>
                  <td className="py-3 px-5 text-gray-700">{new Date(v.fecha).toLocaleDateString('es-PE')}</td>
                  <td className="py-3 px-5 text-gray-700">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                  <td className="py-3 px-5 text-right font-medium text-gray-900">S/ {Number(v.total).toFixed(2)}</td>
                </tr>
              ))}
              {ultimasVentas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">No hay ventas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
