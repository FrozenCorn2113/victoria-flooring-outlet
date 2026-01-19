// lib/harbinger/image-store.js
// Download external images into public/harbinger and return local paths.

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const IMAGE_DIR = path.join(PUBLIC_DIR, 'harbinger');

async function ensureDir() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
}

function getExtension(url) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname);
    if (ext) return ext.toLowerCase();
  } catch (error) {
    return '.jpg';
  }
  return '.jpg';
}

function buildFileName(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex');
  const ext = getExtension(url);
  return `${hash}${ext}`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function buildFallbackUrls(url) {
  if (!url) return [];
  const candidates = [url];
  const fitMatch = url.match(/\/v1\/fit\/w_\d+,h_\d+,q_\d+\//);
  if (fitMatch) {
    candidates.push(url.replace(fitMatch[0], '/v1/fit/w_1200,h_1200,q_85/'));
  }
  if (url.includes('/v1/')) {
    candidates.push(url.split('/v1/')[0]);
  }
  return Array.from(new Set(candidates));
}

async function fetchImageBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'image/*,*/*;q=0.8',
      'Referer': 'https://www.harbingerfloors.com/',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download image ${url} (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function downloadImageToPublic(url) {
  if (!url || url.startsWith('/harbinger/')) {
    return url;
  }

  await ensureDir();
  const fileName = buildFileName(url);
  const filePath = path.join(IMAGE_DIR, fileName);

  if (!(await fileExists(filePath))) {
    const candidates = buildFallbackUrls(url);
    let lastError = null;
    for (const candidate of candidates) {
      try {
        const buffer = await fetchImageBuffer(candidate);
        await fs.writeFile(filePath, buffer);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) {
      throw lastError;
    }
  }

  return `/harbinger/${fileName}`;
}
