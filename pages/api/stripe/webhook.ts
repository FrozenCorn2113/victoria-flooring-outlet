import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import Stripe from 'stripe';

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

    // MVP: Log order details
    console.log('✅ Order completed:', {
      sessionId: session.id,
      dealId: session.metadata?.dealId,
      dealName: session.metadata?.dealName,
      sku: session.metadata?.sku,
      boxes: session.metadata?.boxes,
      sqftPerBox: session.metadata?.sqftPerBox,
      postalCode: session.metadata?.postalCode,
      shippingZone: session.metadata?.shippingZone,
      shippingCost: session.metadata?.shippingCost,
      totalAmount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      customerPhone: session.customer_details?.phone,
    });

    // TODO: Store order in database (Supabase/Prisma/etc.)
    // - Create orders table with fields: sessionId, dealId, sku, boxes, sqftPerBox,
    //   postalCode, shippingZone, shippingCost, totalAmount, customerEmail, etc.
    // - Store session metadata
    // - Send confirmation email to customer
    // - Send notification email to Ty with order details
    // - Integrate with Harbinger inventory system via SKU
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
