import { useState, useEffect } from 'react';
import { pagosAPI } from '../services/api';
import { DollarSign, Calendar, CheckCircle, XCircle, Calculator, Trash2 } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [adelantoEdit, setAdelantoEdit] = useState(null);
  const [adelantoMonto, setAdelantoMonto] = useState('');
  const { showToast } = useToast();

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [semana, setSemana] = useState({
    inicio: weekStart.toISOString().split('T')[0],
    fin: weekEnd.toISOString().split('T')[0],
  });

  function load() {
    setLoading(true);
    pagosAPI.getAll()
      .then(setPagos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function calcularPagos() {
    setCalculando(true);
    try {
      const res = await pagosAPI.calcular(semana.inicio, semana.fin);
      showToast(res.message, 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCalculando(false);
    }
  }

  async function marcarPagado(id) {
    try {
      await pagosAPI.marcarPagado(id);
      showToast('Pago marcado como pagado', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function registrarAdelanto(id) {
    try {
      await pagosAPI.adelanto(id, Number(adelantoMonto) || 0);
      showToast('Adelanto registrado', 'success');
      setAdelantoEdit(null);
      setAdelantoMonto('');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function eliminarPago(id) {
    try {
      await pagosAPI.remove(id);
      setDeleteId(null);
      showToast('Pago eliminado', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pagos a Vendedores</h1>
          <p className="page-subtitle">Gestión de pagos semanales</p>
        </div>
      </div>

      <div className="card-page p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="input-label">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Semana inicio
            </label>
            <input type="date" className="input-field"
              value={semana.inicio}
              onChange={(e) => setSemana({ ...semana, inicio: e.target.value })} />
          </div>
          <div>
            <label className="input-label">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Semana fin
            </label>
            <input type="date" className="input-field"
              value={semana.fin}
              onChange={(e) => setSemana({ ...semana, fin: e.target.value })} />
          </div>
          <Button onClick={calcularPagos} loading={calculando} icon={Calculator}>
            Calcular Pagos
          </Button>
        </div>
      </div>

      {loading ? <Spinner className="h-48" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagos.map(p => {
            const neto = Math.max(0, Number(p.total_pago) - Number(p.adelanto || 0));
            return (
            <div key={p.id} className="stat-card p-4 flex flex-col min-h-[260px]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-gray-900">{p.nombre} {p.apellido}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(p.semana_inicio).toLocaleDateString('es-PE')} — {new Date(p.semana_fin).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.estado === 'pagado' ? (
                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Pagado</Badge>
                  ) : (
                    <Badge variant="warning"><XCircle className="w-3 h-3 mr-1" /> Pendiente</Badge>
                  )}
                  <button onClick={() => setDeleteId(p.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex border border-gray-100 rounded-lg divide-x divide-gray-100 text-sm mb-4">
                <div className="flex-1 py-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Base</p>
                  <p className="font-semibold text-gray-900 tabular-nums">S/&nbsp;{Number(p.sueldo_base).toFixed(2)}</p>
                </div>
                <div className="flex-1 py-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Comisión 2%</p>
                  <p className="font-semibold text-emerald-600 tabular-nums">S/&nbsp;{Number(p.total_comision).toFixed(2)}</p>
                </div>
                <div className="flex-1 py-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">50% Sobrep.</p>
                  <p className="font-semibold text-amber-600 tabular-nums">S/&nbsp;{Number(p.total_sobreprecio).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3.5 py-3 space-y-1.5 text-sm mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total bruto</span>
                  <span className="font-medium text-gray-900 tabular-nums">S/&nbsp;{Number(p.total_pago).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Adelanto</span>
                  <div className="flex items-center gap-1.5">
                    {adelantoEdit === p.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" step="0.01"
                          className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-right tabular-nums"
                          value={adelantoMonto}
                          onChange={e => setAdelantoMonto(e.target.value)}
                          autoFocus />
                        <button onClick={() => registrarAdelanto(p.id)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700">OK</button>
                        <button onClick={() => setAdelantoEdit(null)}
                          className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-red-600 font-medium tabular-nums">
                          -&nbsp;S/&nbsp;{Number(p.adelanto || 0).toFixed(2)}
                          {p.fecha_adelanto && (
                            <span className="text-xs text-gray-400 ml-1">({new Date(p.fecha_adelanto).toLocaleDateString('es-PE')})</span>
                          )}
                        </span>
                        {p.estado !== 'pagado' && (
                          <button onClick={() => { setAdelantoEdit(p.id); setAdelantoMonto(p.adelanto || ''); }}
                            className="text-xs text-primary-600 hover:text-primary-700 underline ml-0.5">
                            {Number(p.adelanto || 0) > 0 ? 'Editar' : 'Añadir'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between">
                  <span className="text-sm font-display font-semibold text-gray-900">Neto a pagar</span>
                  <span className="text-base font-display font-bold text-primary-700 tabular-nums">S/&nbsp;{neto.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-auto flex justify-end">
                {p.estado !== 'pagado' ? (
                  <button onClick={() => marcarPagado(p.id)}
                    className="group inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-lg
                      hover:bg-primary-800 active:scale-[0.97] transition-all duration-150 shadow-sm hover:shadow-md">
                    <CheckCircle className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
                    Marcar Pagado
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Pagado: {new Date(p.pagado_en).toLocaleDateString('es-PE')}
                  </p>
                )}
              </div>
            </div>
            );
          })}
          {pagos.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay pagos registrados. Calcula la semana para generar los pagos.
            </div>
          )}
        </div>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Pago">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar este pago?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminarPago(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
