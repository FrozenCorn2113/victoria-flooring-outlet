const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Image optimization configuration
const images = [
  {
    input: 'images/Untitled design (21).png',
    outputName: 'harbinger-coastal-oak-hero',
    sizes: [640, 828, 1200, 1920],
    quality: 85,
  },
  {
    input: 'images/Untitled design (23).png',
    outputName: 'next-week-preview',
    sizes: [640, 828, 1200],
    quality: 85,
  },
];

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'images', 'optimized');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImage(config) {
  const inputPath = path.join(__dirname, '..', config.input);

  console.log(`\nOptimizing: ${config.input}`);

  // Get original file size
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;
  console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

  try {
    // Generate WebP versions at different sizes
    for (const size of config.sizes) {
      const webpOutput = path.join(outputDir, `${config.outputName}-${size}w.webp`);

      await sharp(inputPath)
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: config.quality })
        .toFile(webpOutput);

      const webpStats = fs.statSync(webpOutput);
      console.log(`  ${size}w WebP: ${(webpStats.size / 1024).toFixed(2)} KB`);
    }

    // Generate main WebP (full size)
    const mainWebpOutput = path.join(outputDir, `${config.outputName}.webp`);
    await sharp(inputPath)
      .webp({ quality: config.quality })
      .toFile(mainWebpOutput);

    const mainWebpStats = fs.statSync(mainWebpOutput);
    console.log(`  Main WebP: ${(mainWebpStats.size / 1024).toFixed(2)} KB`);

    // Generate PNG fallback (optimized)
    const pngOutput = path.join(outputDir, `${config.outputName}.png`);
    await sharp(inputPath)
      .png({ quality: config.quality, compressionLevel: 9 })
      .toFile(pngOutput);

    const pngStats = fs.statSync(pngOutput);
    console.log(`  PNG fallback: ${(pngStats.size / 1024).toFixed(2)} KB`);

    // Calculate savings
    const savings = ((originalSize - mainWebpStats.size) / originalSize * 100).toFixed(1);
    console.log(`  Savings: ${savings}% (${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(mainWebpStats.size / 1024).toFixed(2)} KB)`);

  } catch (error) {
    console.error(`Error optimizing ${config.input}:`, error.message);
  }
}

async function main() {
  console.log('Starting image optimization...\n');
  console.log('='.repeat(60));

  for (const config of images) {
    await optimizeImage(config);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nImage optimization complete!');
  console.log(`Output directory: ${outputDir}`);
}

main().catch(console.error);
