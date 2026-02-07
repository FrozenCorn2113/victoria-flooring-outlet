// pages/api/deal-timer.js
// Returns server-authoritative deal timing for countdown timer
// Clients use this to sync their clocks and avoid trusting local time

import { getServerTime } from '../../lib/deal-timer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Never cache deal timer responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  try {
    const timing = await getServerTime();
    return res.status(200).json(timing);
  } catch (error) {
    console.error('Deal timer error:', error);
    // Return current time even if DB fails so client can still function
    return res.status(200).json({
      serverTime: new Date().toISOString(),
      dealEndsAt: null,
      remainingMs: 0,
      dealActive: false,
      isSubscriberWindow: false,
    });
  }
}
