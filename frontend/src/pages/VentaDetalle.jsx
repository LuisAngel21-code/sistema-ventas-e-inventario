import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ventasAPI } from '../services/api';
import { ArrowLeft, Receipt, User, Calendar, Hash, CreditCard, FileText, Image, Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);
  const [showAbonar, setShowAbonar] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    ventasAPI.getById(id)
      .then(data => {
        setVenta(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  async function handleAbonar(e) {
    e.preventDefault();
    try {
      const res = await ventasAPI.abonar(id, Number(abonoMonto));
      showToast(res.message, 'success');
      setShowAbonar(false);
      setAbonoMonto('');
      const data = await ventasAPI.getById(id);
      setVenta(data);
    } catch (err) { showToast(err.message, 'error'); }
  }

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
            {venta.tipo_venta === 'contrato' && <Badge variant="warning">Contrato</Badge>}
            {venta.tipo_venta === 'separacion' && <Badge variant="info">Separación</Badge>}
            {venta.estado === 'pendiente' && <Badge variant="neutral">Pendiente</Badge>}
          </div>
          <p className="page-subtitle">Detalle de la transacción</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="card-page p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pago</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {venta.metodo_pago?.replace(/_/g, ' ') || 'Efectivo'}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 capitalize">{venta.tipo_comprobante || 'Boleta'}</p>
              <p className="text-sm font-semibold text-gray-900">{venta.nro_comprobante || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex gap-3">
              {venta.comprobante_url && (
                <button onClick={() => setImageModal(venta.comprobante_url)}
                  className="text-xs text-primary-600 hover:text-primary-700 underline">
                  Ver comprobante
                </button>
              )}
              {venta.voucher_url && (
                <button onClick={() => setImageModal(venta.voucher_url)}
                  className="text-xs text-primary-600 hover:text-primary-700 underline">
                  Ver voucher
                </button>
              )}
              {!venta.comprobante_url && !venta.voucher_url && (
                <p className="text-sm text-gray-400">Sin imágenes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress for contracts */}
      {venta.tipo_venta && venta.tipo_venta !== 'directa' && (
        <div className="card-page p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {venta.tipo_venta === 'contrato' ? 'Contrato' : 'Separación'} — Progreso de pago
              </p>
              <p className="text-xs text-gray-500">
                Acta: S/ {Number(venta.monto_acta).toFixed(2)} de S/ {Number(venta.total).toFixed(2)}
              </p>
            </div>
            {venta.estado === 'pendiente' && (
              <button onClick={() => setShowAbonar(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
                <Plus className="w-4 h-4" /> Abonar
              </button>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (Number(venta.monto_acta) / Math.max(Number(venta.total), 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      <Modal open={showAbonar} onClose={() => setShowAbonar(false)} title="Registrar Abono">
        <form onSubmit={handleAbonar} className="space-y-4">
          <Input label="Monto del abono (S/)" type="number" step="0.01" value={abonoMonto}
            onChange={e => setAbonoMonto(e.target.value)} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAbonar(false)}>Cancelar</Button>
            <Button type="submit">Registrar Abono</Button>
          </div>
        </form>
      </Modal>

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
      <Modal open={!!imageModal} onClose={() => setImageModal(null)} title="Imagen" size="lg">
        {imageModal && (
          <img src={imageModal} alt="Comprobante" className="w-full h-auto rounded-lg" />
        )}
      </Modal>
    </div>
  );
}
