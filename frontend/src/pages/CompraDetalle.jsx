import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { comprasAPI } from '../services/api';
import { ArrowLeft, Building2, Calendar, Hash } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

export default function CompraDetalle() {
  const { id } = useParams();
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    comprasAPI.getById(id)
      .then(data => { setCompra(data); setLoading(false); })
      .catch(console.error);
  }, [id]);

  if (loading) return <Spinner size="lg" className="h-64" />;
  if (!compra) return <p className="text-gray-500">Compra no encontrada</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/compras"><Button variant="ghost" icon={ArrowLeft}>Volver</Button></Link>
        <div>
          <h1 className="page-title">Compra #{compra.id}</h1>
          <p className="page-subtitle">Detalle de la compra</p>
        </div>
      </div>

      <div className="card-page p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Proveedor</p>
              <p className="text-sm font-semibold text-gray-900">{compra.proveedor}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(compra.fecha).toLocaleDateString('es-PE')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-page overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-display font-semibold text-gray-900">Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="table-header"><Hash className="w-3 h-3 inline" /> Código</th>
                <th className="table-header">Producto</th>
                <th className="table-header text-right">Cantidad</th>
                <th className="table-header text-right">Costo/u</th>
                <th className="table-header text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {compra.detalle?.map((d, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="table-cell font-mono text-xs text-gray-500">{d.producto_codigo}</td>
                  <td className="table-cell text-gray-700">{d.producto_nombre}</td>
                  <td className="table-cell text-right">{d.cantidad}</td>
                  <td className="table-cell text-right">S/ {Number(d.costo_unitario).toFixed(2)}</td>
                  <td className="table-cell text-right font-semibold">S/ {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/80">
                <td colSpan={4} className="table-cell text-right font-display font-semibold text-gray-900">Total</td>
                <td className="table-cell text-right font-display font-bold text-primary-700">S/ {Number(compra.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
