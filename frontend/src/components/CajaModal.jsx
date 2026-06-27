import { useState, useEffect } from 'react';
import { cajaAPI } from '../services/api';
import { DollarSign } from 'lucide-react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import { useToast } from '../context/ToastContext';

export default function CajaModal({ open, onClose, tipo, editData, onSave }) {
  const [form, setForm] = useState({
    tipo_pago: 'efectivo',
    nro_comprobante: '',
    descripcion: '',
    monto: '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (editData) {
      setForm({
        tipo_pago: editData.tipo_pago || 'efectivo',
        nro_comprobante: editData.nro_comprobante || '',
        descripcion: editData.descripcion || '',
        monto: editData.monto || '',
      });
    } else {
      setForm({ tipo_pago: 'efectivo', nro_comprobante: '', descripcion: '', monto: '' });
    }
  }, [editData, open]);

  const isEditing = !!editData;
  const title = isEditing
    ? `Editar ${editData?.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}`
    : `${tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso'}`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.monto || Number(form.monto) <= 0) {
      return showToast('Ingrese un monto válido', 'warning');
    }
    setSaving(true);
    try {
      if (isEditing) {
        await cajaAPI.actualizar(editData.id, {
          tipo: editData.tipo,
          tipo_pago: form.tipo_pago,
          nro_comprobante: form.nro_comprobante,
          descripcion: form.descripcion,
          monto: Number(form.monto),
        });
        showToast('Movimiento actualizado', 'success');
      } else {
        const res = await cajaAPI.registrar({
          tipo,
          tipo_pago: form.tipo_pago,
          nro_comprobante: form.nro_comprobante,
          descripcion: form.descripcion,
          monto: Number(form.monto),
        });
        showToast(res.message, 'success');
      }
      setForm({ tipo_pago: 'efectivo', nro_comprobante: '', descripcion: '', monto: '' });
      onSave();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia_bcp', label: 'Transferencia BCP' },
    { value: 'transferencia_interbank', label: 'Transferencia Interbank' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'qulqui', label: 'Qulqui' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de pago"
          value={form.tipo_pago}
          onChange={(e) => setForm({ ...form, tipo_pago: e.target.value })}
          options={metodosPago}
        />
        <Input
          label="Nro. comprobante"
          placeholder="Opcional"
          value={form.nro_comprobante}
          onChange={(e) => setForm({ ...form, nro_comprobante: e.target.value })}
        />
        <div className="space-y-1.5">
          <label className="input-label">Descripción</label>
          <textarea
            className="input-field min-h-[80px]"
            placeholder="Describe el movimiento..."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </div>
        <Input
          label="Monto (S/)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          icon={DollarSign}
          value={form.monto}
          onChange={(e) => setForm({ ...form, monto: e.target.value })}
          required
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>
            {isEditing ? 'Guardar Cambios' : tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
