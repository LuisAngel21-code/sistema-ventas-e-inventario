import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/ventas', label: 'Ventas', icon: '💰' },
  { path: '/ventas/nueva', label: 'Nueva Venta', icon: '➕' },
  { path: '/productos', label: 'Productos', icon: '🛏️' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/vendedores', label: 'Vendedores', icon: '👤' },
  { path: '/reportes', label: 'Reportes', icon: '📄' },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-900 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Tienda de Camas y Colchones</h1>
          </div>
          <span className="text-indigo-200 text-sm hidden sm:block">Sistema de Ventas e Inventario</span>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block bg-indigo-800 text-white w-64 flex-shrink-0`}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 lg:p-6 bg-gray-100 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
