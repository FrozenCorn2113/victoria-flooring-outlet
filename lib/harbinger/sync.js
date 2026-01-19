// lib/harbinger/sync.js
// Scrape Harbinger series pages and sync to Postgres

import { query } from '../db.js';

const BASE_URL = 'https://www.harbingerfloors.com';

const SERIES_PAGES = [
  {
    series: 'Contract Series',
    url: `${BASE_URL}/contract`,
    fallbackDescription: 'Durable, stylish and low maintenance glue down vinyl at contractor pricing.',
  },
  {
    series: 'Craftsman Series',
    url: `${BASE_URL}/craftsman`,
    fallbackDescription: 'Where style, design, performance and price come together in harmony.',
  },
  {
    series: 'Essentials',
    url: `${BASE_URL}/essentials`,
    fallbackDescription: 'Essentials neutral palette is always in style.',
  },
];

const NAV_LABELS = new Set([
  'home',
  'products',
  'contract',
  'craftsman',
  'essentials',
  'the quiet zone',
  'signature acoustic click',
  'harbinger acoustic click',
  'harbinger rubber',
  'adhesives, floor prep & more',
  'nosings & transitions',
  'visualizer',
  'featured projects',
  'resources',
  'sustainability',
  'contact',
  'more',
  'find a rep',
  'harbinger origin',
  'linkedin',
  'harbinger instagram',
  'harbinger facebook',
  'harbinger twitter',
  'bay resource group',
]);

const IMAGE_EXCLUDES = [
  'logo',
  'hpd',
  'csa',
  'epd',
  'warranty',
  'waterproof',
  'underfoot',
  'radiantheat',
  'recyclable',
  'dent-resistant',
  'linkedin',
  'instagram',
  'facebook',
  'twitter',
  'mindful',
  'leed',
  'floorscore',
  'origin',
  'csc',
  'scs',
];

function normalizeText(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripHtml(html) {
  return normalizeText(html.replace(/<[^>]*>/g, ' '));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function extractFirstParagraphAfterHeading(html, headingRegex) {
  const headingMatch = html.match(headingRegex);
  if (!headingMatch) return null;

  const afterHeading = html.slice(headingMatch.index + headingMatch[0].length);
  const paragraphMatch = afterHeading.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!paragraphMatch) return null;

  return stripHtml(paragraphMatch[1]);
}

function extractDataSheetUrl(html) {
  const match = html.match(/<a[^>]+href="([^"]+)"[^>]*>[^<]*click here[^<]*<\/a>/i);
  return match ? toAbsoluteUrl(match[1]) : null;
}

function extractFeatureBadges(html) {
  const badges = new Set();
  const imgMatches = html.matchAll(/<img[^>]+alt="([^"]+)"[^>]*>/gi);
  for (const match of imgMatches) {
    const alt = normalizeText(match[1]);
    if (!alt) continue;
    if (alt.length < 3) continue;
    if (NAV_LABELS.has(alt.toLowerCase())) continue;
    if (/series|logo/i.test(alt)) continue;
    if (/warranty|waterproof|recyclable|radiant|underfoot|dent|hpdp|epd|csa/i.test(alt)) {
      badges.add(alt);
    }
  }
  return Array.from(badges);
}

function extractSeriesImage(html) {
  const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    const alt = normalizeText(match[2] || '');
    const lowerSrc = src.toLowerCase();
    if (IMAGE_EXCLUDES.some(token => lowerSrc.includes(token))) {
      continue;
    }
    if (alt && /series|main image/i.test(alt)) {
      return {
        url: toAbsoluteUrl(src),
        alt: alt || 'Harbinger series image',
      };
    }
  }

  for (const match of imgMatches) {
    const src = match[1];
    const alt = normalizeText(match[2] || '');
    const lowerSrc = src.toLowerCase();
    if (IMAGE_EXCLUDES.some(token => lowerSrc.includes(token))) {
      continue;
    }
    return {
      url: toAbsoluteUrl(src),
      alt: alt || 'Harbinger series image',
    };
  }

  return null;
}

