import { useState, useEffect } from 'react';
import { cajaAPI } from '../services/api';
import { Wallet, Plus, Minus, Lock, Unlock, TrendingUp, TrendingDown, History } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CajaModal from '../components/CajaModal';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export default function CajaPage() {
  const [sesion, setSesion] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('ingreso');
  const [editMovimiento, setEditMovimiento] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    cajaAPI.sesionActual()
      .then(data => {
        setSesion(data.sesion);
        if (data.sesion) {
          return cajaAPI.movimientos(data.sesion.id);
        }
        return [];
      })
      .then(movs => setMovimientos(movs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function abrirCaja() {
    try {
      const res = await cajaAPI.abrir(0);
      showToast(res.message, 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function cerrarCaja() {
    if (!confirm('¿Estás segura de cerrar la caja? No podrás registrar más movimientos hoy.')) return;
    try {
      const res = await cajaAPI.cerrar();
      showToast(res.message, 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  function abrirModal(tipo, movimiento = null) {
    setModalTipo(tipo);
    setEditMovimiento(movimiento);
    setModalOpen(true);
  }

  async function eliminarMov(id) {
    try {
      await cajaAPI.eliminar(id);
      setDeleteId(null);
      showToast('Movimiento eliminado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((acc, m) => acc + Number(m.monto), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Caja</h1>
          <p className="page-subtitle">Control de caja diaria</p>
        </div>
        {sesion ? (
          <Button variant="danger" onClick={cerrarCaja} icon={Lock}>Cerrar Caja</Button>
        ) : (
          <Button onClick={abrirCaja} icon={Unlock}>Abrir Caja</Button>
        )}
      </div>

      {loading ? <Spinner className="h-48" /> : !sesion ? (
        <div className="card-page p-12 text-center">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-display font-semibold text-gray-500 mb-1">Caja cerrada</h2>
          <p className="text-sm text-gray-400 mb-4">Abre la caja para empezar a registrar movimientos del día</p>
          <Button onClick={abrirCaja} icon={Unlock}>Abrir Caja</Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="card-page p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Caja del día</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(sesion.fecha_apertura).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Badge variant="success"><Unlock className="w-3 h-3 mr-1" /> Abierta</Badge>
            </div>
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo actual</p>
              <p className="text-4xl font-display font-bold text-primary-700">
                S/ {Number(sesion.saldo_final).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => abrirModal('ingreso')} icon={Plus}>
              Ingreso
            </Button>
            <Button className="flex-1" onClick={() => abrirModal('egreso')} icon={Minus}
              style={{ backgroundColor: '#d97706' }}>
              Egreso
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-xs text-gray-500">Ingresos</p>
              <p className="text-lg font-display font-bold text-emerald-600">S/ {totalIngresos.toFixed(2)}</p>
            </div>
            <div className="stat-card p-4 text-center">
              <TrendingDown className="w-5 h-5 mx-auto text-red-500 mb-1" />
              <p className="text-xs text-gray-500">Egresos</p>
              <p className="text-lg font-display font-bold text-red-600">S/ {totalEgresos.toFixed(2)}</p>
            </div>
          </div>

          {/* Movements */}
          <div className="card-page overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <History className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-display font-semibold text-gray-900">Movimientos del día</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="table-header">Hora</th>
                    <th className="table-header">Tipo</th>
                  <th className="table-header">Tipo pago</th>
                  <th className="table-header">Descripción</th>
                  <th className="table-header text-right">Monto</th>
                  <th className="table-header text-right">Saldo</th>
                  <th className="table-header text-center">Acciones</th>
                </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell text-gray-500 text-xs">
                        {new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="table-cell">
                        {m.tipo === 'ingreso'
                          ? <Badge variant="success">Ingreso</Badge>
                          : <Badge variant="danger">Egreso</Badge>}
                      </td>
                      <td className="table-cell capitalize text-gray-600">{m.tipo_pago}</td>
                      <td className="table-cell text-gray-700">{m.descripcion || '—'}</td>
                      <td className={`table-cell text-right font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'} S/ {Number(m.monto).toFixed(2)}
                      </td>
                      <td className="table-cell text-right text-gray-700">S/ {Number(m.saldo_despues).toFixed(2)}</td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => abrirModal(m.tipo, m)}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Editar">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteId(m.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No hay movimientos aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <CajaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMovimiento(null); }}
        tipo={modalTipo}
        editData={editMovimiento}
        onSave={() => { setModalOpen(false); setEditMovimiento(null); load(); }}
      />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar movimiento">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar este movimiento? Se recalculará el saldo de la caja.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminarMov(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
