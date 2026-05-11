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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Ventas Totales', value: stats.ventas, color: 'bg-blue-500', icon: '💰' },
    { label: 'Vendedores', value: stats.vendedores, color: 'bg-green-500', icon: '👤' },
    { label: 'Productos', value: stats.productos, color: 'bg-purple-500', icon: '🛏️' },
    { label: 'Stock Bajo', value: stats.stockBajo, color: 'bg-red-500', icon: '⚠️' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`${card.color} w-14 h-14 rounded-full flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Últimas Ventas</h3>
          <Link to="/ventas" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Vendedor</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map((v, i) => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">{i + 1}</td>
                  <td className="py-3 px-4">{new Date(v.fecha).toLocaleDateString('es-PE')}</td>
                  <td className="py-3 px-4">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                  <td className="py-3 px-4 text-right font-medium">S/ {Number(v.total).toFixed(2)}</td>
                </tr>
              ))}
              {ultimasVentas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No hay ventas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
