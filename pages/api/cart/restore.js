// pages/api/cart/restore.js
// Restore abandoned cart and redirect to checkout

import { getAbandonedCartByToken } from '@/lib/abandoned-cart';

/**
 * GET /api/cart/restore?token=SESSION_TOKEN
 * Restore abandoned cart from email link and redirect to cart page
 * Cart items are encoded in URL for client-side restoration
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect(302, '/cart?error=invalid_token');
  }

  try {
    const cart = await getAbandonedCartByToken(token);

    if (!cart) {
      return res.redirect(302, '/cart?error=cart_not_found');
    }

    // Check if cart expired
    if (new Date(cart.expires_at) < new Date()) {
      return res.redirect(302, '/cart?error=cart_expired');
    }

    // Check if already purchased
    if (cart.status === 'purchased') {
      return res.redirect(302, '/cart?message=already_purchased');
    }

    // Set cookies for client-side restoration
    res.setHeader('Set-Cookie', [
      `vfo_cart_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 48}`,
      `vfo_cart_email=${encodeURIComponent(cart.email)}; Path=/; Secure; SameSite=Lax; Max-Age=${60 * 60 * 48}`,
      `vfo_restore_cart=${encodeURIComponent(JSON.stringify(cart.cart_snapshot))}; Path=/; Secure; SameSite=Lax; Max-Age=60`, // 1 minute, just for restoration
    ]);

    // Redirect to cart page where client will restore items
    return res.redirect(302, '/cart?restored=true');
  } catch (error) {
    console.error('Cart restore error:', error);
    return res.redirect(302, '/cart?error=restore_failed');
  }
}
