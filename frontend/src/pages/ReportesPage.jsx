import { useState, useEffect } from 'react';
import { pagosAPI, reportesAPI } from '../services/api';
import { FileText, Download, Calendar, User } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function ReportesPage() {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ persona_id: '', fuente: '', desde: '', hasta: '' });
  const { showToast } = useToast();

  useEffect(() => {
    pagosAPI.personal()
      .then(p => { setPersonal(p); setLoading(false); })
      .catch(console.error);
  }, []);

  async function descargar(tipo, params = {}) {
    let url;
    if (tipo === 'trabajador') {
      url = reportesAPI.trabajador(params.id, params.fuente, params.desde || '', params.hasta || '');
    } else if (tipo === 'general') {
      url = reportesAPI.general(params.desde || '', params.hasta || '');
    } else {
      url = reportesAPI.inventario();
    }

    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type');

      if (contentType && contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${tipo}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const data = await res.json();
        showToast(data.error || 'No hay datos disponibles', 'warning');
      }
    } catch (err) {
      showToast('Error al descargar el reporte', 'error');
    }
  }

  const grouped = personal.reduce((acc, p) => {
    const key = p.cargo === 'Vendedor' ? 'Vendedores' : 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const reportes = [
    {
      title: 'Reporte por Trabajador',
      desc: 'Ventas detalladas, comisiones y sobreprecio',
      icon: User,
      color: 'bg-blue-50 text-blue-600',
      tipo: 'trabajador',
      params: { id: filtros.persona_id, fuente: filtros.fuente, desde: filtros.desde, hasta: filtros.hasta },
      extra: (
        <div className="space-y-1.5">
          <label className="input-label">Seleccionar persona</label>
          <select className="input-field"
            value={filtros.persona_id ? `${filtros.fuente}-${filtros.persona_id}` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [fuente, id] = val.split('-');
                setFiltros({ ...filtros, persona_id: id, fuente });
              } else {
                setFiltros({ ...filtros, persona_id: '', fuente: '' });
              }
            }}>
            <option value="">Seleccionar...</option>
            {Object.entries(grouped).map(([grupo, personas]) => (
              <optgroup key={grupo} label={grupo}>
                {personas.map(p => (
                  <option key={`${p.cargo}-${p.id}`} value={`${p.cargo === 'Vendedor' ? 'vendedor' : 'trabajador'}-${p.id}`}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      ),
    },
    {
      title: 'Reporte General',
      desc: 'Resumen global de ventas, comisiones y pagos',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600',
      tipo: 'general',
      params: { desde: filtros.desde, hasta: filtros.hasta },
    },
    {
      title: 'Reporte de Inventario',
      desc: 'Stock actual y movimientos de inventario',
      icon: FileText,
      color: 'bg-violet-50 text-violet-600',
      tipo: 'inventario',
      params: {},
    },
  ];

  if (loading) return <Spinner size="lg" className="h-64" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reportes</h1>
        <p className="page-subtitle">Generación de reportes y balances</p>
      </div>

      <div className="card-page p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Desde</label>
            <input type="date" className="input-field" value={filtros.desde}
              onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div>
            <label className="input-label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Hasta</label>
            <input type="date" className="input-field" value={filtros.hasta}
              onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {reportes.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.tipo} className="stat-card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3">{r.extra}</div>
              <Button className="mt-4 w-full"
                onClick={() => descargar(r.tipo, r.params)}
                disabled={r.tipo === 'trabajador' && !filtros.persona_id}
                icon={Download}>
                Descargar PDF
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
