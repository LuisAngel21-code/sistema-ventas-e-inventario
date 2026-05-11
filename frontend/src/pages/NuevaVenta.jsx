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
        const [vData, pData] = await Promise.all([
          vendedoresAPI.getAll(),
          productosAPI.getAll(true),
        ]);
        setVendedores(vData.filter(v => v.activo));
        setProductos(pData);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  function handleProductChange(index, productoId) {
    const producto = productos.find(p => p.id === Number(productoId));
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      producto_id: productoId,
      precio_final: producto ? producto.precio_base : ''
    };
    setItems(newItems);
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { producto_id: '', cantidad: 1, precio_final: '' }]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function getProducto(id) {
    return productos.find(p => p.id === Number(id));
  }

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
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Venta</h2>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Venta</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Vendedor *</label>
            <select
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Seleccione un vendedor</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              + Agregar producto
            </button>
          </div>

          {items.map((item, index) => {
            const producto = getProducto(item.producto_id);
            return (
              <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Producto #{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Producto</label>
                    <select
                      value={item.producto_id}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - S/ {p.precio_base.toFixed(2)} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={producto?.stock || 99}
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Precio Final
                      {producto && (
                        <span className="text-xs text-gray-400 ml-1">
                          (P. Base: S/ {producto.precio_base.toFixed(2)})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.precio_final}
                      onChange={(e) => handleItemChange(index, 'precio_final', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder={producto ? producto.precio_base.toFixed(2) : ''}
                    />
                  </div>
                </div>
                {producto && (
                  <div className="mt-2 text-xs text-gray-500">
                    Costo: S/ {producto.costo.toFixed(2)} | Precio Base: S/ {producto.precio_base.toFixed(2)}
                    {Number(item.precio_final) > producto.precio_base && (
                      <span className="text-green-600">
                        {' '}| Sobreprecio: S/ {(Number(item.precio_final) - producto.precio_base).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total de la Venta:</span>
            <span className="text-2xl font-bold text-indigo-600">S/ {getTotal().toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          {submitting ? 'Registrando...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  );
}
