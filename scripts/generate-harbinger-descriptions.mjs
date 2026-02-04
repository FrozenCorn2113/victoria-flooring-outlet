import dotenv from 'dotenv';
import { query } from '../lib/db.js';

dotenv.config({ path: '.env.local' });
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING;
}

const SERIES_COPY = {
  Contract: (features) =>
    [
      `Commercial-grade glue-down vinyl built for high-traffic installs${features}.`,
      'Harbinger 4S coating and realistic embossing deliver scratch resistance with a clean, professional look.',
    ],
  Craftsman: (features) =>
    [
      `Craftsman balances design and durability in a glue-down format${features}.`,
      'Realistic textures and Harbinger 4S coating make it a dependable choice for busy homes or light commercial spaces.',
    ],
  Essentials: (features) =>
    [
      `Essentials focuses on versatile neutrals with straightforward glue-down performance${features}.`,
      'Clean visuals and 4S coating make it a go-to option for fast, budget-smart renovations.',
    ],
  'Signature Acoustic Click': (features) =>
    [
      `Signature Acoustic Click delivers quiet comfort with a floating install and cork-backed construction${features}.`,
      'Premium wear layer and realistic embossing give a high-end wood or stone look without the noise.',
    ],
  'Harbinger Acoustic Click': (features) =>
    [
      `Harbinger Acoustic Click pairs a composite core with cork backing for quieter rooms and easy floating installs${features}.`,
      'High-gloss and textured visuals are protected by Harbinger’s 4S coating for long-term durability.',
    ],
  'The Quiet Zone': (features) =>
    [
      `The Quiet Zone combines an IXPE acoustic layer with durable glue-down performance${features}.`,
      'Designed for multi-family or busy spaces, it delivers realistic embossing with dependable 4S protection.',
    ],
};

const getSpec = (specs, labels) => {
  if (!specs) return null;
  const normalized = {};
  Object.entries(specs).forEach(([key, value]) => {
    normalized[String(key).toLowerCase()] = value;
  });
  for (const label of labels) {
    const value = normalized[label.toLowerCase()];
    if (value) return String(value);
  }
  return null;
};

const buildFeatureSnippet = (specs) => {
  const wearLayer = getSpec(specs, ['Wear Layer']);
  const application = getSpec(specs, ['Application']);
  const thickness = getSpec(specs, ['Thickness']);
  const parts = [];
  if (application) parts.push(application.toLowerCase());
  if (wearLayer) parts.push(`${wearLayer} wear layer`);
  if (thickness) parts.push(`${thickness} thickness`);
  if (parts.length === 0) return '';
  return ` with ${parts.join(', ')}`;
};

const toTwoSentences = (lines) => lines.filter(Boolean).slice(0, 2).join(' ');

async function run() {
  const result = await query(
    `SELECT id, series, specs
     FROM vendor_products
     WHERE vendor = 'Harbinger'`,
    []
  );

  let updated = 0;
  for (const row of result.rows) {
    const series = row.series;
    const builder = SERIES_COPY[series];
    if (!builder) continue;

    const specs = row.specs || null;
    const featureSnippet = buildFeatureSnippet(specs);
    const description = toTwoSentences(builder(featureSnippet));

    await query(`UPDATE vendor_products SET description = $1 WHERE id = $2`, [
      description,
      row.id,
    ]);
    updated += 1;
  }

  console.log(`Updated ${updated} product descriptions.`);
}

run().catch((error) => {
  console.error('Description generation failed:', error);
  process.exit(1);
});
