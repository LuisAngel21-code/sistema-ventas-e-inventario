import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    codigo: '', nombre: '', descripcion: '', costo: '',
    precio_venta: '', stock: '0', stock_minimo: '0', categoria: ''
  });

  async function loadProductos() {
    try {
      const data = await productosAPI.getAll();
      setProductos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProductos(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ codigo: '', nombre: '', descripcion: '', costo: '', precio_venta: '', stock: '0', stock_minimo: '0', categoria: '' });
    setShowModal(true);
  }

  function openEdit(producto) {
    setEditing(producto.id);
    setForm({
      codigo: producto.codigo || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      costo: String(producto.costo),
      precio_venta: producto.precio_venta ? String(producto.precio_venta) : '',
      stock: String(producto.stock),
      stock_minimo: String(producto.stock_minimo || 0),
      categoria: producto.categoria || ''
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = {
        ...form,
        costo: Number(form.costo),
        precio_venta: form.precio_venta ? Number(form.precio_venta) : null,
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo),
      };

      if (editing) {
        await productosAPI.update(editing, data);
      } else {
        await productosAPI.create(data);
      }
      setShowModal(false);
      loadProductos();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActivo(producto) {
    try {
      await productosAPI.update(producto.id, { activo: !producto.activo });
      loadProductos();
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
        <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Código</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoría</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Costo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">P. Base</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${!p.activo ? 'text-gray-400' : ''}`}>
                  <td className="py-3 px-4">{p.codigo || '---'}</td>
                  <td className="py-3 px-4 font-medium">{p.nombre}</td>
                  <td className="py-3 px-4">{p.categoria || '---'}</td>
                  <td className="py-3 px-4 text-right">S/ {Number(p.costo).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">S/ {Number(p.precio_base).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={p.stock <= p.stock_minimo ? 'text-red-600 font-bold' : ''}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 mx-2">Editar</button>
                    <button onClick={() => toggleActivo(p)} className="text-orange-600 hover:text-orange-800 mx-2">
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Código</label>
                  <input type="text" value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
                  <input type="text" value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Camas, Colchones" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Costo (S/) *</label>
                  <input type="number" step="0.01" value={form.costo} onChange={(e) => setForm({...form, costo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Precio Venta (S/)</label>
                  <input type="number" step="0.01" value={form.precio_venta}
                    onChange={(e) => setForm({...form, precio_venta: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Stock Mínimo</label>
                  <input type="number" value={form.stock_minimo} onChange={(e) => setForm({...form, stock_minimo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                * Precio base se calcula automáticamente como: costo + 40%
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
