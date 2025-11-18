// In-memory storage for email subscriptions
// In production, this should be replaced with MailerLite, Mailchimp, or a database
let subscribers = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check if already subscribed
  const normalizedEmail = email.toLowerCase().trim();
  if (subscribers.includes(normalizedEmail)) {
    return res.status(200).json({ 
      message: 'Already subscribed',
      subscribed: true 
    });
  }

  // Add to subscribers list
  subscribers.push(normalizedEmail);

  // Log for now (in production, integrate with MailerLite/Mailchimp here)
  console.log('New subscriber:', normalizedEmail);
  console.log('Total subscribers:', subscribers.length);

  // TODO: Replace with actual email service integration
  // Example for MailerLite:
  // await fetch('https://api.mailerlite.com/api/v2/subscribers', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'X-MailerLite-ApiKey': process.env.MAILERLITE_API_KEY,
  //   },
  //   body: JSON.stringify({ email: normalizedEmail }),
  // });

  return res.status(200).json({ 
    message: 'Successfully subscribed',
    subscribed: true 
  });
}

