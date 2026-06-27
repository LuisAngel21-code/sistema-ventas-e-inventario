import { useState, useEffect } from 'react';
import { balanceAPI } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart, Building2, Calendar } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [filtros, setFiltros] = useState({
    desde: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    hasta: today.toISOString().split('T')[0],
  });

  function load() {
    setLoading(true);
    balanceAPI.get(filtros.desde, filtros.hasta)
      .then(setBalance)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Balance General</h1>
          <p className="page-subtitle">Resumen financiero del período</p>
        </div>
      </div>

      <div className="card-page p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Desde</label>
            <input type="date" className="input-field" value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Hasta</label>
            <input type="date" className="input-field" value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
          <Button onClick={load} icon={Calendar}>Filtrar</Button>
        </div>
      </div>

      {loading ? <Spinner className="h-48" /> : balance && (
        <>
          {/* Cards principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="stat-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ingresos</p>
              <p className="text-2xl font-display font-bold text-emerald-600">S/ {balance.ingresos.total.toFixed(2)}</p>
            </div>
            <div className="stat-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Egresos</p>
              <p className="text-2xl font-display font-bold text-red-600">S/ {balance.egresos.total.toFixed(2)}</p>
            </div>
            <div className="stat-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${balance.resultado.ganancia >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <DollarSign className={`w-6 h-6 ${balance.resultado.ganancia >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ganancia Neta</p>
              <p className={`text-2xl font-display font-bold ${balance.resultado.ganancia >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                S/ {balance.resultado.ganancia.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Margen: {balance.resultado.margen}%</p>
            </div>
          </div>

          {/* Desglose */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card-page p-5">
              <h3 className="text-sm font-display font-semibold text-emerald-700 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" /> Ingresos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Ventas</span>
                  <span className="font-semibold">S/ {balance.ingresos.ventas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2"><Receipt className="w-4 h-4" /> Otros ingresos</span>
                  <span className="font-semibold">S/ {balance.ingresos.otros_ingresos.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-display font-bold text-emerald-700">
                  <span>Total Ingresos</span>
                  <span>S/ {balance.ingresos.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="card-page p-5">
              <h3 className="text-sm font-display font-semibold text-red-700 flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4" /> Egresos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Comisiones vendedores</span>
                  <span className="font-semibold">S/ {balance.egresos.comisiones.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de caja</span>
                  <span className="font-semibold">S/ {balance.egresos.gastos_caja.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de caja</span>
                  <span className="font-semibold">S/ {balance.egresos.gastos_caja.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-display font-bold text-red-700">
                  <span>Total Egresos</span>
                  <span>S/ {balance.egresos.total.toFixed(2)}</span>
                </div>
                {balance.retiros > 0 && (
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">💸 Retiros del dueño</span>
                    <span className="text-amber-600 font-semibold">S/ {balance.retiros.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
