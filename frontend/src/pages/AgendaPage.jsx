import { useState, useEffect } from 'react';
import { agendaAPI } from '../services/api';
import { Calendar as CalIcon, Plus, CheckCircle, X, Clock } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

const tipoColors = { recordatorio: 'info', cita: 'warning', pago: 'success', entrega: 'danger' };
const tipoLabels = { recordatorio: 'Recordatorio', cita: 'Cita', pago: 'Pago', entrega: 'Entrega' };

export default function AgendaPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [fechaSel, setFechaSel] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ titulo: '', fecha: '', hora: '', descripcion: '', tipo: 'recordatorio' });
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    agendaAPI.getAll({ fecha: fechaSel }).then(setEventos).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [fechaSel]);

  function abrirModal(evento = null) {
    if (evento) {
      setEditId(evento.id);
      setForm({ titulo: evento.titulo, fecha: evento.fecha.split('T')[0], hora: evento.hora ? evento.hora.slice(0, 5) : '', descripcion: evento.descripcion || '', tipo: evento.tipo });
    } else {
      setEditId(null);
      setForm({ titulo: '', fecha: fechaSel, hora: '', descripcion: '', tipo: 'recordatorio' });
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editId) {
        await agendaAPI.update(editId, form);
        showToast('Evento actualizado', 'success');
      } else {
        await agendaAPI.create(form);
        showToast('Evento creado', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar evento?')) return;
    try { await agendaAPI.remove(id); showToast('Evento eliminado', 'success'); load(); } catch (err) { showToast(err.message, 'error'); }
  }

  async function toggleCompletado(evento) {
    try { await agendaAPI.update(evento.id, { ...evento, completado: !evento.completado }); load(); } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Agenda</h1><p className="page-subtitle">Calendario de eventos y recordatorios</p></div>
        <Button onClick={() => abrirModal()} icon={Plus}>Nuevo Evento</Button>
      </div>

      <div className="card-page p-4">
        <div className="flex gap-3 items-center">
          <CalIcon className="w-5 h-5 text-gray-400" />
          <input type="date" className="input-field w-auto" value={fechaSel} onChange={e => setFechaSel(e.target.value)} />
          <span className="text-sm text-gray-500">{new Date(fechaSel).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {loading ? <Spinner className="h-48" /> : (
        <div className="space-y-3">
          {eventos.map(e => (
            <div key={e.id} className={`card-page p-4 flex items-start gap-4 ${e.completado ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleCompletado(e)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${e.completado ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-primary-500'}`}>
                {e.completado && <CheckCircle className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-gray-900 ${e.completado ? 'line-through' : ''}`}>{e.titulo}</h3>
                  <Badge variant={tipoColors[e.tipo]}>{tipoLabels[e.tipo]}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {e.hora && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.hora.slice(0, 5)}</span>}
                  {e.descripcion && <span>{e.descripcion}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => abrirModal(e)}>✏️</Button>
                <Button variant="ghost" size="sm" onClick={() => eliminar(e.id)}><X className="w-3.5 h-3.5 text-red-400" /></Button>
              </div>
            </div>
          ))}
          {eventos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CalIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay eventos para esta fecha
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Evento' : 'Nuevo Evento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título *" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha *" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
            <Input label="Hora" type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="input-label">Tipo</label>
            <select className="input-field" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="recordatorio">Recordatorio</option>
              <option value="cita">Cita</option>
              <option value="pago">Pago</option>
              <option value="entrega">Entrega</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="input-label">Descripción</label>
            <textarea className="input-field min-h-[60px]" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editId ? 'Actualizar' : 'Crear Evento'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
