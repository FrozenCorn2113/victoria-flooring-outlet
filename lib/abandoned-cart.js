// lib/abandoned-cart.js
// Abandoned cart tracking and email automation

import { query } from './db';
import { Resend } from 'resend';
import crypto from 'crypto';
import { 
  generateAbandonedCartEmail1, 
  generateAbandonedCartEmail1Text,
  generateAbandonedCartEmail2, 
  generateAbandonedCartEmail2Text 
} from './email-templates/abandoned-cart';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a secure session token for cart tracking
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create abandoned cart record
 * Called when user provides email at cart page
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {string} params.sessionToken - Unique session token
 * @param {Array} params.cartItems - Cart items array
 * @param {string} [params.dealId] - Associated deal ID (optional)
 * @param {string} [params.dealEndsAt] - Deal expiry timestamp (optional)
 * @param {string} [params.postalCode] - Shipping postal code
 * @param {string} [params.shippingZone] - Shipping zone
 * @param {number} params.cartTotal - Total cart value in cents
 * @returns {Promise<Object>} Abandoned cart record
 */
export async function createAbandonedCart({
  email,
  sessionToken,
  cartItems,
  dealId,
  dealEndsAt,
  postalCode,
  shippingZone,
  cartTotal,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  // Calculate expiry (deal end time or 48 hours from now, whichever is sooner)
  const defaultExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  const dealExpiry = dealEndsAt ? new Date(dealEndsAt) : null;
  const expiresAt = dealExpiry && dealExpiry < defaultExpiry ? dealExpiry : defaultExpiry;

  const result = await query(
    `INSERT INTO abandoned_carts (
      email,
      session_token,
      cart_snapshot,
      deal_id,
      deal_ends_at,
      postal_code,
      shipping_zone,
      cart_total,
      status,
      expires_at,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      normalizedEmail,
      sessionToken,
      JSON.stringify(cartItems),
      dealId || null,
      dealEndsAt || null,
      postalCode || null,
      shippingZone || null,
      cartTotal,
      expiresAt,
    ]
  );

  return result.rows[0];
}

/**
 * Get abandoned cart by session token
 */
export async function getAbandonedCartByToken(sessionToken) {
  const result = await query(
    `SELECT * FROM abandoned_carts WHERE session_token = $1`,
    [sessionToken]
  );

  if (result.rows.length === 0) return null;

  const cart = result.rows[0];
  cart.cart_snapshot = JSON.parse(cart.cart_snapshot);
  return cart;
}

/**
 * Mark abandoned cart as purchased
 * Called from Stripe webhook after successful checkout
 */
export async function markCartAsPurchased(sessionToken, stripeSessionId) {
  await query(
    `UPDATE abandoned_carts
     SET 
       status = 'purchased',
       stripe_session_id = $2,
       purchased_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE session_token = $1`,
    [sessionToken, stripeSessionId]
  );
}

/**
 * Mark abandoned cart as purchased by email + stripe session
 * Fallback if session token is not available
 */
export async function markCartAsPurchasedByEmail(email, stripeSessionId) {
  const normalizedEmail = email.toLowerCase().trim();

  await query(
    `UPDATE abandoned_carts
     SET 
       status = 'purchased',
       stripe_session_id = $2,
       purchased_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE email = $1 
       AND status IN ('active', 'reminded_1', 'reminded_2')
       AND created_at > CURRENT_TIMESTAMP - INTERVAL '48 hours'
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, stripeSessionId]
  );
}

/**
 * Get carts that need reminder 1 (12 hours after creation)
 */
export async function getCartsDueForReminder1() {
  const result = await query(
    `SELECT * FROM abandoned_carts
     WHERE status = 'active'
       AND reminder_1_sent_at IS NULL
       AND created_at <= CURRENT_TIMESTAMP - INTERVAL '12 hours'
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at ASC
     LIMIT 50`
  );

  return result.rows.map(cart => ({
    ...cart,
    cart_snapshot: JSON.parse(cart.cart_snapshot),
  }));
}