function extractProductNames(html) {
  const listMatch = html.match(/click here[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
  const listHtml = listMatch ? listMatch[1] : html;
  const names = [];
  const liMatches = listHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const match of liMatches) {
    const text = stripHtml(match[1]);
    const lower = text.toLowerCase();
    if (!text || NAV_LABELS.has(lower)) continue;
    if (text.length < 2 || text.length > 80) continue;
    names.push(text);
  }
  return Array.from(new Set(names));
}

function extractProductEntries(html) {
  const entries = [];
  const seen = new Set();
  const linkMatches = html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of linkMatches) {
    const href = match[1];
    if (!href || !href.toLowerCase().includes('/product-page')) continue;

    let name = stripHtml(match[2] || '');
    if (!name) {
      const altMatch = match[2]?.match(/alt="([^"]+)"/i);
      if (altMatch) {
        name = normalizeText(altMatch[1]);
      }
    }
    if (!name) continue;

    const lower = name.toLowerCase();
    if (NAV_LABELS.has(lower)) continue;

    const url = toAbsoluteUrl(href);
    const key = `${slugify(name)}|${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({ name, url });
  }

  if (entries.length > 0) return entries;

  const names = extractProductNames(html);
  return names.map((name) => ({ name, url: null }));
}

function htmlToTextLines(html) {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|td|h[1-6])>/gi, '\n');
  const withoutTags = withBreaks.replace(/<[^>]*>/g, '\n');
  return withoutTags
    .split('\n')
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0);
}

function extractSpecValueFromLines(lines, label) {
  const lowerLabel = label.toLowerCase();
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower === lowerLabel) return lines[i + 1] || null;
    if (lower.startsWith(`${lowerLabel}:`)) {
      return line.slice(label.length + 1).trim();
    }
    if (lower.startsWith(`${lowerLabel} `)) {
      const value = line.slice(label.length).trim();
      if (value) return value;
    }
  }
  return null;
}

function sanitizeSku(value) {
  if (!value) return null;
  const normalized = normalizeText(value).toUpperCase();
  if (normalized.length < 2 || normalized.length > 100) return null;
  return normalized;
}

function extractSkuFromLines(lines) {
  for (const line of lines) {
    const match = line.match(/sku\s*[:#]?\s*([a-z0-9][a-z0-9\- ]{1,40})/i);
    if (match) {
      return sanitizeSku(match[1]);
    }
  }
  return null;
}

function parseCoverageSqFt(value) {
  if (!value) return null;
  const match = String(value).match(/([0-9]+(?:\.[0-9]+)?)\s*sq\.?\s*ft/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractProductSpecs(html) {
  const lines = htmlToTextLines(html);
  const labels = [
    { label: 'Dimensions', key: 'dimensions' },
    { label: 'Box Coverage', key: 'boxCoverage' },
    { label: 'Thickness', key: 'thickness' },
    { label: 'Wear Layer', key: 'wearLayer' },
    { label: 'Edge', key: 'edge' },
    { label: 'Construction', key: 'construction' },
    { label: 'Application', key: 'application' },
    { label: 'Coating', key: 'coating' },
    { label: 'Textures', key: 'textures' },
    { label: 'Texture', key: 'textures' },
    { label: 'Grade Level', key: 'gradeLevel' },
    { label: 'Grade', key: 'gradeLevel' },
    { label: 'Acoustic Properties', key: 'acousticProperties' },
  ];

  const details = {};
  for (const { label, key } of labels) {
    if (details[key]) continue;
    const value = extractSpecValueFromLines(lines, label);
    if (value) details[key] = value;
  }

  const sku = extractSkuFromLines(lines);
  const coverageSqFtPerBox = parseCoverageSqFt(details.boxCoverage);

  return {
    details: Object.keys(details).length > 0 ? details : null,
    sku,
    coverageSqFtPerBox,
  };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'VictoriaFlooringOutletBot/1.0',
      'Accept-Language': 'en-CA,en;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}

async function upsertProduct({
  vendor,
  series,
  name,
  description,
  specs,
  features,
  sourceUrl,
  sku,
  coverageSqFtPerBox,
}) {
  const slug = slugify(`${vendor}-${series}-${name}`);
  const result = await query(
    `INSERT INTO vendor_products
      (vendor, series, name, slug, description, specs, features, source_url, source_updated_at, active, sku, coverage_sqft_per_box)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true, $9, $10)
     ON CONFLICT (slug)
     DO UPDATE SET
       vendor = EXCLUDED.vendor,
       series = EXCLUDED.series,
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       specs = COALESCE(EXCLUDED.specs, vendor_products.specs),
       features = COALESCE(EXCLUDED.features, vendor_products.features),
       source_url = COALESCE(EXCLUDED.source_url, vendor_products.source_url),
       source_updated_at = CURRENT_TIMESTAMP,
       active = true,
       sku = COALESCE(EXCLUDED.sku, vendor_products.sku),
       coverage_sqft_per_box = COALESCE(EXCLUDED.coverage_sqft_per_box, vendor_products.coverage_sqft_per_box)
     RETURNING id`,
    [
      vendor,
      series,
      name,
      slug,
      description,
      specs ? JSON.stringify(specs) : null,
      features ? JSON.stringify(features) : null,
      sourceUrl,
      sku,
      coverageSqFtPerBox,
    ]
  );
  return result.rows[0].id;
}

async function replaceProductImages(productId, images, options = {}) {
  if (options.preserveExisting) {
    const existing = await query(
      `SELECT COUNT(*) as count FROM vendor_product_images WHERE vendor_product_id = $1`,
      [productId]
    );
    if (Number(existing.rows[0].count) > 0) {
      return Number(existing.rows[0].count);
    }
  }

  await query(`DELETE FROM vendor_product_images WHERE vendor_product_id = $1`, [productId]);
  if (!images || images.length === 0) return 0;

  let count = 0;
  for (const image of images) {
    await query(
      `INSERT INTO vendor_product_images
        (vendor_product_id, url, alt, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, image.url, image.alt || null, image.isPrimary || false, image.sortOrder || 0]
    );
    count += 1;
  }
  return count;
}

