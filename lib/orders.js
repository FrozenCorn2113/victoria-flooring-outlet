import { query } from './db';

/**
 * Create a new order in the database
 */
export async function createOrder(orderData) {
  const {
    stripe_session_id,
    stripe_payment_intent,
    customer_email,
    customer_name,
    customer_phone,
    items,
    subtotal,
    shipping,
    total,
    postal_code,
    shipping_zone,
    shipping_address,
  } = orderData;

  const result = await query(
    `INSERT INTO orders (
      stripe_session_id,
      stripe_payment_intent,
      customer_email,
      customer_name,
      customer_phone,
      items,
      subtotal,
      shipping,
      total,
      postal_code,
      shipping_zone,
      shipping_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      stripe_session_id,
      stripe_payment_intent,
      customer_email,
      customer_name,
      customer_phone,
      JSON.stringify(items),
      subtotal,
      shipping,
      total,
      postal_code,
      shipping_zone,
      shipping_address ? JSON.stringify(shipping_address) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Get an order by Stripe session ID
 */
export async function getOrderBySessionId(sessionId) {
  const result = await query(
    'SELECT * FROM orders WHERE stripe_session_id = $1',
    [sessionId]
  );
  return result.rows[0] || null;
}

/**
 * Get all orders for a customer email
 */
export async function getOrdersByEmail(email) {
  const result = await query(
    'SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC',
    [email]
  );
  return result.rows;
}

/**
 * Update order status (for fulfillment, returns, etc.)
 */
export async function updateOrderStatus(sessionId, status, notes = null) {
  const result = await query(
    `UPDATE orders
     SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
     WHERE stripe_session_id = $3
     RETURNING *`,
    [status, notes, sessionId]
  );
  return result.rows[0];
}
