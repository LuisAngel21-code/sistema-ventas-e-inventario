import { useState, useEffect } from 'react';
import { vendedoresAPI } from '../services/api';

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', sueldo_fijo: '350' });

  async function loadVendedores() {
    try {
      const data = await vendedoresAPI.getAll();
      setVendedores(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadVendedores(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', apellido: '', email: '', telefono: '', sueldo_fijo: '350' });
    setShowModal(true);
  }

  function openEdit(v) {
    setEditing(v.id);
    setForm({
      nombre: v.nombre, apellido: v.apellido, email: v.email || '',
      telefono: v.telefono || '', sueldo_fijo: String(v.sueldo_fijo)
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, sueldo_fijo: Number(form.sueldo_fijo) };
      if (editing) {
        await vendedoresAPI.update(editing, data);
      } else {
        await vendedoresAPI.create(data);
      }
      setShowModal(false);
      loadVendedores();
    } catch (err) { alert(err.message); }
  }

  async function eliminarVendedor(id, nombre) {
    if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await vendedoresAPI.remove(id);
      loadVendedores();
    } catch (err) { alert(err.message); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Vendedores</h3>
        <button onClick={openCreate} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
          + Nuevo Vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendedores.map((v) => (
          <div key={v.id} className={`bg-white rounded-lg border border-gray-200 ${!v.activo ? 'opacity-50' : ''}`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                  {v.nombre[0]}{v.apellido[0]}
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  v.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {v.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <h4 className="font-medium text-gray-900">{v.nombre} {v.apellido}</h4>
              <p className="text-sm text-gray-500 mt-0.5">{v.email || 'Sin email'}</p>
              <p className="text-sm text-gray-500">{v.telefono || 'Sin teléfono'}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sueldo fijo</span>
                  <span className="font-medium text-gray-900">S/ {Number(v.sueldo_fijo).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => openEdit(v)}
                className="flex-1 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium">
                Editar
              </button>
              <button onClick={() => eliminarVendedor(v.id, `${v.nombre} ${v.apellido}`)}
                className="flex-1 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-l border-gray-100">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input type="text" value={form.apellido}
                    onChange={(e) => setForm({...form, apellido: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sueldo Fijo (S/)</label>
                <input type="number" step="0.01" value={form.sueldo_fijo}
                  onChange={(e) => setForm({...form, sueldo_fijo: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors">
                  {editing ? 'Guardar Cambios' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
