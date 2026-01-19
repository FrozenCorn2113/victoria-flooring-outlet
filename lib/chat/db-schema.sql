-- Victoria Flooring Outlet - Live Chat Database Schema
-- Run this in your Vercel Postgres (Neon) database

-- conversations table: Track each chat session
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active', -- active, ai_handling, needs_attention, human_handling, resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  context JSONB, -- Page URL, product viewed, cart contents
  sentiment VARCHAR(50), -- positive, neutral, negative, urgent
  requires_human BOOLEAN DEFAULT false,
  assigned_to VARCHAR(50) DEFAULT 'ai', -- 'ai' or 'ty'
  tags TEXT[], -- ['pricing_question', 'installation', 'product_inquiry']
  -- Lead capture fields
  lead_captured_at TIMESTAMP,
  marketing_consent BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMP
);

-- messages table: Store all chat messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'customer', 'ai', 'ty'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB -- AI confidence, product references, etc.
);

-- chat_sessions table: Active session tracking
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  pusher_channel VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON chat_sessions(is_active, last_activity);

-- Indexes for lead capture
CREATE INDEX IF NOT EXISTS idx_conversations_lead_captured ON conversations(lead_captured_at) WHERE lead_captured_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_email ON conversations(customer_email) WHERE customer_email IS NOT NULL;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
