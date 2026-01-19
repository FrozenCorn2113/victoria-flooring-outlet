// pages/api/cron/send-weekly-sneak.js
// Vercel Cron handler to send weekly sneak peek via MailerLite

import { query } from '@/lib/db';
import { getNextWeeklyDealFromDb, getWeeklyDealFromDb } from '@/lib/harbinger/sync';

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

function formatMoney(amount, currency = 'CAD') {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function buildEmailHtml({ deal, siteUrl }) {
  const title = deal.name;
  const description = deal.description || 'A sneak peek at next week\'s flooring deal.';
  const price = deal.pricePerSqFt ? `${formatMoney(deal.pricePerSqFt, deal.currency)} / sq ft` : null;
  const compare = deal.compareAtPricePerSqFt
    ? `${formatMoney(deal.compareAtPricePerSqFt, deal.currency)} / sq ft`
    : null;
  const link = `${siteUrl}/products/${deal.id}`;

  return `
    <div style="font-family: Arial, sans-serif; color: #1E1A15; line-height: 1.6;">
      <h1 style="font-size: 22px; margin-bottom: 12px;">Weekly Sneak Peek</h1>
      <h2 style="font-size: 18px; margin: 0 0 12px 0;">${title}</h2>
      ${deal.image ? `<img src="${deal.image}" alt="${deal.name}" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ''}
      <p style="margin: 0 0 12px 0;">${description}</p>
      ${price ? `<p style="margin: 0 0 8px 0;"><strong>Deal price:</strong> ${price}</p>` : ''}
      ${compare ? `<p style="margin: 0 0 16px 0;"><strong>Compare at:</strong> ${compare}</p>` : ''}
      <a href="${link}" style="display: inline-block; background: #1F1C19; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 999px; font-size: 14px;">
        View the full preview
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #716553;">
        You’re receiving this because you subscribed to Victoria Flooring Outlet updates.
      </p>
    </div>
  `;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function createCampaignV2({
  apiKey,
  subject,
  fromName,
  fromEmail,
  html,
  groupId,
}) {
  const baseUrl = process.env.MAILERLITE_API_BASE_URL || 'https://api.mailerlite.com/api/v2';
  const headers = {
    'Content-Type': 'application/json',
    'X-MailerLite-ApiKey': apiKey,
  };

  const campaignResponse = await fetch(`${baseUrl}/campaigns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'regular',
      subject,
      from_name: fromName,
      from: fromEmail,
      ...(groupId ? { groups: [groupId] } : {}),
    }),
  });

  if (!campaignResponse.ok) {
    const errorText = await campaignResponse.text();
    throw new Error(`MailerLite campaign create error (${campaignResponse.status}): ${errorText}`);
  }

  const campaign = await campaignResponse.json();
  const campaignId = campaign?.id;
  if (!campaignId) {
    throw new Error('MailerLite campaign create error: missing campaign id');
  }

  const contentResponse = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      html,
      plain: stripHtml(html),
    }),
  });

  if (!contentResponse.ok) {
    const errorText = await contentResponse.text();
    throw new Error(`MailerLite campaign content error (${contentResponse.status}): ${errorText}`);
  }

  const sendResponse = await fetch(`${baseUrl}/campaigns/${campaignId}/send`, {
    method: 'POST',
    headers,
  });

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text();
    throw new Error(`MailerLite campaign send error (${sendResponse.status}): ${errorText}`);
  }

  return campaignId;
}

async function hasCampaignAlreadySent(weeklyDealId) {
  const result = await query(
    `SELECT id FROM newsletter_campaigns WHERE weekly_deal_id = $1 LIMIT 1`,
    [weeklyDealId]
  );
  return result.rows.length > 0;
}

async function recordCampaign({ weeklyDealId, providerCampaignId, subject }) {
  await query(
    `INSERT INTO newsletter_campaigns
      (weekly_deal_id, provider, provider_campaign_id, subject, status, sent_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT (weekly_deal_id) DO NOTHING`,
    [weeklyDealId, 'mailerlite', providerCampaignId, subject, 'sent']
  );
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

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing MailerLite API key' });
  }

  const fromName = process.env.MAILERLITE_FROM_NAME || 'Victoria Flooring Outlet';
  const fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'hello@victoriaflooringoutlet.ca';
  const siteUrl = (process.env.SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const groupId = process.env.MAILERLITE_GROUP_ID || null;

  try {
    const upcomingDeal = await getNextWeeklyDealFromDb();
    const deal = upcomingDeal || await getWeeklyDealFromDb();

    if (!deal) {
      return res.status(200).json({ ok: true, message: 'No weekly deal found.' });
    }

    const weeklyDealId = deal.weeklyDealId || null;
    if (weeklyDealId && await hasCampaignAlreadySent(weeklyDealId)) {
      return res.status(200).json({ ok: true, message: 'Campaign already sent for this deal.' });
    }

    const subject = `Sneak Peek: ${deal.name}`;
    const html = buildEmailHtml({ deal, siteUrl });

    const campaignId = await createCampaignV2({
      apiKey,
      subject,
      fromName,
      fromEmail,
      html,
      groupId,
    });

    if (weeklyDealId) {
      await recordCampaign({ weeklyDealId, providerCampaignId: campaignId, subject });
    }

    return res.status(200).json({ ok: true, campaignId });
  } catch (error) {
    console.error('Weekly sneak peek error:', error);
    return res.status(500).json({ error: 'Failed to send weekly sneak peek', details: error.message });
  }
}
