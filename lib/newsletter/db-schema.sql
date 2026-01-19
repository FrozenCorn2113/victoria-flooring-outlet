-- Victoria Flooring Outlet - Newsletter Subscribers Schema
-- Run this in your Postgres database alongside the chat schema.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'subscribed', -- subscribed, unsubscribed, bounced, complained
  source VARCHAR(100),
  provider VARCHAR(50),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

CREATE OR REPLACE FUNCTION update_newsletter_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at_column();

-- Track weekly newsletter campaigns to prevent duplicate sends
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id SERIAL PRIMARY KEY,
  weekly_deal_id INTEGER,
  provider VARCHAR(50),
  provider_campaign_id VARCHAR(255),
  subject TEXT,
  status VARCHAR(50) DEFAULT 'sent', -- sent, scheduled, failed
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_campaigns_weekly_deal
  ON newsletter_campaigns(weekly_deal_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status
  ON newsletter_campaigns(status);
