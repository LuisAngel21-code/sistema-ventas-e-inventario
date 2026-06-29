import { useState, useEffect } from 'react';
import { agendaAPI } from '../services/api';
import { Plus, CheckCircle, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

const tipoColors = { recordatorio: 'info', cita: 'warning', pago: 'success', entrega: 'danger' };
const tipoLabels = { recordatorio: 'Recordatorio', cita: 'Cita', pago: 'Pago', entrega: 'Entrega' };
const semana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function AgendaPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth());
  const [año, setAño] = useState(new Date().getFullYear());
  const [diaSel, setDiaSel] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ titulo: '', fecha: '', hora: '', descripcion: '', tipo: 'recordatorio' });
  const { showToast } = useToast();

  function loadAll() {
    setLoading(true);
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`;
    const fin = `${año}-${String(mes + 1).padStart(2, '0')}-${new Date(año, mes + 1, 0).getDate()}`;
    Promise.all([
      agendaAPI.getAll({ desde: inicio, hasta: fin }),
      agendaAPI.getAll({ fecha: diaSel }),
    ]).then(([todos, delDia]) => {
      setEventos(delDia);
      // Guardar todos los eventos del mes en un estado auxiliar
      window.__eventosMes = todos;
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, [mes, año, diaSel]);

  const eventosMes = window.__eventosMes || [];

  function diasEnMes() {
    return new Date(año, mes + 1, 0).getDate();
  }
  function primerDia() {
    return new Date(año, mes, 1).getDay();
  }

  function cambiarMes(delta) {
    const nuevaFecha = new Date(año, mes + delta, 1);
    setMes(nuevaFecha.getMonth());
    setAño(nuevaFecha.getFullYear());
  }

  function abrirModal(evento = null) {
    if (evento) {
      setEditId(evento.id);
      setForm({ titulo: evento.titulo, fecha: evento.fecha.split('T')[0], hora: evento.hora ? evento.hora.slice(0, 5) : '', descripcion: evento.descripcion || '', tipo: evento.tipo });
    } else {
      setEditId(null);
      setForm({ titulo: '', fecha: diaSel, hora: '', descripcion: '', tipo: 'recordatorio' });
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editId) { await agendaAPI.update(editId, form); showToast('Evento actualizado', 'success'); }
      else { await agendaAPI.create(form); showToast('Evento creado', 'success'); }
      setModalOpen(false); loadAll();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function eliminar(id) {
    try { await agendaAPI.remove(id); setDeleteId(null); showToast('Evento eliminado', 'success'); loadAll(); } catch (err) { showToast(err.message, 'error'); }
  }

  async function toggleCompletado(evento) {
    try { await agendaAPI.update(evento.id, { ...evento, completado: !evento.completado }); loadAll(); } catch (err) { showToast(err.message, 'error'); }
  }

  const eventosHoy = eventosMes.filter(e => {
    const fechaEv = e.fecha.split('T')[0];
    return fechaEv === diaSel;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Agenda</h1><p className="page-subtitle">Calendario mensual</p></div>
        <Button onClick={() => abrirModal()} icon={Plus}>Nuevo Evento</Button>
      </div>

      <div className="card-page p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-display font-semibold text-gray-900">{meses[mes]} {año}</h2>
          <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {semana.map(d => <div key={d} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">{d}</div>)}
          {Array.from({ length: primerDia() }).map((_, i) => <div key={`e${i}`} className="bg-white min-h-[60px]" />)}
          {Array.from({ length: diasEnMes() }).map((_, i) => {
            const dia = i + 1;
            const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const tieneEventos = eventosMes.some(e => (e.fecha.split('T')[0]) === fechaStr);
            const esHoy = fechaStr === new Date().toISOString().split('T')[0];
            const esSeleccionado = fechaStr === diaSel;
            return (
              <button key={dia} onClick={() => setDiaSel(fechaStr)}
                className={`bg-white min-h-[60px] p-1 text-left hover:bg-gray-50 transition-colors relative ${esSeleccionado ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
                <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full ${esHoy ? 'bg-primary-700 text-white font-bold' : 'text-gray-700'}`}>
                  {dia}
                </span>
                {tieneEventos && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-gray-900">
          Eventos del {new Date(diaSel).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
      </div>

      <div className="space-y-3">
        {eventosHoy.map(e => (
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
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(e.id)}><X className="w-3.5 h-3.5 text-red-400" /></Button>
            </div>
          </div>
        ))}
        {eventosHoy.length === 0 && (
          <div className="text-center py-8 text-gray-400">No hay eventos para esta fecha</div>
        )}
      </div>

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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Evento">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar este evento?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminar(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
