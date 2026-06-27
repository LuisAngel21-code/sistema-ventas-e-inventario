import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { comprasAPI } from '../services/api';
import { Package, Plus, Eye, Calendar, Building2 } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    comprasAPI.getAll()
      .then(setCompras)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="page-subtitle">Historial de compras a proveedores</p>
        </div>
        <Link to="/compras/nueva">
          <Button icon={Plus}>Nueva Compra</Button>
        </Link>
      </div>

      <div className="card-page overflow-hidden">
        {loading ? <Spinner className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="table-header">#</th>
                  <th className="table-header">
                    <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Fecha</div>
                  </th>
                  <th className="table-header">
                    <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Proveedor</div>
                  </th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="table-cell text-gray-400">{c.id}</td>
                    <td className="table-cell text-gray-700">{new Date(c.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="table-cell text-gray-700">{c.proveedor || '—'}</td>
                    <td className="table-cell text-right font-semibold text-gray-900">S/ {Number(c.total).toFixed(2)}</td>
                    <td className="table-cell text-right">
                      <Link to={`/compras/${c.id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>Ver</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {compras.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No hay compras registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
