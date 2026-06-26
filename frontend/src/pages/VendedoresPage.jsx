import { useState, useEffect } from 'react';
import { vendedoresAPI } from '../services/api';
import { Users, Plus, Pencil, Trash2, Mail, Phone, DollarSign, UserCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const emptyVendedor = { nombre: '', apellido: '', email: '', telefono: '', sueldo_fijo: 350 };

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyVendedor);

  function load() {
    setLoading(true);
    vendedoresAPI.getAll()
      .then(setVendedores)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(emptyVendedor);
    setModalOpen(true);
  }

  async function openEdit(v) {
    setEditId(v.id);
    setForm({ nombre: v.nombre, apellido: v.apellido, email: v.email || '', telefono: v.telefono || '', sueldo_fijo: v.sueldo_fijo });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...form, sueldo_fijo: Number(form.sueldo_fijo) };
      if (editId) {
        await vendedoresAPI.update(editId, payload);
      } else {
        await vendedoresAPI.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) { alert(err.message); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar vendedor?')) return;
    try {
      await vendedoresAPI.remove(id);
      load();
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendedores</h1>
          <p className="page-subtitle">Gestión del equipo de ventas</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Nuevo Vendedor</Button>
      </div>

      {loading ? <Spinner className="h-48" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendedores.map(v => (
            <div key={v.id} className="stat-card p-5 hover:border-gray-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-gray-900">{v.nombre} {v.apellido}</h3>
                    <div className="mt-1">{v.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminar(v.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {v.email && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{v.email}</span>
                  </div>
                )}
                {v.telefono && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{v.telefono}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Sueldo fijo: S/ {Number(v.sueldo_fijo).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
          {vendedores.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay vendedores registrados
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Vendedor' : 'Nuevo Vendedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Input label="Sueldo Fijo (S/)" type="number" step="0.01" value={form.sueldo_fijo}
            onChange={(e) => setForm({ ...form, sueldo_fijo: e.target.value })} />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editId ? 'Actualizar' : 'Crear Vendedor'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
