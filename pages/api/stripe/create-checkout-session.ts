import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { getWeeklyDeal } from '../../../lib/products-server';
import { calculateShipping, validateCanadianPostalCode } from '../../../lib/shipping';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { boxes, postalCode, customerEmail } = req.body;

    // Validate boxes
    if (!boxes || typeof boxes !== 'number' || boxes < 1 || boxes > 200) {
      return res.status(400).json({ error: 'Boxes must be a number between 1 and 200' });
    }

    // Validate postal code
    if (!postalCode || typeof postalCode !== 'string') {
      return res.status(400).json({ error: 'Postal code is required' });
    }

    if (!validateCanadianPostalCode(postalCode)) {
      return res.status(400).json({ error: 'Invalid Canadian postal code format' });
    }

    // Get weekly deal
    const weeklyDeal = await getWeeklyDeal();
    if (!weeklyDeal) {
      return res.status(404).json({ error: 'No weekly deal available' });
    }

    const coverageSqFtPerBox = weeklyDeal.coverageSqFtPerBox || 1;

    // Calculate price per box (in cents)
    const pricePerBoxCents = Math.round(
      weeklyDeal.pricePerSqFt * coverageSqFtPerBox * 100
    );

    // Calculate shipping
    const shippingResult = calculateShipping({
      postalCode,
      totalBoxes: boxes,
    });

    if (!shippingResult.valid) {
      return res.status(400).json({ error: shippingResult.error });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: weeklyDeal.name,
              description: `${boxes} boxes - ${coverageSqFtPerBox} sq ft per box`,
              metadata: {
                sku: weeklyDeal.sku || weeklyDeal.id,
                dealId: weeklyDeal.id,
              },
            },
            unit_amount: pricePerBoxCents,
          },
          quantity: boxes,
        },
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Shipping - ${shippingResult.zone}`,
              description: `${boxes} boxes @ $${(shippingResult.ratePerBox / 100).toFixed(2)}/box`,
            },
            unit_amount: shippingResult.shipping,
          },
          quantity: 1,
        },
      ],
      metadata: {
        dealId: weeklyDeal.id,
        dealName: weeklyDeal.name,
        sku: weeklyDeal.sku || weeklyDeal.id,
        boxes: boxes.toString(),
        sqftPerBox: weeklyDeal.coverageSqFtPerBox.toString(),
        postalCode: shippingResult.formattedPostalCode,
        shippingZone: shippingResult.zone,
        shippingCost: shippingResult.shipping.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin}/checkout/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
