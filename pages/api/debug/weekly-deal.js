// pages/api/debug/weekly-deal.js
// Diagnostic endpoint to debug weekly deal issues
// Access: /api/debug/weekly-deal?secret=YOUR_SECRET

import { query } from '@/lib/db';

export default async function handler(req, res) {
  // Basic security - require a secret in production
  const secret = req.query.secret;
  const expectedSecret = process.env.CRON_PUBLIC_SECRET || process.env.ADMIN_SECRET_KEY;

  if (process.env.NODE_ENV === 'production' && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 30) + '...',
    hasPostgresHost: !!process.env.POSTGRES_HOST,
    postgresHost: process.env.POSTGRES_HOST,
  };

  try {
    // Test database connection
    const tzResult = await query('SHOW timezone');
    diagnostics.dbTimezone = tzResult.rows[0]?.TimeZone;
    diagnostics.dbConnected = true;

    // Get current time from DB
    const timeResult = await query('SELECT NOW() as db_now');
    diagnostics.dbTime = timeResult.rows[0]?.db_now;
    diagnostics.serverTime = new Date().toISOString();

    // Check weekly deals table
    const dealsResult = await query(`
      SELECT
        wd.id,
        wd.is_active,
        wd.starts_at,
        wd.ends_at,
        vp.name as product_name,
        wd.starts_at <= NOW() as has_started,
        wd.ends_at > NOW() as not_ended,
        (wd.is_active = true AND wd.starts_at <= NOW() AND wd.ends_at > NOW()) as is_current
      FROM weekly_deals wd
      JOIN vendor_products vp ON vp.id = wd.vendor_product_id
      ORDER BY wd.starts_at DESC
      LIMIT 5
    `);
    diagnostics.weeklyDeals = dealsResult.rows;

    // Check which deal would be returned by getWeeklyDealFromDb
    const currentDealResult = await query(`
      SELECT
        wd.id as weekly_deal_id,
        vp.name,
        vp.vendor,
        vp.series
      FROM weekly_deals wd
      JOIN vendor_products vp ON vp.id = wd.vendor_product_id
      WHERE wd.is_active = true
        AND wd.starts_at <= NOW()
        AND wd.ends_at > NOW()
      ORDER BY wd.starts_at DESC
      LIMIT 1
    `);
    diagnostics.currentDeal = currentDealResult.rows[0] || null;

    // Check fallback query (getLatestWeeklyDealFromDb)
    const latestDealResult = await query(`
      SELECT
        wd.id as weekly_deal_id,
        vp.name,
        vp.vendor,
        vp.series
      FROM weekly_deals wd
      JOIN vendor_products vp ON vp.id = wd.vendor_product_id
      ORDER BY wd.starts_at DESC
      LIMIT 1
    `);
    diagnostics.latestDeal = latestDealResult.rows[0] || null;

  } catch (error) {
    diagnostics.dbConnected = false;
    diagnostics.dbError = error.message;
    diagnostics.dbErrorCode = error.code;
    diagnostics.dbErrorStack = error.stack?.split('\n').slice(0, 5);
  }

  return res.status(200).json(diagnostics);
}
