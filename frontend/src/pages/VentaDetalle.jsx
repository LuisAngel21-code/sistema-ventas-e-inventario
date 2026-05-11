import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ventasAPI } from '../services/api';

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ventasAPI.getById(id).then(setVenta).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!venta) return <div className="text-center py-12 text-gray-400">Venta no encontrada</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Venta #{venta.id}</h3>
        <Link to="/ventas" className="text-sm text-blue-600 hover:text-blue-800 font-medium">← Volver</Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha</p>
            <p className="text-sm font-medium text-gray-900">{new Date(venta.fecha).toLocaleString('es-PE')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vendedor</p>
            <p className="text-sm font-medium text-gray-900">{venta.vendedor_nombre} {venta.vendedor_apellido}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-lg font-bold text-gray-900">S/ {Number(venta.total).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Detalle de Productos</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 font-medium text-gray-500 text-xs uppercase">Producto</th>
                <th className="text-center py-3 px-5 font-medium text-gray-500 text-xs uppercase">Cant.</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Costo U.</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">P. Base</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">P. Final</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Sobreprecio</th>
                <th className="text-right py-3 px-5 font-medium text-gray-500 text-xs uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalle.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-5">
                    <p className="font-medium text-gray-900">{d.producto_nombre}</p>
                    <p className="text-xs text-gray-400">{d.producto_codigo}</p>
                  </td>
                  <td className="py-3 px-5 text-center text-gray-700">{d.cantidad}</td>
                  <td className="py-3 px-5 text-right text-gray-700">S/ {Number(d.costo_unitario).toFixed(2)}</td>
                  <td className="py-3 px-5 text-right text-gray-700">S/ {Number(d.precio_base_unitario).toFixed(2)}</td>
                  <td className="py-3 px-5 text-right text-gray-700">S/ {Number(d.precio_final_unitario).toFixed(2)}</td>
                  <td className="py-3 px-5 text-right">
                    <span className={Number(d.sobreprecio_unitario) > 0 ? 'text-emerald-600 font-medium' : 'text-gray-700'}>
                      S/ {Number(d.sobreprecio_unitario).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right font-medium text-gray-900">S/ {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td colSpan={6} className="text-right py-3 px-5 text-sm text-gray-700">Total:</td>
                <td className="text-right py-3 px-5 font-bold text-gray-900">S/ {Number(venta.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
