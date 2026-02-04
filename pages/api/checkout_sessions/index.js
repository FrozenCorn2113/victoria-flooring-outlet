import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Allowed origins for redirect URLs
const ALLOWED_ORIGINS = [
  'https://victoriaflooringoutlet.ca',
  'https://www.victoriaflooringoutlet.ca',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean);

function getValidOrigin(requestOrigin) {
  if (!requestOrigin) return ALLOWED_ORIGINS[0];
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  // Allow localhost for development
  if (process.env.NODE_ENV === 'development' && requestOrigin.startsWith('http://localhost')) {
    return requestOrigin;
  }
  return ALLOWED_ORIGINS[0];
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      if (!stripe) {
        return res.status(503).json({
          statusCode: 503,
          message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.'
        });
      }
      const { items, shipping, postalCode, shippingZone } = req.body || {};

      // Build line items
      const lineItems = items || [];

      // Add shipping as a line item if provided (in cents)
      if (shipping && shipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Shipping',
            },
            unit_amount: shipping,
          },
          quantity: 1,
        });
      }

      // Build items summary for metadata (Stripe limits metadata to 500 chars per value)
      const itemsSummary = (items || [])
        .filter(item => item.price_data?.product_data?.name !== 'Shipping')
        .map(item => `${item.price_data?.product_data?.name || 'Item'} x${item.quantity}`)
        .join(', ')
        .slice(0, 490);

      // Calculate subtotal (excluding shipping)
      const subtotal = (items || []).reduce((sum, item) => {
        const amount = item.price_data?.unit_amount || 0;
        return sum + (amount * (item.quantity || 1));
      }, 0);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        billing_address_collection: 'required',
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: ['CA'],
        },
        metadata: {
          items_summary: itemsSummary,
          postal_code: postalCode || '',
          shipping_zone: shippingZone || '',
          subtotal: String(subtotal),
          shipping_cost: String(shipping || 0),
        },
        success_url: `${getValidOrigin(req.headers.origin)}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getValidOrigin(req.headers.origin)}/cart`,
      });

      res.status(200).json(session);
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
