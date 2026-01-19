import {
  isNewsletterDbConfigured,
  updateSubscriberError,
  upsertSubscriber
} from '@/lib/newsletter/db-newsletter';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function addToMailerLite({ email, source }) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) return null;

  const groupId = process.env.MAILERLITE_GROUP_ID;
  const url = groupId
    ? `https://api.mailerlite.com/api/v2/groups/${groupId}/subscribers`
    : 'https://api.mailerlite.com/api/v2/subscribers';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MailerLite-ApiKey': apiKey,
    },
    body: JSON.stringify({
      email,
      resubscribe: true,
      ...(source ? { fields: { source } } : {})
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailerLite error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedSource = typeof source === 'string'
    ? source.trim().slice(0, 100)
    : null;
  const provider = process.env.MAILERLITE_API_KEY ? 'mailerlite' : 'internal';

  if (!process.env.MAILERLITE_API_KEY && !isNewsletterDbConfigured()) {
    return res.status(500).json({
      error: 'Newsletter service is not configured'
    });
  }

  if (isNewsletterDbConfigured()) {
    try {
      await upsertSubscriber({
        email: normalizedEmail,
        source: normalizedSource,
        provider
      });
    } catch (error) {
      console.error('Newsletter database error:', error);
      return res.status(500).json({
        error: 'Unable to save subscription. Please try again later.'
      });
    }
  }

  if (process.env.MAILERLITE_API_KEY) {
    try {
      await addToMailerLite({ email: normalizedEmail, source: normalizedSource });
    } catch (error) {
      console.error('MailerLite subscription error:', error);
      if (isNewsletterDbConfigured()) {
        await updateSubscriberError(normalizedEmail, error.message);
      }
      return res.status(502).json({
        error: 'Unable to subscribe at the moment. Please try again later.'
      });
    }
  }

  return res.status(200).json({
    message: 'Successfully subscribed',
    subscribed: true
  });
}

