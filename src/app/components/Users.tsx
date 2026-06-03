import { useState, useEffect } from 'react';
import { UserPlus, KeyRound, Trash2, ShieldCheck, X } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface User {
  id: number;
  name: string;
  type: string;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  dentist: 'Dentista',
  receptionist: 'Recepção',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  dentist: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', password: '', confirm: '', type: 'receptionist', isAdmin: false });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [changePwdUser, setChangePwdUser] = useState<User | null>(null);
  const [pwdForm, setPwdForm] = useState({ password: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar usuários');
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (createForm.password !== createForm.confirm) {
      setCreateError('As senhas não coincidem.');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: createForm.name, password: createForm.password, type: createForm.type, isAdmin: createForm.isAdmin }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Erro ao criar usuário');
      setShowCreate(false);
      setCreateForm({ name: '', password: '', confirm: '', type: 'receptionist', isAdmin: false });
      load();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.password !== pwdForm.confirm) {
      setPwdError('As senhas não coincidem.');
      return;
    }
    if (!pwdForm.password) {
      setPwdError('A nova senha é obrigatória.');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${changePwdUser!.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ password: pwdForm.password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Erro ao alterar senha');
      setChangePwdUser(null);
      setPwdForm({ password: '', confirm: '' });
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${deleteUser.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Erro ao excluir usuário');
      }
      setDeleteUser(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestão de Usuários</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Nenhum usuário cadastrado.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[user.type] ?? user.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isAdmin && (
                      <span className="inline-flex items-center gap-1 text-purple-600 text-xs font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        Sim
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setChangePwdUser(user); setPwdForm({ password: '', confirm: '' }); setPwdError(''); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Alterar senha"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteUser(user)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Novo Usuário" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nome / Usuário <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tipo <span className="text-red-500">*</span></label>
              <select
                value={createForm.type}
                onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="receptionist">Recepção</option>
                <option value="dentist">Dentista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isAdmin"
                type="checkbox"
                checked={createForm.isAdmin}
                onChange={e => setCreateForm(f => ({ ...f, isAdmin: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isAdmin" className="text-sm text-gray-700">Acesso de administrador</label>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Senha <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Confirmar Senha <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={createForm.confirm}
                onChange={e => setCreateForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={createLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {createLoading ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {changePwdUser && (
        <Modal title={`Alterar Senha — ${changePwdUser.name}`} onClose={() => setChangePwdUser(null)}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nova Senha <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={pwdForm.password}
                onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Confirmar Nova Senha <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={pwdForm.confirm}
                onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setChangePwdUser(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={pwdLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {pwdLoading ? 'Salvando...' : 'Salvar Senha'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteUser && (
        <Modal title="Excluir Usuário" onClose={() => setDeleteUser(null)}>
          <p className="text-sm text-gray-700 mb-6">
            Tem certeza que deseja excluir o usuário <strong>{deleteUser.name}</strong>? Essa ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteUser(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
