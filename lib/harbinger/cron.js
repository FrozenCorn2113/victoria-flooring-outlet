// lib/harbinger/cron.js
// Shared cron logic for syncing and rotating Harbinger deals

import { syncHarbingerProducts } from './sync';
import { query } from '../db';

function parseOptionalNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function runHarbingerCron({ mode = 'syncAndRotate' } = {}) {
  let syncResult = null;

  if (mode !== 'rotateOnly') {
    syncResult = await syncHarbingerProducts();
  }

  if (mode === 'syncOnly') {
    return { ok: true, sync: syncResult };
  }

  const lastDeal = await query(
    `SELECT vendor_product_id
     FROM weekly_deals
     ORDER BY starts_at DESC
     LIMIT 1`,
    []
  );

  const lastId = lastDeal.rows[0]?.vendor_product_id ?? null;
  const next = await query(
    `WITH series_order AS (
       SELECT
         id,
         series,
         ROW_NUMBER() OVER (PARTITION BY series ORDER BY id ASC) AS series_index,
         CASE
           WHEN LOWER(series) LIKE '%contract%' THEN 1
           WHEN LOWER(series) LIKE '%craftsman%' THEN 2
           WHEN LOWER(series) LIKE '%essential%' THEN 3
           ELSE 4
         END AS series_rank
       FROM vendor_products
       WHERE vendor = $1 AND active = true
     ),
     ordered AS (
       SELECT
         id,
         ROW_NUMBER() OVER (ORDER BY series_index, series_rank, id ASC) AS overall_rank
       FROM series_order
     )
     SELECT id
     FROM ordered
     ORDER BY
       CASE
         WHEN overall_rank > COALESCE((SELECT overall_rank FROM ordered WHERE id = $2), 0)
         THEN 0
         ELSE 1
       END,
       overall_rank
     LIMIT 1`,
    ['Harbinger', lastId]
  );
  const nextProduct = next.rows[0] || null;

  if (!nextProduct) {
    return { ok: true, sync: syncResult, message: 'No vendor products found.' };
  }

  const pricePerSqFt =
    parseOptionalNumber(process.env.DEFAULT_WEEKLY_PRICE_PER_SQFT) ?? 4.99;
  const compareAtPerSqFt =
    parseOptionalNumber(process.env.DEFAULT_WEEKLY_COMPARE_AT_PER_SQFT) ?? 6.49;
  const now = new Date();
  const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `UPDATE weekly_deals
     SET is_active = false
     WHERE is_active = true`,
    []
  );

  const insert = await query(
    `INSERT INTO weekly_deals
      (vendor_product_id, starts_at, ends_at, price_per_sqft, compare_at_per_sqft, currency, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, vendor_product_id, starts_at, ends_at, price_per_sqft, compare_at_per_sqft`,
    [
      nextProduct.id,
      now,
      endsAt,
      pricePerSqFt,
      compareAtPerSqFt,
      'CAD',
    ]
  );

  return {
    ok: true,
    sync: syncResult,
    deal: insert.rows[0],
  };
}
