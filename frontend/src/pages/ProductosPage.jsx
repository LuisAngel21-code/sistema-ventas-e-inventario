import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';
import { Package, Plus, Pencil, Trash2, Search } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const emptyProduct = {
  codigo: '', nombre: '', descripcion: '', costo: '', categoria: '',
  stock: 0, stock_minimo: 0, precio_venta: '',
};

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [search, setSearch] = useState('');

  function load() {
    setLoading(true);
    productosAPI.getAll(true)
      .then(setProductos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(emptyProduct);
    setModalOpen(true);
  }

  async function openEdit(id) {
    try {
      const prod = await productosAPI.getById(id);
      setEditId(id);
      setForm({
        codigo: prod.codigo || '',
        nombre: prod.nombre || '',
        descripcion: prod.descripcion || '',
        costo: prod.costo || '',
        categoria: prod.categoria || '',
        stock: prod.stock || 0,
        stock_minimo: prod.stock_minimo || 0,
        precio_venta: prod.precio_venta || '',
      });
      setModalOpen(true);
    } catch (err) { alert(err.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        costo: Number(form.costo),
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo),
        precio_venta: form.precio_venta ? Number(form.precio_venta) : undefined,
      };

      if (editId) {
        await productosAPI.update(editId, payload);
      } else {
        await productosAPI.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) { alert(err.message); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar producto?')) return;
    try {
      await productosAPI.remove(id);
      load();
    } catch (err) { alert(err.message); }
  }

  const filtered = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Catálogo de productos</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Nuevo Producto</Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-gray-400">{filtered.length} productos</span>
      </div>

      <div className="card-page overflow-hidden">
        {loading ? <Spinner className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="table-header">Código</th>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Categoría</th>
                  <th className="table-header text-right">Costo</th>
                  <th className="table-header text-right">Precio Base</th>
                  <th className="table-header text-right">Stock</th>
                  <th className="table-header text-center">Estado</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="table-cell font-mono text-xs text-gray-500">{p.codigo}</td>
                    <td className="table-cell font-medium text-gray-900">{p.nombre}</td>
                    <td className="table-cell text-gray-500">{p.categoria || '—'}</td>
                    <td className="table-cell text-right text-gray-500">S/ {Number(p.costo).toFixed(2)}</td>
                    <td className="table-cell text-right font-medium">S/ {Number(p.precio_base).toFixed(2)}</td>
                    <td className="table-cell text-right font-semibold">{p.stock}</td>
                    <td className="table-cell text-center">
                      {Number(p.stock) <= 0 ? (
                        <Badge variant="danger">Sin stock</Badge>
                      ) : Number(p.stock) <= Number(p.stock_minimo) ? (
                        <Badge variant="warning">Bajo</Badge>
                      ) : (
                        <Badge variant="success">Disponible</Badge>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p.id)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => eliminar(p.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No hay productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Costo (S/)" type="number" step="0.01" value={form.costo}
              onChange={(e) => {
                const costo = Number(e.target.value);
                setForm({ ...form, costo: e.target.value, precio_venta: costo > 0 ? (costo * 1.4).toFixed(2) : '' });
              }} required />
            <Input label="Precio Base (costo + 40%)" type="number" step="0.01" value={form.precio_venta}
              onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} />
          </div>
          <Input label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock Inicial" type="number" min="0" value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <Input label="Stock Mínimo" type="number" min="0" value={form.stock_minimo}
              onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editId ? 'Actualizar' : 'Crear Producto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
