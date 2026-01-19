import { getLatestWeeklyDealFromDb, getWeeklyDealFromDb } from './harbinger/sync';

/**
 * Get the current weekly deal product (server-only).
 * @returns {Object|null} The product marked as weekly deal, or null if none found
 */
export async function getWeeklyDeal() {
  try {
    // Log environment info for debugging
    if (!process.env.POSTGRES_URL && !process.env.POSTGRES_HOST) {
      console.error('[getWeeklyDeal] No database credentials found. Check POSTGRES_URL or POSTGRES_HOST env vars.');
      return null;
    }

    const dbDeal = await getWeeklyDealFromDb();
    if (dbDeal) {
      console.log(`[getWeeklyDeal] Found active deal: ${dbDeal.name}`);
      return dbDeal;
    }

    console.log('[getWeeklyDeal] No active deal found, trying fallback to latest deal');
    const latestDeal = await getLatestWeeklyDealFromDb();
    if (latestDeal) {
      console.log(`[getWeeklyDeal] Using fallback deal: ${latestDeal.name}`);
      return latestDeal;
    }

    console.log('[getWeeklyDeal] No deals found in database');
  } catch (error) {
    console.error('[getWeeklyDeal] Failed to load weekly deal from DB:', {
      message: error.message,
      code: error.code,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
    });
  }
  return null;
}
