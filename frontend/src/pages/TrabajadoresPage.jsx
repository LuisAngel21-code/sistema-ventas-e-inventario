import { useState, useEffect } from 'react';
import { trabajadoresAPI } from '../services/api';
import { Users, Plus, Pencil, Trash2, DollarSign, Briefcase, Calculator } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('trabajadores');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pagoModal, setPagoModal] = useState(null);
  const [deleteIdTrab, setDeleteIdTrab] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', tipo: 'jornalero', telefono: '', email: '', sueldo_semanal: '', tarifa_por_unidad: '', sueldo_mensual: '' });
  const [pagoForm, setPagoForm] = useState({ trabajador_id: '', unidades: '', monto_pagado: '' });
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      trabajadoresAPI.getAll(),
      trabajadoresAPI.pagos({}),
    ]).then(([t, p]) => { setTrabajadores(t); setPagos(p); }).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function abrirModal(t = null) {
    if (t) {
      setEditId(t.id);
      setForm({ nombre: t.nombre, apellido: t.apellido, tipo: t.tipo, telefono: t.telefono || '', email: t.email || '', sueldo_semanal: t.sueldo_semanal, tarifa_por_unidad: t.tarifa_por_unidad, sueldo_mensual: t.sueldo_mensual || '' });
    } else {
      setEditId(null);
      setForm({ nombre: '', apellido: '', tipo: 'jornalero', telefono: '', email: '', sueldo_semanal: '', tarifa_por_unidad: '' });
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
        const payload = { ...form, sueldo_semanal: Number(form.sueldo_semanal), tarifa_por_unidad: Number(form.tarifa_por_unidad), sueldo_mensual: Number(form.sueldo_mensual) };
      if (editId) { await trabajadoresAPI.update(editId, payload); showToast('Trabajador actualizado', 'success'); }
      else { await trabajadoresAPI.create(payload); showToast('Trabajador registrado', 'success'); }
      setModalOpen(false); load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function eliminar(id) {
    try { await trabajadoresAPI.remove(id); setDeleteIdTrab(null); showToast('Trabajador eliminado', 'success'); load(); } catch (err) { showToast(err.message, 'error'); }
  }

  function abrirPago(t) {
    const totalEsperado = t.tipo === 'jornalero' ? Number(t.sueldo_semanal) : 0;
    setPagoForm({ trabajador_id: t.id, unidades: '', monto_pagado: totalEsperado || '' });
    setPagoModal(t);
  }

  async function handlePago(e) {
    e.preventDefault();
    try {
      const today = new Date();
      const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
      const res = await trabajadoresAPI.calcularPago({
        trabajador_id: pagoModal.id,
        semana_inicio: weekStart.toISOString().split('T')[0],
        semana_fin: weekEnd.toISOString().split('T')[0],
        unidades: Number(pagoForm.unidades) || 0,
        monto_pagado: Number(pagoForm.monto_pagado) || 0,
      });
      showToast(res.message, 'success');
      setPagoModal(null);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function marcarPagado(id) {
    try { await trabajadoresAPI.marcarPagado(id); showToast('Pago marcado como pagado', 'success'); load(); } catch (err) { showToast(err.message, 'error'); }
  }

  const tabs = [
    { id: 'trabajadores', label: 'Trabajadores', icon: Users },
    { id: 'pagos', label: 'Pagos Semanales', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Trabajadores</h1><p className="page-subtitle">Jornaleros, destajistas y planilla</p></div>
        {tab === 'trabajadores' && <Button onClick={() => abrirModal()} icon={Plus}>Nuevo Trabajador</Button>}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'trabajadores' ? (
        <div className="card-page overflow-hidden">
          {loading ? <Spinner className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50/50">
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header text-right">Sueldo</th>
                  <th className="table-header">Teléfono</th>
                  <th className="table-header text-center">Estado</th>
                  <th className="table-header text-center">Pago</th>
                  <th className="table-header text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {trabajadores.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell font-medium">{t.nombre} {t.apellido}</td>
                      <td className="table-cell"><Badge variant={t.tipo === 'jornalero' ? 'info' : t.tipo === 'destajista' ? 'warning' : 'success'}>{t.tipo}</Badge></td>
                      <td className="table-cell text-right font-medium tabular-nums">
                        {t.tipo === 'jornalero' && t.sueldo_semanal ? `S/ ${Number(t.sueldo_semanal).toFixed(2)}/sem` : ''}
                        {t.tipo === 'destajista' && t.tarifa_por_unidad ? `S/ ${Number(t.tarifa_por_unidad).toFixed(2)} x ud` : ''}
                        {t.tipo === 'encargado' && t.sueldo_mensual ? `S/ ${Number(t.sueldo_mensual).toFixed(2)}/mes` : ''}
                        {!t.sueldo_semanal && !t.tarifa_por_unidad && !t.sueldo_mensual ? '—' : ''}
                      </td>
                      <td className="table-cell text-gray-500">{t.telefono || '—'}</td>
                      <td className="table-cell text-center">{t.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}</td>
                      <td className="table-cell text-center">
                        <Button size="sm" variant="secondary" onClick={() => abrirPago(t)} icon={Calculator}>Pagar</Button>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => abrirModal(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteIdTrab(t.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trabajadores.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" />No hay trabajadores</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card-page overflow-hidden">
          {loading ? <Spinner className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50/50">
                  <th className="table-header">Trabajador</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Semana</th>
                  <th className="table-header text-right">Unidades</th>
                  <th className="table-header text-right">Esperado</th>
                  <th className="table-header text-right">Pagado</th>
                  <th className="table-header text-right">Saldo</th>
                  <th className="table-header text-center">Estado</th>
                  <th className="table-header text-center">Acción</th>
                </tr></thead>
                <tbody>
                  {pagos.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell font-medium">{p.nombre} {p.apellido}</td>
                      <td className="table-cell"><Badge variant="info">{p.tipo}</Badge></td>
                      <td className="table-cell text-xs text-gray-500">
                        {new Date(p.semana_inicio).toLocaleDateString('es-PE')} — {new Date(p.semana_fin).toLocaleDateString('es-PE')}
                      </td>
                      <td className="table-cell text-right">{p.unidades || '—'}</td>
                      <td className="table-cell text-right font-semibold">S/ {Number(p.total_pagar).toFixed(2)}</td>
                      <td className="table-cell text-right text-emerald-600">S/ {Number(p.monto_pagado || p.total_pagar).toFixed(2)}</td>
                      <td className="table-cell text-right text-red-600 font-medium">{Number(p.saldo) > 0 ? `S/ ${Number(p.saldo).toFixed(2)}` : '—'}</td>
                      <td className="table-cell text-center">
                        {p.estado === 'pagado' ? <Badge variant="success">Pagado</Badge> : <Badge variant="warning">Pendiente</Badge>}
                      </td>
                      <td className="table-cell text-center">
                        {p.estado !== 'pagado' && <Button size="sm" onClick={() => marcarPagado(p.id)}>Pagar</Button>}
                        {p.estado === 'pagado' && <span className="text-xs text-gray-400">✅ {new Date(p.pagado_en).toLocaleDateString('es-PE')}</span>}
                      </td>
                    </tr>
                  ))}
                  {pagos.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />No hay pagos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Trabajador' : 'Nuevo Trabajador'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Apellido *" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
          </div>
            <div className="space-y-1.5">
              <label className="input-label">Tipo</label>
              <select className="input-field" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="jornalero">Jornalero (sueldo fijo)</option>
                <option value="destajista">Destajista (por unidad)</option>
                <option value="encargado">Encargado (sueldo mensual + comisiones)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {form.tipo === 'jornalero' && (
                <Input label="Sueldo Semanal (S/)" type="number" step="0.01" value={form.sueldo_semanal} onChange={e => setForm({ ...form, sueldo_semanal: e.target.value })} />
              )}
              {form.tipo === 'destajista' && (
                <Input label="Tarifa por Unidad (S/)" type="number" step="0.01" value={form.tarifa_por_unidad} onChange={e => setForm({ ...form, tarifa_por_unidad: e.target.value })} />
              )}
              {form.tipo === 'encargado' && (
                <Input label="Sueldo Mensual (S/)" type="number" step="0.01" value={form.sueldo_mensual} onChange={e => setForm({ ...form, sueldo_mensual: e.target.value })} />
              )}
              <Input label="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editId ? 'Actualizar' : 'Crear Trabajador'}</Button>
          </div>
        </form>
      </Modal>

      {pagoModal && (
        <Modal open={!!pagoModal} onClose={() => setPagoModal(null)} title={`Pagar a ${pagoModal.nombre} ${pagoModal.apellido}`}>
          <form onSubmit={handlePago} className="space-y-4">
            <p className="text-sm text-gray-600">
              {pagoModal.tipo === 'jornalero' ?
                `Sueldo semanal: S/ ${Number(pagoModal.sueldo_semanal).toFixed(2)}` :
                `Tarifa por unidad: S/ ${Number(pagoModal.tarifa_por_unidad).toFixed(2)}`
              }
            </p>
            {pagoModal.tipo === 'destajista' && (
              <Input label="Unidades producidas en la semana" type="number" min="0" value={pagoForm.unidades}
                onChange={e => setPagoForm({ ...pagoForm, unidades: e.target.value })} />
            )}
            <Input label="Monto a pagar *" type="number" step="0.01" min="0" value={pagoForm.monto_pagado}
              onChange={e => setPagoForm({ ...pagoForm, monto_pagado: e.target.value })} required />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setPagoModal(null)}>Cancelar</Button>
              <Button type="submit" icon={Calculator}>Registrar Pago</Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal open={!!deleteIdTrab} onClose={() => setDeleteIdTrab(null)} title="Eliminar Trabajador">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar este trabajador?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteIdTrab(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminar(deleteIdTrab)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
