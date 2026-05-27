import * as db from '../db.js';

export default class ReportsService {
    constructor() {}

    async pool() {
        if (typeof db.getPool === 'function') return db.getPool();
        if (db.default && typeof db.default.getPool === 'function') return db.default.getPool();
        if (db.default) return db.default;
        return db;
    }

    async treatmentsCount() {
        const pool = await this.pool();
        const result = await pool.request().query(`
            SELECT t.Descricao AS descricao, COUNT(*) AS quantidade
            FROM Tratamento t
            GROUP BY t.Descricao
            ORDER BY quantidade DESC
        `);
        return result.recordset;
    }

    async treatmentsRevenue() {
        const pool = await this.pool();
        const result = await pool.request().query(`
            SELECT t.Descricao AS descricao,
                   SUM(f.Valor) AS receita_total,
                   SUM(f.Pago)  AS recebido
            FROM Financeiro f
            JOIN Tratamento t ON f.ID_Tratamento = t.ID
            GROUP BY t.Descricao
            ORDER BY receita_total DESC
        `);
        return result.recordset;
    }

    async treatmentsCost() {
        const pool = await this.pool();
        const result = await pool.request().query(`
            SELECT t.Descricao AS descricao,
                   AVG(CAST(t.Valor AS FLOAT))     AS valor_medio,
                   AVG(CAST(f.Pago AS FLOAT))      AS pago_medio,
                   AVG(CAST(f.Pendente AS FLOAT))  AS pendente_medio
            FROM Tratamento t
            LEFT JOIN Financeiro f ON f.ID_Tratamento = t.ID
            WHERE t.Valor IS NOT NULL
            GROUP BY t.Descricao
            ORDER BY valor_medio DESC
        `);
        return result.recordset.map(r => ({
            descricao: r.descricao,
            valor_medio: Number((r.valor_medio ?? 0).toFixed(2)),
            pago_medio: Number((r.pago_medio ?? 0).toFixed(2)),
            pendente_medio: Number((r.pendente_medio ?? 0).toFixed(2)),
            margem_pct: r.valor_medio > 0
                ? Number(((r.pago_medio / r.valor_medio) * 100).toFixed(1))
                : 0
        }));
    }

    async patientProfiles() {
        const pool = await this.pool();
        const result = await pool.request().query(`
            SELECT t.Descricao AS descricao,
                   COUNT(DISTINCT t.ID_Paciente) AS total_pacientes,
                   AVG(CAST(DATEDIFF(YEAR, p.Data_Nascimento, GETDATE()) AS FLOAT)) AS idade_media,
                   COUNT(CASE WHEN DATEDIFF(YEAR, p.Data_Nascimento, GETDATE()) < 18  THEN 1 END) AS faixa_menor18,
                   COUNT(CASE WHEN DATEDIFF(YEAR, p.Data_Nascimento, GETDATE()) BETWEEN 18 AND 35 THEN 1 END) AS faixa_18_35,
                   COUNT(CASE WHEN DATEDIFF(YEAR, p.Data_Nascimento, GETDATE()) BETWEEN 36 AND 55 THEN 1 END) AS faixa_36_55,
                   COUNT(CASE WHEN DATEDIFF(YEAR, p.Data_Nascimento, GETDATE()) > 55  THEN 1 END) AS faixa_mais55
            FROM Tratamento t
            JOIN dbo.Pacientes p ON t.ID_Paciente = p.ID
            GROUP BY t.Descricao
            ORDER BY total_pacientes DESC
        `);
        return result.recordset.map(r => ({
            descricao: r.descricao,
            total_pacientes: r.total_pacientes,
            idade_media: r.idade_media != null ? Number(r.idade_media.toFixed(1)) : null,
            faixas: [
                { faixa: '< 18',  quantidade: r.faixa_menor18 },
                { faixa: '18–35', quantidade: r.faixa_18_35  },
                { faixa: '36–55', quantidade: r.faixa_36_55  },
                { faixa: '> 55',  quantidade: r.faixa_mais55  }
            ]
        }));
    }

    async returnRate() {
        const pool = await this.pool();

        const result = await pool.request().query(`
            SELECT
                p.ID   AS patientId,
                p.Nome AS patientName,
                COUNT(a.ID)              AS total_consultas,
                MAX(a.Data)              AS ultima_consulta,
                DATEDIFF(DAY, MAX(a.Data), GETDATE()) AS dias_sem_retorno
            FROM dbo.Pacientes p
            JOIN Agenda a ON a.ID_Paciente = p.ID
            GROUP BY p.ID, p.Nome
        `);

        const rows = result.recordset;
        const total = rows.length;
        const retornaram = rows.filter(r => r.dias_sem_retorno <= 90);
        const naoRetornaram = rows
            .filter(r => r.dias_sem_retorno > 90)
            .sort((a, b) => b.dias_sem_retorno - a.dias_sem_retorno);

        return {
            total_pacientes: total,
            pacientes_retorno: retornaram.length,
            pacientes_sem_retorno: naoRetornaram.length,
            taxa_retorno_pct: total > 0
                ? Number(((retornaram.length / total) * 100).toFixed(1))
                : 0,
            alerta: naoRetornaram.map(r => ({
                patientId: r.patientId,
                patientName: r.patientName,
                total_consultas: r.total_consultas,
                ultima_consulta: r.ultima_consulta,
                dias_sem_retorno: r.dias_sem_retorno
            }))
        };
    }

    async abandonment() {
        const pool = await this.pool();

        const result = await pool.request().query(`
            SELECT
                COALESCE(t.Descricao, a.Descricao, 'Sem descrição') AS descricao,
                s.Nome AS status_nome,
                COUNT(*) AS quantidade
            FROM Agenda a
            JOIN Status_Agenda s ON a.ID_Status = s.ID
            LEFT JOIN Tratamento t ON t.ID_Agenda = a.ID
            WHERE a.IsTratamento = 1 OR t.ID IS NOT NULL
            GROUP BY COALESCE(t.Descricao, a.Descricao, 'Sem descrição'), s.Nome
            ORDER BY descricao, quantidade DESC
        `);

        const CANCEL_PATTERNS  = ['cancel', 'desmarcad', 'falt', 'não compareceu', 'ausente', 'desistiu', 'remarcad'];
        const AGENDADO_PATTERNS = ['agendad', 'marcad', 'pendente', 'aguardando'];

        const isCancelamento = (s) => CANCEL_PATTERNS.some(p => s.toLowerCase().includes(p));
        const isAgendado      = (s) => AGENDADO_PATTERNS.some(p => s.toLowerCase().includes(p));

        const map = new Map();
        for (const row of result.recordset) {
            if (!map.has(row.descricao)) {
                map.set(row.descricao, { descricao: row.descricao, total: 0, cancelamentos: 0, agendados: 0, statuses: [] });
            }
            const entry = map.get(row.descricao);
            entry.total += row.quantidade;
            entry.statuses.push({ status: row.status_nome, quantidade: row.quantidade });
            if (isCancelamento(row.status_nome))     entry.cancelamentos += row.quantidade;
            else if (isAgendado(row.status_nome))    entry.agendados     += row.quantidade;
        }

        return Array.from(map.values())
            .map(e => ({
                descricao: e.descricao,
                total: e.total,
                cancelamentos: e.cancelamentos,
                agendados: e.agendados,
                realizados: e.total - e.cancelamentos - e.agendados,
                statuses: e.statuses
            }))
            .sort((a, b) => b.cancelamentos - a.cancelamentos || b.total - a.total);
    }
}
