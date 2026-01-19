// lib/harbinger/import-csv.js
// Import Harbinger products from a CSV export into Postgres

import fs from 'fs';
import { query } from '../db.js';
import { downloadImageToPublic } from './image-store.js';

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
  const lines = contents.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function toNumber(value) {
  if (!value) return null;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function upgradeWixImageUrl(url, width = 1600, quality = 85) {
  if (!url) return null;
  return url.replace(
    /\/v1\/fit\/w_\d+,h_\d+,q_\d+\//,
    `/v1/fit/w_${width},h_${width},q_${quality}/`
  );
}

function splitImageUrls(value) {
  if (!value) return [];
  return value.split('|').map(url => url.trim()).filter(Boolean);
}

async function upsertProduct(row) {
  const vendor = row.brand || 'Harbinger';
  const series = row.collection_name || row.category || null;
  const category = row.category || null;
  const name = row.product_name;
  const sku = row.sku || null;
  const slug = slugify(`${vendor}-${series || ''}-${name}`);
  const coverageSqFtPerBox = toNumber(row.box_coverage_sqft);

  let specs = null;
  if (row.raw_specs_json) {
    try {
      specs = JSON.parse(row.raw_specs_json);
    } catch (error) {
      specs = { raw: row.raw_specs_json };
    }
  }

  if (!specs) {
    specs = {};
  }

  const additionalSpecs = {
    plankWidthIn: toNumber(row.plank_width_in),
    plankLengthIn: toNumber(row.plank_length_in),
    thicknessMm: toNumber(row.thickness_mm),
    wearLayerMm: toNumber(row.wear_layer_mm),
    edgeType: row.edge_type || null,
    construction: row.construction || null,
    application: row.application || null,
    coating: row.coating || null,
    texture: row.texture || null,
    gradeLevel: row.grade_level || null,
    productUrl: row.product_url || null,
  };

  specs = { ...additionalSpecs, ...specs };

  const result = await query(
    `INSERT INTO vendor_products
      (vendor, category, series, name, sku, slug, description, coverage_sqft_per_box, specs, source_url, source_updated_at, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, true)
     ON CONFLICT (slug)
     DO UPDATE SET
       vendor = EXCLUDED.vendor,
       category = EXCLUDED.category,
       series = EXCLUDED.series,
       name = EXCLUDED.name,
       sku = EXCLUDED.sku,
       description = EXCLUDED.description,
       coverage_sqft_per_box = EXCLUDED.coverage_sqft_per_box,
       specs = EXCLUDED.specs,
       source_url = EXCLUDED.source_url,
       source_updated_at = CURRENT_TIMESTAMP,
       active = true
     RETURNING id`,
    [
      vendor,
      category,
      series,
      name,
      sku,
      slug,
      row.application || null,
      coverageSqFtPerBox,
      JSON.stringify(specs),
      row.product_url || null,
    ]
  );

  return result.rows[0].id;
}

function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

async function replaceImages(productId, row) {
  await query(`DELETE FROM vendor_product_images WHERE vendor_product_id = $1`, [productId]);

  const heroSource = row.hero_image_url_hires || row.hero_image_url;
  const thumbSource = row.thumbnail_image_urls_hires || row.thumbnail_image_urls;
  const heroUrl = upgradeWixImageUrl(heroSource, 1600, 85);
  const thumbnailUrls = splitImageUrls(thumbSource).map((url) =>
    upgradeWixImageUrl(url, 1600, 85)
  );
  const urls = uniqueUrls([heroUrl, ...thumbnailUrls]).filter(Boolean);

  let sortOrder = 0;
  for (const url of urls) {
    const finalUrl = process.env.LOCAL_IMAGE_STORE === 'true'
      ? await downloadImageToPublic(url)
      : url;
    await query(
      `INSERT INTO vendor_product_images
        (vendor_product_id, url, alt, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, finalUrl, row.product_name || null, sortOrder === 0, sortOrder]
    );
    sortOrder += 1;
  }

  return urls.length;
}

export async function importHarbingerCsv(csvPath) {
  const contents = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(contents);
  const summary = { totalProducts: 0, totalImages: 0 };

  for (const row of rows) {
    if (!row.product_name) continue;
    const productId = await upsertProduct(row);
    const imageCount = await replaceImages(productId, row);
    summary.totalProducts += 1;
    summary.totalImages += imageCount;
  }

  return summary;
}
