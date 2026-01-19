// pages/api/cron/sync-harbinger.js
// Vercel Cron handler to sync Harbinger products and rotate weekly deals

import { runHarbingerCron } from '@/lib/harbinger/cron';

function getSecretFromRequest(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.replace('Bearer ', '').trim();
  }
  if (typeof req.query?.secret === 'string') {
    return req.query.secret;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const provided = getSecretFromRequest(req);
  if (secret && provided !== secret && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const mode = typeof req.query?.mode === 'string' ? req.query.mode : 'syncAndRotate';
    const result = await runHarbingerCron({ mode });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Harbinger cron error:', error);
    return res.status(500).json({ error: 'Cron job failed', details: error.message });
  }
}
