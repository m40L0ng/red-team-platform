import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Engagements from './pages/Engagements';
import Findings from './pages/Findings';
import TeamCapacity from './pages/TeamCapacity';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/engagements" element={<Engagements />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/team" element={<TeamCapacity />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
