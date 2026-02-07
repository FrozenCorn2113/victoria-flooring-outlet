// lib/harbinger/sync.js
// Scrape Harbinger series pages and sync to Postgres

import { query } from '../db.js';

const BASE_URL = 'https://www.harbingerfloors.com';

const CONTRACT_NAMES = new Set([
  'Coventry Spice',
  'Savannah Oak',
  'Bonsai Maple',
  'Tumbleweed',
  'Sienna',
  'Melbourne',
  'Canberra',
  'Perth',
  'Winton',
  'Sydney',
  'Marla',
  'Cairns',
  'Brisbane',
]);

const ESSENTIALS_NAMES = new Set(['Hampton Greige', 'Beach House', 'Perissa']);

const SERIES_BY_PREFIX = {
  HCP: 'Craftsman',
  HAC: 'Harbinger Acoustic Click',
  SAC: 'Signature Acoustic Click',
  TQZ: 'The Quiet Zone',
};

const SITEMAP_URLS = [
  `${BASE_URL}/sitemap.xml`,
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

function upgradeWixImageUrl(url, width = 1600, quality = 85) {
  if (!url) return url;
  return url.replace(
    /\/v1\/fit\/w_\d+,h_\d+,q_\d+\//,
    `/v1/fit/w_${width},h_${width},q_${quality}/`
  );
}

function getMediaPriority(title = '') {
  const lower = title.toLowerCase();
  if (lower.includes('room')) return 0;
  return 1;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Normalize series name for consistent slug generation (removes "Series" suffix)
function normalizeSeriesForSlug(series) {
  if (!series) return '';
  return series.replace(/\s+series$/i, '').trim();
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function parseSpecsFromHtml(html) {
  if (!html) return null;
  const specs = {};
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const cells = Array.from(rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(
      (cell) => stripHtml(cell[1])
    );
    if (cells.length >= 2 && cells[0] && cells[1]) {
      specs[cells[0]] = cells[1];
    }
  }
  return Object.keys(specs).length > 0 ? specs : null;
}

function extractSkuFallback(description, mediaTitles) {
  const combined = `${description || ''} ${mediaTitles || []}`.trim();
  const match = combined.match(/\b([A-Z]{2,4}\s*\d{4,5}[A-Z]?)\b/);
  if (!match) return null;
  return match[1].replace(/\s+/g, ' ').trim();
}

function extractWixProduct(html) {
  const match = html.match(
    /<script type="application\/json" id="wix-warmup-data">([\s\S]*?)<\/script>/i
  );
  if (!match) return null;

  let data = null;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    return null;
  }

  for (const appData of Object.values(data.appsWarmupData || {})) {
    if (!appData || typeof appData !== 'object') continue;
    for (const [key, value] of Object.entries(appData)) {
      if (key.startsWith('productPage_') && value?.catalog?.product) {
        return value.catalog.product;
      }
    }
  }
  return null;
}

function parseCoverageSqFtFromSpecs(specs) {
  const value = specs?.['Box Coverage'];
  if (!value) return null;
  const match = String(value).match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveSeries(name, skuPrefix) {
  if (CONTRACT_NAMES.has(name)) return 'Contract';
  if (ESSENTIALS_NAMES.has(name)) return 'Essentials';
  return SERIES_BY_PREFIX[skuPrefix] || null;
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((match) => match[1].trim());
}

async function fetchSitemapProductUrls() {
  const urls = new Set();
  const sitemapQueue = [...SITEMAP_URLS];
  const seenSitemaps = new Set();

  while (sitemapQueue.length > 0) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) continue;
    seenSitemaps.add(sitemapUrl);

    try {
      const xml = await fetchHtml(sitemapUrl);
      const locs = extractLocs(xml);

      const isIndex = /<sitemapindex/i.test(xml);
      if (isIndex) {
        for (const loc of locs) {
          sitemapQueue.push(loc);
        }
        continue;
      }

      for (const loc of locs) {
        if (loc.includes('/product-page/')) {
          urls.add(loc);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch sitemap:', sitemapUrl, error);
    }
  }

  return Array.from(urls);
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
  const slug = slugify(`${vendor}-${normalizeSeriesForSlug(series)}-${name}`);
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
  const seriesCounts = new Map();
  let totalProducts = 0;
  let totalImages = 0;

  const productUrls = await fetchSitemapProductUrls();
  for (const productUrl of productUrls) {
    let product = null;
    try {
      const html = await fetchHtml(productUrl);
      product = extractWixProduct(html);
    } catch (error) {
      console.warn('Failed to fetch product page:', productUrl, error);
      continue;
    }

    if (!product) continue;

    const name = normalizeText(product.name || '');
    if (!name) continue;

    const description = stripHtml(product.description || '');
    const media = Array.isArray(product.media) ? product.media : [];
    const mediaTitles = media.map((item) => item?.title || '').filter(Boolean);
    const sku = normalizeText(product.sku || '') || extractSkuFallback(description, mediaTitles);
    const skuPrefix = sku ? sku.split(' ')[0] : '';
    const series = resolveSeries(name, skuPrefix);

    if (!series) continue;

    const specsBlock = (product.additionalInfo || []).find(
      (block) => normalizeText(block?.title || '').toLowerCase() === 'specs'
    );
    const specs = parseSpecsFromHtml(specsBlock?.description || '');
    const coverageSqFtPerBox = parseCoverageSqFtFromSpecs(specs);

    const productId = await upsertProduct({
      vendor: 'Harbinger',
      series,
      name,
      description: description || null,
      specs,
      features: null,
      sourceUrl: productUrl,
      sku: sku || null,
      coverageSqFtPerBox,
    });

    const orderedMedia = media
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const priorityDiff = getMediaPriority(a.item?.title) - getMediaPriority(b.item?.title);
        if (priorityDiff !== 0) return priorityDiff;
        return a.index - b.index;
      })
      .map(({ item }) => item);

    const images = orderedMedia
      .map((item, index) => ({
        url: upgradeWixImageUrl(item?.fullUrl || item?.url || null),
        alt: item?.title || null,
        isPrimary: index === 0,
        sortOrder: index,
      }))
      .filter((item) => item.url);

    const imageCount = await replaceProductImages(productId, images);

    totalProducts += 1;
    totalImages += imageCount;
    seriesCounts.set(series, (seriesCounts.get(series) || 0) + 1);
  }

  for (const [series, count] of seriesCounts.entries()) {
    summary.push({ series, products: count });
  }

  return { totalProducts, totalImages, summary };
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
       vp.description as product_description,
       vp.series_description,
       vp.warranty,
       vp.specs,
       vp.features,
       vp.deal_content,
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

  // Fetch all images for this product
  const imagesResult = await query(
    `SELECT url, alt, is_primary, sort_order
     FROM vendor_product_images
     WHERE vendor_product_id = $1
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [row.product_id]
  );
  const images = imagesResult.rows || [];

  return {
    id: 'deal-of-the-week',
    vendorProductId: row.product_id,
    weeklyDealId: row.weekly_deal_id,
    slug: slugify(`${row.vendor}-${normalizeSeriesForSlug(row.series)}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    compareAtPricePerSqFt: row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    images,
    shortTagline: row.product_description || row.series_description || null,
    description: row.product_description || row.series_description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    sku: row.sku || null,
    coverageSqFtPerBox: row.coverage_sqft_per_box ? Number(row.coverage_sqft_per_box) : null,
    dealContent: row.deal_content || null,
    highlights: row.deal_content?.highlights || null,
    isWeeklyDeal: true,
  };
}

export async function getLatestWeeklyDealFromDb() {
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
       vp.description as product_description,
       vp.series_description,
       vp.warranty,
       vp.specs,
       vp.features,
       vp.deal_content,
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
     ORDER BY wd.starts_at DESC
     LIMIT 1`,
    []
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  // Fetch all images for this product
  const imagesResult = await query(
    `SELECT url, alt, is_primary, sort_order
     FROM vendor_product_images
     WHERE vendor_product_id = $1
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [row.product_id]
  );
  const images = imagesResult.rows || [];

  return {
    id: 'deal-of-the-week',
    vendorProductId: row.product_id,
    weeklyDealId: row.weekly_deal_id,
    slug: slugify(`${row.vendor}-${normalizeSeriesForSlug(row.series)}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    compareAtPricePerSqFt: row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    images,
    shortTagline: row.product_description || row.series_description || null,
    description: row.product_description || row.series_description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    sku: row.sku || null,
    coverageSqFtPerBox: row.coverage_sqft_per_box ? Number(row.coverage_sqft_per_box) : null,
    dealContent: row.deal_content || null,
    highlights: row.deal_content?.highlights || null,
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
       vp.description as product_description,
       vp.series_description,
       vp.specs,
       vp.features,
       vp.deal_content,
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
    id: 'deal-of-the-week',
    vendorProductId: row.product_id,
    weeklyDealId: row.weekly_deal_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    slug: slugify(`${row.vendor}-${normalizeSeriesForSlug(row.series)}-${row.name}`),
    name: `${row.vendor} ${row.series} – ${row.name}`,
    brand: row.vendor,
    collection: row.series,
    type: 'Luxury Vinyl Plank',
    pricePerSqFt: row.price_per_sqft ? Number(row.price_per_sqft) : null,
    compareAtPricePerSqFt: row.compare_at_per_sqft ? Number(row.compare_at_per_sqft) : null,
    currency: row.currency || 'CAD',
    image: row.image_url || null,
    shortTagline: row.product_description || row.series_description || null,
    description: row.product_description || row.series_description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    dealContent: row.deal_content || null,
    highlights: row.deal_content?.highlights || null,
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
       vp.description as product_description,
       vp.series_description,
       vp.warranty,
       vp.specs,
       vp.features,
       vp.deal_content,
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
    slug: slugify(`${row.vendor}-${normalizeSeriesForSlug(row.series)}-${row.name}`),
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
    shortTagline: row.product_description || row.series_description || null,
    description: row.product_description || row.series_description || null,
    warranty: row.warranty || null,
    features: row.features || null,
    specs: row.specs || null,
    sku: row.sku || null,
    coverageSqFtPerBox: coverageSqFtPerBox || 1,
    dealContent: row.deal_content || null,
    isWeeklyDeal: Boolean(row.weekly_deal_id),
  };
}
