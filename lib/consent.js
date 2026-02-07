// lib/consent.js
// CASL consent tracking — records, withdraws, and verifies consent
// All consent records are append-only (withdrawn_at set, never deleted)

import crypto from 'crypto';
import { query } from './db';

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'default-dev-secret-change-me';

/**
 * Record a new consent entry
 * Uses ON CONFLICT to avoid duplicates for same email+type+source while consent is active
 */
export async function recordConsent({
  email,
  consentType,    // 'express' | 'implied_purchase' | 'implied_inquiry'
  consentSource,  // 'subscribe_form' | 'checkout' | 'next_week_preview' | 'deal_closed_page'
  consentText,    // exact wording shown to user
  ipAddress,
  userAgent,
  pageUrl,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `INSERT INTO email_consents (email, consent_type, consent_source, consent_text, ip_address, user_agent, page_url, consented_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     ON CONFLICT (email, consent_type, consent_source) WHERE withdrawn_at IS NULL
     DO UPDATE SET
       consent_text = EXCLUDED.consent_text,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent,
       page_url = EXCLUDED.page_url,
       consented_at = CURRENT_TIMESTAMP
     RETURNING id, email, consent_type, consented_at`,
    [normalizedEmail, consentType, consentSource, consentText, ipAddress || null, userAgent || null, pageUrl || null]
  );

  return result.rows[0];
}

/**
 * Withdraw consent — sets withdrawn_at, does not delete
 */
export async function withdrawConsent(email, consentType) {
  const normalizedEmail = email.toLowerCase().trim();

  await query(
    `UPDATE email_consents
     SET withdrawn_at = CURRENT_TIMESTAMP
     WHERE email = $1
       AND ($2::text IS NULL OR consent_type = $2)
       AND withdrawn_at IS NULL`,
    [normalizedEmail, consentType || null]
  );
}

/**
 * Withdraw ALL consent for an email (full unsubscribe)
 */
export async function withdrawAllConsent(email) {
  const normalizedEmail = email.toLowerCase().trim();

  await query(
    `UPDATE email_consents
     SET withdrawn_at = CURRENT_TIMESTAMP
     WHERE email = $1 AND withdrawn_at IS NULL`,
    [normalizedEmail]
  );
}

/**
 * Check if email has any active (non-withdrawn) consent
 */
export async function hasActiveConsent(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT id FROM email_consents
     WHERE email = $1 AND withdrawn_at IS NULL
     LIMIT 1`,
    [normalizedEmail]
  );

  return result.rows.length > 0;
}

/**
 * Get full consent history for an email (for auditing)
 */
export async function getConsentHistory(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT id, consent_type, consent_source, consent_text, ip_address,
            consented_at, withdrawn_at
     FROM email_consents
     WHERE email = $1
     ORDER BY consented_at DESC`,
    [normalizedEmail]
  );

  return result.rows;
}

/**
 * Generate HMAC-signed unsubscribe token for an email
 */
export function generateUnsubscribeToken(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(normalizedEmail)
    .digest('hex');
}

/**
 * Verify an unsubscribe token
 */
export function verifyUnsubscribeToken(email, token) {
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(token, 'hex')
  );
}

/**
 * Generate a full unsubscribe URL
 */
export function generateUnsubscribeUrl(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const encodedEmail = Buffer.from(normalizedEmail).toString('base64url');
  const token = generateUnsubscribeToken(normalizedEmail);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  return `${siteUrl}/api/unsubscribe?email=${encodedEmail}&token=${token}`;
}
