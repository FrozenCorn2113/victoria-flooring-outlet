// lib/newsletter/db-newsletter.js
// Database queries for newsletter subscriptions (Postgres)

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import pg from 'pg';
const { Pool } = pg;

let pool;

function normalizeEnv(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeHost(rawHost) {
  const host = normalizeEnv(rawHost);
  if (!host) return host;
  if (host.includes('://')) {
    try {
      return new URL(host).hostname;
    } catch {
      return host;
    }
  }
  const hostOnly = host.split('/')[0];
  return hostOnly.split(':')[0];
}

function getNewsletterConnectionString() {
  return normalizeEnv(
    process.env.NEWSLETTER_POSTGRES_URL ||
    process.env.NEWSLETTER_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

function isNewsletterDbConfigured() {
  const connectionString = getNewsletterConnectionString();
  return Boolean(
    connectionString || (
      normalizeEnv(process.env.POSTGRES_HOST) &&
      normalizeEnv(process.env.POSTGRES_USER) &&
      normalizeEnv(process.env.POSTGRES_PASSWORD)
    )
  );
}

function getPool() {
  if (!pool) {
    const connectionString = getNewsletterConnectionString();
    // Debug: log which connection method is being used
    console.log('[Newsletter DB] Connection method:', connectionString ? 'connection string' : 'host/user/pass');
    console.log('[Newsletter DB] NEWSLETTER_POSTGRES_URL set:', Boolean(process.env.NEWSLETTER_POSTGRES_URL));
    console.log('[Newsletter DB] POSTGRES_URL set:', Boolean(process.env.POSTGRES_URL));
    console.log('[Newsletter DB] POSTGRES_HOST:', process.env.POSTGRES_HOST ? 'set' : 'not set');

    const host = normalizeHost(process.env.POSTGRES_HOST);
    const connectionConfig = {
      ...(connectionString ? { connectionString } : {
        host,
        port: 5432,
        database: normalizeEnv(process.env.POSTGRES_DATABASE) || 'postgres',
        user: normalizeEnv(process.env.POSTGRES_USER),
        password: normalizeEnv(process.env.POSTGRES_PASSWORD),
      }),
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(connectionConfig);

    pool.on('error', (err) => {
      console.error('Unexpected newsletter database pool error:', err);
    });
  }

  return pool;
}

async function query(text, params) {
  const poolInstance = getPool();
  const result = await poolInstance.query(text, params);
  return result;
}

export { isNewsletterDbConfigured };

export async function upsertSubscriber({ email, source, provider }) {
  const result = await query(
    `INSERT INTO newsletter_subscribers (email, source, provider, status, subscribed_at)
     VALUES ($1, $2, $3, 'subscribed', CURRENT_TIMESTAMP)
     ON CONFLICT (email)
     DO UPDATE SET
       source = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
       provider = COALESCE(EXCLUDED.provider, newsletter_subscribers.provider),
       status = 'subscribed',
       subscribed_at = CURRENT_TIMESTAMP,
       unsubscribed_at = NULL,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, email, status, subscribed_at, unsubscribed_at`,
    [email, source, provider]
  );

  return result.rows[0];
}

export async function updateSubscriberError(email, message) {
  await query(
    `UPDATE newsletter_subscribers
     SET last_error = $2, updated_at = CURRENT_TIMESTAMP
     WHERE email = $1`,
    [email, message]
  );
}
