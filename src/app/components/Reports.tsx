import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, TrendingUp, Calculator, Users, Repeat, XCircle, ArrowLeft, Eye } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

function authHeaders() {
    const token = localStorage.getItem('token');
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function shortLabel(label: string, max = 14) {
    return label.length > max ? label.slice(0, max) + '…' : label;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function useReport<T>(endpoint: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/reports/${endpoint}`, { headers: authHeaders() })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [endpoint]);

    return { data, loading, error };
}

function Card({ title, children }: { title: string; kiq?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
            {children}
        </div>
    );
}

function Skeleton() {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>;
}

function Err({ msg }: { msg: string }) {
    return <div className="h-32 flex items-center justify-center text-red-500 text-sm">{msg}</div>;
}

function KIQ01() {
    const { data, loading, error } = useReport<{ descricao: string; quantidade: number }[]>('treatments-count');
    return (
        <Card kiq="KIQ 01" title="Tratamentos mais realizados">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="descricao" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} tickFormatter={l => shortLabel(l, 18)} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [v, 'Realizados']} />
                        <Bar dataKey="quantidade" name="Realizados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

function KIQ02() {
    const { data, loading, error } = useReport<{ descricao: string; receita_total: number; recebido: number }[]>('treatments-revenue');
    return (
        <Card kiq="KIQ 02" title="Tratamentos que geram maior receita">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data ?? []} margin={{ top: 4, right: 16, left: 16, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="descricao" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} tickFormatter={l => shortLabel(l, 18)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [fmt(v), 'Valor cobrado']} />
                        <Bar dataKey="receita_total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

type CostRow = { descricao: string; valor_medio: number; pago_medio: number; pendente_medio: number; margem_pct: number };
function KIQ0304() {
    const { data, loading, error } = useReport<CostRow[]>('treatments-cost');
    return (
        <Card kiq="KIQ 03 + 04" title="Custo médio e margem de recebimento por procedimento">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : (
                <div className="space-y-4">
                    <div className="flex gap-4 text-xs mb-1">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />Valor médio cobrado</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />Pago médio</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data ?? []} margin={{ top: 4, right: 16, left: 16, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="descricao" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" tickFormatter={l => shortLabel(l)} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Bar dataKey="valor_medio" name="Valor médio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="pago_medio" name="Pago médio" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <th className="px-3 py-2 text-left">Procedimento</th>
                                    <th className="px-3 py-2 text-right">Valor médio</th>
                                    <th className="px-3 py-2 text-right">Pago médio</th>
                                    <th className="px-3 py-2 text-right">Margem recebida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data ?? []).map(r => (
                                    <tr key={r.descricao} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-900">{r.descricao}</td>
                                        <td className="px-3 py-2 text-right">{fmt(r.valor_medio)}</td>
                                        <td className="px-3 py-2 text-right text-green-700">{fmt(r.pago_medio)}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`font-semibold ${r.margem_pct >= 80 ? 'text-green-600' : r.margem_pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {r.margem_pct}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>
    );
}

type ProfileRow = {
    descricao: string;
    total_pacientes: number;
    idade_media: number | null;
    faixas: { faixa: string; quantidade: number }[];
};
function KIQ05() {
    const { data, loading, error } = useReport<ProfileRow[]>('patient-profiles');
    const [selected, setSelected] = useState(0);
    const row = data?.[selected];

    return (
        <Card kiq="KIQ 05" title="Perfil dos pacientes por tipo de tratamento">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {(data ?? []).map((r, i) => (
                            <button key={r.descricao} onClick={() => setSelected(i)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${i === selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {r.descricao}
                            </button>
                        ))}
                    </div>
                    {row && (
                        <div className="grid md:grid-cols-2 gap-4 items-center">
                            <div className="space-y-2">
                                <div className="bg-gray-50 rounded p-3 flex justify-between">
                                    <span className="text-sm text-gray-500">Total de pacientes</span>
                                    <span className="font-semibold">{row.total_pacientes}</span>
                                </div>
                                <div className="bg-gray-50 rounded p-3 flex justify-between">
                                    <span className="text-sm text-gray-500">Idade média</span>
                                    <span className="font-semibold">{row.idade_media != null ? `${row.idade_media} anos` : 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-2 text-center">Distribuição por faixa etária</p>
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie data={row.faixas} dataKey="quantidade" nameKey="faixa" cx="50%" cy="50%"
                                            outerRadius={60} label={false}>
                                            {row.faixas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [v, 'Pacientes']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                                    {row.faixas.map((f, i) => (
                                        <span key={f.faixa} className="flex items-center gap-1 text-xs text-gray-600">
                                            <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            {f.faixa}: <strong>{f.quantidade}</strong>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

type AlertaRow = { patientId: number; patientName: string; total_consultas: number; ultima_consulta: string; dias_sem_retorno: number };
type ReturnData = {
    total_pacientes: number;
    pacientes_retorno: number;
    pacientes_sem_retorno: number;
    taxa_retorno_pct: number;
    alerta: AlertaRow[];
};
function KIQ06() {
    const { data, loading, error } = useReport<ReturnData>('return-rate');
    const pieData = data ? [
        { name: 'Retornaram (≤ 90 dias)', value: data.pacientes_retorno },
        { name: 'Sem retorno (> 90 dias)', value: data.pacientes_sem_retorno }
    ] : [];

    return (
        <Card kiq="KIQ 06" title="Taxa de retorno dos pacientes">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : data && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-3">
                            <div className="text-center p-6 bg-blue-50 rounded-lg">
                                <div className="text-4xl font-bold text-blue-700">{data.taxa_retorno_pct}%</div>
                                <div className="text-sm text-gray-500 mt-1">Retornaram nos últimos 3 meses</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 rounded p-3 text-center">
                                    <div className="text-2xl font-bold text-green-700">{data.pacientes_retorno}</div>
                                    <div className="text-xs text-gray-500">Retornaram</div>
                                </div>
                                <div className="bg-red-50 rounded p-3 text-center">
                                    <div className="text-2xl font-bold text-red-600">{data.pacientes_sem_retorno}</div>
                                    <div className="text-xs text-gray-500">Sem retorno</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3 text-center text-sm text-gray-500">
                                Total de pacientes com consultas: <span className="font-semibold text-gray-900">{data.total_pacientes}</span>
                            </div>
                        </div>
                        <div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                        outerRadius={80} label={false}>
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip formatter={(v: number) => [v, 'Pacientes']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-1">
                                <span className="flex items-center gap-1 text-xs text-gray-600"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />Retornaram</span>
                                <span className="flex items-center gap-1 text-xs text-gray-600"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />Sem retorno</span>
                            </div>
                        </div>
                    </div>

                    {data.alerta.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-sm font-medium text-red-700">
                                    Alerta — {data.alerta.length} paciente{data.alerta.length > 1 ? 's' : ''} sem retorno há mais de 3 meses
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-red-50 text-gray-500 text-xs uppercase">
                                            <th className="px-3 py-2 text-left">Paciente</th>
                                            <th className="px-3 py-2 text-right">Consultas</th>
                                            <th className="px-3 py-2 text-right">Última consulta</th>
                                            <th className="px-3 py-2 text-right">Dias sem retorno</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.alerta.map(r => (
                                            <tr key={r.patientId} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-gray-900">{r.patientName}</td>
                                                <td className="px-3 py-2 text-right">{r.total_consultas}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {new Date(r.ultima_consulta).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className={`font-semibold ${r.dias_sem_retorno > 180 ? 'text-red-600' : 'text-orange-500'}`}>
                                                        {r.dias_sem_retorno} dias
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

type CancelRow = {
    descricao: string;
    total: number;
    cancelamentos: number;
    agendados: number;
    realizados: number;
    statuses: { status: string; quantidade: number }[];
};
function KIQ07() {
    const { data, loading, error } = useReport<CancelRow[]>('abandonment');
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <Card kiq="KIQ 07" title="Tratamentos com maior taxa de cancelamento / desmarcação">
            {loading ? <Skeleton /> : error ? <Err msg={error} /> : (data ?? []).length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                    Nenhum agendamento de tratamento encontrado na Agenda.
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-4 text-xs mb-1">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" />Cancelados</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="descricao" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} tickFormatter={l => shortLabel(l, 18)} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number, name: string) => [v, name === 'realizados' ? 'Realizados' : name === 'agendados' ? 'Agendados' : 'Cancelados']} />
                            <Bar dataKey="realizados" name="realizados" fill="#3b82f6" stackId="a" />
                            <Bar dataKey="agendados" name="agendados" fill="#f59e0b" stackId="a" />
                            <Bar dataKey="cancelamentos" name="cancelamentos" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <th className="px-3 py-2 text-left">Tratamento</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                    <th className="px-3 py-2 text-right">Realizados</th>
                                    <th className="px-3 py-2 text-right">Agendados</th>
                                    <th className="px-3 py-2 text-right">Cancelados</th>
                                    <th className="px-3 py-2 text-right">Detalhamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data ?? []).map(r => (
                                    <>
                                        <tr key={r.descricao} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-900">{r.descricao}</td>
                                            <td className="px-3 py-2 text-right">{r.total}</td>
                                            <td className="px-3 py-2 text-right text-blue-600">{r.realizados}</td>
                                            <td className="px-3 py-2 text-right text-yellow-600">{r.agendados}</td>
                                            <td className="px-3 py-2 text-right text-red-600">{r.cancelamentos}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    onClick={() => setExpanded(expanded === r.descricao ? null : r.descricao)}
                                                    className={`transition-colors ${expanded === r.descricao ? 'text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                                    title="Ver detalhamento"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                        {expanded === r.descricao && (
                                            <tr key={`${r.descricao}-detail`}>
                                                <td colSpan={6} className="px-6 py-3 bg-gray-50">
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.statuses.map(s => (
                                                            <span key={s.status} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200">
                                                                <span className="font-medium">{s.status}</span>
                                                                <span className="text-gray-500">({s.quantidade})</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>
    );
}

type ReportId = 'kiq01' | 'kiq02' | 'kiq0304' | 'kiq05' | 'kiq06' | 'kiq07';

const REPORT_MENU: { id: ReportId; title: string; description: string; icon: React.ElementType }[] = [
    {
        id: 'kiq01',
        title: 'Tratamentos mais realizados',
        description: 'Quais procedimentos são executados com maior frequência no consultório.',
        icon: BarChart3
    },
    {
        id: 'kiq02',
        title: 'Tratamentos que geram maior receita',
        description: 'Quais tratamentos contribuem mais para o faturamento total.',
        icon: TrendingUp
    },
    {
        id: 'kiq0304',
        title: 'Custo médio e margem por procedimento',
        description: 'Valor médio cobrado e percentual efetivamente recebido por tipo de tratamento.',
        icon: Calculator
    },
    {
        id: 'kiq05',
        title: 'Perfil dos pacientes por tratamento',
        description: 'Distribuição etária e quantidade de pacientes por tipo de procedimento.',
        icon: Users
    },
    {
        id: 'kiq06',
        title: 'Taxa de retorno dos pacientes',
        description: 'Pacientes que retornaram nos últimos 3 meses e alerta dos que não voltaram.',
        icon: Repeat
    },
    {
        id: 'kiq07',
        title: 'Cancelamentos e desmarcações',
        description: 'Quais tratamentos têm maior taxa de cancelamento ou desmarcação na agenda.',
        icon: XCircle
    },
];

export function Reports() {
    const [selected, setSelected] = useState<ReportId | null>(null);

    const current = REPORT_MENU.find(r => r.id === selected);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                {selected && (
                    <button
                        onClick={() => setSelected(null)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {current ? current.title : 'Relatórios'}
                    </h2>
                    {!selected && (
                        <p className="text-sm text-gray-500 mt-0.5">Selecione um relatório para visualizar.</p>
                    )}
                </div>
            </div>

            {!selected && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {REPORT_MENU.map(report => {
                        const Icon = report.icon;
                        return (
                            <button
                                key={report.id}
                                onClick={() => setSelected(report.id)}
                                className="group flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{report.title}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {selected === 'kiq01'   && <KIQ01 />}
            {selected === 'kiq02'   && <KIQ02 />}
            {selected === 'kiq0304' && <KIQ0304 />}
            {selected === 'kiq05'   && <KIQ05 />}
            {selected === 'kiq06'   && <KIQ06 />}
            {selected === 'kiq07'   && <KIQ07 />}
        </div>
    );
}
