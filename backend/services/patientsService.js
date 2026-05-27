import * as db from '../db.js';
import Patient from '../entities/patient.js';

export default class PatientsService {
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
            SELECT ID, Nome, Telefone, Email, Data_Nascimento, Origem, Observacoes
            FROM dbo.Pacientes
            WHERE (@name IS NULL OR Nome LIKE '%' + @name + '%')
              AND (@origin IS NULL OR Origem LIKE '%' + @origin + '%')
        `;
        const result = await pool.request()
            .input('name', filter.name || null)
            .input('origin', filter.origin || null)
            .query(q);
        return result.recordset.map(r => new Patient(r));
    }

    async findById(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query(`
                SELECT p.ID, p.Nome, p.Telefone, p.Email, p.Data_Nascimento, p.Origem, p.Observacoes,
                       (SELECT MAX(a.Data) FROM Agenda a WHERE a.ID_Paciente = p.ID) AS ultima_consulta
                FROM dbo.Pacientes p
                WHERE p.ID = @id
            `);
        const row = result.recordset[0];
        if (!row) return null;
        const patient = new Patient(row);
        patient.lastVisit = row.ultima_consulta ?? null;
        return patient;
    }

    async create(data) {
        const pool = await this.pool();
        const Nome = data.name;
        const Telefone = data.phone;
        const Email = data.email;
        const Data_Nascimento = data.dateOfBirth ?? data.dob ?? null;
        const Origem = data.origin ?? null;
        const Observacoes = data.observations ?? null;

        const result = await pool.request()
            .input('Nome', Nome)
            .input('Telefone', Telefone)
            .input('Email', Email)
            .input('Data_Nascimento', Data_Nascimento)
            .input('Origem', Origem)
            .input('Observacoes', Observacoes)
            .query(`
                INSERT INTO dbo.Pacientes (Nome, Telefone, Email, Data_Nascimento, Origem, Observacoes)
                OUTPUT INSERTED.*
                VALUES (@Nome, @Telefone, @Email, @Data_Nascimento, @Origem, @Observacoes)
            `);
        return new Patient(result.recordset[0]);
    }

    async update(id, data) {
        const pool = await this.pool();
        const Nome = data.name;
        const Telefone = data.phone;
        const Email = data.email;
        const Data_Nascimento = data.dateOfBirth ?? data.dob ?? null;
        const Origem = data.origin;
        const Observacoes = data.observations;
        const result = await pool.request()
            .input('id', id)
            .input('Nome', Nome)
            .input('Telefone', Telefone)
            .input('Email', Email)
            .input('Data_Nascimento', Data_Nascimento)
            .input('Origem', Origem)
            .input('Observacoes', Observacoes)
            .query(`
                UPDATE dbo.Pacientes SET
                    Nome = ISNULL(@Nome, Nome),
                    Telefone = ISNULL(@Telefone, Telefone),
                    Email = ISNULL(@Email, Email),
                    Data_Nascimento = ISNULL(@Data_Nascimento, Data_Nascimento),
                    Origem = ISNULL(@Origem, Origem),
                    Observacoes = ISNULL(@Observacoes, Observacoes)
                OUTPUT INSERTED.*
                WHERE ID = @id
            `);
        const row = result.recordset[0];
        return row ? new Patient(row) : null;
    }

    async delete(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM dbo.Pacientes OUTPUT DELETED.* WHERE ID = @id');
        return result.recordset[0] ? true : false;
    }
}
