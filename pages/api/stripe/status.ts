import type { NextApiRequest, NextApiResponse } from 'next';

type StripeStatusResponse =
  | {
      ok: true;
      accountId: string;
      livemode: boolean;
      hasPublishableKey: boolean;
      hasWebhookSecret: boolean;
    }
  | {
      ok: false;
      error: string;
      hasPublishableKey: boolean;
      hasWebhookSecret: boolean;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeStatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      ok: false,
      error: 'STRIPE_SECRET_KEY is not configured',
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  }

  try {
    const { stripe } = await import('../../../lib/stripe');
    const account = await stripe.accounts.retrieve();

    return res.status(200).json({
      ok: true,
      accountId: account.id,
      livemode: (account as any).livemode ?? false,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Unable to reach Stripe',
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  }
}
