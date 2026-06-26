import { useState, useEffect } from 'react';
import { inventarioAPI, productosAPI } from '../services/api';
import { Warehouse, Package, Plus, ArrowUpDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { useToast } from '../context/ToastContext';

export default function InventarioPage() {
  const [tab, setTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryOpen, setEntryOpen] = useState(false);
  const { showToast } = useToast();
  const [entryForm, setEntryForm] = useState({ producto_id: '', cantidad: '', referencia: '' });

  function loadStock() {
    setLoading(true);
    inventarioAPI.getStock()
      .then(setStock)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function loadMovimientos() {
    setLoading(true);
    inventarioAPI.getMovimientos()
      .then(setMovimientos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (tab === 'stock') loadStock();
    else loadMovimientos();
  }, [tab]);

  async function handleEntry(e) {
    e.preventDefault();
    try {
      await inventarioAPI.entradaStock({
        producto_id: Number(entryForm.producto_id),
        cantidad: Number(entryForm.cantidad),
        referencia: entryForm.referencia || 'Entrada manual',
      });
      setEntryOpen(false);
      setEntryForm({ producto_id: '', cantidad: '', referencia: '' });
      showToast('Stock actualizado exitosamente', 'success');
      loadStock();
    } catch (err) { showToast(err.message, 'error'); }
  }

  const [productos, setProductos] = useState([]);
  useEffect(() => {
    if (entryOpen) {
      productosAPI.getAll(true).then(setProductos).catch(console.error);
    }
  }, [entryOpen]);

  const tabs = [
    { id: 'stock', label: 'Stock Actual', icon: Package },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowUpDown },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Control de existencias</p>
        </div>
        <Button onClick={() => setEntryOpen(true)} icon={Plus}>Entrada de Stock</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'stock' ? (
        <div className="card-page overflow-hidden">
          {loading ? <Spinner className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="table-header">Código</th>
                    <th className="table-header">Producto</th>
                    <th className="table-header">Categoría</th>
                    <th className="table-header text-right">Costo</th>
                    <th className="table-header text-right">Precio Base</th>
                    <th className="table-header text-right">Stock</th>
                    <th className="table-header text-right">Stock Min</th>
                    <th className="table-header text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map(p => {
                    const estado = Number(p.stock) <= 0 ? 'sin_stock' : Number(p.stock) <= Number(p.stock_minimo) ? 'bajo' : 'normal';
                    return (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${
                        estado === 'sin_stock' ? 'bg-red-50/30' : estado === 'bajo' ? 'bg-amber-50/30' : ''
                      }`}>
                        <td className="table-cell font-mono text-xs text-gray-500">{p.codigo}</td>
                        <td className="table-cell font-medium text-gray-900">{p.nombre}</td>
                        <td className="table-cell text-gray-500">{p.categoria || '—'}</td>
                        <td className="table-cell text-right text-gray-500">S/ {Number(p.costo).toFixed(2)}</td>
                        <td className="table-cell text-right">S/ {Number(p.precio_base).toFixed(2)}</td>
                        <td className={`table-cell text-right font-bold ${estado === 'sin_stock' ? 'text-red-600' : estado === 'bajo' ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </td>
                        <td className="table-cell text-right text-gray-400">{p.stock_minimo}</td>
                        <td className="table-cell text-center">
                          {estado === 'sin_stock' ? <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" /> Sin stock</Badge> :
                           estado === 'bajo' ? <Badge variant="warning"><AlertTriangle className="w-3 h-3 mr-1" /> Bajo</Badge> :
                           <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Disponible</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card-page overflow-hidden">
          {loading ? <Spinner className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="table-header">Fecha</th>
                    <th className="table-header">Producto</th>
                    <th className="table-header text-center">Tipo</th>
                    <th className="table-header text-right">Cantidad</th>
                    <th className="table-header">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell text-gray-500 text-xs">{new Date(m.created_at).toLocaleString('es-PE')}</td>
                      <td className="table-cell font-medium text-gray-900">{m.producto_nombre}</td>
                      <td className="table-cell text-center">
                        {m.tipo === 'entrada' ? <Badge variant="success">Entrada</Badge> :
                         m.tipo === 'salida' ? <Badge variant="warning">Salida</Badge> :
                         <Badge variant="info">Ajuste</Badge>}
                      </td>
                      <td className="table-cell text-right font-semibold">{m.cantidad}</td>
                      <td className="table-cell text-gray-500 text-xs">{m.referencia || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={entryOpen} onClose={() => setEntryOpen(false)} title="Entrada de Stock">
        <form onSubmit={handleEntry} className="space-y-4">
          <Select
            label="Producto"
            placeholder="Seleccionar producto..."
            value={entryForm.producto_id}
            onChange={(e) => setEntryForm({ ...entryForm, producto_id: e.target.value })}
            options={productos.map(p => ({ value: p.id, label: `${p.codigo} — ${p.nombre}` }))}
          />
          <Input label="Cantidad" type="number" min="1" placeholder="Cantidad"
            value={entryForm.cantidad}
            onChange={(e) => setEntryForm({ ...entryForm, cantidad: e.target.value })} required />
          <Input label="Referencia" placeholder="Referencia (opcional)"
            value={entryForm.referencia}
            onChange={(e) => setEntryForm({ ...entryForm, referencia: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEntryOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar Entrada</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
