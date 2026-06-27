import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ventasAPI, vendedoresAPI, getDownloadUrl } from '../services/api';
import { ShoppingCart, Plus, Search, Trash2, Calendar, User, FileSpreadsheet } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ vendedor_id: '', desde: '', hasta: '' });
  const { showToast } = useToast();
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    setLoading(true);
    const params = {};
    if (filtros.vendedor_id) params.vendedor_id = filtros.vendedor_id;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;

    Promise.all([
      ventasAPI.getAll(params),
      vendedoresAPI.getAll(),
    ]).then(([v, vends]) => {
      setVentas(v);
      setVendedores(vends);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function eliminarVenta(id) {
    try {
      await ventasAPI.remove(id);
      setVentas(ventas.filter(v => v.id !== id));
      setDeleteId(null);
      showToast('Venta eliminada. Stock restaurado.', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Gestión de ventas registradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.open(getDownloadUrl('/api/exportes/ventas'), '_blank')} icon={FileSpreadsheet}>Excel</Button>
          <Link to="/ventas/nueva">
            <Button icon={Plus}>Nueva Venta</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card-page p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="input-label">Vendedor</label>
            <select
              className="input-field"
              value={filtros.vendedor_id}
              onChange={(e) => setFiltros({ ...filtros, vendedor_id: e.target.value })}
            >
              <option value="">Todos</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Desde</label>
            <input type="date" className="input-field" value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Hasta</label>
            <input type="date" className="input-field" value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button onClick={load} icon={Search} className="w-full">Filtrar</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-page overflow-hidden">
        {loading ? <Spinner className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="table-header">#</th>
                  <th className="table-header">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha</div>
                  </th>
                  <th className="table-header">
                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Vendedor</div>
                  </th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, i) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="table-cell text-gray-400">{v.id}</td>
                    <td className="table-cell text-gray-700">{new Date(v.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="table-cell text-gray-700">{v.vendedor_nombre} {v.vendedor_apellido}</td>
                    <td className="table-cell text-right font-semibold text-gray-900">S/ {Number(v.total).toFixed(2)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/ventas/${v.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(v.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar Venta">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar esta venta? El stock se restaurará automáticamente.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => eliminarVenta(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
