import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comprasAPI, productosAPI } from '../services/api';
import { Plus, Trash2, Save, ArrowLeft, Building2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function NuevaCompra() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [items, setItems] = useState([{ producto_id: '', cantidad: 1, costo_unitario: '' }]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    productosAPI.getAll(true).then(setProductos).catch(console.error);
  }, []);

  function handleProductChange(index, productoId) {
    const prod = productos.find(p => p.id === Number(productoId));
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      producto_id: productoId,
      costo_unitario: prod ? prod.costo : '',
    };
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { producto_id: '', cantidad: 1, costo_unitario: '' }]);
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
    return items.reduce((acc, item) =>
      acc + (Number(item.costo_unitario) || 0) * (Number(item.cantidad) || 0), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!proveedor) return showToast('Ingrese el nombre del proveedor', 'warning');
    if (items.some(i => !i.producto_id)) return showToast('Complete todos los productos', 'warning');

    setSaving(true);
    try {
      const payload = {
        proveedor,
        productos: items.map(i => ({
          producto_id: Number(i.producto_id),
          cantidad: Number(i.cantidad),
          costo_unitario: Number(i.costo_unitario),
        })),
      };
      const result = await comprasAPI.create(payload);
      showToast('Compra registrada exitosamente. Stock actualizado.', 'success');
      navigate(`/compras/${result.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const prodOptions = productos.map(p => ({
    value: p.id,
    label: `${p.codigo} — ${p.nombre} (S/ ${Number(p.costo).toFixed(2)})`,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/compras')} icon={ArrowLeft}>Volver</Button>
        <div>
          <h1 className="page-title">Nueva Compra</h1>
          <p className="page-subtitle">Registrar entrada de mercadería</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="card-page p-5">
          <Input
            label="Proveedor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            icon={Building2}
            placeholder="Nombre del proveedor"
            required
          />
        </div>

        <div className="card-page p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-semibold text-gray-900">Productos</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addItem} icon={Plus}>
              Agregar
            </Button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Select
                  placeholder="Seleccionar producto..."
                  value={item.producto_id}
                  onChange={(e) => handleProductChange(i, e.target.value)}
                  options={prodOptions}
                />
              </div>
              <div className="w-24">
                <Input type="number" min="1" value={item.cantidad}
                  onChange={(e) => updateItem(i, 'cantidad', e.target.value)} />
              </div>
              <div className="w-36">
                <Input type="number" step="0.01" value={item.costo_unitario}
                  onChange={(e) => updateItem(i, 'costo_unitario', e.target.value)} />
              </div>
              <button type="button" onClick={() => removeItem(i)}
                className="p-2 mt-1 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
          <Button variant="secondary" onClick={() => navigate('/compras')}>Cancelar</Button>
          <Button type="submit" loading={saving} icon={Save}>Registrar Compra</Button>
        </div>
      </form>
    </div>
  );
}