export async function syncHarbingerProducts() {
  const summary = [];
  let totalProducts = 0;
  let totalImages = 0;

  for (const page of SERIES_PAGES) {
    const html = await fetchHtml(page.url);
    const seriesDescription =
      extractFirstParagraphAfterHeading(html, /<h2[^>]*>[\s\S]*series[\s\S]*<\/h2>/i) ||
      page.fallbackDescription;
    const dataSheetUrl = extractDataSheetUrl(html);
    const features = extractFeatureBadges(html);
    const seriesImage = extractSeriesImage(html);
    const productEntries = extractProductEntries(html);

    let seriesCount = 0;
    for (const productEntry of productEntries) {
      let productDetails = null;
      let sku = null;
      let coverageSqFtPerBox = null;
      let productPageUrl = productEntry.url;

      if (productPageUrl) {
        try {
          const productHtml = await fetchHtml(productPageUrl);
          const extracted = extractProductSpecs(productHtml);
          productDetails = extracted.details;
          sku = extracted.sku;
          coverageSqFtPerBox = extracted.coverageSqFtPerBox;
        } catch (error) {
          console.warn('Failed to fetch product details:', productPageUrl, error);
        }
      }

      const specs = {
        ...(dataSheetUrl ? { dataSheetUrl } : {}),
        ...(productPageUrl ? { productPageUrl } : {}),
        ...(productDetails ? { details: productDetails } : {}),
      };

      const productId = await upsertProduct({
        vendor: 'Harbinger',
        series: page.series,
        name: productEntry.name,
        description: seriesDescription,
        specs: Object.keys(specs).length > 0 ? specs : null,
        features: features.length > 0 ? { badges: features } : null,
        sourceUrl: productPageUrl || page.url,
        sku,
        coverageSqFtPerBox,
      });

      const imageCount = await replaceProductImages(
        productId,
        seriesImage
          ? [
              {
                url: seriesImage.url,
                alt: seriesImage.alt,
                isPrimary: true,
                sortOrder: 0,
              },
            ]
          : [],
        { preserveExisting: true }
      );

      totalProducts += 1;
      totalImages += imageCount;
      seriesCount += 1;
    }

    summary.push({
      series: page.series,
      products: seriesCount,
      dataSheetUrl,
    });
  }

  return {
    totalProducts,
    totalImages,
    summary,
  };
}