/**
 * Get carts that need reminder 2 (24 hours after creation)
 */
export async function getCartsDueForReminder2() {
  const result = await query(
    `SELECT * FROM abandoned_carts
     WHERE status = 'reminded_1'
       AND reminder_2_sent_at IS NULL
       AND created_at <= CURRENT_TIMESTAMP - INTERVAL '24 hours'
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at ASC
     LIMIT 50`
  );

  return result.rows.map(cart => ({
    ...cart,
    cart_snapshot: JSON.parse(cart.cart_snapshot),
  }));
}

/**
 * Send abandoned cart reminder email (version 1: 12 hours)
 */
export async function sendAbandonedCartReminder1(cart) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured, skipping abandoned cart email');
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const checkoutUrl = `${siteUrl}/api/cart/restore?token=${cart.session_token}`;

  const html = generateAbandonedCartEmail1({
    email: cart.email,
    cart: cart.cart_snapshot,
    checkoutUrl,
    dealEndsAt: cart.deal_ends_at,
  });

  const text = generateAbandonedCartEmail1Text({
    cart: cart.cart_snapshot,
    checkoutUrl,
    dealEndsAt: cart.deal_ends_at,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>',
      to: cart.email,
      subject: 'You left something in your cart',
      html,
      text,
    });

    // Mark reminder 1 as sent
    await query(
      `UPDATE abandoned_carts
       SET 
         status = 'reminded_1',
         reminder_1_sent_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [cart.id]
    );

    console.log(`Sent abandoned cart reminder 1 to ${cart.email}`);
  } catch (error) {
    console.error(`Failed to send abandoned cart reminder 1 to ${cart.email}:`, error);
    throw error;
  }
}

/**
 * Send abandoned cart reminder email (version 2: 24 hours)
 */
export async function sendAbandonedCartReminder2(cart) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured, skipping abandoned cart email');
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const checkoutUrl = `${siteUrl}/api/cart/restore?token=${cart.session_token}`;

  const html = generateAbandonedCartEmail2({
    email: cart.email,
    cart: cart.cart_snapshot,
    checkoutUrl,
    dealEndsAt: cart.deal_ends_at,
  });

  const text = generateAbandonedCartEmail2Text({
    cart: cart.cart_snapshot,
    checkoutUrl,
    dealEndsAt: cart.deal_ends_at,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>',
      to: cart.email,
      subject: '⏰ Your flooring deal expires soon',
      html,
      text,
    });

    // Mark reminder 2 as sent
    await query(
      `UPDATE abandoned_carts
       SET 
         status = 'reminded_2',
         reminder_2_sent_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [cart.id]
    );

    console.log(`Sent abandoned cart reminder 2 to ${cart.email}`);
  } catch (error) {
    console.error(`Failed to send abandoned cart reminder 2 to ${cart.email}:`, error);
    throw error;
  }
}

/**
 * Clean up expired abandoned carts
 * Called by cron job to mark expired carts
 */
export async function cleanupExpiredCarts() {
  const result = await query(
    `UPDATE abandoned_carts
     SET 
       status = 'expired',
       updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('active', 'reminded_1', 'reminded_2')
       AND expires_at <= CURRENT_TIMESTAMP
     RETURNING id`,
    []
  );

  console.log(`Marked ${result.rows.length} abandoned carts as expired`);
  return result.rows.length;
}

/**
 * Suppress abandoned cart emails for a given email
 * Called if user clicks "Don't remind me" link (future enhancement)
 */
export async function suppressAbandonedCartEmails(sessionToken) {
  await query(
    `UPDATE abandoned_carts
     SET 
       status = 'expired',
       updated_at = CURRENT_TIMESTAMP
     WHERE session_token = $1`,
    [sessionToken]
  );
}
