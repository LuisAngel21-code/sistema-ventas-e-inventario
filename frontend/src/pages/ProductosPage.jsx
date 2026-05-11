import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', costo: '', precio_venta: '', stock: '0', stock_minimo: '0', categoria: '' });

  async function load() {
    try { setProductos(await productosAPI.getAll()); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ codigo: '', nombre: '', descripcion: '', costo: '', precio_venta: '', stock: '0', stock_minimo: '0', categoria: '' });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p.id);
    setForm({
      codigo: p.codigo || '', nombre: p.nombre, descripcion: p.descripcion || '',
      costo: String(p.costo), precio_venta: p.precio_venta ? String(p.precio_venta) : '',
      stock: String(p.stock), stock_minimo: String(p.stock_minimo || 0), categoria: p.categoria || ''
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, costo: Number(form.costo), precio_venta: form.precio_venta ? Number(form.precio_venta) : null, stock: Number(form.stock), stock_minimo: Number(form.stock_minimo) };
      if (editing) { await productosAPI.update(editing, data); } else { await productosAPI.create(data); }
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  }

  async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try { await productosAPI.remove(id); load(); } catch (err) { alert(err.message); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
        <button onClick={openCreate} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">+ Nuevo Producto</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Código</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Nombre</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Categoría</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Costo</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">P. Base</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Stock</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500 text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-gray-500">{p.codigo || '---'}</td>
                  <td className="py-3 px-5 font-medium text-gray-900">{p.nombre}</td>
                  <td className="py-3 px-5 text-gray-600">{p.categoria || '---'}</td>
                  <td className="py-3 px-5 text-right text-gray-700">S/ {Number(p.costo).toFixed(2)}</td>
                  <td className="py-3 px-5 text-right text-gray-700">S/ {Number(p.precio_base).toFixed(2)}</td>
                  <td className="py-3 px-5 text-right">
                    <span className={`font-medium ${p.stock <= p.stock_minimo ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-sm font-medium mx-1.5">Editar</button>
                    <button onClick={() => eliminarProducto(p.id, p.nombre)} className="text-red-600 hover:text-red-800 text-sm font-medium mx-1.5">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input type="text" value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" placeholder="Ej: Camas" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo (S/) *</label>
                  <input type="number" step="0.01" value={form.costo} onChange={(e) => setForm({...form, costo: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta (S/)</label>
                  <input type="number" step="0.01" value={form.precio_venta} onChange={(e) => setForm({...form, precio_venta: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" value={form.stock_minimo} onChange={(e) => setForm({...form, stock_minimo: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" />
                </div>
              </div>
              <p className="text-xs text-gray-400">* Precio base se calcula como costo + 40%</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800">
                  {editing ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
