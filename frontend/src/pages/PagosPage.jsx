import { useState, useEffect } from 'react';
import { pagosAPI } from '../services/api';
import { DollarSign, Calendar, CheckCircle, XCircle, Calculator, Trash2, User } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteFuente, setDeleteFuente] = useState('');
  const [adelantoEdit, setAdelantoEdit] = useState(null);
  const [adelantoEditFuente, setAdelantoEditFuente] = useState('');
  const [adelantoMonto, setAdelantoMonto] = useState('');
  const [personaSel, setPersonaSel] = useState(null);
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

  useEffect(() => {
    pagosAPI.personal().then(p => { setPersonal(p); setLoading(false); }).catch(console.error);
  }, []);

  function loadPagos() {
    setLoading(true);
    const params = personaSel ? { persona_id: personaSel.id, fuente: personaSel.cargo === 'Vendedor' ? 'vendedor' : 'trabajador' } : {};
    pagosAPI.getAll(params).then(setPagos).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { loadPagos(); }, [personaSel]);

  async function calcularPagos() {
    setCalculando(true);
    try {
      const params = personaSel ? `persona_id=${personaSel.id}&fuente=${personaSel.cargo === 'Vendedor' ? 'vendedor' : 'trabajador'}` : '';
      const res = await pagosAPI.calcular(semana.inicio, semana.fin, params);
      showToast(res.message, 'success');
      loadPagos();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCalculando(false); }
  }

  async function marcarPagado(id, fuente) {
    try { await pagosAPI.marcarPagado(id, fuente); showToast('Pago marcado como pagado', 'success'); loadPagos(); }
    catch (err) { showToast(err.message, 'error'); }
  }

  async function registrarAdelanto(id, fuente) {
    try { await pagosAPI.adelanto(id, Number(adelantoMonto) || 0, fuente); showToast('Adelanto registrado', 'success');
      setAdelantoEdit(null); setAdelantoMonto(''); loadPagos(); }
    catch (err) { showToast(err.message, 'error'); }
  }

  async function eliminarPago(id, fuente) {
    try { await pagosAPI.remove(id, fuente); setDeleteId(null); showToast('Pago eliminado', 'success'); loadPagos(); }
    catch (err) { showToast(err.message, 'error'); }
  }

  const grouped = personal.reduce((acc, p) => {
    const key = p.cargo === 'Vendedor' ? 'Vendedores' : 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Pagos</h1><p className="page-subtitle">Gestión de pagos a todo el personal</p></div>
      </div>

      <div className="card-page p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="input-label"><User className="w-3.5 h-3.5 inline mr-1" /> Persona</label>
            <select className="input-field w-48" value={personaSel ? JSON.stringify(personaSel) : ''}
              onChange={e => setPersonaSel(e.target.value ? JSON.parse(e.target.value) : null)}>
              <option value="">Todos</option>
              {Object.entries(grouped).map(([grupo, personas]) => (
                <optgroup key={grupo} label={grupo}>
                  {personas.map(p => (
                    <option key={`${p.cargo}-${p.id}`} value={JSON.stringify(p)}>{p.nombre} {p.apellido} — {p.cargo}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Inicio</label>
            <input type="date" className="input-field" value={semana.inicio}
              onChange={e => setSemana({ ...semana, inicio: e.target.value })} />
          </div>
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Fin</label>
            <input type="date" className="input-field" value={semana.fin}
              onChange={e => setSemana({ ...semana, fin: e.target.value })} />
          </div>
          <Button onClick={calcularPagos} loading={calculando} icon={Calculator}>Calcular Pagos</Button>
        </div>
      </div>

      {loading ? <Spinner className="h-48" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagos.map(p => {
            const neto = Math.max(0, Number(p.total) - Number(p.adelanto || 0));
            const tieneDesglose = p.cargo === 'Vendedor' || p.cargo === 'Encargado';
            return (
            <div key={`${p.fuente}-${p.id}`} className="stat-card p-4 flex flex-col min-h-[260px]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-gray-900 truncate">{p.nombre} {p.apellido}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={p.cargo === 'Vendedor' ? 'success' : p.cargo === 'Encargado' ? 'info' : 'neutral'}>{p.cargo}</Badge>
                    <span className="text-xs text-gray-400">{new Date(p.semana_inicio).toLocaleDateString('es-PE')} — {new Date(p.semana_fin).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {p.estado === 'pagado' ? <Badge variant="success">Pagado</Badge> : <Badge variant="warning">Pend.</Badge>}
                  <button onClick={() => { setDeleteId(p.id); setDeleteFuente(p.fuente); }}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {tieneDesglose && (
                <div className="flex border border-gray-100 rounded-lg divide-x divide-gray-100 text-sm mb-3">
                  <div className="flex-1 py-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Base</p>
                    <p className="font-semibold text-gray-900 tabular-nums">S/&nbsp;{Number(p.sueldo_base).toFixed(2)}</p>
                  </div>
                  <div className="flex-1 py-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Comisión</p>
                    <p className="font-semibold text-emerald-600 tabular-nums">S/&nbsp;{Number(p.total_comision).toFixed(2)}</p>
                  </div>
                  <div className="flex-1 py-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Sobrep.</p>
                    <p className="font-semibold text-amber-600 tabular-nums">S/&nbsp;{Number(p.total_sobreprecio).toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg px-3.5 py-3 space-y-1.5 text-sm mb-3 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900 tabular-nums">S/&nbsp;{Number(p.total).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Adelantos</span>
                  <div className="flex flex-col items-end">
                    <span className="text-red-600 font-medium tabular-nums text-sm">
                      -&nbsp;S/&nbsp;{Number(p.adelanto || 0).toFixed(2)}
                    </span>
                    {p.fecha_adelanto && (
                      <span className="text-[10px] text-gray-400">Último: {new Date(p.fecha_adelanto).toLocaleDateString('es-PE')}</span>
                    )}
                  </div>
                </div>
                {p.estado !== 'pagado' && (
                  <div className="flex justify-end pt-0.5 pb-1">
                    {adelantoEdit === p.id && adelantoEditFuente === p.fuente ? (
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">S/</span>
                          <input type="number" step="0.01"
                            className="w-20 pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded text-right tabular-nums"
                            value={adelantoMonto} onChange={e => setAdelantoMonto(e.target.value)} autoFocus />
                        </div>
                        <button onClick={() => registrarAdelanto(p.id, p.fuente)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors">
                          Guardar
                        </button>
                        <button onClick={() => setAdelantoEdit(null)}
                          className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAdelantoEdit(p.id); setAdelantoEditFuente(p.fuente); setAdelantoMonto(''); }}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                        + Adelanto
                      </button>
                    )}
                  </div>
                )}
                <div className="border-t-2 border-primary-700 pt-1.5 flex justify-between items-center">
                  <span className="text-sm font-display font-semibold text-gray-900">Neto a pagar</span>
                  <span className="text-lg font-display font-bold text-primary-700 tabular-nums">S/&nbsp;{neto.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end">
                {p.estado !== 'pagado' ? (
                  <button onClick={() => marcarPagado(p.id, p.fuente)}
                    className="group inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-lg hover:bg-primary-800 active:scale-[0.97] transition-all duration-150 shadow-sm hover:shadow-md">
                    <CheckCircle className="w-4 h-4" /> Marcar Pagado
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
          <Button variant="danger" onClick={() => eliminarPago(deleteId, deleteFuente)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
