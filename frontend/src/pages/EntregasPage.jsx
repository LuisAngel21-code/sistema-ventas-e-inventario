import { useState, useEffect } from 'react';
import { entregasAPI } from '../services/api';
import { Truck, Plus, MapPin, Phone, Calendar, Clock } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

const estados = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  en_ruta: { label: 'En ruta', variant: 'info' },
  entregado: { label: 'Entregado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'neutral' },
};

export default function EntregasPage() {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState('pendiente');
  const [form, setForm] = useState({ cliente: '', direccion: '', distrito: '', referencia: '', telefono: '', producto: '', fecha_entrega: '', hora_programada: '', observaciones: '' });
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    entregasAPI.getAll({ estado: filtro === 'todas' ? '' : filtro }).then(setEntregas).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [filtro]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await entregasAPI.create(form);
      setModalOpen(false);
      setForm({ cliente: '', direccion: '', distrito: '', referencia: '', telefono: '', producto: '', fecha_entrega: '', hora_programada: '', observaciones: '' });
      showToast('Entrega registrada', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function updateEstado(id, estado) {
    try {
      await entregasAPI.updateEstado(id, estado);
      showToast(`Entrega ${estado === 'entregado' ? 'marcada como entregada' : 'actualizada'}`, 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Entregas / Reparto</h1><p className="page-subtitle">Gestión de entregas a domicilio</p></div>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>Nueva Entrega</Button>
      </div>

      <div className="flex gap-2">
        {['pendiente', 'en_ruta', 'entregado', 'todas'].map(est => (
          <button key={est} onClick={() => setFiltro(est)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === est ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {est === 'todas' ? 'Todas' : estados[est]?.label}
          </button>
        ))}
      </div>

      <div className="card-page overflow-hidden">
        {loading ? <Spinner className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/50">
                <th className="table-header">Cliente</th>
                <th className="table-header">Producto</th>
                <th className="table-header">Dirección</th>
                <th className="table-header">Distrito</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Hora</th>
                <th className="table-header text-center">Estado</th>
                <th className="table-header text-center">Acción</th>
              </tr></thead>
              <tbody>
                {entregas.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="table-cell font-medium">{e.cliente}</td>
                    <td className="table-cell text-gray-500">{e.producto || '—'}</td>
                    <td className="table-cell text-gray-500 text-xs">{e.direccion}</td>
                    <td className="table-cell text-gray-500">{e.distrito || '—'}</td>
                    <td className="table-cell text-gray-700">{new Date(e.fecha_entrega).toLocaleDateString('es-PE')}</td>
                    <td className="table-cell text-gray-500">{e.hora_programada ? e.hora_programada.slice(0, 5) : '—'}</td>
                    <td className="table-cell text-center"><Badge variant={estados[e.estado]?.variant}>{estados[e.estado]?.label}</Badge></td>
                    <td className="table-cell text-center">
                      {e.estado === 'pendiente' && <Button size="sm" onClick={() => updateEstado(e.id, 'en_ruta')}>Iniciar</Button>}
                      {e.estado === 'en_ruta' && <Button size="sm" variant="success" onClick={() => updateEstado(e.id, 'entregado')}>Entregar</Button>}
                      {e.estado === 'entregado' && <span className="text-xs text-gray-400">✅</span>}
                      {e.estado === 'cancelado' && <span className="text-xs text-gray-400">✕</span>}
                    </td>
                  </tr>
                ))}
                {entregas.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400"><Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />No hay entregas</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Entrega" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cliente *" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} required />
            <Input label="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <Input label="Producto" value={form.producto} onChange={e => setForm({ ...form, producto: e.target.value })} />
          <Input label="Dirección *" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Distrito" value={form.distrito} onChange={e => setForm({ ...form, distrito: e.target.value })} />
            <Input label="Referencia" value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de entrega *" type="date" value={form.fecha_entrega} onChange={e => setForm({ ...form, fecha_entrega: e.target.value })} required />
            <Input label="Hora programada" type="time" value={form.hora_programada} onChange={e => setForm({ ...form, hora_programada: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="input-label">Observaciones</label>
            <textarea className="input-field min-h-[60px]" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar Entrega</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
