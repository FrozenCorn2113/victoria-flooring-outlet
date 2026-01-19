// scripts/enrich-harbinger-csv.js
// Usage: node scripts/enrich-harbinger-csv.js "/path/to/input.csv" [output.csv]
// Adds hero_image_url_hires + thumbnail_image_urls_hires using product pages.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error('Input CSV path required.');
  process.exit(1);
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

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  if (str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  return str;
}

function parseCsv(contents) {
  const lines = contents.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

function normalizeUrl(url) {
  if (!url) return null;
  return url.replace(/&amp;/g, '&').trim();
}

function extractMetaImage(html, property) {
  const regex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match ? normalizeUrl(match[1]) : null;
}

function extractAllWixImages(html) {
  const urls = new Set();
  const regex = /https:\/\/static\.wixstatic\.com\/media\/[^"'>\s]+/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.add(normalizeUrl(match[0]));
  }
  return Array.from(urls);
}

function buildCandidateUrls(url) {
  if (!url) return [];
  const cleaned = normalizeUrl(url);
  const candidates = [cleaned];
  const fitMatch = cleaned.match(/\/v1\/fit\/w_\d+,h_\d+,q_\d+\//);
  if (fitMatch) {
    candidates.push(cleaned.replace(fitMatch[0], '/v1/fit/w_2000,h_2000,q_90/'));
  }
  if (cleaned.includes('/v1/')) {
    candidates.push(cleaned.split('/v1/')[0]);
  }
  return Array.from(new Set(candidates.filter(Boolean)));
}

function prioritizeCandidates(urls) {
  return urls.sort((a, b) => {
    const score = (u) => {
      if (!u) return 0;
      if (!u.includes('/v1/')) return 3;
      if (u.includes('w_2000')) return 2;
      return 1;
    };
    return score(b) - score(a);
  });
}

async function fetchImageSize(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'image/*,*/*;q=0.8',
      'Referer': 'https://www.harbingerfloors.com/',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  return { url, width: metadata.width || 0, height: metadata.height || 0 };
}

async function resolveBestImages({ productUrl }) {
  if (!productUrl) return [];
  const response = await fetch(productUrl, {
    headers: {
      'User-Agent': 'VictoriaFlooringOutletBot/1.0',
      'Accept-Language': 'en-CA,en;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${productUrl} (${response.status})`);
  }
  const html = await response.text();

  const candidates = new Set();
  const ogImage = extractMetaImage(html, 'og:image');
  const twitterImage = extractMetaImage(html, 'twitter:image');
  [ogImage, twitterImage].filter(Boolean).forEach((url) => {
    buildCandidateUrls(url).forEach((candidate) => candidates.add(candidate));
  });

  extractAllWixImages(html).forEach((url) => {
    buildCandidateUrls(url).forEach((candidate) => candidates.add(candidate));
  });

  const candidateList = prioritizeCandidates(Array.from(candidates));
  const results = [];
  const maxDownloads = 8;

  for (const url of candidateList.slice(0, maxDownloads)) {
    try {
      const size = await fetchImageSize(url);
      results.push(size);
    } catch (error) {
      // Skip broken images
    }
  }

  return results.sort((a, b) => (b.width * b.height) - (a.width * a.height));
}

async function run() {
  const contents = fs.readFileSync(inputPath, 'utf8');
  const { headers, rows } = parseCsv(contents);

  const hireHero = 'hero_image_url_hires';
  const hiresThumbs = 'thumbnail_image_urls_hires';
  const outputHeaders = headers.includes(hireHero) ? headers : [...headers, hireHero, hiresThumbs];

  const outputRows = [];
  for (const row of rows) {
    const productUrl = row.product_url;
    let best = [];

    if (productUrl) {
      try {
        best = await resolveBestImages({ productUrl });
      } catch (error) {
        // leave hires empty on error
      }
    }

    if (best.length > 0) {
      const hero = best[0].url;
      const thumbs = best.slice(0, 4).map(item => item.url).join('|');
      row[hireHero] = hero;
      row[hiresThumbs] = thumbs;
    } else {
      row[hireHero] = row[hireHero] || '';
      row[hiresThumbs] = row[hiresThumbs] || '';
    }

    outputRows.push(row);
    const name = row.product_name || 'Unknown';
    console.log(`Processed: ${name}`);
  }

  const outPath = outputPath
    || path.join(
      path.dirname(inputPath),
      `${path.basename(inputPath, path.extname(inputPath))}_hires${path.extname(inputPath)}`
    );

  const lines = [];
  lines.push(outputHeaders.join(','));
  for (const row of outputRows) {
    const line = outputHeaders.map((header) => toCsvValue(row[header] ?? '')).join(',');
    lines.push(line);
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Saved: ${outPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
