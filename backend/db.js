import sql from 'mssql';

const getConfig = () => {
  return {
    server: process.env.DB_SERVER ,
    database: process.env.DB_DATABASE ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 1433),
    options: {
      encrypt: (process.env.DB_ENCRYPT || 'true') === 'true',
      trustServerCertificate: (process.env.DB_TRUST_SERVER_CERTIFICATE || 'false') === 'true'
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
};

let pool = null;
let poolConnect = null;

const getPool = async () => {
  if (pool === null) {
    const config = getConfig();
    console.log('Connecting to:', { server: config.server, database: config.database });
    pool = new sql.ConnectionPool(config);
    poolConnect = pool.connect();
  }
  return poolConnect;
};

export { sql, getPool, getConfig };
