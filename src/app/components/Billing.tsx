import { useEffect, useState } from 'react';
import { DollarSign, Clock, CheckCircle, AlertCircle, X, Pencil, Search } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_MAP = {
  1: { label: 'Pago', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  2: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-700', icon: Clock },
  3: { label: 'Atrasado', class: 'bg-red-100 text-red-700', icon: AlertCircle }
} as const;

type StatusKey = keyof typeof STATUS_MAP;

interface Invoice {
  id: number;
  patientId: number;
  treatmentId: number | null;
  patientName: string;
  treatmentDescricao: string;
  date: string | null;
  valor: number;
  pago: number;
  pendente: number;
  status: StatusKey;
  statusLabel: string;
}

type FilterOption = 'all' | '1' | '2' | '3';

export function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [pagoInput, setPagoInput] = useState('');
  const [statusInput, setStatusInput] = useState<StatusKey>(2);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/invoices`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Invoice[] = await response.json();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar as entradas financeiras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filter === 'all' || String(inv.status) === filter;
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      inv.patientName.toLowerCase().includes(term) ||
      inv.treatmentDescricao.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const totalPago = invoices.filter(inv => inv.status === 1).reduce((s, inv) => s + inv.valor, 0);
  const totalPendente = invoices.filter(inv => inv.status === 2).reduce((s, inv) => s + inv.pendente, 0);
  const totalAtrasado = invoices.filter(inv => inv.status === 3).reduce((s, inv) => s + inv.pendente, 0);

  const openPaymentModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setPagoInput(String(invoice.pago));
    setStatusInput(invoice.status);
    setSaveError(null);
  };

  const handleSavePayment = async () => {
    if (!editingInvoice) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${editingInvoice.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ pago: Number(pagoInput), status: Number(statusInput) })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      setEditingInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Receita Recebida</p>
              <p className="text-2xl text-gray-900 mt-1">{formatCurrency(totalPago)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendente</p>
              <p className="text-2xl text-gray-900 mt-1">{formatCurrency(totalPendente)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Atrasado</p>
              <p className="text-2xl text-gray-900 mt-1">{formatCurrency(totalAtrasado)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900">Entradas Financeiras</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nome do paciente ou tratamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all', label: 'Tudo' },
              { key: '1', label: 'Pago' },
              { key: '2', label: 'Pendente' },
              { key: '3', label: 'Atrasado' }
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Tratamento</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Pendente</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">Carregando entradas...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-sm text-red-600 text-center">{error}</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">Nenhuma entrada encontrada.</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const statusInfo = STATUS_MAP[invoice.status] ?? STATUS_MAP[2];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.patientName || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.treatmentDescricao || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {invoice.date ? new Date(invoice.date).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.valor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{formatCurrency(invoice.pago)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">{formatCurrency(invoice.pendente)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar pagamento"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setEditingInvoice(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Atualizar Pagamento</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingInvoice.patientName} — {editingInvoice.treatmentDescricao}
                </p>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Total</div>
                  <div className="font-medium">{formatCurrency(editingInvoice.valor)}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Pago atual</div>
                  <div className="font-medium text-green-700">{formatCurrency(editingInvoice.pago)}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Pendente</div>
                  <div className="font-medium text-red-700">{formatCurrency(editingInvoice.pendente)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Valor pago (R$)</label>
                <input
                  type="number"
                  min={0}
                  max={editingInvoice.valor}
                  step="0.01"
                  value={pagoInput}
                  onChange={(e) => setPagoInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(Number(e.target.value) as StatusKey)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>Pago</option>
                  <option value={2}>Pendente</option>
                  <option value={3}>Atrasado</option>
                </select>
              </div>

              {saveError && <div className="text-sm text-red-600">{saveError}</div>}

              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={() => setEditingInvoice(null)} className="px-4 py-2 bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
