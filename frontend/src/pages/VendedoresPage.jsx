import { useState, useEffect } from 'react';
import { vendedoresAPI } from '../services/api';

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', sueldo_fijo: '350'
  });

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
      nombre: v.nombre,
      apellido: v.apellido,
      email: v.email || '',
      telefono: v.telefono || '',
      sueldo_fijo: String(v.sueldo_fijo)
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

  async function toggleActivo(v) {
    try {
      await vendedoresAPI.update(v.id, { activo: !v.activo, ...v });
      loadVendedores();
    } catch (err) { alert(err.message); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vendedores</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Nuevo Vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendedores.map((v) => (
          <div key={v.id} className={`bg-white rounded-xl shadow-md p-6 ${!v.activo ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl text-indigo-600 font-bold">
                {v.nombre[0]}{v.apellido[0]}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                v.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {v.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800">{v.nombre} {v.apellido}</h3>
            <p className="text-sm text-gray-500">{v.email || 'Sin email'}</p>
            <p className="text-sm text-gray-500">{v.telefono || 'Sin teléfono'}</p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Sueldo Fijo: <span className="font-semibold">S/ {Number(v.sueldo_fijo).toFixed(2)}</span></p>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(v)}
                className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm hover:bg-indigo-100">
                Editar
              </button>
              <button onClick={() => toggleActivo(v)}
                className={`flex-1 py-2 rounded-lg text-sm ${
                  v.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}>
                {v.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editing ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
                  <input type="text" value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Apellido *</label>
                  <input type="text" value={form.apellido}
                    onChange={(e) => setForm({...form, apellido: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={(e) => setForm({...form, telefono: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sueldo Fijo (S/)</label>
                <input type="number" step="0.01" value={form.sueldo_fijo}
                  onChange={(e) => setForm({...form, sueldo_fijo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
