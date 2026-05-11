import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/ventas', label: 'Ventas', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5.5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  { path: '/ventas/nueva', label: 'Nueva Venta', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { path: '/productos', label: 'Productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/inventario', label: 'Inventario', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/vendedores', label: 'Vendedores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { path: '/reportes', label: 'Reportes', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight">Mueblería Cams</h1>
          <p className="text-xs text-slate-400 mt-0.5">Sistema de Gestión</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
          v2.0.0
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="hidden sm:inline">Mueblería Cams</span>
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
                A
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
