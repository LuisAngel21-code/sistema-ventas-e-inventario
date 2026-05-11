import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VentasPage from './pages/VentasPage';
import NuevaVenta from './pages/NuevaVenta';
import VentaDetalle from './pages/VentaDetalle';
import ProductosPage from './pages/ProductosPage';
import InventarioPage from './pages/InventarioPage';
import VendedoresPage from './pages/VendedoresPage';
import ReportesPage from './pages/ReportesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/ventas/nueva" element={<NuevaVenta />} />
        <Route path="/ventas/:id" element={<VentaDetalle />} />
        <Route path="/productos" element={<ProductosPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/vendedores" element={<VendedoresPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
