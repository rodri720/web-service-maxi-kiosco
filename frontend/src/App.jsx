import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Cash from './pages/Cash';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
// Eliminado: import Configuracion from './pages/Configuracion';

const ProtectedRoute = ({ children }) => children; // temporal sin auth

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="ventas" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="caja" element={<ProtectedRoute><Cash /></ProtectedRoute>} />
        <Route path="productos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        {/* Ruta de configuración eliminada */}
      </Route>
    </Routes>
  );
}