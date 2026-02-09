-- 002-next-week-deal-subscriber-email.sql
-- Track when we sent the "next week's deal" follow-up email to new subscribers
-- Idempotent: safe to run multiple times

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS next_week_deal_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN newsletter_subscribers.next_week_deal_email_sent_at IS 'When the subscriber follow-up (next week deal preview) email was sent';
