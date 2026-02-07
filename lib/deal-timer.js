// lib/deal-timer.js
// Server-authoritative deal timing
// Provides accurate end times so clients don't rely on local clocks

import { query } from './db';

/**
 * Get the end time for the current active weekly deal
 * Checks deal_timers first (override), falls back to weekly_deals.ends_at
 * @returns {{ dealId: number, endsAt: string, startsAt: string } | null}
 */
export async function getActiveDealTiming() {
  const result = await query(
    `SELECT
       wd.id as deal_id,
       wd.starts_at,
       wd.ends_at,
       dt.ends_at as timer_ends_at,
       da.subscriber_visible_at,
       da.public_visible_at
     FROM weekly_deals wd
     LEFT JOIN deal_timers dt ON dt.weekly_deal_id = wd.id
     LEFT JOIN deal_access da ON da.weekly_deal_id = wd.id
     WHERE wd.is_active = true
       AND wd.starts_at <= NOW()
       AND wd.ends_at > NOW()
     ORDER BY wd.starts_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    dealId: row.deal_id,
    startsAt: row.starts_at,
    endsAt: row.timer_ends_at || row.ends_at,
    subscriberVisibleAt: row.subscriber_visible_at || null,
    publicVisibleAt: row.public_visible_at || null,
  };
}

/**
 * Get server time + deal timing in one call
 * Used by the /api/deal-timer endpoint and CountdownTimer component
 */
export async function getServerTime() {
  const dealTiming = await getActiveDealTiming();
  const serverTime = new Date().toISOString();

  if (!dealTiming) {
    return {
      serverTime,
      dealEndsAt: null,
      remainingMs: 0,
      dealActive: false,
      subscriberVisibleAt: null,
      publicVisibleAt: null,
      isSubscriberWindow: false,
    };
  }

  const endsAt = new Date(dealTiming.endsAt);
  const now = new Date();
  const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());

  // Determine if we're in the subscriber-only window
  let isSubscriberWindow = false;
  if (dealTiming.subscriberVisibleAt && dealTiming.publicVisibleAt) {
    const subVisible = new Date(dealTiming.subscriberVisibleAt);
    const pubVisible = new Date(dealTiming.publicVisibleAt);
    isSubscriberWindow = now >= subVisible && now < pubVisible;
  }

  return {
    serverTime,
    dealEndsAt: dealTiming.endsAt,
    remainingMs,
    dealActive: remainingMs > 0,
    subscriberVisibleAt: dealTiming.subscriberVisibleAt,
    publicVisibleAt: dealTiming.publicVisibleAt,
    isSubscriberWindow,
  };
}

/**
 * Check if a specific deal has expired
 */
export async function isDealExpired(weeklyDealId) {
  const result = await query(
    `SELECT id FROM weekly_deals
     WHERE id = $1
       AND is_active = true
       AND starts_at <= NOW()
       AND ends_at > NOW()`,
    [weeklyDealId]
  );
  return result.rows.length === 0;
}
