import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, productosAPI } from '../services/api';

export default function NuevaVenta() {
  const navigate = useNavigate();
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, precio_final: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [vData, pData] = await Promise.all([vendedoresAPI.getAll(), productosAPI.getAll(true)]);
        setVendedores(vData.filter(v => v.activo));
        setProductos(pData);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  function handleProductChange(index, productoId) {
    const producto = productos.find(p => p.id === Number(productoId));
    const newItems = [...items];
    newItems[index] = { ...newItems[index], producto_id: productoId, precio_final: producto ? producto.precio_base : '' };
    setItems(newItems);
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  }

  function addItem() { setItems([...items, { producto_id: '', cantidad: 1, precio_final: '' }]); }
  function removeItem(index) { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); }

  function getProducto(id) { return productos.find(p => p.id === Number(id)); }

  function getTotal() {
    return items.reduce((sum, item) => {
      const p = getProducto(item.producto_id);
      if (!p) return sum;
      return sum + (Number(item.precio_final || p.precio_base) * (item.cantidad || 1));
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!vendedorId) { setError('Seleccione un vendedor'); return; }
    if (items.some(i => !i.producto_id)) { setError('Complete todos los productos'); return; }
    setSubmitting(true);
    try {
      const data = {
        vendedor_id: Number(vendedorId),
        productos: items.map(i => ({
          producto_id: Number(i.producto_id),
          cantidad: Number(i.cantidad) || 1,
          precio_final: Number(i.precio_final) || getProducto(i.producto_id)?.precio_base || 0
        }))
      };
      const result = await ventasAPI.create(data);
      navigate(`/ventas/${result.id}`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Nueva Venta</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Datos de la Venta</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor *</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" required>
              <option value="">Seleccione un vendedor</option>
              {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Productos</h4>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Agregar producto</button>
          </div>
          {items.map((item, index) => {
            const producto = getProducto(item.producto_id);
            return (
              <div key={index} className={`border rounded-md p-4 ${index < items.length - 1 ? 'mb-3' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase">Producto #{index + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-600 hover:text-red-800">Quitar</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Producto</label>
                    <select value={item.producto_id} onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" required>
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre} — S/ {p.precio_base.toFixed(2)} (Stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input type="number" min="1" max={producto?.stock || 99} value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Precio Final {producto && <span className="text-gray-400 font-normal">(Base: S/ {producto.precio_base.toFixed(2)})</span>}
                    </label>
                    <input type="number" step="0.01" min="0" value={item.precio_final}
                      onChange={(e) => handleItemChange(index, 'precio_final', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      placeholder={producto ? String(producto.precio_base.toFixed(2)) : ''} />
                  </div>
                </div>
                {producto && Number(item.precio_final) > producto.precio_base && (
                  <p className="mt-2 text-xs text-emerald-600">
                    Sobreprecio: S/ {(Number(item.precio_final) - producto.precio_base).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total de la Venta</span>
            <span className="text-xl font-bold text-gray-900">S/ {getTotal().toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-slate-900 text-white py-3 rounded-md font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
          {submitting ? 'Registrando...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  );
}
