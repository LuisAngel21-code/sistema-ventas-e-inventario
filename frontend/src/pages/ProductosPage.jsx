import { useState, useEffect } from 'react';
import { productosAPI, marcasAPI, getDownloadUrl } from '../services/api';
import { Package, Plus, Pencil, Trash2, Search, FileSpreadsheet, CheckCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../context/ToastContext';

const emptyProduct = {
  codigo: '', nombre: '', costo: '', categoria: '',
  marca_id: '', proveedor: '', tipo: '', medida: '', tipo_tela: '',
  stock: 0, stock_minimo: 0, precio_venta: '',
};

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [marcas, setMarcas] = useState([]);
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activos');

  const [catEsOtro, setCatEsOtro] = useState(false);
  const [marcaText, setMarcaText] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      productosAPI.getAll(filtroEstado !== 'inactivos'),
      marcasAPI.getAll(),
    ]).then(([prods, mar]) => {
      setProductos(prods);
      setMarcas(mar);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [filtroEstado]);

  function openCreate() {
    setEditId(null);
    setForm(emptyProduct);
    setCatEsOtro(false);
    setMarcaText('');
    setModalOpen(true);
  }

  async function openEdit(id) {
    try {
      const prod = await productosAPI.getById(id);
      setEditId(id);
      setForm({
        codigo: prod.codigo || '',
        nombre: prod.nombre || '',
        costo: prod.costo || '',
        categoria: prod.categoria || '',
        marca_id: prod.marca_id || '',
        proveedor: prod.proveedor || '',
        tipo: prod.tipo || '',
        medida: prod.medida || '',
        tipo_tela: prod.tipo_tela || '',
        stock: prod.stock || 0,
        stock_minimo: prod.stock_minimo || 0,
        precio_venta: prod.precio_venta || '',
      });
      setCatEsOtro(prod.categoria && !['Camas', 'Colchón', 'Almohadas'].includes(prod.categoria));
      setMarcaText('');
      setModalOpen(true);
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
        let marcaIdFinal = form.marca_id && !String(form.marca_id).startsWith('temp-') ? Number(form.marca_id) : undefined;
        if (String(form.marca_id).startsWith('temp-') && marcaText) {
          const created = await marcasAPI.create({ nombre: marcaText });
          marcaIdFinal = created.id;
        }
        const payload = {
          ...form,
          marca_id: marcaIdFinal,
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
      showToast(editId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function desactivar(id) {
    try {
      await productosAPI.remove(id);
      setDeleteId(null);
      showToast('Producto desactivado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function activarProducto(id) {
    try {
      await productosAPI.activar(id);
      setDeleteId(null);
      showToast('Producto activado', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  const marcasColchon = ['Paraíso', 'Cisne', 'Avanty', 'Gala', 'Gianlui'];
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

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Buscar producto..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="input-field w-32"
          value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="activos">Activos</option>
          <option value="todos">Todos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => window.open(getDownloadUrl('/api/exportes/productos'), '_blank')} icon={FileSpreadsheet}>
          Excel
        </Button>
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
                  <th className="table-header">Medida</th>
                  <th className="table-header">Marca</th>
                  <th className="table-header">Proveedor</th>
                  <th className="table-header text-right">Costo</th>
                  <th className="table-header text-right">P. Base</th>
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
                    <td className="table-cell text-gray-500">{p.medida || '—'}</td>
                    <td className="table-cell text-gray-500">{p.marca_id ? marcas.find(m => m.id === p.marca_id)?.nombre || '—' : '—'}</td>
                    <td className="table-cell text-gray-500">{p.proveedor || '—'}</td>
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
                        {p.activo !== false ? (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => activarProducto(p.id)}>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-400">
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
            <Input label="Descripción del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="input-label">Categoría</label>
              <select className="input-field"
                value={['Camas', 'Colchón', 'Almohadas'].includes(form.categoria) ? form.categoria : 'otro'}
                onChange={(e) => {
                  if (e.target.value === 'otro') { setCatEsOtro(true); setForm({ ...form, categoria: '' }); }
                  else { setCatEsOtro(false); setForm({ ...form, categoria: e.target.value }); }
                }}>
                <option value="">Seleccionar...</option>
                <option value="Camas">Camas</option>
                <option value="Colchón">Colchón</option>
                <option value="Almohadas">Almohadas</option>
                <option value="otro">Otro</option>
              </select>
              {catEsOtro && (
                <input className="input-field mt-2" placeholder="Escribir categoría..."
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="input-label">Marca</label>
              <select className="input-field"
                value={form.marca_id}
                onChange={(e) => setForm({ ...form, marca_id: e.target.value })}>
                <option value="">Seleccionar...</option>
                {form.categoria === 'Colchón'
                  ? marcasColchon.map(m => {
                      const found = marcas.find(mc => mc.nombre === m);
                      const id = found ? found.id : `text-${m}`;
                      return <option key={id} value={id}>{m}</option>;
                    })
                  : marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)
                }
                <option value="otro">Otro...</option>
              </select>
              {form.marca_id === 'otro' && (
                <input className="input-field mt-2" placeholder="Escribir marca..."
                  value={marcaText}
                  onChange={(e) => {
                    setMarcaText(e.target.value);
                    setForm({ ...form, marca_id: `temp-${Date.now()}` });
                  }} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Proveedor" value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
            <div className="space-y-1.5">
              <label className="input-label">Medida</label>
              <select className="input-field" value={form.medida}
                onChange={(e) => setForm({ ...form, medida: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="1plz">1plz</option>
                <option value="1.5 plz">1.5 plz</option>
                <option value="2plz">2plz</option>
                <option value="Queen">Queen</option>
                <option value="King Size">King Size</option>
              </select>
            </div>
            {form.categoria?.toLowerCase() === 'camas' && (
              <div className="space-y-1.5">
                <label className="input-label">Tipo</label>
                <select className="input-field" value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  <option value="madera">Madera</option>
                  <option value="tapizada">Tapizada</option>
                </select>
                {form.tipo === 'tapizada' && (
                  <input className="input-field mt-2" placeholder="Tipo de tela (ej: Chenille, Tela, Cuero...)"
                    value={form.tipo_tela}
                    onChange={(e) => setForm({ ...form, tipo_tela: e.target.value })} />
                )}
              </div>
            )}
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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Desactivar Producto">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de desactivar este producto? No aparecerá en las listas pero el historial de ventas se conserva.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => desactivar(deleteId)}>Desactivar</Button>
        </div>
      </Modal>
    </div>
  );
}
