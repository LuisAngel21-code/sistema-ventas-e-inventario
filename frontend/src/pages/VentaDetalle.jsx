import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ventasAPI } from '../services/api';

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await ventasAPI.getById(id);
        setVenta(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!venta) {
    return <div className="text-center py-12 text-gray-500">Venta no encontrada</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Venta #{venta.id}</h2>
        <Link to="/ventas" className="text-indigo-600 hover:text-indigo-800">← Volver</Link>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">{new Date(venta.fecha).toLocaleString('es-PE')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vendedor</p>
            <p className="font-medium">{venta.vendedor_nombre} {venta.vendedor_apellido}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-xl text-indigo-600">S/ {Number(venta.total).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-6 pb-2">Detalle de Productos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Cant.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Costo U.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">P. Base U.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">P. Final U.</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Sobreprecio</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalle.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{d.producto_nombre}</p>
                    <p className="text-xs text-gray-400">{d.producto_codigo}</p>
                  </td>
                  <td className="py-3 px-4 text-center">{d.cantidad}</td>
                  <td className="py-3 px-4 text-right">S/ {Number(d.costo_unitario).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">S/ {Number(d.precio_base_unitario).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">S/ {Number(d.precio_final_unitario).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={Number(d.sobreprecio_unitario) > 0 ? 'text-green-600 font-medium' : ''}>
                      S/ {Number(d.sobreprecio_unitario).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">S/ {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={6} className="text-right py-3 px-4">Total:</td>
                <td className="text-right py-3 px-4 text-indigo-600">S/ {Number(venta.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
