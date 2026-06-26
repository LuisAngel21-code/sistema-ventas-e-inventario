import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ventasAPI } from '../services/api';
import { ArrowLeft, Receipt, User, Calendar, Hash } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ventasAPI.getById(id)
      .then(data => {
        setVenta(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) return <Spinner size="lg" className="h-64" />;
  if (!venta) return <p className="text-gray-500">Venta no encontrada</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/ventas">
          <Button variant="ghost" icon={ArrowLeft}>Volver</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Venta #{venta.id}</h1>
            {venta.estado === 'anulada' && <Badge variant="danger">Anulada</Badge>}
          </div>
          <p className="page-subtitle">Detalle de la transacción</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="card-page p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Vendedor</p>
              <p className="text-sm font-semibold text-gray-900">{venta.vendedor_nombre} {venta.vendedor_apellido}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(venta.fecha).toLocaleDateString('es-PE')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-display font-bold text-primary-700">S/ {Number(venta.total).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className="card-page overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-display font-semibold text-gray-900">Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="table-header">
                  <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> Código</div>
                </th>
                <th className="table-header">Producto</th>
                <th className="table-header text-right">Cant.</th>
                <th className="table-header text-right">Costo/u</th>
                <th className="table-header text-right">Precio Base</th>
                <th className="table-header text-right">Precio Final</th>
                <th className="table-header text-right">Sobreprecio</th>
                <th className="table-header text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalle?.map((d, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="table-cell font-mono text-gray-500">{d.producto_codigo}</td>
                  <td className="table-cell text-gray-700">{d.producto_nombre}</td>
                  <td className="table-cell text-right">{d.cantidad}</td>
                  <td className="table-cell text-right text-gray-500">S/ {Number(d.costo_unitario).toFixed(2)}</td>
                  <td className="table-cell text-right text-gray-500">S/ {Number(d.precio_base_unitario).toFixed(2)}</td>
                  <td className="table-cell text-right font-medium">S/ {Number(d.precio_final_unitario).toFixed(2)}</td>
                  <td className="table-cell text-right">
                    {Number(d.sobreprecio_unitario) > 0 ? (
                      <span className="text-amber-600 font-medium">S/ {Number(d.sobreprecio_unitario).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="table-cell text-right font-semibold">S/ {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/80">
                <td colSpan={7} className="table-cell text-right font-display font-semibold text-gray-900">
                  Total
                </td>
                <td className="table-cell text-right font-display font-bold text-primary-700">
                  S/ {Number(venta.total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
