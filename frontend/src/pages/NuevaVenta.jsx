import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, productosAPI, trabajadoresAPI } from '../services/api';
import { Plus, Trash2, Save, ArrowLeft, DollarSign, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function NuevaVenta() {
  const navigate = useNavigate();
  const [vendedores, setVendedores] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [esEncargado, setEsEncargado] = useState(false);
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, precio_final: '' }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState('boleta');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [nroComprobante, setNroComprobante] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [voucherFile, setVoucherFile] = useState(null);
  const comprobanteRef = useRef();
  const voucherRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      vendedoresAPI.getAll(),
      productosAPI.getAll(true),
      trabajadoresAPI.getAll().then(t => t.filter(trab => trab.tipo === 'encargado' && trab.activo !== false)),
    ]).then(([vends, prods, encs]) => {
      setVendedores(vends);
      setEncargados(encs);
      setProductos(prods);
      setLoading(false);
    }).catch(console.error);
  }, []);

  function handleProductChange(index, productoId) {
    const prod = productos.find(p => p.id === Number(productoId));
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      producto_id: productoId,
      precio_final: prod ? prod.precio_base : '',
    };
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { producto_id: '', cantidad: 1, precio_final: '' }]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index, field, value) {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  }

  function getTotal() {
    return items.reduce((acc, item) => {
      return acc + (Number(item.precio_final) || 0) * (Number(item.cantidad) || 0);
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vendedorId) return showToast('Seleccione un vendedor', 'warning');
    if (items.some(i => !i.producto_id)) return showToast('Complete todos los productos', 'warning');
    if (!nroComprobante) return showToast('Nro. de comprobante requerido', 'warning');
    if (!comprobanteFile) return showToast('Foto del comprobante requerida', 'warning');
    if (metodoPago !== 'efectivo' && !voucherFile) {
      return showToast('Foto del voucher requerida para este método de pago', 'warning');
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (esEncargado) {
        formData.append('trabajador_id', Number(vendedorId));
      } else {
        formData.append('vendedor_id', Number(vendedorId));
      }
      formData.append('tipo_comprobante', tipoComprobante);
      formData.append('metodo_pago', metodoPago);
      formData.append('nro_comprobante', nroComprobante);
      formData.append('comprobante', comprobanteFile);
      if (voucherFile) formData.append('voucher', voucherFile);
      formData.append('productos', JSON.stringify(items.map(i => ({
        producto_id: Number(i.producto_id),
        cantidad: Number(i.cantidad),
        precio_final: Number(i.precio_final),
      }))));

      const result = await ventasAPI.createWithFiles(formData);
      showToast('Venta registrada exitosamente', 'success');
      navigate(`/ventas/${result.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const prodOptions = productos
    .filter(p => p.activo !== false)
    .map(p => ({
      value: p.id,
      label: `${p.codigo} — ${p.nombre} (S/ ${Number(p.precio_base).toFixed(2)})`,
    }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/ventas')} icon={ArrowLeft}>Volver</Button>
        <div>
          <h1 className="page-title">Nueva Venta</h1>
          <p className="page-subtitle">Registrar una nueva venta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="card-page p-5 space-y-4">
          <h3 className="text-sm font-display font-semibold text-gray-900">Información de pago</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo comprobante *"
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value)}
              options={[
                { value: 'boleta', label: 'Boleta' },
                { value: 'factura', label: 'Factura' },
              ]}
            />
            <Select
              label="Método de pago *"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              options={[
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'transferencia_bcp', label: 'Transferencia BCP' },
                { value: 'transferencia_interbank', label: 'Transferencia Interbank' },
                { value: 'yape', label: 'Yape' },
                { value: 'plin', label: 'Plin' },
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'qulqui', label: 'Qulqui' },
              ]}
            />
          </div>
          <Input
            label="Nro. de comprobante *"
            value={nroComprobante}
            onChange={(e) => setNroComprobante(e.target.value)}
            placeholder="Ej: B001-00012345"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="input-label">Foto del comprobante *</label>
              <div
                onClick={() => comprobanteRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
              >
                <input ref={comprobanteRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setComprobanteFile(e.target.files[0])} />
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">
                  {comprobanteFile ? comprobanteFile.name : 'Click para subir foto'}
                </p>
              </div>
            </div>
            {metodoPago !== 'efectivo' && (
              <div className="space-y-1.5">
                <label className="input-label">Foto del voucher *</label>
                <div
                  onClick={() => voucherRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
                >
                  <input ref={voucherRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setVoucherFile(e.target.files[0])} />
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">
                    {voucherFile ? voucherFile.name : 'Click para subir foto'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card-page p-5">
          <div className="space-y-1.5">
            <label className="input-label">Vendedor / Encargado</label>
            <select className="input-field" value={vendedorId}
              onChange={(e) => {
                const val = e.target.value;
                setEsEncargado(val.startsWith('enc-'));
                setVendedorId(val.replace('enc-', ''));
              }}>
              <option value="">Seleccionar...</option>
              <optgroup label="Vendedores">
                {vendedores.map(v => (
                  <option key={`ven-${v.id}`} value={v.id}>{v.nombre} {v.apellido}</option>
                ))}
              </optgroup>
              {encargados.length > 0 && (
                <optgroup label="Encargados">
                  {encargados.map(v => (
                    <option key={`enc-${v.id}`} value={`enc-${v.id}`}>{v.nombre} {v.apellido}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <div className="card-page p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-semibold text-gray-900">Productos</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addItem} icon={Plus}>
              Agregar
            </Button>
          </div>

          {items.map((item, i) => {
            const prod = productos.find(p => p.id === Number(item.producto_id));
            const sobreprecio = item.precio_final && prod
              ? Number(item.precio_final) - Number(prod.precio_base)
              : 0;

            return (
              <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Select
                    placeholder="Buscar producto..."
                    value={item.producto_id}
                    onChange={(e) => handleProductChange(i, e.target.value)}
                    options={prodOptions}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <Input
                    type="number"
                    step="0.01"
                    value={item.precio_final}
                    onChange={(e) => updateItem(i, 'precio_final', e.target.value)}
                    icon={DollarSign}
                  />
                </div>
                <div className="w-24 pt-1.5 text-right">
                  {sobreprecio > 0 && (
                    <span className="text-xs font-medium text-amber-600">
                      +S/ {sobreprecio.toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="p-2 mt-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="card-page p-5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-display font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-display font-bold text-primary-700">
              S/ {getTotal().toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/ventas')}>Cancelar</Button>
          <Button type="submit" loading={saving} icon={Save}>Registrar Venta</Button>
        </div>
      </form>
    </div>
  );
}
