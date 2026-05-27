import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus, X, Edit2, Trash2 } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface Appointment {
  id: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  time: string;
  duration: number;
  type: string;
  statusId: number;
  statusName: string;
  notes: string;
  duracao: number;
  isTratamento: boolean;
  date: string;
}

interface AppointmentForm {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duracao: number;
  isTratamento: boolean;
  statusId: number;
  notes: string;
}

const STATUS_OPTIONS = [
  { id: 1, label: 'Agendado' },
  { id: 2, label: 'Concluído' },
  { id: 3, label: 'Cancelado' },
];

interface AppointmentFormFieldsProps {
  form: AppointmentForm;
  onChange: (key: keyof AppointmentForm, value: any) => void;
  patients: { id: number; name: string }[];
  dentists: { id: number; name: string }[];
  formError: string | null;
}

function AppointmentFormFields({ form, onChange, patients, dentists, formError }: AppointmentFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Paciente *</label>
        <select
          value={form.patientId}
          onChange={e => onChange('patientId', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">Selecione um paciente</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Dentista</label>
        <select
          value={form.doctorId}
          onChange={e => onChange('doctorId', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Selecione um dentista</option>
          {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Data *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => onChange('date', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Horário *</label>
          <input
            type="time"
            value={form.time}
            onChange={e => onChange('time', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Duração (min)</label>
          <input
            type="number"
            min={5}
            step={5}
            value={form.duracao}
            onChange={e => onChange('duracao', Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select
            value={form.statusId}
            onChange={e => onChange('statusId', Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Tipo</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" checked={!form.isTratamento} onChange={() => onChange('isTratamento', false)} />
            Consulta
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" checked={form.isTratamento} onChange={() => onChange('isTratamento', true)} />
            Tratamento
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Observações</label>
        <textarea
          value={form.notes}
          onChange={e => onChange('notes', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      {formError && <div className="text-sm text-red-600">{formError}</div>}
    </div>
  );
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function toDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function toTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export function Calendar() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [patients, setPatients] = useState<{ id: number; name: string }[]>([]);
  const [dentists, setDentists] = useState<{ id: number; name: string }[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<AppointmentForm>({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    duracao: 60,
    isTratamento: false,
    statusId: 1,
    notes: '',
  });

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/appointments`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawData = await response.json();
      const mappedData = rawData.map((item: any) => ({
        id: item.id,
        patientId: item.patientId,
        patientName: item.patientName,
        doctorId: item.doctorId,
        doctorName: item.doctorName,
        time: item.date,
        duration: item.duracao,
        type: item.isTratamento ? 'Tratamento' : 'Consulta',
        statusId: item.statusId,
        statusName: item.statusName,
        notes: item.notes,
        duracao: item.duracao,
        isTratamento: item.isTratamento,
        date: item.date,
      }));
      setAppointments(mappedData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();

    fetch(`${API_BASE}/api/patients`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setPatients(data.map((p: any) => ({ id: p.id, name: p.name }))))
      .catch(console.error);

    fetch(`${API_BASE}/api/appointments/dentists`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setDentists(data))
      .catch(console.error);
  }, []);

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const daysWithAppointments = new Set(
    appointments
      .filter(apt => {
        const d = new Date(apt.time);
        return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
      })
      .map(apt => new Date(apt.time).getDate())
  );

  const openCreateModal = () => {
    setForm({
      patientId: '',
      doctorId: '',
      date: toDateInput(selectedDay),
      time: '09:00',
      duracao: 60,
      isTratamento: false,
      statusId: 1,
      notes: '',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (apt: Appointment) => {
    const d = new Date(apt.time);
    setForm({
      patientId: String(apt.patientId),
      doctorId: String(apt.doctorId),
      date: toDateInput(d),
      time: toTimeInput(d),
      duracao: apt.duracao,
      isTratamento: apt.isTratamento,
      statusId: apt.statusId,
      notes: apt.notes ?? '',
    });
    setFormError(null);
    setEditingAppointment(apt);
  };

  const handleFormChange = (key: keyof AppointmentForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    patientId: Number(form.patientId),
    doctorId: Number(form.doctorId),
    date: `${form.date}T${form.time}:00`,
    duracao: Number(form.duracao),
    isTratamento: form.isTratamento,
    statusId: form.statusId,
    notes: form.notes,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time) {
      setFormError('Paciente, data e horário são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      setShowCreateModal(false);
      await loadAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.date || !form.time) {
      setFormError('Paciente, data e horário são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${editingAppointment!.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      setEditingAppointment(null);
      await loadAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao atualizar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 min-h-[80px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = isSameDay(dayDate, today);
    const isSelected = isSameDay(dayDate, selectedDay);
    const hasAppointments = daysWithAppointments.has(day);

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => setSelectedDay(dayDate)}
        className={`p-2 border min-h-[80px] w-full text-left transition-colors ${
          isSelected
            ? 'bg-blue-100 border-blue-400'
            : isToday
            ? 'bg-blue-50 border-blue-300'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>
        {hasAppointments && <span className="mt-1 inline-block w-2 h-2 rounded-full bg-blue-500" />}
      </button>
    );
  }

  const selectedDayAppointments = appointments
    .filter(apt => isSameDay(new Date(apt.time), selectedDay))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const isSelectedToday = isSameDay(selectedDay, today);
  const selectedDayLabel = isSelectedToday
    ? 'Hoje'
    : selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const selectedDayDate = selectedDay.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="ml-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Agendar
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm text-gray-600">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg text-gray-900 capitalize">{selectedDayLabel}</h2>
          <p className="text-sm text-gray-500">{selectedDayDate}</p>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="text-sm text-gray-500">Carregando compromissos...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : selectedDayAppointments.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum compromisso para este dia.</div>
          ) : (
            selectedDayAppointments.map(apt => {
              const time = new Date(apt.time);
              return (
                <div key={apt.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="text-gray-900 font-medium">{apt.patientName}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        apt.statusId === 1 ? 'bg-green-100 text-green-700'
                        : apt.statusId === 2 ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {apt.statusName}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(apt)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(apt.id)}
                        disabled={deletingId === apt.id}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 shrink-0" />
                      {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })} ({apt.duration} min)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 shrink-0" />
                      {apt.doctorName}
                    </div>
                    <div className="text-xs text-gray-500">{apt.type}</div>
                    {apt.notes && <div className="text-xs text-gray-500 mt-1">{apt.notes}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowCreateModal(false)} />
          <form onSubmit={handleCreate} className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Novo Agendamento</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AppointmentFormFields form={form} onChange={handleFormChange} patients={patients} dentists={dentists} formError={formError} />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                {saving ? 'Salvando...' : 'Criar agendamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setEditingAppointment(null)} />
          <form onSubmit={handleUpdate} className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editar Agendamento</h3>
              <button type="button" onClick={() => setEditingAppointment(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AppointmentFormFields form={form} onChange={handleFormChange} patients={patients} dentists={dentists} formError={formError} />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" onClick={() => setEditingAppointment(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
