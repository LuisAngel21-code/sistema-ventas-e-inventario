import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, productosAPI } from '../services/api';
import { ShoppingCart, Users, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function Dashboard() {
  const [stats, setStats] = useState({ ventas: 0, vendedores: 0, productos: 0, stockBajo: 0, totalVentasMonto: 0 });
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
        const stockBajo = productos.filter(p => Number(p.stock) <= Number(p.stock_minimo));
        const totalVentasMonto = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
        setStats({
          ventas: ventas.length,
          vendedores: vendedores.length,
          productos: productos.length,
          stockBajo: stockBajo.length,
          totalVentasMonto,
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
    return <Spinner size="lg" className="h-64" />;
  }

  const cards = [
    { label: 'Ventas Totales', value: stats.ventas, icon: ShoppingCart, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { label: 'Monto Vendido', value: `S/ ${stats.totalVentasMonto.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { label: 'Vendedores', value: stats.vendedores, icon: Users, color: 'bg-violet-500', textColor: 'text-violet-600', bgLight: 'bg-violet-50' },
    { label: 'Stock Bajo', value: stats.stockBajo, icon: AlertTriangle, color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card p-5 group hover:border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className={`icon-wrapper ${card.bgLight}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent sales */}
      <div className="card-page">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            <h3 className="text-sm font-display font-semibold text-gray-900">Últimas Ventas</h3>
          </div>
          <Link to="/ventas" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Ver todas <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="table-header">#</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Vendedor</th>
                <th className="table-header text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map((v, i) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell text-gray-700">{new Date(v.fecha).toLocaleDateString('es-PE')}</td>
                  <td className="table-cell text-gray-700">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                  <td className="table-cell text-right font-semibold text-gray-900">S/ {Number(v.total).toFixed(2)}</td>
                </tr>
              ))}
              {ultimasVentas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No hay ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
