import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'dentist' | 'receptionist') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.message || 'Falha ao autenticar');
        setLoading(false);
        return;
      }

      const token = body.token ?? body?.data?.token;
      const user = body.user ?? body?.data?.user ?? {};
      if (token) localStorage.setItem('token', token);

      let role = (user.type as string) || (user.role as string) || (body.role as string) || 'receptionist';
      if (!['admin', 'dentist', 'receptionist'].includes(role)) {
        if (role === 'user' || role === 'reception') role = 'receptionist';
        else if (role === 'doctor') role = 'dentist';
        else role = 'receptionist';
      }

      onLogin(user.name || user.username || username, role as 'admin' | 'dentist' | 'receptionist');
    } catch (err: any) {
      setError(err?.message || 'Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-gray-900 mb-2">Consultório Odontológico</h1>
            <p className="text-sm text-gray-600">Sistema de Gestão</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-700 mb-2">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
