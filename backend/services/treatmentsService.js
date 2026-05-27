import * as db from '../db.js';

export default class TreatmentsService {
    constructor() {}

    async pool() {
        if (typeof db.getPool === 'function') return db.getPool();
        if (db.default && typeof db.default.getPool === 'function') return db.default.getPool();
        if (db.default) return db.default;
        return db;
    }

    async findByPatientId(patientId) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('patientId', patientId)
            .query(`
                SELECT t.ID as id, t.ID_Paciente as patientId, t.ID_Dentista as dentistId,
                       d.Nome as dentistName, t.ID_Agenda as agendaId,
                       CAST(a.Data AS DATE) as agendaDate,
                       t.Descricao as descricao, t.Detalhes as detalhes,
                       t.Dente as dente, t.Valor as valor
                FROM Tratamento t
                LEFT JOIN Dentistas d ON t.ID_Dentista = d.ID
                LEFT JOIN Agenda a ON t.ID_Agenda = a.ID
                WHERE t.ID_Paciente = @patientId
                ORDER BY t.ID DESC
            `);
        return result.recordset;
    }

    async create(data) {
        const pool = await this.pool();
        const { patientId, dentistId, agendaId = null, descricao, detalhes = null, dente = null, valor = null } = data;
        const result = await pool.request()
            .input('patientId', patientId)
            .input('dentistId', dentistId)
            .input('agendaId', agendaId)
            .input('descricao', descricao)
            .input('detalhes', detalhes)
            .input('dente', dente)
            .input('valor', valor)
            .query(`
                INSERT INTO Tratamento (ID_Paciente, ID_Dentista, ID_Agenda, Descricao, Detalhes, Dente, Valor)
                OUTPUT INSERTED.ID
                VALUES (@patientId, @dentistId, @agendaId, @descricao, @detalhes, @dente, @valor)
            `);
        const insertedId = result.recordset[0].ID;

        const valorNum = valor !== null ? Number(valor) : 0;
        const today = new Date().toISOString().split('T')[0];
        await pool.request()
            .input('patientId', patientId)
            .input('treatmentId', insertedId)
            .input('date', today)
            .input('valor', valorNum)
            .input('pendente', valorNum)
            .query(`
                INSERT INTO Financeiro (ID_Paciente, ID_Tratamento, Data, Valor, Pago, Pendente, Status)
                VALUES (@patientId, @treatmentId, @date, @valor, 0, @pendente, 2)
            `);

        const rows = await this.findByPatientId(patientId);
        return rows.find(r => r.id === insertedId) || null;
    }

    async update(id, data) {
        const pool = await this.pool();
        const { dentistId, agendaId = null, descricao, detalhes = null, dente = null, valor = null } = data;

        const check = await pool.request()
            .input('id', id)
            .query('SELECT ID_Paciente as patientId FROM Tratamento WHERE ID = @id');
        const row = check.recordset[0];
        if (!row) return null;

        await pool.request()
            .input('id', id)
            .input('dentistId', dentistId)
            .input('agendaId', agendaId)
            .input('descricao', descricao)
            .input('detalhes', detalhes)
            .input('dente', dente)
            .input('valor', valor)
            .query(`
                UPDATE Tratamento SET
                    ID_Dentista = @dentistId,
                    ID_Agenda = @agendaId,
                    Descricao = @descricao,
                    Detalhes = @detalhes,
                    Dente = @dente,
                    Valor = @valor
                WHERE ID = @id
            `);

        const rows = await this.findByPatientId(row.patientId);
        return rows.find(r => r.id === Number(id)) || null;
    }

    async delete(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM Tratamento OUTPUT DELETED.ID WHERE ID = @id');
        return result.recordset.length > 0;
    }
}
