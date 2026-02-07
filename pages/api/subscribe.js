import { subscribeUser } from '@/lib/newsletter/subscriber-sync';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/subscribe
 * Subscribe a user to the newsletter with CASL consent tracking
 * 
 * Body:
 * - email (required): Email address
 * - source (required): Consent source (e.g., 'subscribe_form', 'next_week_preview')
 * - firstName (optional): First name
 * - consentText (optional): Exact consent wording shown to user
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source, firstName, consentText } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!source || typeof source !== 'string') {
    return res.status(400).json({ error: 'Consent source is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedSource = source.trim().slice(0, 100);
  const normalizedFirstName = firstName && typeof firstName === 'string' 
    ? firstName.trim().slice(0, 100) 
    : null;

  // Extract metadata for CASL compliance
  const metadata = {
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
        req.headers['x-real-ip'] || 
        req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    pageUrl: req.headers.referer || req.headers.referrer,
  };

  try {
    const subscriber = await subscribeUser({
      email: normalizedEmail,
      source: normalizedSource,
      firstName: normalizedFirstName,
      consentText: consentText || 'I agree to receive weekly flooring deals and updates from Victoria Flooring Outlet.',
      metadata,
    });

    // Set subscriber cookie for hard-gate early access
    res.setHeader('Set-Cookie', `vfo_subscriber=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`);

    return res.status(200).json({
      message: 'Successfully subscribed! Check your inbox for a welcome email.',
      subscribed: true,
      subscriber: {
        email: subscriber.email,
        status: subscriber.status,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({
      error: 'Unable to complete subscription. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

