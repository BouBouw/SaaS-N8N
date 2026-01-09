import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApiKeysPage from './pages/ApiKeysPage';
import AdminPage from './pages/AdminPage';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';
import Make from './pages/Make';
import Resources from './pages/Resources';
import Library from './pages/Library';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="documentation" element={<Documentation />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="make" element={<Make />} />
            <Route path="resources" element={<Resources />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
