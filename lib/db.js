// lib/db.js
// Shared Postgres pool helper

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import pg from 'pg';
const { Pool } = pg;

let pool;

function buildConnectionConfig() {
  if (process.env.POSTGRES_URL) {
    return {
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    database: process.env.POSTGRES_DATABASE || 'postgres',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      ...buildConnectionConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  const result = await client.query(text, params);
  return result;
}
