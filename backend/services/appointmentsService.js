import * as db from '../db.js';
import Appointment from '../entities/appointment.js';

export default class AppointmentsService {
    constructor() {}

    async pool() {
        if (typeof db.getPool === 'function') return db.getPool();
        if (db.default && typeof db.default.getPool === 'function') return db.default.getPool();
        if (db.default) return db.default;
        return db;
    }

    async findAll(filter = {}) {
        const pool = await this.pool();
        const q = `
            SELECT a.ID as id, a.ID_Paciente as patientId, p.Nome as patientName,
                   a.ID_Dentista as doctorId, d.Nome as doctorName,
                   CAST(CONVERT(VARCHAR, a.Data, 23) + ' ' + CONVERT(VARCHAR, a.Hora, 108) AS DATETIME2) as date,
                   a.ID_Status as statusId, s.Nome as statusName,
                   a.Descricao as notes, a.Duracao as duracao, a.IsTratamento as isTratamento
            FROM Agenda a
            LEFT JOIN Status_Agenda s ON a.ID_Status = s.ID
            LEFT JOIN dbo.Pacientes p ON a.ID_Paciente = p.ID
            LEFT JOIN Dentistas d ON a.ID_Dentista = d.ID
            WHERE (@patientId IS NULL OR a.ID_Paciente = @patientId)
              AND (@doctorId IS NULL OR a.ID_Dentista = @doctorId)
        `;
        const result = await pool.request()
            .input('patientId', filter.patientId || null)
            .input('doctorId', filter.doctorId || null)
            .query(q);
        return result.recordset.map(r => new Appointment(r));
    }

    async findById(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query(`
                SELECT a.ID as id, a.ID_Paciente as patientId, p.Nome as patientName,
                       a.ID_Dentista as doctorId, d.Nome as doctorName,
                       CAST(CONVERT(VARCHAR, a.Data, 23) + ' ' + CONVERT(VARCHAR, a.Hora, 108) AS DATETIME2) as date,
                       a.ID_Status as statusId, s.Nome as statusName,
                       a.Descricao as notes, a.Duracao as duracao, a.IsTratamento as isTratamento
                FROM Agenda a
                LEFT JOIN Status_Agenda s ON a.ID_Status = s.ID
                LEFT JOIN dbo.Pacientes p ON a.ID_Paciente = p.ID
                LEFT JOIN Dentistas d ON a.ID_Dentista = d.ID
                WHERE a.ID = @id
            `);
        const row = result.recordset[0];
        return row ? new Appointment(row) : null;
    }

    async create(data) {
        const pool = await this.pool();
        const { patientId, doctorId, date, statusId = 1, notes = '', duracao = 60, isTratamento = false } = data;
        const dataDate = new Date(date);
        const result = await pool.request()
            .input('patientId', patientId)
            .input('doctorId', doctorId)
            .input('data', dataDate.toISOString().split('T')[0])
            .input('hora', dataDate.toTimeString().split(' ')[0])
            .input('statusId', statusId)
            .input('notes', notes)
            .input('duracao', duracao)
            .input('isTratamento', isTratamento)
            .query(`
                INSERT INTO Agenda (ID_Paciente, ID_Dentista, Data, Hora, ID_Status, Descricao, Duracao, IsTratamento)
                OUTPUT INSERTED.ID, INSERTED.ID_Paciente, INSERTED.ID_Dentista, INSERTED.Data, INSERTED.Hora, INSERTED.ID_Status, INSERTED.Descricao, INSERTED.Duracao, INSERTED.IsTratamento
                VALUES (@patientId, @doctorId, @data, @hora, @statusId, @notes, @duracao, @isTratamento)
            `);
        const inserted = result.recordset[0];
        return await this.findById(inserted.ID);
    }

    async update(id, data) {
        const pool = await this.pool();
        const { patientId, doctorId, date, statusId, notes, duracao, isTratamento } = data;
        let setParts = [];
        let inputs = { id };

        if (patientId !== undefined) {
            setParts.push('ID_Paciente = @patientId');
            inputs.patientId = patientId;
        }
        if (doctorId !== undefined) {
            setParts.push('ID_Dentista = @doctorId');
            inputs.doctorId = doctorId;
        }
        if (date !== undefined) {
            const dataDate = new Date(date);
            setParts.push('Data = @data');
            setParts.push('Hora = @hora');
            inputs.data = dataDate.toISOString().split('T')[0];
            inputs.hora = dataDate.toTimeString().split(' ')[0];
        }
        if (statusId !== undefined) {
            setParts.push('ID_Status = @statusId');
            inputs.statusId = statusId;
        }
        if (notes !== undefined) {
            setParts.push('Descricao = @notes');
            inputs.notes = notes;
        }
        if (duracao !== undefined) {
            setParts.push('Duracao = @duracao');
            inputs.duracao = duracao;
        }
        if (isTratamento !== undefined) {
            setParts.push('IsTratamento = @isTratamento');
            inputs.isTratamento = isTratamento;
        }

        if (setParts.length === 0) return await this.findById(id);

        const q = `
            UPDATE Agenda SET ${setParts.join(', ')}
            OUTPUT INSERTED.ID, INSERTED.ID_Paciente, INSERTED.ID_Dentista, INSERTED.Data, INSERTED.Hora, INSERTED.ID_Status, INSERTED.Descricao, INSERTED.Duracao, INSERTED.IsTratamento
            WHERE ID = @id
        `;
        const request = pool.request().input('id', id);
        Object.keys(inputs).forEach(key => {
            if (key !== 'id') request.input(key, inputs[key]);
        });
        const result = await request.query(q);
        const row = result.recordset[0];
        return row ? await this.findById(row.ID) : null;
    }

    async delete(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM Agenda OUTPUT DELETED.ID WHERE ID = @id');
        return result.recordset.length > 0;
    }

    async listDentists() {
        const pool = await this.pool();
        const result = await pool.request()
            .query('SELECT ID as id, Nome as name FROM Dentistas ORDER BY Nome');
        return result.recordset;
    }
}
