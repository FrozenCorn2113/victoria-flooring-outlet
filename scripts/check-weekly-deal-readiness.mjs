// scripts/check-weekly-deal-readiness.mjs
// Checks all products for weekly deal readiness (images + descriptions)
// Run with: node scripts/check-weekly-deal-readiness.mjs

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const marketingData = JSON.parse(fs.readFileSync('./data/vendor_product_marketing.json', 'utf-8'));

function normalizeSeriesForSlug(series) {
  if (!series) return '';
  return series.replace(/\s+series$/i, '').trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
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
    // Get ALL vendor products (potential future deals)
    const products = await pool.query(`
      SELECT
        vp.id,
        vp.name,
        vp.series,
        vp.vendor,
        vp.description,
        (SELECT COUNT(*) FROM vendor_product_images WHERE vendor_product_id = vp.id) as image_count,
        (SELECT url FROM vendor_product_images WHERE vendor_product_id = vp.id ORDER BY is_primary DESC, sort_order LIMIT 1) as primary_image
      FROM vendor_products vp
      WHERE vp.active = true
      ORDER BY vp.series, vp.name
    `);

    let good = 0;
    let missingImages = [];
    let badImages = [];
    let missingDescriptions = [];

    products.rows.forEach(row => {
      const slug = slugify(row.vendor + '-' + normalizeSeriesForSlug(row.series) + '-' + row.name);
      const hasMarketing = marketingData[slug] !== undefined;
      const imageCount = parseInt(row.image_count);
      const hasBadImage = row.primary_image && (
        row.primary_image.includes('blur_') ||
        row.primary_image.includes('/v1/fill/w_100') ||
        row.primary_image.includes('/v1/fill/w_50') ||
        row.primary_image.includes('/v1/fill/w_41') ||
        row.primary_image.includes(',h_60,') ||
        row.primary_image.includes(',h_20,')
      );

      if (imageCount === 0) {
        missingImages.push({ id: row.id, name: row.series + ' - ' + row.name, slug });
      } else if (hasBadImage) {
        badImages.push({ id: row.id, name: row.series + ' - ' + row.name, url: row.primary_image.substring(0, 80) });
      }

      if (!hasMarketing) {
        missingDescriptions.push({ id: row.id, name: row.series + ' - ' + row.name, slug });
      }

      if (imageCount > 0 && !hasBadImage && hasMarketing) {
        good++;
      }
    });

    console.log('='.repeat(60));
    console.log('VENDOR PRODUCTS READINESS CHECK');
    console.log('='.repeat(60));
    console.log(`Total products: ${products.rows.length}`);
    console.log(`Ready for weekly deal: ${good}`);
    console.log();

    if (badImages.length > 0) {
      console.log('❌ PRODUCTS WITH BAD IMAGES (' + badImages.length + '):');
      badImages.forEach(p => console.log('   - ' + p.name));
      console.log();
    }

    if (missingImages.length > 0) {
      console.log('⚠️  PRODUCTS WITH NO IMAGES (' + missingImages.length + '):');
      missingImages.slice(0, 10).forEach(p => console.log('   - ' + p.name));
      if (missingImages.length > 10) console.log('   ... and ' + (missingImages.length - 10) + ' more');
      console.log();
    }

    if (missingDescriptions.length > 0) {
      console.log('⚠️  PRODUCTS WITHOUT MARKETING DESCRIPTIONS (' + missingDescriptions.length + '):');
      missingDescriptions.slice(0, 20).forEach(p => console.log('   - ' + p.name + ' (slug: ' + p.slug + ')'));
      if (missingDescriptions.length > 20) console.log('   ... and ' + (missingDescriptions.length - 20) + ' more');
      console.log();
    }

    if (badImages.length === 0 && missingImages.length === 0 && missingDescriptions.length === 0) {
      console.log('✅ ALL PRODUCTS ARE READY FOR WEEKLY DEALS!');
    } else {
      console.log('─'.repeat(60));
      console.log('SUMMARY:');
      if (badImages.length > 0) console.log(`  ❌ ${badImages.length} products have bad/blurry images`);
      if (missingImages.length > 0) console.log(`  ⚠️  ${missingImages.length} products have no images`);
      if (missingDescriptions.length > 0) console.log(`  ⚠️  ${missingDescriptions.length} products missing marketing descriptions`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
