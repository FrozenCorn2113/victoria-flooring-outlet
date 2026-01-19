import { getLatestWeeklyDealFromDb, getWeeklyDealFromDb } from './harbinger/sync';

/**
 * Get the current weekly deal product (server-only).
 * @returns {Object|null} The product marked as weekly deal, or null if none found
 */
export async function getWeeklyDeal() {
  try {
    const dbDeal = await getWeeklyDealFromDb();
    if (dbDeal) return dbDeal;
    const latestDeal = await getLatestWeeklyDealFromDb();
    if (latestDeal) return latestDeal;
  } catch (error) {
    console.error('Failed to load weekly deal from DB:', error);
  }
  return null;
}
