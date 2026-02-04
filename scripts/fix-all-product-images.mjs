// scripts/fix-all-product-images.mjs
// Fixes all products with blurry/low-res images by matching with CSV data
// Run with: node scripts/fix-all-product-images.mjs

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// Simple CSV parser for our specific format
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function buildConnectionConfig() {
  if (process.env.POSTGRES_URL) {
    return {
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    database: process.env.POSTGRES_DATABASE || 'postgres',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };
}

async function main() {
  const pool = new Pool(buildConnectionConfig());

  try {
    // Load CSV data
    const productsCsv = fs.readFileSync('vendor_products_clean.csv', 'utf-8');
    const imagesCsv = fs.readFileSync('vendor_product_images_clean.csv', 'utf-8');

    const csvProducts = parseCSV(productsCsv);
    const csvImages = parseCSV(imagesCsv);

    console.log(`Loaded ${csvProducts.length} products and ${csvImages.length} images from CSV`);

    // Create lookup map: product name -> CSV product id
    const csvProductByName = {};
    csvProducts.forEach(p => {
      const key = `${p.series}-${p.name}`.toLowerCase();
      csvProductByName[key] = p.id;
    });

    // Create lookup: CSV product id -> images
    const csvImagesByProductId = {};
    csvImages.forEach(img => {
      if (!csvImagesByProductId[img.vendor_product_id]) {
        csvImagesByProductId[img.vendor_product_id] = [];
      }
      csvImagesByProductId[img.vendor_product_id].push(img);
    });

    // Find all DB products with bad images
    const badProducts = await pool.query(`
      SELECT DISTINCT vp.id, vp.name, vp.series
      FROM vendor_products vp
      JOIN vendor_product_images vpi ON vpi.vendor_product_id = vp.id
      WHERE vpi.url LIKE '%blur_%'
         OR vpi.url LIKE '%/v1/fill/w_100%'
         OR vpi.url LIKE '%/v1/fill/w_50%'
         OR vpi.url LIKE '%/v1/fill/w_41%'
         OR vpi.url LIKE '%,h_60,%'
         OR vpi.url LIKE '%,h_20,%'
    `);

    console.log(`\nFound ${badProducts.rows.length} products with bad images to fix\n`);

    let fixed = 0;
    let skipped = 0;

    for (const dbProduct of badProducts.rows) {
      // Normalize series name for matching
      let seriesForLookup = dbProduct.series;
      if (seriesForLookup === 'Contract Series') seriesForLookup = 'Contract';
      if (seriesForLookup === 'Craftsman Series') seriesForLookup = 'Craftsman';

      const lookupKey = `${seriesForLookup}-${dbProduct.name}`.toLowerCase();
      const csvProductId = csvProductByName[lookupKey];

      if (!csvProductId) {
        console.log(`⚠️  No CSV match for: ${dbProduct.series} - ${dbProduct.name} (key: ${lookupKey})`);
        skipped++;
        continue;
      }

      const csvImagesForProduct = csvImagesByProductId[csvProductId];
      if (!csvImagesForProduct || csvImagesForProduct.length === 0) {
        console.log(`⚠️  No CSV images for: ${dbProduct.series} - ${dbProduct.name}`);
        skipped++;
        continue;
      }

      // Delete existing bad images
      await pool.query('DELETE FROM vendor_product_images WHERE vendor_product_id = $1', [dbProduct.id]);

      // Insert correct images from CSV
      for (const csvImg of csvImagesForProduct) {
        await pool.query(`
          INSERT INTO vendor_product_images (vendor_product_id, url, alt, is_primary, sort_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          dbProduct.id,
          csvImg.url,
          csvImg.alt,
          csvImg.is_primary === 'true',
          parseInt(csvImg.sort_order) || 0
        ]);
      }

      console.log(`✓ Fixed: ${dbProduct.series} - ${dbProduct.name} (${csvImagesForProduct.length} images)`);
      fixed++;
    }

    console.log(`\n========================================`);
    console.log(`Fixed: ${fixed} products`);
    console.log(`Skipped: ${skipped} products`);
    console.log(`========================================`);

    // Verify no more bad images
    const remaining = await pool.query(`
      SELECT COUNT(*) as count
      FROM vendor_product_images
      WHERE url LIKE '%blur_%'
         OR url LIKE '%/v1/fill/w_100%'
         OR url LIKE '%/v1/fill/w_50%'
         OR url LIKE '%/v1/fill/w_41%'
         OR url LIKE '%,h_60,%'
         OR url LIKE '%,h_20,%'
    `);

    if (parseInt(remaining.rows[0].count) === 0) {
      console.log(`\n✓ All images are now high quality!`);
    } else {
      console.log(`\n⚠️  ${remaining.rows[0].count} bad images still remain`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
