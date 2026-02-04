// scripts/fix-coventry-spice-images.mjs
// Run with: node scripts/fix-coventry-spice-images.mjs

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

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
    // First check current images
    const current = await pool.query(
      'SELECT * FROM vendor_product_images WHERE vendor_product_id = 165'
    );
    console.log('Current images for vendor_product_id 165:', current.rows);

    // Delete existing images
    await pool.query('DELETE FROM vendor_product_images WHERE vendor_product_id = 165');
    console.log('Deleted existing images');

    // Insert correct images from Harbinger website
    const insertResult = await pool.query(`
      INSERT INTO vendor_product_images (vendor_product_id, url, alt, is_primary, sort_order)
      VALUES
        (165, 'https://static.wixstatic.com/media/6fde1e_9cf244fa691d48e3b73d0487bec01185~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg', 'Coventry Spice - Installed Room View', true, 0),
        (165, 'https://static.wixstatic.com/media/6fde1e_48759ff19a4749f39d802e7f6aed12b5~mv2.png/v1/fit/w_500,h_500,q_90/file.png', 'Contract Series - Coventry Spice', false, 1),
        (165, 'https://static.wixstatic.com/media/6fde1e_d50e2c4302014db280184607de6f6ffb~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg', 'Coventry Spice - Single Plank', false, 2)
      RETURNING *
    `);
    console.log('Inserted new images:', insertResult.rows);

    console.log('\nDone! Refresh the deal of the week page to see the updated images.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
