import Stripe from 'stripe';
import { getWeeklyDealFromDb } from '../../../lib/harbinger/sync';
import products from '../../../products';

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

// Build a lookup map of known accessory products by name for server-side price validation
const accessoryPriceMap = new Map();
for (const product of products) {
  if (product.type === 'Accessory' && product.name && product.price) {
    accessoryPriceMap.set(product.name, {
      id: product.id,
      price: product.price, // already in cents
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    if (!stripe) {
      return res.status(503).json({
        statusCode: 503,
        message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.'
      });
    }

    const { items, email, sessionToken } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // -------------------------------------------------------
    // SERVER-SIDE PRICE VALIDATION
    // Never trust client-provided prices — always verify against DB/catalog
    // -------------------------------------------------------

    let weeklyDeal = null;
    try {
      weeklyDeal = await getWeeklyDealFromDb();
    } catch (err) {
      console.error('Failed to fetch weekly deal for validation:', err.message);
    }

    const validatedLineItems = [];

    for (const item of items) {
      const clientName = item.price_data?.product_data?.name || '';
      const clientUnitAmount = item.price_data?.unit_amount;
      const clientQuantity = item.quantity || 1;

      // Skip client-provided shipping — we recalculate below
      if (clientName === 'Shipping') continue;

      // Check if this is a known accessory
      const knownAccessory = accessoryPriceMap.get(clientName);

      if (knownAccessory) {
        // ---- ACCESSORY: use server-side catalog price ----
        if (clientUnitAmount !== knownAccessory.price) {
          console.warn(
            `Price mismatch for "${clientName}": client=${clientUnitAmount}, server=${knownAccessory.price}`
          );
        }
        validatedLineItems.push({
          price_data: {
            currency: 'cad',
            product_data: { name: clientName },
            unit_amount: knownAccessory.price,
          },
          quantity: clientQuantity,
        });
      } else if (weeklyDeal) {
        // ---- FLOORING (weekly deal): validate against DB ----
        const dealEndsAt = new Date(weeklyDeal.endsAt || weeklyDeal.ends_at);
        const dealStartsAt = new Date(weeklyDeal.startsAt || weeklyDeal.starts_at);
        const now = new Date();

        if (now < dealStartsAt || now > dealEndsAt) {
          return res.status(410).json({
            error: 'This deal has expired',
            redirect: '/deal-expired',
          });
        }

        const serverPricePerSqFt = weeklyDeal.pricePerSqFt || weeklyDeal.price_per_sqft;
        const coveragePerBox = weeklyDeal.coverageSqFtPerBox || weeklyDeal.coverage_sqft_per_box || 48;
        
        // Calculate boxes and actual square footage customer will receive
        const sqftRequested = clientQuantity; // clientQuantity is square footage requested
        const boxesNeeded = Math.ceil(sqftRequested / coveragePerBox);
        const actualSqFt = boxesNeeded * coveragePerBox; // Actual sq ft they're receiving
        const pricePerBoxCents = Math.round(serverPricePerSqFt * coveragePerBox * 100);

        const serverPriceCents = Math.round(serverPricePerSqFt * 100);
        if (clientUnitAmount !== serverPriceCents) {
          console.warn(
            `Price mismatch for "${clientName}": client=${clientUnitAmount}, server=${serverPriceCents}`
          );
        }

        validatedLineItems.push({
          price_data: {
            currency: 'cad',
            product_data: { 
              name: `${clientName} (${coveragePerBox} sq ft/box)`,
              description: `${actualSqFt} sq ft total`,
            },
            unit_amount: pricePerBoxCents,
          },
          quantity: boxesNeeded,
        });
      } else {
        // No weekly deal and not a known accessory
        // Reject — we can't validate the price
        console.error(`Cannot validate price for unknown product: "${clientName}"`);
        return res.status(400).json({
          error: `Unable to verify price for "${clientName}". Please refresh and try again.`,
        });
      }
    }

    if (validatedLineItems.length === 0) {
      return res.status(400).json({ error: 'No valid items to checkout' });
    }

    // -------------------------------------------------------
    // CALCULATE TOTAL SQUARE FOOTAGE FOR FREE SHIPPING CHECK
    // Free shipping on orders over 500 sq ft
    // -------------------------------------------------------

    let totalSqFt = 0;
    for (const item of validatedLineItems) {
      const isAccessory = accessoryPriceMap.has(item.price_data?.product_data?.name);
      if (!isAccessory) {
        totalSqFt += item.quantity; // quantity is square footage for flooring
      }
    }

    const qualifiesForFreeShipping = totalSqFt >= 500;

    // Build items summary for metadata (Stripe limits metadata to 500 chars per value)
    const itemsSummary = validatedLineItems
      .map(item => `${item.price_data?.product_data?.name || 'Item'} x${item.quantity}`)
      .join(', ')
      .slice(0, 490);

    const subtotal = validatedLineItems
      .reduce((sum, item) => sum + (item.price_data.unit_amount * (item.quantity || 1)), 0);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: validatedLineItems,
      customer_email: email || undefined, // Pre-fill email from cart capture
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['CA'],
      },
      metadata: {
        items_summary: itemsSummary,
        subtotal: String(subtotal),
        total_sqft: String(totalSqFt),
        free_shipping: String(qualifiesForFreeShipping),
        session_token: sessionToken || '', // For abandoned cart tracking
      },
      success_url: `${getValidOrigin(req.headers.origin)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getValidOrigin(req.headers.origin)}/cart`,
    });

    res.status(200).json(session);
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}
