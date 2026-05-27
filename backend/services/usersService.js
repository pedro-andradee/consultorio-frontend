import bcrypt from 'bcrypt';
import * as db from '../db.js';
import User from '../entities/user.js';

export default class UsersService {
    constructor() {}

    async pool() {
        if (typeof db.getPool === 'function') return db.getPool();
        if (db.default && typeof db.default.getPool === 'function') return db.default.getPool();
        if (db.default) return db.default;
        return db;
    }

    async findAll() {
        const pool = await this.pool();
        const result = await pool.request().query('SELECT ID as id, Nome as name, Senha as password, Tipo as type, IsAdmin as isAdmin FROM Usuarios');
        return result.recordset.map(r => new User(r));
    }

    async findById(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('SELECT ID as id, Nome as name, Senha as password, Tipo as type, IsAdmin as isAdmin FROM Usuarios WHERE ID = @id');
        const row = result.recordset[0];
        return row ? new User(row) : null;
    }

    async findByUsername(username) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('username', username)
            .query('SELECT ID as id, Nome as name, Senha as password, Tipo as type, IsAdmin as isAdmin FROM Usuarios WHERE Nome = @username');
        const row = result.recordset[0];
        return row ? new User(row) : null;
    }

    async validateUser(username, password) {
        const user = await this.findByUsername(username);
        if (!user) return null;
        const hash = user.password || user.passwordHash || user.hash;
        const ok = hash ? await bcrypt.compare(password, hash) : false;
        return ok ? user : null;
    }

    async createUser(name, hashedPassword, type = 'receptionist', isAdmin = false) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('name', name)
            .input('password', hashedPassword)
            .input('type', type)
            .input('isAdmin', isAdmin)
            .query(`
                INSERT INTO Usuarios (Nome, Senha, Tipo, IsAdmin)
                OUTPUT INSERTED.ID, INSERTED.Nome, INSERTED.Senha, INSERTED.Tipo, INSERTED.IsAdmin
                VALUES (@name, @password, @type, @isAdmin)
            `);
        const row = result.recordset[0];
        return new User({ id: row.ID, name: row.Nome, password: row.Senha, type: row.Tipo, isAdmin: row.IsAdmin });
    }

    async update(id, data) {
        const pool = await this.pool();
        const { name, type, isAdmin } = data;
        let setParts = [];
        let inputs = { id };

        if (name !== undefined) {
            setParts.push('Nome = @name');
            inputs.name = name;
        }
        if (type !== undefined) {
            setParts.push('Tipo = @type');
            inputs.type = type;
        }
        if (isAdmin !== undefined) {
            setParts.push('IsAdmin = @isAdmin');
            inputs.isAdmin = isAdmin;
        }

        if (setParts.length === 0) return await this.findById(id);

        const q = `
            UPDATE Usuarios SET ${setParts.join(', ')}
            OUTPUT INSERTED.ID, INSERTED.Nome, INSERTED.Senha, INSERTED.Tipo, INSERTED.IsAdmin
            WHERE ID = @id
        `;
        const request = pool.request().input('id', id);
        Object.keys(inputs).forEach(key => {
            if (key !== 'id') request.input(key, inputs[key]);
        });
        const result = await request.query(q);
        const row = result.recordset[0];
        return row ? new User({ id: row.ID, name: row.Nome, password: row.Senha, type: row.Tipo, isAdmin: row.IsAdmin }) : null;
    }

    async delete(id) {
        const pool = await this.pool();
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM Usuarios OUTPUT DELETED.ID WHERE ID = @id');
        return result.recordset.length > 0;
    }
}
