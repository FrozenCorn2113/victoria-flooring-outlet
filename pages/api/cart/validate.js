// pages/api/cart/validate.js
// Validates cart items and returns which items are still valid
// Used to remove expired weekly deals from the cart

import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cartDetails } = req.body;

  if (!cartDetails || typeof cartDetails !== 'object') {
    return res.status(400).json({ error: 'Invalid cart data' });
  }

  const expiredItems = [];

  try {
    // Check each cart item that has a weeklyDealId
    for (const [itemId, item] of Object.entries(cartDetails)) {
      if (item.weeklyDealId) {
        // Check if this weekly deal is still active
        const result = await query(
          `SELECT id FROM weekly_deals
           WHERE id = $1
             AND is_active = true
             AND starts_at <= NOW()
             AND ends_at > NOW()`,
          [item.weeklyDealId]
        );

        if (result.rows.length === 0) {
          // This deal has expired
          expiredItems.push({
            id: itemId,
            name: item.name,
            reason: 'Weekly deal has expired',
          });
        }
      }
    }

    return res.status(200).json({
      valid: expiredItems.length === 0,
      expiredItems,
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    return res.status(500).json({ error: 'Failed to validate cart' });
  }
}
