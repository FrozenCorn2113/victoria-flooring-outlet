import fs from 'fs';
import dotenv from 'dotenv';
import { query } from '../lib/db.js';

dotenv.config({ path: '.env.local' });
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(contents) {
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function toBoolean(value) {
  return value === 'true';
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function importProducts(products) {
  for (const row of products) {
    const specs = row.specs ? JSON.parse(row.specs) : null;
    const features = row.features ? JSON.parse(row.features) : null;
    const coverage = toNumber(row.coverage_sqft_per_box);

    await query(
      `INSERT INTO vendor_products
        (id, vendor, series, name, slug, description, specs, warranty, features, source_url, source_updated_at, active, created_at, updated_at, category, sku, coverage_sqft_per_box)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        Number(row.id),
        row.vendor,
        row.series,
        row.name,
        row.slug,
        row.description || null,
        specs,
        row.warranty || null,
        features,
        row.source_url || null,
        row.source_updated_at || null,
        toBoolean(row.active),
        row.created_at || null,
        row.updated_at || null,
        row.category || null,
        row.sku || null,
        coverage,
      ]
    );
  }
}

async function importImages(images) {
  for (const row of images) {
    await query(
      `INSERT INTO vendor_product_images
        (id, vendor_product_id, url, alt, is_primary, sort_order, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        Number(row.id),
        Number(row.vendor_product_id),
        row.url,
        row.alt || null,
        toBoolean(row.is_primary),
        Number(row.sort_order),
        row.created_at || null,
      ]
    );
  }
}

async function run() {
  const productsCsv = fs.readFileSync('vendor_products_clean.csv', 'utf8');
  const imagesCsv = fs.readFileSync('vendor_product_images_clean.csv', 'utf8');
  const products = parseCsv(productsCsv);
  const images = parseCsv(imagesCsv);

  await query('BEGIN');
  try {
    await query('TRUNCATE vendor_product_images, vendor_products RESTART IDENTITY CASCADE');
    await importProducts(products);
    await importImages(images);
    await query(`SELECT setval('vendor_products_id_seq', (SELECT MAX(id) FROM vendor_products))`);
    await query(`SELECT setval('vendor_product_images_id_seq', (SELECT MAX(id) FROM vendor_product_images))`);
    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }

  console.log(`Imported ${products.length} products and ${images.length} images.`);
}

run().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
