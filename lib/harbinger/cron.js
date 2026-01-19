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

  let nextProduct;
  if (lastDeal.rows.length > 0) {
    const lastId = lastDeal.rows[0].vendor_product_id;
    const next = await query(
      `SELECT id
       FROM vendor_products
       WHERE vendor = $1 AND active = true AND id > $2
       ORDER BY id ASC
       LIMIT 1`,
      ['Harbinger', lastId]
    );
    nextProduct = next.rows[0] || null;
  }

  if (!nextProduct) {
    const first = await query(
      `SELECT id
       FROM vendor_products
       WHERE vendor = $1 AND active = true
       ORDER BY id ASC
       LIMIT 1`,
      ['Harbinger']
    );
    nextProduct = first.rows[0] || null;
  }

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
