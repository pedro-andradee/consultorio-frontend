import sql from 'mssql';

const config = {
  server: 'srv-consultorio-us.database.windows.net',
  database: 'Consultorio_Odontologico',
  user: 'consultorio',
  password: 'Y6t5r4e3w2q1',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

const pool = await new sql.ConnectionPool(config).connect();
const query = `
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME IN ('Paciente','Agenda','Financeiro','Orcamento','Status_Agenda','Tratamento','Dentistas','Usuarios')
  ORDER BY TABLE_NAME, ORDINAL_POSITION
`;
const result = await pool.request().query(query);
console.table(result.recordset);
await pool.close();
