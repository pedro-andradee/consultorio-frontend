import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Mail, UserCircle, X, Edit2, Stethoscope, Trash2 } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'Não informado';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface PatientSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  origin?: string | null;
  observations?: string | null;
  lastVisit?: string | null;
  nextAppointment?: string | null;
  quotes?: Quote[];
}

interface Quote {
  id: number;
  procedure: string;
  status: string;
  value: string | number;
  date: string;
}

interface Treatment {
  id: number;
  patientId: number;
  dentistId: number;
  dentistName?: string;
  agendaId?: number | null;
  agendaDate?: string | null;
  descricao: string;
  detalhes?: string | null;
  dente?: number | null;
  valor?: number | null;
}

interface Dentist {
  id: number;
  name: string;
}

interface NewPatient {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  origin: string;
  observations: string;
}

interface PatientAppointment {
  id: number;
  date: string;
}

interface NewTreatment {
  dentistId: string;
  agendaId: string;
  descricao: string;
  detalhes: string;
  dente: string;
  valor: string;
}

interface PatientsProps {
  role: string;
}

export function Patients({ role }: PatientsProps) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatient>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    origin: '',
    observations: ''
  });

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [treatmentError, setTreatmentError] = useState<string | null>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointment[]>([]);
  const [newTreatment, setNewTreatment] = useState<NewTreatment>({
    dentistId: '',
    agendaId: '',
    descricao: '',
    detalhes: '',
    dente: '',
    valor: ''
  });

  const canManageTreatments = role === 'dentist' || role === 'admin';

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'GET',
        headers: authHeaders()
      });
      if (response.status === 401) {
        setError('Não autorizado. Faça login novamente.');
        setPatients([]);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: PatientSummary[] = await response.json();
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar a lista de pacientes.');
    } finally {
      setLoading(false);
    }
  };

  const loadTreatments = async (patientId: number) => {
    setTreatmentsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/treatments?patientId=${patientId}`, {
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Treatment[] = await response.json();
      setTreatments(data);
    } catch (err) {
      console.error(err);
      setTreatments([]);
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const loadPatientAppointments = async (patientId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments?patientId=${patientId}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setPatientAppointments(data.map((a: any) => ({ id: a.id, date: a.date })));
    } catch {
      setPatientAppointments([]);
    }
  };

  const loadDentists = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/appointments/dentists`, {
        headers: authHeaders()
      });
      if (!response.ok) return;
      const data: Dentist[] = await response.json();
      setDentists(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPatients();
    if (canManageTreatments) loadDentists();
  }, []);

  const handleSelectPatient = async (patientId: number) => {
    setDetailLoading(true);
    setTreatments([]);
    try {
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: 'GET',
        headers: authHeaders()
      });
      if (response.status === 401) {
        setError('Não autorizado. Faça login novamente.');
        setSelectedPatient(null);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Patient = await response.json();
      setSelectedPatient(data);
      setError(null);
      await Promise.all([loadTreatments(patientId), loadPatientAppointments(patientId)]);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os detalhes do paciente.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddPatient = () => {
    setNewPatient({ name: '', email: '', phone: '', dateOfBirth: '', origin: '', observations: '' });
    setShowModal(true);
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      setNewPatient({
        name: selectedPatient.name,
        email: selectedPatient.email || '',
        phone: selectedPatient.phone || '',
        dateOfBirth: selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toISOString().split('T')[0] : '',
        origin: selectedPatient.origin || '',
        observations: selectedPatient.observations || ''
      });
      setShowEditModal(true);
    }
  };

  const handleUpdatePatient = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPatient.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setEditing(true);
    try {
      const response = await fetch(`${API_BASE}/api/patients/${selectedPatient?.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newPatient.name,
          email: newPatient.email,
          phone: unformatPhone(newPatient.phone),
          dateOfBirth: newPatient.dateOfBirth || null,
          origin: newPatient.origin,
          observations: newPatient.observations
        })
      });
      if (response.status === 401) { setError('Não autorizado. Faça login novamente.'); return; }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      setShowEditModal(false);
      setError(null);
      await loadPatients();
      if (selectedPatient) await handleSelectPatient(selectedPatient.id);
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar paciente.');
    } finally {
      setEditing(false);
    }
  };

  const handleCreatePatient = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPatient.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newPatient.name,
          email: newPatient.email,
          phone: unformatPhone(newPatient.phone),
          dateOfBirth: newPatient.dateOfBirth || null,
          origin: newPatient.origin,
          observations: newPatient.observations
        })
      });
      if (response.status === 401) { setError('Não autorizado. Faça login novamente.'); return; }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      setShowModal(false);
      setError(null);
      await loadPatients();
    } catch (err) {
      console.error(err);
      setError('Erro ao criar paciente.');
    } finally {
      setCreating(false);
    }
  };

  const emptyTreatmentForm = (): NewTreatment => ({
    dentistId: dentists[0]?.id?.toString() ?? '',
    agendaId: '',
    descricao: '',
    detalhes: '',
    dente: '',
    valor: ''
  });

  const handleOpenTreatmentModal = () => {
    setEditingTreatment(null);
    setNewTreatment(emptyTreatmentForm());
    setTreatmentError(null);
    setShowTreatmentModal(true);
  };

  const handleOpenEditTreatmentModal = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setNewTreatment({
      dentistId: String(treatment.dentistId),
      agendaId: treatment.agendaId ? String(treatment.agendaId) : '',
      descricao: treatment.descricao,
      detalhes: treatment.detalhes ?? '',
      dente: treatment.dente != null ? String(treatment.dente) : '',
      valor: treatment.valor != null ? String(treatment.valor) : ''
    });
    setTreatmentError(null);
    setShowTreatmentModal(true);
  };

  const buildTreatmentPayload = () => ({
    dentistId: Number(newTreatment.dentistId),
    agendaId: newTreatment.agendaId ? Number(newTreatment.agendaId) : null,
    descricao: newTreatment.descricao.trim(),
    detalhes: newTreatment.detalhes.trim() || null,
    dente: newTreatment.dente ? Number(newTreatment.dente) : null,
    valor: newTreatment.valor ? Number(newTreatment.valor) : null
  });

  const handleSaveTreatment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTreatment.descricao.trim() || !newTreatment.dentistId) {
      setTreatmentError('Dentista e descrição são obrigatórios.');
      return;
    }
    setSavingTreatment(true);
    setTreatmentError(null);
    try {
      const isEdit = editingTreatment !== null;
      const url = isEdit
        ? `${API_BASE}/api/treatments/${editingTreatment!.id}`
        : `${API_BASE}/api/treatments`;
      const body = isEdit
        ? buildTreatmentPayload()
        : { patientId: selectedPatient?.id, ...buildTreatmentPayload() };

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const resp = await response.json().catch(() => ({}));
        throw new Error(resp.message || `HTTP ${response.status}`);
      }
      setShowTreatmentModal(false);
      setEditingTreatment(null);
      if (selectedPatient) await loadTreatments(selectedPatient.id);
    } catch (err: any) {
      setTreatmentError(err.message || 'Erro ao salvar tratamento.');
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleDeleteTreatment = async (treatmentId: number) => {
    if (!confirm('Remover este tratamento?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/treatments/${treatmentId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (selectedPatient) await loadTreatments(selectedPatient.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalChange = (key: keyof NewPatient, value: string) => {
    setNewPatient((prev) => ({ ...prev, [key]: value }));
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-gray-900">Lista de Pacientes</h2>
              <button onClick={handleAddPatient} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Busque um paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {loading && <div className="p-4 text-gray-500">Carregando...</div>}
            {!loading && filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedPatient?.id === patient.id ? 'bg-blue-50' : ''}`}
              >
                <div className="text-gray-900">{patient.name}</div>
                <div className="text-sm text-gray-500 mt-1">{patient.phone}</div>
              </button>
            ))}
            {!loading && filteredPatients.length === 0 && (
              <div className="p-4 text-gray-500">Nenhum paciente encontrado.</div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {detailLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando detalhes do paciente...</p>
          </div>
        ) : selectedPatient ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{selectedPatient.name}</h2>
              <button onClick={handleEditPatient} className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-gray-500 mb-4">Informação de Contato</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPatient.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{selectedPatient.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 mb-4">Informações Pessoais</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Data de Nascimento</div>
                      <div className="text-gray-900">
                        {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'Não informado'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Origem</div>
                      <div className="text-gray-900">{selectedPatient.origin ?? 'Não informado'}</div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm text-gray-500 mb-3">Observações</h3>
                  <p className="text-gray-900">
                    {selectedPatient.observations ?? 'Nenhuma observação registrada.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-gray-500">Histórico de Tratamentos</h3>
                  {canManageTreatments && (
                    <button
                      onClick={handleOpenTreatmentModal}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Tratamento
                    </button>
                  )}
                </div>

                {treatmentsLoading ? (
                  <div className="p-4 text-gray-500 text-sm">Carregando tratamentos...</div>
                ) : treatments.length > 0 ? (
                  <div className="space-y-3">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-900 font-medium">{treatment.descricao}</span>
                          </div>
                          {canManageTreatments && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleOpenEditTreatmentModal(treatment)}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                title="Editar tratamento"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTreatment(treatment.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Remover tratamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {treatment.detalhes && (
                          <p className="text-sm text-gray-600 mb-3 ml-6">{treatment.detalhes}</p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-6">
                          {treatment.dente != null && (
                            <div>
                              <div className="text-xs text-gray-500">Dente</div>
                              <div className="text-sm text-gray-900">{treatment.dente}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-500">Valor</div>
                            <div className="text-sm text-gray-900">{formatCurrency(treatment.valor)}</div>
                          </div>
                          {treatment.dentistName && (
                            <div>
                              <div className="text-xs text-gray-500">Dentista</div>
                              <div className="text-sm text-gray-900">{treatment.dentistName}</div>
                            </div>
                          )}
                          {treatment.agendaDate && (
                            <div>
                              <div className="text-xs text-gray-500">Data</div>
                              <div className="text-sm text-gray-900">
                                {new Date(treatment.agendaDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                    Nenhum tratamento registrado.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm text-gray-500 mb-4">Histórico de Orçamentos</h3>
                <div className="space-y-3">
                  {selectedPatient.quotes?.length ? (
                    selectedPatient.quotes.map((quote) => (
                      <div key={quote.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3 gap-3">
                          <div className="text-gray-900">{quote.procedure}</div>
                          <div className={`rounded-full px-2 py-1 text-xs font-semibold ${quote.status === 'Aprovado' ? 'bg-green-100 text-green-700' : quote.status === 'Rejeitado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {quote.status}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-sm text-gray-500">Valor R$</div>
                            <div className="text-gray-900">{quote.value}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Data</div>
                            <div className="text-gray-900">{quote.date}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-500">Nenhum orçamento registrado.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Selecione um paciente para ver detalhes</p>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowEditModal(false)} />
          <form onSubmit={handleUpdatePatient} className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editar Paciente</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nome *</label>
                <input type="text" value={newPatient.name} onChange={(e) => handleModalChange('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input type="email" value={newPatient.email} onChange={(e) => handleModalChange('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Telefone</label>
                  <input type="tel" placeholder="(XX) XXXXX-XXXX" value={formatPhone(newPatient.phone)} onChange={(e) => handleModalChange('phone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Data de nascimento</label>
                  <input type="date" value={newPatient.dateOfBirth} onChange={(e) => handleModalChange('dateOfBirth', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Origem</label>
                  <input type="text" value={newPatient.origin} onChange={(e) => handleModalChange('origin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Observações</label>
                <textarea value={newPatient.observations} onChange={(e) => handleModalChange('observations', e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={editing} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {editing ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <form onSubmit={handleCreatePatient} className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Novo Paciente</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nome *</label>
                <input type="text" value={newPatient.name} onChange={(e) => handleModalChange('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input type="email" value={newPatient.email} onChange={(e) => handleModalChange('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Telefone</label>
                  <input type="tel" placeholder="(XX) XXXXX-XXXX" value={formatPhone(newPatient.phone)} onChange={(e) => handleModalChange('phone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Data de nascimento</label>
                  <input type="date" value={newPatient.dateOfBirth} onChange={(e) => handleModalChange('dateOfBirth', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Origem</label>
                  <input type="text" value={newPatient.origin} onChange={(e) => handleModalChange('origin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Observações</label>
                <textarea value={newPatient.observations} onChange={(e) => handleModalChange('observations', e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {creating ? 'Criando...' : 'Criar paciente'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {showTreatmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => { setShowTreatmentModal(false); setEditingTreatment(null); }} />
          <form onSubmit={handleSaveTreatment} className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTreatment ? 'Editar Tratamento' : 'Registrar Tratamento'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Paciente: {selectedPatient?.name}</p>
              </div>
              <button type="button" onClick={() => { setShowTreatmentModal(false); setEditingTreatment(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Dentista *</label>
                <select
                  value={newTreatment.dentistId}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, dentistId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Selecione um dentista</option>
                  {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Agendamento vinculado</label>
                <select
                  value={newTreatment.agendaId}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, agendaId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Nenhum agendamento</option>
                  {patientAppointments.map(a => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Descrição (procedimento) *</label>
                <input
                  type="text"
                  placeholder="Ex: Restauração, Extração, Limpeza Dentária..."
                  value={newTreatment.descricao}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Detalhes</label>
                <textarea
                  placeholder="Detalhes clínicos do tratamento..."
                  value={newTreatment.detalhes}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, detalhes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Dente (nº)</label>
                  <input
                    type="number"
                    placeholder="Ex: 23"
                    min={1}
                    max={48}
                    value={newTreatment.dente}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, dente: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    min={0}
                    step="0.01"
                    value={newTreatment.valor}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {treatmentError && <div className="text-sm text-red-600">{treatmentError}</div>}

              <div className="flex items-center justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setShowTreatmentModal(false); setEditingTreatment(null); }} className="px-4 py-2 bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={savingTreatment} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {savingTreatment ? 'Salvando...' : editingTreatment ? 'Salvar alterações' : 'Registrar Tratamento'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
