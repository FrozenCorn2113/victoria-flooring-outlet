// pages/api/cron/email-jobs.js
// Consolidated cron job for ALL email automation tasks
// Handles: weekly deal drop, abandoned cart reminders, post-purchase emails, cleanup
// Runs every hour, but weekly email only sends on Sundays at 5 PM PT

import { query } from '@/lib/db';
import { 
  getCartsDueForReminder1,
  getCartsDueForReminder2,
  sendAbandonedCartReminder1,
  sendAbandonedCartReminder2,
  cleanupExpiredCarts
} from '@/lib/abandoned-cart';
import { getWeeklyDealFromDb, getNextWeeklyDealFromDb } from '@/lib/harbinger/sync';
import { createAndSendCampaign, getGroupIds, isMailerLiteConfigured } from '@/lib/mailerlite';
import { generateWeeklyDealDropEmail, generateWeeklyDealDropEmailText } from '@/lib/email-templates/weekly-deal-drop';
import { generatePostPurchaseEmail, generatePostPurchaseEmailText } from '@/lib/email-templates/post-purchase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
 * Check if current time is Sunday 5 PM Pacific Time
 */
function isSundayEveningPT() {
  const now = new Date();
  const ptTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = ptTime.getDay(); // 0 = Sunday
  const hour = ptTime.getHours();
  
  // Run on Sunday (day 0) between 5 PM and 6 PM PT
  return day === 0 && hour === 17;
}

/**
 * Send weekly deal drop email (only on Sunday evening)
 */
