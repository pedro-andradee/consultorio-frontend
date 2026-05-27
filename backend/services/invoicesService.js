import * as db from '../db.js';
import Invoice from '../entities/invoice.js';

const SELECT_INVOICE = `
    SELECT f.ID as id, f.ID_Paciente as patientId, f.ID_Tratamento as treatmentId,
           p.Nome as patientName, t.Descricao as treatmentDescricao,
           f.Data as date, f.Valor as valor, f.Pago as pago,
           f.Pendente as pendente, f.Status as status
    FROM Financeiro f
    LEFT JOIN dbo.Pacientes p ON f.ID_Paciente = p.ID
    LEFT JOIN Tratamento t ON f.ID_Tratamento = t.ID
`;

export default class InvoicesService {
    constructor() {}

    async pool() {
        if (typeof db.getPool === 'function') return db.getPool();
        if (db.default && typeof db.default.getPool === 'function') return db.default.getPool();
        if (db.default) return db.default;
        return db;
    }

    async findAll(filter = {}) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('patientId', filter.patientId || null)
            .input('status', filter.status ? Number(filter.status) : null)
            .query(`
                ${SELECT_INVOICE}
                WHERE (@patientId IS NULL OR f.ID_Paciente = @patientId)
                  AND (@status IS NULL OR f.Status = @status)
                ORDER BY f.Data DESC, f.ID DESC
            `);
        return result.recordset.map(r => new Invoice(r));
    }

    async findById(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query(`${SELECT_INVOICE} WHERE f.ID = @id`);
        const row = result.recordset[0];
        return row ? new Invoice(row) : null;
    }

    async create(data) {
        const pool = await this.pool();
        const { patientId, treatmentId = null, valor = 0, pago = 0, status = 2 } = data;
        const pendente = Number(valor) - Number(pago);
        const today = new Date().toISOString().split('T')[0];

        const result = await pool.request()
            .input('patientId', patientId)
            .input('treatmentId', treatmentId)
            .input('date', today)
            .input('valor', Number(valor))
            .input('pago', Number(pago))
            .input('pendente', pendente)
            .input('status', Number(status))
            .query(`
                INSERT INTO Financeiro (ID_Paciente, ID_Tratamento, Data, Valor, Pago, Pendente, Status)
                OUTPUT INSERTED.ID
                VALUES (@patientId, @treatmentId, @date, @valor, @pago, @pendente, @status)
            `);
        return await this.findById(result.recordset[0].ID);
    }

    async updatePayment(id, data) {
        const pool = await this.pool();
        const current = await this.findById(id);
        if (!current) return null;

        const pago = data.pago !== undefined ? Number(data.pago) : current.pago;
        const valor = current.valor;
        const pendente = valor - pago;

        let status = data.status !== undefined ? Number(data.status) : current.status;
        if (data.status === undefined) {
            if (pendente <= 0) status = 1;
            else if (pago > 0) status = 2;
        }

        await pool.request()
            .input('id', id)
            .input('pago', pago)
            .input('pendente', pendente)
            .input('status', status)
            .query(`
                UPDATE Financeiro SET Pago = @pago, Pendente = @pendente, Status = @status
                WHERE ID = @id
            `);
        return await this.findById(id);
    }

    async delete(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM Financeiro OUTPUT DELETED.ID WHERE ID = @id');
        return result.recordset.length > 0;
    }
}
