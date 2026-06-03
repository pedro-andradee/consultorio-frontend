import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { Patients } from './components/Patients';
import { Calendar } from './components/Calendar';
import { Billing } from './components/Billing';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { Users } from './components/Users';
import { UserCircle, CalendarDays, DollarSign, BarChart3, LogOut, UsersRound } from 'lucide-react';

function getStoredSession(): { username: string; role: string } | null {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(getStoredSession);
  const isAuthenticated = currentUser !== null;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (username: string, role: 'admin' | 'dentist' | 'receptionist') => {
    setCurrentUser({ username, role });
    navigate('/pacientes');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/pacientes');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'dentist': return 'Dentista';
      case 'receptionist': return 'Recepção';
      default: return role;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const canAccessBilling = currentUser.role === 'admin' || currentUser.role === 'dentist';
  const canAccessReports = currentUser.role === 'admin';

  const navLink = (path: string) =>
    location.pathname === path
      ? 'flex items-center gap-2 px-3 py-4 border-b-2 border-blue-500 text-blue-600 transition-colors'
      : 'flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';

  return (
    <div className="size-full bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Consultório Odontológico</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="text-gray-900">{currentUser.username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {getRoleDisplayName(currentUser.role)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button onClick={() => navigate('/pacientes')} className={navLink('/pacientes')}>
              <UserCircle className="w-5 h-5" />
              Pacientes
            </button>
            <button onClick={() => navigate('/agenda')} className={navLink('/agenda')}>
              <CalendarDays className="w-5 h-5" />
              Agenda
            </button>
            {canAccessBilling && (
              <button onClick={() => navigate('/financeiro')} className={navLink('/financeiro')}>
                <DollarSign className="w-5 h-5" />
                Financeiro
              </button>
            )}
            {canAccessReports && (
              <button onClick={() => navigate('/relatorios')} className={navLink('/relatorios')}>
                <BarChart3 className="w-5 h-5" />
                Relatórios
              </button>
            )}
            {canAccessReports && (
              <button onClick={() => navigate('/usuarios')} className={navLink('/usuarios')}>
                <UsersRound className="w-5 h-5" />
                Usuários
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/pacientes" replace />} />
          <Route path="/pacientes" element={<Patients role={currentUser.role} />} />
          <Route path="/agenda" element={<Calendar />} />
          <Route path="/financeiro" element={canAccessBilling ? <Billing /> : <Navigate to="/pacientes" replace />} />
          <Route path="/relatorios" element={canAccessReports ? <Reports /> : <Navigate to="/pacientes" replace />} />
          <Route path="/usuarios" element={canAccessReports ? <Users /> : <Navigate to="/pacientes" replace />} />
          <Route path="*" element={<Navigate to="/pacientes" replace />} />
        </Routes>
      </main>
    </div>
  );
}
