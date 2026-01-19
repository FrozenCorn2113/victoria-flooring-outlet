// scripts/localize-harbinger-images.js
// Usage: LOCAL_IMAGE_STORE=true node scripts/localize-harbinger-images.js

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL;
const config = connectionString
  ? { connectionString, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.POSTGRES_HOST,
      port: 5432,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false },
    };

const pool = new Pool(config);

(async () => {
  const { downloadImageToPublic } = await import('../lib/harbinger/image-store.js');
  const result = await pool.query(
    `SELECT id, url
     FROM vendor_product_images
     WHERE url LIKE 'http%'`
  );

  let updated = 0;
  for (const row of result.rows) {
    try {
      const localUrl = await downloadImageToPublic(row.url);
      if (localUrl && localUrl !== row.url) {
        await pool.query(
          `UPDATE vendor_product_images SET url = $1 WHERE id = $2`,
          [localUrl, row.id]
        );
        updated += 1;
      }
    } catch (error) {
      console.warn(`Failed to download ${row.url}: ${error.message}`);
    }
  }

  console.log(JSON.stringify({ updated }, null, 2));
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
