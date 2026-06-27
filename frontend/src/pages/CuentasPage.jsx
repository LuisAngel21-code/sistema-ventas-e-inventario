import { useState, useEffect } from 'react';
import { cuentasAPI } from '../services/api';
import { CreditCard, Plus, DollarSign, Calendar, Building2 } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagoModal, setPagoModal] = useState(null);
  const [filtro, setFiltro] = useState('activa');
  const [form, setForm] = useState({ proveedor: '', concepto: '', monto_total: '', cuotas: 1, fecha_inicio: '', periodicidad: 'semanal' });
  const [pagoForm, setPagoForm] = useState({ nro_cuota: 1, monto: '', metodo_pago: 'efectivo', observaciones: '' });
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    cuentasAPI.getAll({ estado: filtro === 'todas' ? '' : filtro }).then(setCuentas).catch(console.error).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [filtro]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await cuentasAPI.create({ ...form, monto_total: Number(form.monto_total), cuotas: Number(form.cuotas) });
      showToast(res.message, 'success');
      setModalOpen(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handlePago(e) {
    e.preventDefault();
    try {
      const res = await cuentasAPI.pagarCuota(pagoModal.id, { ...pagoForm, monto: Number(pagoForm.monto) });
      showToast(res.message, 'success');
      setPagoModal(null);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  function abrirPago(cuenta) {
    const sigCuota = Number(cuenta.cuotas_pagadas) + 1;
    setPagoForm({ nro_cuota: sigCuota, monto: cuenta.monto_cuota, metodo_pago: 'efectivo', observaciones: '' });
    setPagoModal(cuenta);
  }

  const deudaTotal = cuentas.filter(c => c.estado === 'activa').reduce((acc, c) => acc + Number(c.monto_total) - (Number(c.monto_cuota) * Number(c.cuotas_pagadas)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Cuentas por Pagar</h1><p className="page-subtitle">Proveedores a crédito</p></div>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>Nueva Cuenta</Button>
      </div>

      <div className="flex gap-2 items-center">
        {['activa', 'pagada', 'todas'].map(est => (
          <button key={est} onClick={() => setFiltro(est)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === est ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {est === 'activa' ? 'Activas' : est === 'pagada' ? 'Pagadas' : 'Todas'}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-auto">Deuda total: <strong className="text-red-600">S/ {deudaTotal.toFixed(2)}</strong></span>
      </div>

      <div className="card-page overflow-hidden">
        {loading ? <Spinner className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/50">
                <th className="table-header">Proveedor</th>
                <th className="table-header">Concepto</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header text-right">Cuotas</th>
                <th className="table-header text-right">Cuota</th>
                <th className="table-header text-right">Pagado</th>
                <th className="table-header text-right">Deuda</th>
                <th className="table-header text-center">Estado</th>
                <th className="table-header text-center">Acción</th>
              </tr></thead>
              <tbody>
                {cuentas.map(c => {
                  const total = Number(c.monto_total);
                  const cuota = Number(c.monto_cuota);
                  const pagadas = Number(c.cuotas_pagadas);
                  const deuda = total - (cuota * pagadas);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell font-medium">{c.proveedor}</td>
                      <td className="table-cell text-gray-500">{c.concepto}</td>
                      <td className="table-cell text-right">S/ {total.toFixed(2)}</td>
                      <td className="table-cell text-right">{c.cuotas}</td>
                      <td className="table-cell text-right">S/ {cuota.toFixed(2)}</td>
                      <td className="table-cell text-right text-emerald-600">{pagadas}/{c.cuotas}</td>
                      <td className="table-cell text-right font-semibold text-red-600">S/ {deuda.toFixed(2)}</td>
                      <td className="table-cell text-center">{c.estado === 'pagada' ? <Badge variant="success">Pagada</Badge> : <Badge variant="warning">Activa</Badge>}</td>
                      <td className="table-cell text-center">
                        {c.estado === 'activa' && <Button size="sm" onClick={() => abrirPago(c)}>Pagar</Button>}
                      </td>
                    </tr>
                  );
                })}
                {cuentas.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-gray-400"><CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />No hay cuentas</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Cuenta" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Proveedor *" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} required />
            <Input label="Concepto *" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto Total *" type="number" step="0.01" value={form.monto_total} onChange={e => setForm({ ...form, monto_total: e.target.value })} required />
            <Input label="Nro. Cuotas" type="number" min="1" value={form.cuotas} onChange={e => setForm({ ...form, cuotas: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha Inicio *" type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} required />
            <div className="space-y-1.5">
              <label className="input-label">Periodicidad</label>
              <select className="input-field" value={form.periodicidad} onChange={e => setForm({ ...form, periodicidad: e.target.value })}>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar Cuenta</Button>
          </div>
        </form>
      </Modal>

      {pagoModal && (
        <Modal open={!!pagoModal} onClose={() => setPagoModal(null)} title={`Pagar cuota - ${pagoModal.proveedor}`}>
          <form onSubmit={handlePago} className="space-y-4">
            <p className="text-sm text-gray-600">Pagando cuota #{pagoForm.nro_cuota} de {pagoModal.cuotas}</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nro. Cuota" type="number" value={pagoForm.nro_cuota} onChange={e => setPagoForm({ ...pagoForm, nro_cuota: e.target.value })} />
              <Input label="Monto *" type="number" step="0.01" value={pagoForm.monto} onChange={e => setPagoForm({ ...pagoForm, monto: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label className="input-label">Método de pago</label>
              <select className="input-field" value={pagoForm.metodo_pago} onChange={e => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </div>
            <Input label="Observaciones" value={pagoForm.observaciones} onChange={e => setPagoForm({ ...pagoForm, observaciones: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setPagoModal(null)}>Cancelar</Button>
              <Button type="submit">Registrar Pago</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
