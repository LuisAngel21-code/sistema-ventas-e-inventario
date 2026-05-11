import { useState, useEffect } from 'react';
import { inventarioAPI, productosAPI } from '../services/api';

export default function InventarioPage() {
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tab, setTab] = useState('stock');
  const [showEntrada, setShowEntrada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ producto_id: '', cantidad: 1, referencia: '' });

  async function loadData() {
    setLoading(true);
    try {
      const [stockData, movData, prodData] = await Promise.all([
        inventarioAPI.getStock(),
        inventarioAPI.getMovimientos(),
        productosAPI.getAll(true),
      ]);
      setStock(stockData);
      setMovimientos(movData);
      setProductos(prodData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleEntrada(e) {
    e.preventDefault();
    try {
      await inventarioAPI.entradaStock({
        producto_id: Number(form.producto_id),
        cantidad: Number(form.cantidad),
        referencia: form.referencia
      });
      setShowEntrada(false);
      setForm({ producto_id: '', cantidad: 1, referencia: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        <button onClick={() => setShowEntrada(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Entrada de Stock
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('stock')}
          className={`px-4 py-2 rounded-lg ${tab === 'stock' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          Stock Actual
        </button>
        <button onClick={() => setTab('movimientos')}
          className={`px-4 py-2 rounded-lg ${tab === 'movimientos' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          Movimientos
        </button>
      </div>

      {tab === 'stock' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Categoría</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Costo</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">P. Base</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Stock</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{p.codigo || '---'}</td>
                    <td className="py-3 px-4 font-medium">{p.nombre}</td>
                    <td className="py-3 px-4">{p.categoria || '---'}</td>
                    <td className="py-3 px-4 text-right">S/ {Number(p.costo).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">S/ {Number(p.precio_base).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${p.estado_stock === 'bajo' ? 'text-red-600' : 'text-gray-800'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.estado_stock === 'bajo' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {p.estado_stock === 'bajo' ? 'Stock Bajo' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'movimientos' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Cantidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(m.created_at).toLocaleString('es-PE')}</td>
                    <td className="py-3 px-4">{m.producto_nombre}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'salida' ? 'Salida' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{m.cantidad}</td>
                    <td className="py-3 px-4 text-gray-500">{m.referencia || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEntrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Entrada de Stock</h3>
            <form onSubmit={handleEntrada} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Producto *</label>
                <select value={form.producto_id} onChange={(e) => setForm({...form, producto_id: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" required>
                  <option value="">Seleccionar...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad *</label>
                <input type="number" min="1" value={form.cantidad}
                  onChange={(e) => setForm({...form, cantidad: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Referencia</label>
                <input type="text" value={form.referencia}
                  onChange={(e) => setForm({...form, referencia: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Proveedor X, Nota Y" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEntrada(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
