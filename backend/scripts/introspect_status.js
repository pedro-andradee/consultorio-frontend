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
  SELECT 'Status_Agenda' AS TableName, ID, Nome FROM Status_Agenda
  UNION ALL
  SELECT 'Status_Financeiro', ID, Nome FROM Status_Financeiro
  UNION ALL
  SELECT 'Status_Orcamento', ID, Nome FROM Status_Orcamento
  ORDER BY TableName, ID
`;
const result = await pool.request().query(query);
console.table(result.recordset);
await pool.close();
