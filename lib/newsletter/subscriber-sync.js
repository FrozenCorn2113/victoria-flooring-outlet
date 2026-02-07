// lib/newsletter/subscriber-sync.js
// Unified subscriber management: DB + MailerLite sync

import { query } from '../db';
import { addSubscriber, updateSubscriber, getGroupIds } from '../mailerlite';
import { recordConsent } from '../consent';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Subscribe a new user: DB + MailerLite + Consent + Welcome email
 * 
 * @param {Object} params
 * @param {string} params.email - Subscriber email
 * @param {string} params.source - Consent source (e.g., 'subscribe_form', 'next_week_preview')
 * @param {string} [params.firstName] - Optional first name
 * @param {string} [params.consentText] - Exact consent wording shown to user
 * @param {Object} [params.metadata] - Optional metadata (ip, user agent, etc.)
 * @returns {Promise<Object>} Subscriber record
 */
export async function subscribeUser({ 
  email, 
  source, 
  firstName, 
  consentText = 'I agree to receive weekly flooring deals and updates.',
  metadata = {} 
}) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Record CASL consent
  await recordConsent({
    email: normalizedEmail,
    consentType: 'express',
    consentSource: source,
    consentText,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    pageUrl: metadata.pageUrl,
  });

  // 2. Get MailerLite group IDs
  const groupIds = await getGroupIds();
  const subscriberGroupId = groupIds?.subscribers || null;

  // 3. Add/update subscriber in MailerLite
  let mailerLiteId = null;
  try {
    const mlResponse = await addSubscriber({
      email: normalizedEmail,
      groups: subscriberGroupId ? [subscriberGroupId] : [],
      fields: {
        ...(firstName ? { first_name: firstName } : {}),
        source,
      },
      status: 'active',
    });
    mailerLiteId = mlResponse?.data?.id || null;
  } catch (error) {
    console.error('MailerLite subscription error:', error);
    // Continue with DB-only subscription if MailerLite fails
  }

  // 4. Upsert subscriber in local database
  const dbResult = await query(
    `INSERT INTO newsletter_subscribers (
      email, 
      first_name, 
      source, 
      provider, 
      status, 
      consent_type, 
      consent_source,
      mailerlite_subscriber_id,
      tags,
      subscribed_at
    )
    VALUES ($1, $2, $3, $4, 'subscribed', 'express', $5, $6, ARRAY['Subscriber']::TEXT[], CURRENT_TIMESTAMP)
    ON CONFLICT (email)
    DO UPDATE SET
      first_name = COALESCE($2, newsletter_subscribers.first_name),
      source = COALESCE($3, newsletter_subscribers.source),
      provider = COALESCE($4, newsletter_subscribers.provider),
      status = 'subscribed',
      consent_type = 'express',
      consent_source = COALESCE($5, newsletter_subscribers.consent_source),
      mailerlite_subscriber_id = COALESCE($6, newsletter_subscribers.mailerlite_subscriber_id),
      tags = ARRAY['Subscriber']::TEXT[],
      subscribed_at = CURRENT_TIMESTAMP,
      unsubscribed_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, email, first_name, status, subscribed_at`,
    [normalizedEmail, firstName || null, source, 'mailerlite', source, mailerLiteId]
  );

  const subscriber = dbResult.rows[0];

  // 5. Send welcome email (async, don't block response)
  sendWelcomeEmail({ email: normalizedEmail, firstName }).catch(err => {
    console.error('Welcome email error:', err);
  });

  return subscriber;
}

/**
 * Send welcome email to new subscriber
 */
async function sendWelcomeEmail({ email, firstName }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured, skipping welcome email');
    return;
  }

  const { generateWelcomeEmail, generateWelcomeEmailText } = await import('../email-templates/welcome');

  const html = generateWelcomeEmail({ email, firstName });
  const text = generateWelcomeEmailText({ firstName });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>',
      to: email,
      subject: 'Welcome to the VFO Insider Club!',
      html,
      text,
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    throw error;
  }
}

/**
 * Mark subscriber as customer after purchase
 * Updates both DB and MailerLite
 * 
 * @param {string} email - Customer email
 * @param {number} orderTotal - Order total in cents
 */
export async function markAsCustomer(email, orderTotal) {
  const normalizedEmail = email.toLowerCase().trim();

  // Update local DB
  await query(
    `UPDATE newsletter_subscribers
     SET 
       is_customer = TRUE,
       first_purchase_at = COALESCE(first_purchase_at, CURRENT_TIMESTAMP),
       purchase_count = purchase_count + 1,
       total_spent = total_spent + $2,
       tags = CASE 
         WHEN NOT 'Customer' = ANY(tags) THEN array_append(tags, 'Customer')
         ELSE tags
       END,
       updated_at = CURRENT_TIMESTAMP
     WHERE email = $1`,
    [normalizedEmail, orderTotal]
  );

  // Update MailerLite (add to "Customers" group)
  try {
    const groupIds = await getGroupIds();
    const customerGroupId = groupIds?.customers;

    if (customerGroupId) {
      await updateSubscriber({
        email: normalizedEmail,
        groups: [customerGroupId],
        fields: {
          is_customer: true,
        },
      });
    }
  } catch (error) {
    console.error('MailerLite customer update error:', error);
    // Non-blocking - DB is source of truth
  }
}

/**
 * Increment purchase count for repeat customer
 */
export async function incrementPurchaseCount(email, orderTotal) {
  const normalizedEmail = email.toLowerCase().trim();

  await query(
    `UPDATE newsletter_subscribers
     SET 
       purchase_count = purchase_count + 1,
       total_spent = total_spent + $2,
       tags = CASE 
         WHEN purchase_count + 1 >= 2 AND NOT 'RepeatCustomer' = ANY(tags) 
         THEN array_append(tags, 'RepeatCustomer')
         ELSE tags
       END,
       updated_at = CURRENT_TIMESTAMP
     WHERE email = $1`,
    [normalizedEmail, orderTotal]
  );

  // Check if repeat customer (2+ purchases) and add to MailerLite group
  const result = await query(
    `SELECT purchase_count FROM newsletter_subscribers WHERE email = $1`,
    [normalizedEmail]
  );

  if (result.rows[0]?.purchase_count >= 2) {
    try {
      const groupIds = await getGroupIds();
      const repeatGroupId = groupIds?.repeatCustomer;

      if (repeatGroupId) {
        await updateSubscriber({
          email: normalizedEmail,
          groups: [repeatGroupId],
        });
      }
    } catch (error) {
      console.error('MailerLite repeat customer update error:', error);
    }
  }
}

/**
 * Get subscriber by email
 */
export async function getSubscriber(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT * FROM newsletter_subscribers WHERE email = $1`,
    [normalizedEmail]
  );

  return result.rows[0] || null;
}

/**
 * Check if email is subscribed
 */
export async function isSubscribed(email) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT status FROM newsletter_subscribers WHERE email = $1`,
    [normalizedEmail]
  );

  return result.rows[0]?.status === 'subscribed';
}
