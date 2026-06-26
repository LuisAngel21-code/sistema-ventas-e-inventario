import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, productosAPI } from '../services/api';
import { Plus, Trash2, Save, ArrowLeft, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';

export default function NuevaVenta() {
  const navigate = useNavigate();
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, precio_final: '' }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      vendedoresAPI.getAll(),
      productosAPI.getAll(true),
    ]).then(([vends, prods]) => {
      setVendedores(vends);
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
    if (!vendedorId) return alert('Seleccione un vendedor');
    if (items.some(i => !i.producto_id)) return alert('Complete todos los productos');

    setSaving(true);
    try {
      const payload = {
        vendedor_id: Number(vendedorId),
        productos: items.map(i => ({
          producto_id: Number(i.producto_id),
          cantidad: Number(i.cantidad),
          precio_final: Number(i.precio_final),
        })),
      };
      const result = await ventasAPI.create(payload);
      navigate(`/ventas/${result.id}`);
    } catch (err) {
      alert(err.message);
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-page p-5">
          <Select
            label="Vendedor"
            placeholder="Seleccionar vendedor..."
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            options={vendedores.map(v => ({
              value: v.id,
              label: `${v.nombre} ${v.apellido}`,
            }))}
          />
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
