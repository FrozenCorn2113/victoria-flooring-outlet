// lib/chat/db-chat.js
// Database queries for chat functionality
// Uses Postgres (Supabase)

// Workaround for Supabase SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import pg from 'pg';
const { Pool } = pg;

// Create a connection pool
let pool;

function getPool() {
  if (!pool) {
    // Use POSTGRES_URL connection string if available, otherwise fall back to individual vars
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    const connectionConfig = connectionString
      ? {
          connectionString,
          ssl: {
            rejectUnauthorized: false
          },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      : {
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

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

// Helper to run SQL queries
async function query(text, params) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result;
}

/**
 * Create a new conversation
 */
export async function createConversation({ sessionId, context = {} }) {
  const result = await query(
    `INSERT INTO conversations (session_id, context, status, assigned_to)
     VALUES ($1, $2, 'active', 'ai')
     RETURNING id, session_id, status, created_at`,
    [sessionId, JSON.stringify(context)]
  );
  return result.rows[0];
}

/**
 * Get conversation by session ID
 */
export async function getConversationBySessionId(sessionId) {
  const result = await query(
    `SELECT * FROM conversations WHERE session_id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

/**
 * Get conversation by ID
 */
export async function getConversationById(id) {
  const result = await query(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(sessionId, status, additionalFields = {}) {
  const result = await query(
    `UPDATE conversations
     SET
       status = $1::varchar,
       requires_human = COALESCE($2::boolean, requires_human),
       assigned_to = COALESCE($3::varchar, assigned_to),
       sentiment = COALESCE($4::varchar, sentiment),
       resolved_at = CASE WHEN $1::varchar = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
     WHERE session_id = $5::varchar
     RETURNING *`,
    [
      status,
      additionalFields.requiresHuman ?? null,
      additionalFields.assignedTo ?? null,
      additionalFields.sentiment ?? null,
      sessionId
    ]
  );
  return result.rows[0];
}

/**
 * Update lead contact fields for a conversation
 */
export async function updateConversationLead(sessionId, { email = null, phone = null, name = null } = {}) {
  try {
    const result = await query(
      `UPDATE conversations
       SET
         customer_email = COALESCE($1::varchar, customer_email),
         customer_phone = COALESCE($2::varchar, customer_phone),
         customer_name = COALESCE($3::varchar, customer_name),
         lead_captured_at = CASE
           WHEN ($1 IS NOT NULL OR $2 IS NOT NULL OR $3 IS NOT NULL)
           THEN COALESCE(lead_captured_at, CURRENT_TIMESTAMP)
           ELSE lead_captured_at
         END
       WHERE session_id = $4::varchar
       RETURNING *`,
      [email, phone, name, sessionId]
    );
    return result.rows[0];
  } catch (error) {
    // Fallback if lead columns are missing: store in context JSON
    if (error.code !== '42703') {
      throw error;
    }

    const result = await query(
      `UPDATE conversations
       SET context = jsonb_set(
         COALESCE(context, '{}'::jsonb),
         '{lead}',
         jsonb_strip_nulls(jsonb_build_object('name', $1, 'email', $2, 'phone', $3)),
         true
       )
       WHERE session_id = $4::varchar
       RETURNING *`,
      [name, email, phone, sessionId]
    );
    return result.rows[0];
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage({ conversationId, sender, message, metadata = {} }) {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender, message, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING id, sender, message, created_at, metadata`,
    [conversationId, sender, message, JSON.stringify(metadata)]
  );

  // Update conversation's updated_at timestamp
  await query(
    `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0];
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId, limit = 50, offset = 0) {
  const result = await query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return result.rows;
}

/**
 * Get message count for a conversation
 */
export async function getMessageCount(conversationId) {
  const result = await query(
    `SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1`,
    [conversationId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Create or update a chat session
 */
export async function upsertChatSession({ sessionId, conversationId, pusherChannel }) {
  const result = await query(
    `INSERT INTO chat_sessions (session_id, conversation_id, pusher_channel, is_active, last_activity)
     VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
     ON CONFLICT (session_id)
     DO UPDATE SET
       last_activity = CURRENT_TIMESTAMP,
       is_active = true
     RETURNING *`,
    [sessionId, conversationId, pusherChannel]
  );
  return result.rows[0];
}

/**
 * Get active chat session
 */
export async function getChatSession(sessionId) {
  const result = await query(
    `SELECT * FROM chat_sessions WHERE session_id = $1 AND is_active = true`,
    [sessionId]
  );
  return result.rows[0] || null;
}

/**
 * Deactivate a chat session
 */
export async function deactivateChatSession(sessionId) {
  await query(
    `UPDATE chat_sessions SET is_active = false WHERE session_id = $1`,
    [sessionId]
  );
}

/**
 * Get all active conversations (for admin dashboard)
 */
export async function getActiveConversations(limit = 50) {
  const result = await query(
    `SELECT
       c.*,
       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
       (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
       (SELECT sender FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender
     FROM conversations c
     WHERE c.status != 'resolved'
     ORDER BY
       CASE WHEN c.requires_human = true THEN 0 ELSE 1 END,
       c.updated_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get conversations needing attention
 */
export async function getConversationsNeedingAttention() {
  const result = await query(
    `SELECT
       c.*,
       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
       (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM conversations c
     WHERE c.requires_human = true AND c.status != 'resolved'
     ORDER BY c.updated_at DESC`,
    []
  );
  return result.rows;
}

/**
 * Get conversation with messages (full detail for admin)
 */
export async function getConversationWithMessages(sessionId) {
  const conversation = await getConversationBySessionId(sessionId);
  if (!conversation) return null;

  const messages = await getMessages(conversation.id);

  return {
    ...conversation,
    messages
  };
}

/**
 * Get chat statistics
 */
export async function getChatStats() {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active' OR status = 'ai_handling') as active_count,
       COUNT(*) FILTER (WHERE requires_human = true AND status != 'resolved') as needs_attention_count,
       COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at > NOW() - INTERVAL '24 hours') as resolved_today,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
       COUNT(*) FILTER (WHERE assigned_to = 'ai' AND status != 'resolved') as ai_handling_count,
       COUNT(*) FILTER (WHERE assigned_to = 'ty' AND status != 'resolved') as ty_handling_count
     FROM conversations`,
    []
  );
  return result.rows[0];
}

/**
 * Close stale conversations (auto-cleanup)
 */
export async function closeStaleConversations(minutesInactive = 30) {
  const result = await query(
    `UPDATE conversations
     SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
     WHERE status IN ('active', 'ai_handling')
     AND updated_at < NOW() - INTERVAL '${minutesInactive} minutes'
     RETURNING id, session_id`,
    []
  );
  return result.rows;
}
