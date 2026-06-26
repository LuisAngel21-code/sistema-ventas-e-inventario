const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tienda_camas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

async function getConnection() {
  const client = await pool.connect();
  return {
    query: (text, params = []) => client.query(text, params),
    release: () => client.release(),
  };
}

module.exports = { pool, query, getConnection };
