// pages/api/cron/send-weekly-sneak.js
// Vercel Cron handler to send weekly Deal of the Week email via MailerLite
// Two-section format: THIS WEEK (live deal) + NEXT WEEK (preview)

import { query } from '@/lib/db';
import { getWeeklyDealFromDb, getNextWeeklyDealFromDb } from '@/lib/harbinger/sync';
import { createAndSendCampaign, getGroupIds, isMailerLiteConfigured } from '@/lib/mailerlite';
import { generateWeeklyDealDropEmail, generateWeeklyDealDropEmailText } from '@/lib/email-templates/weekly-deal-drop';

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

/**
 * Transform DB deal into email template format
 */
function transformDealForEmail(deal) {
  if (!deal) return null;

  return {
    id: deal.id,
    name: deal.name || `${deal.brand} ${deal.collection}`,
    vendor: deal.brand,
    series: deal.collection,
    description: deal.description || deal.seriesDescription || '',
    pricePerSqFt: deal.pricePerSqFt,
    compareAtPricePerSqFt: deal.compareAtPricePerSqFt,
    currency: deal.currency || 'CAD',
    image: deal.image,
    specs: deal.specs,
    features: deal.features,
  };
}

/**
 * Check if campaign already sent for this deal
 */
async function hasCampaignAlreadySent(weeklyDealId) {
  const result = await query(
    `SELECT id FROM newsletter_campaigns 
     WHERE weekly_deal_id = $1 
       AND campaign_type = 'weekly_drop' 
     LIMIT 1`,
    [weeklyDealId]
  );
  return result.rows.length > 0;
}

/**
 * Record campaign in database
 */
async function recordCampaign({ weeklyDealId, providerCampaignId, subject }) {
  await query(
    `INSERT INTO newsletter_campaigns
      (weekly_deal_id, provider, provider_campaign_id, subject, campaign_type, target_group, status, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     ON CONFLICT DO NOTHING`,
    [weeklyDealId, 'mailerlite', providerCampaignId, subject, 'weekly_drop', 'Subscriber', 'sent']
  );
}

/**
 * GET/POST /api/cron/send-weekly-sneak
 * Cron job to send weekly Deal of the Week email
 * Should run every Sunday evening (e.g., 8 PM PT)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  const provided = getSecretFromRequest(req);
  if (secret && provided !== secret && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isMailerLiteConfigured()) {
    return res.status(500).json({ error: 'MailerLite not configured' });
  }

  try {
    // Fetch current and next deals
    const currentDealRaw = await getWeeklyDealFromDb();
    const nextDealRaw = await getNextWeeklyDealFromDb();

    if (!currentDealRaw) {
      return res.status(200).json({ 
        ok: true, 
        message: 'No active deal found. Skipping email.' 
      });
    }

    const currentDeal = transformDealForEmail(currentDealRaw);
    const nextDeal = nextDealRaw ? transformDealForEmail(nextDealRaw) : null;

    // Check if already sent for this deal
    const weeklyDealId = currentDealRaw.weeklyDealId;
    if (weeklyDealId && await hasCampaignAlreadySent(weeklyDealId)) {
      return res.status(200).json({ 
        ok: true, 
        message: `Campaign already sent for deal ${weeklyDealId}` 
      });
    }

    // Build subject line
    const subject = nextDeal
      ? `🔥 ${currentDeal.name} is LIVE + Next Week's Preview`
      : `🔥 Deal of the Week: ${currentDeal.name}`;

    // Generate email HTML using template (with placeholder email for unsubscribe link generation)
    const htmlTemplate = generateWeeklyDealDropEmail({
      email: '{$email}', // MailerLite placeholder
      currentDeal,
      nextDeal,
    });

    const textTemplate = generateWeeklyDealDropEmailText({
      currentDeal,
      nextDeal,
    });

    // Get MailerLite group IDs
    const groupIds = await getGroupIds();
    const subscriberGroupId = groupIds?.subscribers;

    if (!subscriberGroupId) {
      console.warn('MailerLite Subscriber group not found. Campaign will send to all subscribers.');
    }

    // Create and send campaign via MailerLite
    const campaignId = await createAndSendCampaign({
      subject,
      html: htmlTemplate,
      text: textTemplate,
      groupIds: subscriberGroupId ? [subscriberGroupId] : undefined,
    });

    // Record campaign in database
    if (weeklyDealId) {
      await recordCampaign({
        weeklyDealId,
        providerCampaignId: campaignId,
        subject,
      });
    }

    return res.status(200).json({
      ok: true,
      campaignId,
      currentDeal: currentDeal.name,
      nextDeal: nextDeal?.name || null,
      message: 'Weekly deal email sent successfully',
    });
  } catch (error) {
    console.error('Weekly deal email error:', error);
    return res.status(500).json({
      error: 'Failed to send weekly deal email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
