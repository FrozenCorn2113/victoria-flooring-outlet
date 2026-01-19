import { getWeeklyDealFromDb } from './harbinger/sync';

/**
 * Get the current weekly deal product (server-only).
 * @returns {Object|null} The product marked as weekly deal, or null if none found
 */
export async function getWeeklyDeal() {
  try {
    const dbDeal = await getWeeklyDealFromDb();
    if (dbDeal) return dbDeal;
  } catch (error) {
    console.error('Failed to load weekly deal from DB:', error);
  }
  return null;
}
