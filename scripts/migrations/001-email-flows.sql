-- 001-email-flows.sql
-- Email flows, segmentation, abandoned carts, CASL consent, deal access control
-- Idempotent: safe to run multiple times

-- ============================================================
-- 1. CASL Consent Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS email_consents (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  consent_type TEXT NOT NULL,        -- 'express' | 'implied_purchase' | 'implied_inquiry'
  consent_source TEXT NOT NULL,      -- 'subscribe_form' | 'checkout' | 'next_week_preview' | 'deal_closed_page'
  consent_text TEXT NOT NULL,        -- exact wording shown to user at time of consent
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Allow re-consent from same source after withdrawal
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_consents_unique
  ON email_consents (email, consent_type, consent_source)
  WHERE withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_consents_email ON email_consents(email);

-- ============================================================
-- 2. Abandoned Carts
-- ============================================================

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  cart_snapshot JSONB NOT NULL,
  deal_id TEXT,
  deal_ends_at TIMESTAMPTZ,
  postal_code TEXT,
  shipping_zone TEXT,
  cart_total INTEGER,                -- cents
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'reminded_1' | 'reminded_2' | 'purchased' | 'expired'
  stripe_session_id TEXT,
  reminder_1_sent_at TIMESTAMPTZ,
  reminder_2_sent_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_active
  ON abandoned_carts(status, created_at)
  WHERE status NOT IN ('purchased', 'expired');
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_stripe
  ON abandoned_carts(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- ============================================================
-- 3. Deal Timers (server-authoritative)
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_timers (
  id SERIAL PRIMARY KEY,
  weekly_deal_id INTEGER NOT NULL REFERENCES weekly_deals(id) ON DELETE CASCADE,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Vancouver',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(weekly_deal_id)
);

-- ============================================================
-- 4. Deal Access Control (hard-gate early access)
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_access (
  id SERIAL PRIMARY KEY,
  weekly_deal_id INTEGER NOT NULL REFERENCES weekly_deals(id) ON DELETE CASCADE,
  subscriber_visible_at TIMESTAMPTZ NOT NULL,  -- Sunday midnight PT
  public_visible_at TIMESTAMPTZ NOT NULL,      -- Monday midnight PT
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(weekly_deal_id)
);

-- ============================================================
-- 5. Alter newsletter_subscribers (add segmentation fields)
-- ============================================================

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT FALSE;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS first_purchase_at TIMESTAMPTZ;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS consent_type TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS consent_source TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS mailerlite_subscriber_id TEXT;

-- ============================================================
-- 6. Alter newsletter_campaigns (add campaign types)
-- ============================================================

ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'sneak_peek';
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS target_group TEXT;

-- ============================================================
-- 7. Alter orders (post-purchase email scheduling)
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS post_purchase_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS post_purchase_email_due_at TIMESTAMPTZ;
