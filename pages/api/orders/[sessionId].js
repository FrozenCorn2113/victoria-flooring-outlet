import { getOrderBySessionId } from '@/lib/orders';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    const order = await getOrderBySessionId(sessionId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse JSON fields if they're strings
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const shippingAddress = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;

    return res.status(200).json({
      order: {
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        shippingAddress,
        shippingZone: order.shipping_zone,
        createdAt: order.created_at,
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}
