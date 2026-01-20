// pages/api/debug/test-db.js
// Temporary endpoint to test database connection

// Workaround for Supabase SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import pg from 'pg';
const { Pool } = pg;

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return res.status(500).json({ error: 'POSTGRES_URL not configured' });
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as time');

    // Check if conversations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'conversations'
      ) as exists
    `);

    const conversationsExist = tableCheck.rows[0].exists;

    let conversationCount = null;
    if (conversationsExist) {
      const countResult = await pool.query('SELECT COUNT(*) as count FROM conversations');
      conversationCount = parseInt(countResult.rows[0].count);
    }

    await pool.end();

    return res.status(200).json({
      connected: true,
      serverTime: result.rows[0].time,
      conversationsTableExists: conversationsExist,
      conversationCount,
      message: conversationsExist
        ? `Database connected. ${conversationCount} conversations found.`
        : 'Database connected but conversations table does not exist. Run the schema SQL.'
    });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({
      connected: false,
      error: error.message,
      code: error.code
    });
  }
}
