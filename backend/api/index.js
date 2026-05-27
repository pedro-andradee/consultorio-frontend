import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import patientsRouter from '../routes/patients.js';
import appointmentsRouter from '../routes/appointments.js';
import invoicesRouter from '../routes/invoices.js';
import usersRouter from '../routes/users.js';
import treatmentsRouter from '../routes/treatments.js';
import reportsRouter from '../routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.options('*', cors());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Consultório API está funcionando.' });
});

app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/users', usersRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/reports', reportsRouter);

export default app;
