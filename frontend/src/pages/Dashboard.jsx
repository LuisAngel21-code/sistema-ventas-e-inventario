import { useState, useEffect } from 'react';
import { balanceAPI, configAPI } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart, Calendar, Home, Save } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alquiler, setAlquiler] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { showToast } = useToast();
  const today = new Date();
  const [filtros, setFiltros] = useState({
    desde: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    hasta: today.toISOString().split('T')[0],
  });

  function load() {
    setLoading(true);
    Promise.all([
      balanceAPI.get(filtros.desde, filtros.hasta),
      configAPI.get('alquiler_mensual'),
    ]).then(([bal, cfg]) => {
      setBalance(bal);
      setAlquiler(cfg.valor || '');
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function guardarAlquiler() {
    setGuardando(true);
    try {
      await configAPI.set('alquiler_mensual', alquiler);
      showToast('Pago mensual guardado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setGuardando(false); }
  }

  const totalEgresosConAlquiler = balance ? Number(balance.egresos.total) + (Number(alquiler) || 0) : 0;
  const gananciaConAlquiler = balance ? Number(balance.ingresos.total) - totalEgresosConAlquiler : 0;
  const margenConAlquiler = balance && Number(balance.ingresos.total) > 0
    ? Math.round((gananciaConAlquiler / Number(balance.ingresos.total)) * 10000) / 100 : 0;

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

      {/* Card Alquiler */}
      <div className="stat-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pago Mensual Tienda</p>
              <p className="text-xs text-gray-500">Alquiler, agua, luz</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
              <input type="number" step="0.01" className="input-field pl-8 w-36"
                value={alquiler} onChange={(e) => setAlquiler(e.target.value)} />
            </div>
            <Button onClick={guardarAlquiler} loading={guardando} icon={Save} size="sm">Guardar</Button>
          </div>
        </div>
      </div>

      {loading ? <Spinner className="h-48" /> : balance && (
        <>
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
              <p className="text-2xl font-display font-bold text-red-600">S/ {totalEgresosConAlquiler.toFixed(2)}</p>
            </div>
            <div className="stat-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gananciaConAlquiler >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <DollarSign className={`w-6 h-6 ${gananciaConAlquiler >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ganancia Neta</p>
              <p className={`text-2xl font-display font-bold ${gananciaConAlquiler >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                S/ {gananciaConAlquiler.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Margen: {margenConAlquiler}%</p>
            </div>
          </div>

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
                  <span className="text-gray-600 flex items-center gap-2"><Home className="w-4 h-4" /> Alquiler tienda</span>
                  <span className="font-semibold">S/ {(Number(alquiler) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de caja</span>
                  <span className="font-semibold">S/ {balance.egresos.gastos_caja.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-display font-bold text-red-700">
                  <span>Total Egresos</span>
                  <span>S/ {totalEgresosConAlquiler.toFixed(2)}</span>
                </div>
                {balance.retiros > 0 && (
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">💸 Retiros del dueño</span>
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
