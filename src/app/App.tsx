import { useState } from 'react';
import { Patients } from './components/Patients';
import { Calendar } from './components/Calendar';
import { Billing } from './components/Billing';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { UserCircle, CalendarDays, DollarSign, BarChart3, LogOut } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'patients' | 'calendar' | 'billing' | 'reports'>('patients');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  const handleLogin = (username: string, role: 'admin' | 'dentist' | 'receptionist') => {
    setIsAuthenticated(true);
    setCurrentUser({ username, role });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('patients');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'dentist':
        return 'Dentista';
      case 'receptionist':
        return 'Recepção';
      default:
        return role;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="size-full bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Consultório Odontológico</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="text-gray-900">{currentUser?.username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {getRoleDisplayName(currentUser?.role || '')}
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
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${activeTab === 'patients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <UserCircle className="w-5 h-5" />
              Pacientes
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CalendarDays className="w-5 h-5" />
              Agenda
            </button>
            {(currentUser?.role === 'admin' || currentUser?.role === 'dentist') && (
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <DollarSign className="w-5 h-5" />
                Financeiro
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <BarChart3 className="w-5 h-5" />
                Relatórios
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'patients' && <Patients role={currentUser?.role ?? 'receptionist'} />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'billing' && <Billing />}
        {activeTab === 'reports' && currentUser?.role === 'admin' && <Reports />}
      </main>
    </div>
  );
}
