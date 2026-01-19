// lib/newsletter/db-newsletter.js
// Database queries for newsletter subscriptions (Postgres)

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import pg from 'pg';
const { Pool } = pg;

let pool;

function isNewsletterDbConfigured() {
  return Boolean(
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD
  );
}

function getPool() {
  if (!pool) {
    const connectionConfig = {
      host: process.env.POSTGRES_HOST,
      port: 5432,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
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
