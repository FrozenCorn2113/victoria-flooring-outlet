// pages/api/cart/capture.js
// Capture email at cart page and create abandoned cart record

import { createAbandonedCart, generateSessionToken } from '@/lib/abandoned-cart';
import { recordConsent } from '@/lib/consent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/cart/capture
 * Capture email and cart snapshot for abandoned cart tracking
 * 
 * Body:
 * - email (required): Customer email
 * - cartItems (required): Cart items array
 * - dealId (optional): Associated deal ID
 * - dealEndsAt (optional): Deal expiry ISO timestamp
 * - postalCode (optional): Shipping postal code
 * - shippingZone (optional): Shipping zone
 * - cartTotal (required): Total cart value in cents
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    cartItems,
    dealId,
    dealEndsAt,
    postalCode,
    shippingZone,
    cartTotal,
  } = req.body || {};

  // Validate required fields
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' });
  }

  if (typeof cartTotal !== 'number' || cartTotal <= 0) {
    return res.status(400).json({ error: 'Valid cart total is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Generate secure session token
    const sessionToken = generateSessionToken();

    // Record implied consent (cart email capture = implied inquiry consent)
    const metadata = {
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
          req.headers['x-real-ip'] || 
          req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      pageUrl: req.headers.referer || req.headers.referrer,
    };

    await recordConsent({
      email: normalizedEmail,
      consentType: 'implied_inquiry',
      consentSource: 'cart_capture',
      consentText: 'Email provided at checkout to complete purchase and receive order updates.',
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      pageUrl: metadata.pageUrl,
    });

    // Create abandoned cart record
    const cart = await createAbandonedCart({
      email: normalizedEmail,
      sessionToken,
      cartItems,
      dealId,
      dealEndsAt,
      postalCode,
      shippingZone,
      cartTotal,
    });

    // Set session token cookie for cart restoration
    res.setHeader('Set-Cookie', [
      `vfo_cart_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 48}`, // 48 hours
      `vfo_cart_email=${encodeURIComponent(normalizedEmail)}; Path=/; Secure; SameSite=Lax; Max-Age=${60 * 60 * 48}`, // 48 hours
    ]);

    return res.status(200).json({
      message: 'Cart saved successfully',
      sessionToken,
      cartId: cart.id,
    });
  } catch (error) {
    console.error('Cart capture error:', error);
    return res.status(500).json({
      error: 'Unable to save cart. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
