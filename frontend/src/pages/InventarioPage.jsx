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
        inventarioAPI.getStock(), inventarioAPI.getMovimientos(), productosAPI.getAll(true)
      ]);
      setStock(stockData); setMovimientos(movData); setProductos(prodData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleEntrada(e) {
    e.preventDefault();
    try {
      await inventarioAPI.entradaStock({ producto_id: Number(form.producto_id), cantidad: Number(form.cantidad), referencia: form.referencia });
      setShowEntrada(false);
      setForm({ producto_id: '', cantidad: 1, referencia: '' });
      loadData();
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
        <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
        <button onClick={() => setShowEntrada(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">+ Entrada de Stock</button>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        <button onClick={() => setTab('stock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'stock' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          Stock Actual
        </button>
        <button onClick={() => setTab('movimientos')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'movimientos' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          Movimientos
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {tab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Código</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Producto</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Categoría</th>
                  <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Costo</th>
                  <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">P. Base</th>
                  <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Stock</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500 text-xs uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-gray-500">{p.codigo || '---'}</td>
                    <td className="py-3 px-5 font-medium text-gray-900">{p.nombre}</td>
                    <td className="py-3 px-5 text-gray-600">{p.categoria || '---'}</td>
                    <td className="py-3 px-5 text-right text-gray-700">S/ {Number(p.costo).toFixed(2)}</td>
                    <td className="py-3 px-5 text-right text-gray-700">S/ {Number(p.precio_base).toFixed(2)}</td>
                    <td className="py-3 px-5 text-right font-medium">{p.stock}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.estado_stock === 'bajo' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {p.estado_stock === 'bajo' ? 'Stock Bajo' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Fecha</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Producto</th>
                  <th className="text-center py-3 px-5 font-medium text-gray-500 text-xs uppercase">Tipo</th>
                  <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Cantidad</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 text-gray-700">{new Date(m.created_at).toLocaleString('es-PE')}</td>
                    <td className="py-3 px-5 font-medium text-gray-900">{m.producto_nombre}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-medium text-gray-900">{m.cantidad}</td>
                    <td className="py-3 px-5 text-gray-500">{m.referencia || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEntrada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Entrada de Stock</h3>
            </div>
            <form onSubmit={handleEntrada} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <select value={form.producto_id} onChange={(e) => setForm({...form, producto_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" required>
                  <option value="">Seleccionar...</option>
                  {productos.map((p) => (<option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                <input type="number" min="1" value={form.cantidad} onChange={(e) => setForm({...form, cantidad: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input type="text" value={form.referencia} onChange={(e) => setForm({...form, referencia: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900" placeholder="Ej: Proveedor X" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEntrada(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800">Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