async function sendWeeklyDealEmail() {
  if (!isMailerLiteConfigured()) {
    console.log('[email-jobs] MailerLite not configured, skipping weekly email');
    return { skipped: true, reason: 'MailerLite not configured' };
  }

  const currentDealRaw = await getWeeklyDealFromDb();
  const nextDealRaw = await getNextWeeklyDealFromDb();

  if (!currentDealRaw) {
    console.log('[email-jobs] No active deal found, skipping weekly email');
    return { skipped: true, reason: 'No active deal' };
  }

  // Transform deals for email template
  const transformDeal = (deal) => deal ? {
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
  } : null;

  const currentDeal = transformDeal(currentDealRaw);
  const nextDeal = transformDeal(nextDealRaw);

  // Check if campaign already sent for this deal
  const weeklyDealId = currentDealRaw.weeklyDealId;
  if (weeklyDealId) {
    const result = await query(
      `SELECT id FROM newsletter_campaigns 
       WHERE weekly_deal_id = $1 
         AND campaign_type = 'weekly_drop' 
       LIMIT 1`,
      [weeklyDealId]
    );
    if (result.rows.length > 0) {
      console.log(`[email-jobs] Campaign already sent for deal ${weeklyDealId}`);
      return { skipped: true, reason: 'Already sent' };
    }
  }

  // Build subject line
  const subject = nextDeal
    ? `🔥 ${currentDeal.name} is LIVE + Next Week's Preview`
    : `🔥 Deal of the Week: ${currentDeal.name}`;

  // Generate email HTML using template
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

  // Create and send campaign
  const campaignId = await createAndSendCampaign({
    subject,
    html: htmlTemplate,
    text: textTemplate,
    groupIds: subscriberGroupId ? [subscriberGroupId] : undefined,
  });

  // Record campaign in database
  if (weeklyDealId) {
    await query(
      `INSERT INTO newsletter_campaigns
        (weekly_deal_id, provider, provider_campaign_id, subject, campaign_type, target_group, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [weeklyDealId, 'mailerlite', campaignId, subject, 'weekly_drop', 'Subscriber', 'sent']
    );
  }

  console.log(`[email-jobs] Sent weekly deal email: ${currentDeal.name}`);
  return { sent: true, campaignId, currentDeal: currentDeal.name, nextDeal: nextDeal?.name || null };
}

/**
 * GET/POST /api/cron/email-jobs
 * Consolidated cron job for all email automation
 * Should run every hour
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

  const results = {
    weeklyEmail: null,
    abandonedCartReminder1: { sent: 0, failed: 0 },
    abandonedCartReminder2: { sent: 0, failed: 0 },
    postPurchaseEmails: { sent: 0, failed: 0 },
    cleanup: { expired: 0 },
  };

  try {
    // 1. Send weekly deal email (only on Sunday 5 PM PT)
    if (isSundayEveningPT()) {
      console.log('[email-jobs] Sunday evening detected, sending weekly deal email...');
      try {
        results.weeklyEmail = await sendWeeklyDealEmail();
      } catch (error) {
        console.error('[email-jobs] Weekly email error:', error);
        results.weeklyEmail = { error: error.message };
      }
    } else {
      console.log('[email-jobs] Not Sunday evening PT, skipping weekly email');
      results.weeklyEmail = { skipped: true, reason: 'Not Sunday evening PT' };
    }

    // 2. Send abandoned cart reminder 1 (12 hours)
    console.log('[email-jobs] Checking for abandoned cart reminder 1...');
    const cartsDueForReminder1 = await getCartsDueForReminder1();
    console.log(`[email-jobs] Found ${cartsDueForReminder1.length} carts due for reminder 1`);

    for (const cart of cartsDueForReminder1) {
      try {
        await sendAbandonedCartReminder1(cart);
        results.abandonedCartReminder1.sent++;
      } catch (error) {
        console.error(`[email-jobs] Failed to send reminder 1 for cart ${cart.id}:`, error);
        results.abandonedCartReminder1.failed++;
      }
    }

    // 3. Send abandoned cart reminder 2 (24 hours)
    console.log('[email-jobs] Checking for abandoned cart reminder 2...');
    const cartsDueForReminder2 = await getCartsDueForReminder2();
    console.log(`[email-jobs] Found ${cartsDueForReminder2.length} carts due for reminder 2`);

    for (const cart of cartsDueForReminder2) {
      try {
        await sendAbandonedCartReminder2(cart);
        results.abandonedCartReminder2.sent++;
      } catch (error) {
        console.error(`[email-jobs] Failed to send reminder 2 for cart ${cart.id}:`, error);
        results.abandonedCartReminder2.failed++;
      }
    }

    // 4. Send post-purchase emails
    console.log('[email-jobs] Checking for post-purchase emails...');
    const ordersDueForPostPurchase = await query(
      `SELECT o.*, s.first_name 
       FROM orders o
       LEFT JOIN newsletter_subscribers s ON s.email = o.customer_email
       WHERE o.post_purchase_email_sent = FALSE
         AND o.post_purchase_email_due_at IS NOT NULL
         AND o.post_purchase_email_due_at <= CURRENT_TIMESTAMP
       ORDER BY o.created_at ASC
       LIMIT 50`
    );
    console.log(`[email-jobs] Found ${ordersDueForPostPurchase.rows.length} orders due for post-purchase email`);

    for (const order of ordersDueForPostPurchase.rows) {
      try {
        const nextDeal = await getNextWeeklyDealFromDb();
        const transformedNextDeal = nextDeal ? {
          id: nextDeal.id,
          name: nextDeal.name || `${nextDeal.brand} ${nextDeal.collection}`,
          vendor: nextDeal.brand,
          series: nextDeal.collection,
          description: nextDeal.description || nextDeal.seriesDescription || '',
          pricePerSqFt: nextDeal.pricePerSqFt,
          currency: nextDeal.currency || 'CAD',
          image: nextDeal.image,
        } : null;

        const html = generatePostPurchaseEmail({
          email: order.customer_email,
          firstName: order.first_name || order.customer_name?.split(' ')[0] || null,
          order: {
            items: JSON.parse(order.items || '[]'),
          },
          nextDeal: transformedNextDeal,
        });

        const text = generatePostPurchaseEmailText({
          firstName: order.first_name || order.customer_name?.split(' ')[0] || null,
          order: {
            items: JSON.parse(order.items || '[]'),
          },
          nextDeal: transformedNextDeal,
        });

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Victoria Flooring Outlet <hello@victoriaflooringoutlet.ca>',
          to: order.customer_email,
          subject: 'How is your new flooring?',
          html,
          text,
        });

        // Mark as sent
        await query(
          `UPDATE orders 
           SET post_purchase_email_sent = TRUE 
           WHERE id = $1`,
          [order.id]
        );

        results.postPurchaseEmails.sent++;
        console.log(`[email-jobs] Sent post-purchase email to ${order.customer_email}`);
      } catch (error) {
        console.error(`[email-jobs] Failed to send post-purchase email for order ${order.id}:`, error);
        results.postPurchaseEmails.failed++;
      }
    }

    // 5. Cleanup expired carts
    console.log('[email-jobs] Cleaning up expired carts...');
    const expiredCount = await cleanupExpiredCarts();
    results.cleanup.expired = expiredCount;

    console.log('[email-jobs] Email jobs completed successfully');
    console.log('[email-jobs] Results:', results);

    return res.status(200).json({
      ok: true,
      message: 'Email jobs completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[email-jobs] Fatal error:', error);
    return res.status(500).json({
      error: 'Email jobs failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      results,
    });
  }
}
