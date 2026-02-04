import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import Stripe from 'stripe';
import { createOrder } from '../../../lib/orders';
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '../../../lib/orders/email-notifications';

export const config = {
  api: {
    bodyParser: false, // CRITICAL: Must disable to verify signature
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not defined');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Fetch line items to get order details
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // Build items array for database
    const items = lineItems.data
      .filter(item => item.description !== 'Shipping')
      .map(item => ({
        name: item.description || 'Unknown Item',
        quantity: item.quantity || 1,
        unit_price: item.price?.unit_amount || 0,
        total: item.amount_total || 0,
      }));

    // Calculate subtotal and shipping from line items
    const shippingItem = lineItems.data.find(item => item.description === 'Shipping');
    const shippingCost = shippingItem?.amount_total || parseInt(session.metadata?.shipping_cost || '0', 10);
    const subtotal = parseInt(session.metadata?.subtotal || '0', 10) ||
      (session.amount_total || 0) - shippingCost;

    // Save order to database
    try {
      const order = await createOrder({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        customer_email: session.customer_details?.email || '',
        customer_name: session.customer_details?.name || null,
        customer_phone: session.customer_details?.phone || null,
        items,
        subtotal,
        shipping: shippingCost,
        total: session.amount_total || 0,
        postal_code: session.metadata?.postal_code || null,
        shipping_zone: session.metadata?.shipping_zone || null,
        shipping_address: session.shipping_details?.address || null,
      });

      // Send confirmation emails (non-blocking)
      sendOrderConfirmationEmail({ order, session }).catch(err =>
        console.error('Failed to send order confirmation email:', err.message)
      );
      sendOrderNotificationEmail({ order, session }).catch(err =>
        console.error('Failed to send admin notification email:', err.message)
      );
    } catch (dbError: any) {
      // Log error but don't fail the webhook - payment already succeeded
      console.error('Failed to save order to database:', dbError.message);

      // Still try to send emails with session data even if DB failed
      const fallbackOrder = {
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name,
        customer_phone: session.customer_details?.phone,
        items,
        subtotal,
        shipping: shippingCost,
        total: session.amount_total || 0,
        postal_code: session.metadata?.postal_code,
        shipping_zone: session.metadata?.shipping_zone,
        shipping_address: session.shipping_details?.address,
        stripe_session_id: session.id,
      };

      sendOrderConfirmationEmail({ order: fallbackOrder, session }).catch(err =>
        console.error('Failed to send order confirmation email:', err.message)
      );
      sendOrderNotificationEmail({ order: fallbackOrder, session }).catch(err =>
        console.error('Failed to send admin notification email:', err.message)
      );
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
