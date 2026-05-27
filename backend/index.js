import express from 'express';
console.log('Express imported');
import cors from 'cors';
console.log('CORS imported');
import dotenv from 'dotenv';
console.log('Dotenv imported');
import path from 'path';
console.log('Path imported');
import { fileURLToPath } from 'url';
console.log('fileURLToPath imported');
import * as dbModule from './db.js';

import * as patientsModule from './routes/patients.js';
const patientsRouter = patientsModule.default ?? patientsModule.router ?? patientsModule.patientsRouter ?? patientsModule;

import * as appointmentsModule from './routes/appointments.js';
const appointmentsRouter = appointmentsModule.default ?? appointmentsModule.router ?? appointmentsModule.appointmentsRouter ?? appointmentsModule;

import * as invoicesModule from './routes/invoices.js';
const invoicesRouter = invoicesModule.default ?? invoicesModule.router ?? invoicesModule.invoicesRouter ?? invoicesModule;

import * as usersModule from './routes/users.js';
const usersRouter = usersModule.default ?? usersModule.router ?? usersModule.usersRouter ?? usersModule;

import * as treatmentsModule from './routes/treatments.js';
const treatmentsRouter = treatmentsModule.default ?? treatmentsModule.router ?? treatmentsModule;

import * as reportsModule from './routes/reports.js';
const reportsRouter = reportsModule.default ?? reportsModule.router ?? reportsModule;

console.log('Routers imported (resolved resiliently)');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('__dirname set');
dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Dotenv config loaded');

const app = express();
console.log('Express app created');
app.use(cors());
console.log('CORS middleware added');
app.use(express.json());
console.log('JSON middleware added');

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Consultório API está funcionando.' });
});
console.log('Root route added');

app.use('/api/patients', patientsRouter);
console.log('Patients route added');
app.use('/api/appointments', appointmentsRouter);
console.log('Appointments route added');
app.use('/api/invoices', invoicesRouter);
console.log('Invoices route added');
app.use('/api/users', usersRouter);
console.log('Users route added');
app.use('/api/treatments', treatmentsRouter);
console.log('Treatments route added');
app.use('/api/reports', reportsRouter);
console.log('Reports route added');

async function getPool() {
    if (typeof dbModule.getPool === 'function') return dbModule.getPool();
    if (dbModule.default && typeof dbModule.default.getPool === 'function') return dbModule.default.getPool();
    if (dbModule.default) return dbModule.default;
    return dbModule;
}

async function ensureTables(pool) {
    const queries = [
`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
CREATE TABLE dbo.Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(150) NOT NULL UNIQUE,
  passwordHash NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NULL,
  role NVARCHAR(50) NOT NULL DEFAULT 'user',
  blocked BIT NOT NULL DEFAULT 0,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
END`,

`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pacientes' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
CREATE TABLE dbo.Pacientes (
  ID INT IDENTITY(1,1) PRIMARY KEY,
  Nome NVARCHAR(255) NOT NULL,
  Telefone NVARCHAR(50) NULL,
  Email NVARCHAR(255) NULL,
  Data_Nascimento DATE NULL,
  Origem NVARCHAR(100) NULL,
  Observacoes NVARCHAR(MAX) NULL
);
END`,

`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
CREATE TABLE dbo.Appointments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  patientId INT NOT NULL,
  doctorId INT NULL,
  date DATETIME2 NULL,
  status NVARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes NVARCHAR(MAX) NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Appointments_Patients FOREIGN KEY (patientId) REFERENCES dbo.Patients(id)
);
END`,

`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
CREATE TABLE dbo.Invoices (
  id INT IDENTITY(1,1) PRIMARY KEY,
  patientId INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  dueDate DATE NULL,
  paid BIT NOT NULL DEFAULT 0,
  items NVARCHAR(MAX) NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Invoices_Patients FOREIGN KEY (patientId) REFERENCES dbo.Patients(id)
);
END`
    ];

    for (const q of queries) {
        try {
            await pool.request().batch(q);
            console.log('Checked/created table.');
        } catch (err) {
            console.error('Erro ao criar/verificar tabela:', err.message);
            throw err;
        }
    }
}

(async () => {
    try {
        const pool = await getPool();
        if (!pool) throw new Error('Não foi possível obter pool de conexão ao banco');
        console.log('DB pool obtained, ensuring tables...');
        await ensureTables(pool);
        console.log('All tables ensured.');

        const port = Number(process.env.PORT || 4000);
        console.log(`Starting server on port ${port}`);
        app.listen(port, () => {
            console.log(`Backend rodando em http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Startup error:', err);
        process.exit(1);
    }
})();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