export async function getWeeklyDealFromDb() {
  const result = await query(
    `SELECT
       wd.id as weekly_deal_id,
       wd.starts_at,
       wd.ends_at,
       wd.price_per_sqft,
       wd.compare_at_per_sqft,
       wd.currency,
       vp.id as product_id,
       vp.vendor,
       vp.series,
       vp.name,
       vp.sku,
       vp.coverage_sqft_per_box,
       vp.description,
       vp.warranty,
       vp.specs,
       vp.features,
       vpi.url as image_url,
       vpi.alt as image_alt
     FROM weekly_deals wd
     JOIN vendor_products vp ON vp.id = wd.vendor_product_id
     LEFT JOIN LATERAL (
       SELECT url, alt
       FROM vendor_product_images
       WHERE vendor_product_id = vp.id
       ORDER BY is_primary DESC, sort_order ASC, id ASC
       LIMIT 1
     ) vpi ON true
     WHERE wd.is_active = true
       AND wd.starts_at <= NOW()
       AND wd.ends_at > NOW()
     ORDER BY wd.starts_at DESC
     LIMIT 1`,
    []
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: `vendor-${row.product_id}`,
    weeklyDealId: row.weekly_deal_id,
    slug: slugify(`${row.vendor}-${row.series}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    compareAtPricePerSqFt: row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    shortTagline: row.description || null,
    description: row.description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    sku: row.sku || null,
    coverageSqFtPerBox: row.coverage_sqft_per_box ? Number(row.coverage_sqft_per_box) : null,
    isWeeklyDeal: true,
  };
}

export async function getNextWeeklyDealFromDb() {
  const result = await query(
    `SELECT
       wd.id as weekly_deal_id,
       wd.starts_at,
       wd.ends_at,
       wd.price_per_sqft,
       wd.compare_at_per_sqft,
       wd.currency,
       vp.id as product_id,
       vp.vendor,
       vp.series,
       vp.name,
       vp.warranty,
       vp.description,
       vp.specs,
       vp.features,
       vpi.url as image_url,
       vpi.alt as image_alt
     FROM weekly_deals wd
     JOIN vendor_products vp ON vp.id = wd.vendor_product_id
     LEFT JOIN LATERAL (
       SELECT url, alt
       FROM vendor_product_images
       WHERE vendor_product_id = vp.id
       ORDER BY is_primary DESC, sort_order ASC, id ASC
       LIMIT 1
     ) vpi ON true
     WHERE wd.is_active = true
       AND wd.starts_at > NOW()
     ORDER BY wd.starts_at ASC
     LIMIT 1`,
    []
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: `vendor-${row.product_id}`,
    weeklyDealId: row.weekly_deal_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    slug: slugify(`${row.vendor}-${row.series}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    compareAtPricePerSqFt: row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    shortTagline: row.description || null,
    description: row.description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    isWeeklyDeal: true,
  };
}

export async function getVendorProductById(vendorProductId) {
  const id = Number(vendorProductId);
  if (!id) return null;

  const result = await query(
    `SELECT
       vp.id as product_id,
       vp.vendor,
       vp.series,
       vp.name,
       vp.sku,
       vp.coverage_sqft_per_box,
       vp.description,
       vp.warranty,
       vp.specs,
       vp.features,
       vpi.url as image_url,
       vpi.alt as image_alt,
       wd.price_per_sqft,
       wd.compare_at_per_sqft,
       wd.currency,
       wd.id as weekly_deal_id
     FROM vendor_products vp
     LEFT JOIN LATERAL (
       SELECT url, alt
       FROM vendor_product_images
       WHERE vendor_product_id = vp.id
       ORDER BY is_primary DESC, sort_order ASC, id ASC
       LIMIT 1
     ) vpi ON true
     LEFT JOIN LATERAL (
       SELECT id, price_per_sqft, compare_at_per_sqft, currency
       FROM weekly_deals
       WHERE vendor_product_id = vp.id
         AND is_active = true
         AND starts_at <= NOW()
         AND ends_at > NOW()
       ORDER BY starts_at DESC
       LIMIT 1
     ) wd ON true
     WHERE vp.id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  const imagesResult = await query(
    `SELECT url, alt, is_primary, sort_order
     FROM vendor_product_images
     WHERE vendor_product_id = $1
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [id]
  );
  const images = imagesResult.rows || [];

  const pricePerSqFt = row.price_per_sqft ? Number(row.price_per_sqft) : null;
  const compareAtPricePerSqFt = row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null;
  const coverageSqFtPerBox = row.coverage_sqft_per_box ? Number(row.coverage_sqft_per_box) : null;

  return {
    id: `vendor-${row.product_id}`,
    slug: slugify(`${row.vendor}-${row.series}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt,
    compareAtPricePerSqFt,
    price: pricePerSqFt ? Math.round(pricePerSqFt * 100) : null,
    compareAtPrice: compareAtPricePerSqFt ? Math.round(compareAtPricePerSqFt * 100) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    images,
    shortTagline: row.description || null,
    description: row.description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    sku: row.sku || null,
    coverageSqFtPerBox: coverageSqFtPerBox || 1,
    isWeeklyDeal: Boolean(row.weekly_deal_id),
  };
}
