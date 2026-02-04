// scripts/generate-deal-content.mjs
// Generate story-driven deal_content for all vendor products

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// Series-specific templates
const SERIES_CONFIG = {
  Contract: {
    installType: 'Glue-down',
    thickness: '2.0 mm',
    wearLayer: '12 mil (0.3 mm)',
    plankSize: '6" × 48"',
    coverage: '48 sq ft/box',
    warranty: 'Lifetime residential / 20-year commercial',
    whyChooseBase: [
      "Glue-down install means no hollow sounds underfoot, and it stays flat even with temperature swings.",
      "Commercial-grade construction at residential pricing — this is the same spec contractors use in medical clinics and busy retail.",
      "The embossed texture actually feels like wood grain, not plastic."
    ],
    perfectForBase: [
      "Basement suites and rentals",
      "Kitchens and laundry rooms",
      "Home offices and dens",
      "Light commercial (waiting rooms, small retail)",
      "Homes with kids or pets"
    ]
  },
  Craftsman: {
    installType: 'Glue-down',
    thickness: '2.5 mm',
    wearLayer: '22 mil (0.55 mm)',
    plankSize: 'Varies by style',
    coverage: 'Varies by style',
    warranty: 'Lifetime residential / 15-year commercial',
    whyChooseBase: [
      "Thicker 22 mil wear layer handles heavy foot traffic and resists scratches from pets and furniture.",
      "Wide planks and large-format tiles make a design statement while minimizing seam lines.",
      "Glue-down installation keeps floors stable and quiet in any room."
    ],
    perfectForBase: [
      "Living rooms and great rooms",
      "Design-focused renovations",
      "Open-concept layouts",
      "Condos and townhomes",
      "Home offices"
    ]
  },
  Essentials: {
    installType: 'Glue-down',
    thickness: '2.5 mm',
    wearLayer: '22 mil (0.55 mm)',
    plankSize: '7" × 48"',
    coverage: '33.89 sq ft/box',
    warranty: 'Lifetime residential / 10-year commercial',
    whyChooseBase: [
      "Clean, versatile neutrals that work with any decor style.",
      "Heavy-commercial rated for durability that lasts.",
      "Simple glue-down install with no fuss."
    ],
    perfectForBase: [
      "Rental properties",
      "Quick renovations",
      "Neutral-palette interiors",
      "Basements and bonus rooms",
      "Multi-unit buildings"
    ]
  },
  "Harbinger Acoustic Click": {
    installType: 'Floating click',
    thickness: '6.5 mm',
    wearLayer: '20 mil (0.5 mm)',
    plankSize: '7" × 48"',
    coverage: '23.64 sq ft/box',
    warranty: 'Lifetime residential / 10-year light commercial',
    whyChooseBase: [
      "Cork backing reduces sound transmission between floors — great for condos and upstairs bedrooms.",
      "Rigid composite core stays flat and stable, even with temperature changes.",
      "Floating click install means no glue and faster installation."
    ],
    perfectForBase: [
      "Condos and apartments",
      "Upper floors",
      "Bedrooms and home offices",
      "Spaces over radiant heat",
      "DIY-friendly projects"
    ]
  },
  "Signature Acoustic Click": {
    installType: 'Floating click',
    thickness: '6.5 mm',
    wearLayer: '22 mil (0.55 mm)',
    plankSize: 'Varies by style',
    coverage: 'Varies by style',
    warranty: 'Lifetime residential / 10-year light commercial',
    whyChooseBase: [
      "Integrated cork underlayment reduces sound and adds cushion underfoot.",
      "Click-lock install means no adhesive — floors go down faster and can be replaced easier.",
      "Extra-wide planks and large tiles create a modern, seamless look."
    ],
    perfectForBase: [
      "Condos and apartments",
      "Bedrooms and living rooms",
      "Upstairs installations",
      "DIY renovations",
      "Spaces needing sound control"
    ]
  },
  "The Quiet Zone": {
    installType: 'Glue-down',
    thickness: '5.0 mm',
    wearLayer: '22 mil (0.55 mm)',
    plankSize: 'Varies by style',
    coverage: 'Varies by style',
    warranty: 'Lifetime residential / 10-year commercial',
    whyChooseBase: [
      "Built-in IXPE acoustic layer absorbs impact noise and softens every step.",
      "Glue-down install keeps floors stable and eliminates hollow sounds.",
      "100% waterproof construction handles spills and humidity."
    ],
    perfectForBase: [
      "Quiet bedrooms and nurseries",
      "Home theatres and media rooms",
      "Upper-level condos",
      "Spaces over living areas",
      "Any room where noise matters"
    ]
  }
};

// VFO benefits (same for all products)
const VFO_BENEFITS = [
  "Local pickup in Victoria — no waiting weeks for shipping from the mainland.",
  "Questions? Call or email us. We'll help you figure out how much you need and which adhesive to use."
];

// Generate theVibe based on product aesthetic
function generateTheVibe(name, marketingDesc, series) {
  // Extract the aesthetic description from marketing copy (first sentence usually)
  const aesthetic = marketingDesc.split('.')[0];

  // Create a story-driven version
  const vibeTemplates = {
    // Warm tones
    warm: `${name} brings easy warmth to your space — ${aesthetic.toLowerCase().replace(/^a /, '')} that works in everything from modern builds to classic renos. It's the kind of floor that makes a room feel finished without trying too hard.`,
    // Cool tones
    cool: `${name} adds calm, contemporary character — ${aesthetic.toLowerCase().replace(/^a /, '')} that photographs well and lives even better. Clean enough for minimalist spaces, interesting enough to stand on its own.`,
    // Neutral
    neutral: `${name} is the kind of floor that just works — ${aesthetic.toLowerCase().replace(/^a /, '')} that pairs with practically any palette. It handles everyday life without showing every scuff and footprint.`,
    // Bold/dramatic
    bold: `${name} makes a statement — ${aesthetic.toLowerCase().replace(/^a /, '')} for spaces that deserve attention. Not shy, but not loud either. Just confident.`,
    // Light/airy
    light: `${name} opens up a room — ${aesthetic.toLowerCase().replace(/^a /, '')} that bounces light and makes spaces feel bigger. Great for basements, condos, or anywhere that needs a lift.`,
    // Coastal
    coastal: `${name} brings that relaxed, easy feeling — ${aesthetic.toLowerCase().replace(/^a /, '')} that works whether you're near the water or just wish you were. Casual but put-together.`,
    // Classic
    classic: `${name} is timeless for a reason — ${aesthetic.toLowerCase().replace(/^a /, '')} that won't feel dated in five years. A safe choice that still looks sharp.`
  };

  // Determine vibe category based on description keywords
  const desc = marketingDesc.toLowerCase();
  if (desc.includes('coastal') || desc.includes('beach') || desc.includes('driftwood') || desc.includes('sea')) {
    return vibeTemplates.coastal;
  }
  if (desc.includes('bold') || desc.includes('dramatic') || desc.includes('charcoal') || desc.includes('dark') || desc.includes('black')) {
    return vibeTemplates.bold;
  }
  if (desc.includes('light') || desc.includes('pale') || desc.includes('bright') || desc.includes('white') || desc.includes('airy')) {
    return vibeTemplates.light;
  }
  if (desc.includes('warm') || desc.includes('honey') || desc.includes('amber') || desc.includes('golden') || desc.includes('spice')) {
    return vibeTemplates.warm;
  }
  if (desc.includes('cool') || desc.includes('grey') || desc.includes('silver') || desc.includes('slate')) {
    return vibeTemplates.cool;
  }
  if (desc.includes('classic') || desc.includes('traditional') || desc.includes('timeless')) {
    return vibeTemplates.classic;
  }
  return vibeTemplates.neutral;
}

// Generate color-specific benefit
function getColorBenefit(marketingDesc) {
  const desc = marketingDesc.toLowerCase();

  if (desc.includes('light') || desc.includes('pale') || desc.includes('white') || desc.includes('blonde')) {
    return "Light tones make rooms feel larger and brighter — especially useful for basements and north-facing rooms.";
  }
  if (desc.includes('grey') || desc.includes('greige') || desc.includes('taupe')) {
    return "The colour hides dust, pet hair, and everyday mess better than most floors — a real plus if you're not into daily sweeping.";
  }
  if (desc.includes('dark') || desc.includes('charcoal') || desc.includes('espresso') || desc.includes('black')) {
    return "Dark tones add drama and anchor a room, though they do show dust more than mid-tones.";
  }
  if (desc.includes('warm') || desc.includes('honey') || desc.includes('amber') || desc.includes('golden')) {
    return "Warm tones add coziness and work well with both modern and traditional furnishings.";
  }
  return "Mid-tone finishes are forgiving with dust and footprints — practical for busy households.";
}

// Build deal_content for a product
function buildDealContent(product, marketingDesc, seriesConfig) {
  const theVibe = generateTheVibe(product.name, marketingDesc, product.series);
  const colorBenefit = getColorBenefit(marketingDesc);

  const whyPeopleChooseIt = [
    colorBenefit,
    ...seriesConfig.whyChooseBase
  ];

  const specsAtAGlance = [
    { label: "Thickness", value: seriesConfig.thickness },
    { label: "Wear Layer", value: seriesConfig.wearLayer },
    { label: "Plank Size", value: seriesConfig.plankSize },
    { label: "Coverage", value: seriesConfig.coverage },
    { label: "Install", value: seriesConfig.installType },
    { label: "Waterproof", value: "Yes, 100%" },
    { label: "Radiant Heat", value: "Compatible" },
    { label: "Warranty", value: seriesConfig.warranty }
  ];

  return {
    theVibe,
    whyPeopleChooseIt,
    perfectFor: seriesConfig.perfectForBase,
    specsAtAGlance,
    howVfoMakesItEasy: VFO_BENEFITS
  };
}

// Marketing data mapping (slug -> description)
const MARKETING_DATA = {
  "harbinger-contract-bonsai-maple": "A warm maple tone with subtle grain variation that brings organic warmth to modern interiors.",
  "harbinger-contract-brisbane": "A sun-bleached coastal wood look with soft grey undertones for relaxed, beachy appeal.",
  "harbinger-contract-cairns": "A weathered driftwood aesthetic with cool grey tones that evoke coastal tranquility.",
  "harbinger-contract-canberra": "A light sandy wood look with clean lines and a contemporary neutral finish.",
  "harbinger-contract-coventry-spice": "A rich spiced wood tone with warm amber undertones that add depth to any room.",
  "harbinger-contract-marla": "A balanced mid-tone wood look with natural grain character and timeless appeal.",
  "harbinger-contract-melbourne": "A soft greige wood look that bridges warm and cool palettes with effortless versatility.",
  "harbinger-contract-perth": "A pale ash-inspired plank with subtle silver undertones for a light, airy feel.",
  "harbinger-contract-savannah-oak": "A classic honey oak with gentle grain movement and inviting warmth.",
  "harbinger-contract-sienna": "A rich terracotta-toned wood with rustic character and earthy warmth.",
  "harbinger-contract-sydney": "A sophisticated grey-brown wood look with refined grain detail for modern spaces.",
  "harbinger-contract-tumbleweed": "A warm taupe wood tone with natural variation that complements both rustic and modern decor.",
  "harbinger-contract-winton": "A soft wheat-toned wood look with gentle grain for bright, welcoming interiors.",
  "harbinger-craftsman-angola": "A warm sandstone tile look with natural veining for understated elegance.",
  "harbinger-craftsman-bali": "An exotic wood look with tropical warmth and rich, varied grain patterns.",
  "harbinger-craftsman-beachcomber": "A sun-washed coastal wood look with pale blonde tones and relaxed charm.",
  "harbinger-craftsman-botswana": "A rich slate-inspired tile with dark grey depth and natural stone character.",
  "harbinger-craftsman-brunei": "A deep espresso wood look with bold grain and sophisticated warmth.",
  "harbinger-craftsman-burmese-teak": "A rich golden teak with exotic grain movement and timeless luxury appeal.",
  "harbinger-craftsman-farmhouse-nordic": "A whitewashed Scandinavian wood look with clean lines and bright, airy appeal.",
  "harbinger-craftsman-farmhouse-umber": "A deep umber wood tone with rustic character and cozy farmhouse warmth.",
  "harbinger-craftsman-gobi": "A desert-inspired neutral wood look with soft sandy tones and subtle grain.",
  "harbinger-craftsman-horizon": "A soft grey-brown wood look with smooth grain and calming, contemporary appeal.",
  "harbinger-craftsman-jakarta": "A warm chestnut wood look with deep grain character and inviting richness.",
  "harbinger-craftsman-kenya": "A warm travertine-inspired tile with honey tones and natural stone texture.",
  "harbinger-craftsman-madagascar": "A cool grey stone tile with subtle veining and modern minimalist appeal.",
  "harbinger-craftsman-namibia": "A desert sandstone tile with warm beige tones and organic texture.",
  "harbinger-craftsman-paris": "A refined grey oak look with European elegance and timeless sophistication.",
  "harbinger-craftsman-tanzania": "A rich charcoal stone tile with dramatic depth and bold contemporary style.",
  "harbinger-craftsman-terrazzo": "A classic terrazzo pattern with scattered aggregate for retro-modern charm.",
  "harbinger-craftsman-tonga": "A warm walnut wood look with rich chocolate tones and classic grain pattern.",
  "harbinger-craftsman-topeka": "A mid-tone oak look with balanced warmth and versatile, everyday appeal.",
  "harbinger-craftsman-zambia": "A deep slate tile with charcoal depth and bold, sophisticated presence.",
  "harbinger-essentials-beach-house": "A light coastal wood look with sun-bleached character and casual elegance.",
  "harbinger-essentials-hampton-greige": "A sophisticated greige wood tone that balances warm and cool for effortless coordination.",
  "harbinger-essentials-perissa": "A soft grey stone tile with understated elegance and Mediterranean warmth.",
  "harbinger-harbinger-acoustic-click-carrara": "A luminous Carrara marble look with refined veining and polished sophistication.",
  "harbinger-signature-acoustic-click-aberdeen": "A weathered grey oak with subtle grain movement and relaxed highland charm.",
  "harbinger-signature-acoustic-click-alexandria": "A warm honey oak with classic grain and inviting, sunlit appeal.",
  "harbinger-signature-acoustic-click-amtico-grey": "A cool concrete-inspired tile with industrial edge and urban sophistication.",
  "harbinger-signature-acoustic-click-bantame": "A warm sandstone tile with soft, earthy texture and Mediterranean appeal.",
  "harbinger-signature-acoustic-click-basalt": "A dramatic dark basalt look with volcanic depth and bold, modern presence.",
  "harbinger-signature-acoustic-click-birmingham": "A mid-tone oak with balanced warmth and refined English character.",
  "harbinger-signature-acoustic-click-canterbury": "A rich walnut tone with deep grain character and traditional warmth.",
  "harbinger-signature-acoustic-click-cardiff": "A cool grey oak with subtle silver undertones and contemporary calm.",
  "harbinger-signature-acoustic-click-chester": "A dark espresso oak with bold grain and sophisticated depth.",
  "harbinger-signature-acoustic-click-churchill": "A distinguished grey-brown oak with stately character and timeless appeal.",
  "harbinger-signature-acoustic-click-colchester": "A warm chestnut wood look with inviting depth and natural grain variation.",
  "harbinger-signature-acoustic-click-cornwall": "A weathered coastal grey with driftwood character and seaside serenity.",
  "harbinger-signature-acoustic-click-derby": "A light ash wood look with soft grey tones and effortless modern style.",
  "harbinger-signature-acoustic-click-dublin": "A rich auburn oak with warm copper undertones and Celtic charm.",
  "harbinger-signature-acoustic-click-durham": "A smoky charcoal oak with dramatic depth and urban sophistication.",
  "harbinger-signature-acoustic-click-exeter": "A soft taupe wood look with gentle warmth and understated elegance.",
  "harbinger-signature-acoustic-click-gaudi": "An artistic terrazzo-inspired tile with playful pattern and creative flair.",
  "harbinger-signature-acoustic-click-kaya": "A soft limestone tile with warm ivory tones and natural elegance.",
  "harbinger-signature-acoustic-click-knoxville": "A classic hickory look with bold grain movement and rustic warmth.",
  "harbinger-signature-acoustic-click-marengo-grey": "A smoky grey stone tile with subtle depth and refined contemporary style.",
  "harbinger-signature-acoustic-click-marmo": "A classic white marble look with elegant grey veining and timeless luxury.",
  "harbinger-signature-acoustic-click-nero": "A bold black stone tile with dramatic impact and sleek modern edge.",
  "harbinger-signature-acoustic-click-nottingham": "A warm caramel oak with rich tones and classic English appeal.",
  "harbinger-signature-acoustic-click-plymouth": "A light sandy oak with coastal warmth and relaxed New England charm.",
  "harbinger-signature-acoustic-click-poole": "A soft greige oak that blends warm and cool for effortless versatility.",
  "harbinger-signature-acoustic-click-san-antonio": "A warm pecan wood look with southwestern character and inviting warmth.",
  "harbinger-signature-acoustic-click-selene": "A soft lunar grey tile with ethereal calm and sophisticated serenity.",
  "harbinger-signature-acoustic-click-sheffield": "A steel-grey oak with industrial edge and contemporary urban appeal.",
  "harbinger-signature-acoustic-click-st-tropez-limestone": "A creamy French limestone with Mediterranean warmth and coastal elegance.",
  "harbinger-signature-acoustic-click-sussex": "A warm honey wood look with gentle grain and inviting cottage appeal.",
  "harbinger-signature-acoustic-click-truro": "A weathered grey-brown oak with coastal character and relaxed sophistication.",
  "harbinger-signature-acoustic-click-york": "A classic mid-tone oak with traditional grain and enduring appeal.",
  "harbinger-the-quiet-zone-amuse": "A warm beige stone tile with playful texture and inviting softness.",
  "harbinger-the-quiet-zone-bianco": "A bright white stone tile with clean, luminous appeal and modern freshness.",
  "harbinger-the-quiet-zone-cirrus": "A soft grey wood look with wispy grain and cloud-like serenity.",
  "harbinger-the-quiet-zone-coastal-fog": "A misty grey stone tile with soft coastal atmosphere and calming presence.",
  "harbinger-the-quiet-zone-copenhagen": "A pale Scandinavian wood look with minimalist beauty and Nordic calm.",
  "harbinger-the-quiet-zone-cumulus": "A light grey wood look with soft, billowing grain and dreamy appeal.",
  "harbinger-the-quiet-zone-mountain-fog": "A cool grey stone tile with alpine mist atmosphere and natural calm.",
  "harbinger-the-quiet-zone-munich": "A warm European oak with refined grain and continental elegance.",
  "harbinger-the-quiet-zone-night-sky": "A deep charcoal stone tile with dramatic depth and midnight sophistication.",
  "harbinger-the-quiet-zone-nimbus": "A medium grey wood look with storm-cloud depth and moody elegance.",
  "harbinger-the-quiet-zone-sea-salt": "A pale coastal wood with sea-salt whitewash and breezy beach appeal.",
  "harbinger-the-quiet-zone-serene": "A soft neutral wood look with gentle grain and peaceful, calming appeal.",
  "harbinger-the-quiet-zone-vik": "A cool slate-grey tile with Icelandic character and minimalist edge."
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

async function run() {
  const client = await pool.connect();

  try {
    // Get all products
    const result = await client.query(`
      SELECT id, name, series, vendor
      FROM vendor_products
      WHERE active = true
      ORDER BY series, name
    `);

    console.log(`Processing ${result.rows.length} products...\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of result.rows) {
      const slug = slugify(`${product.vendor}-${product.series}-${product.name}`);
      const marketingDesc = MARKETING_DATA[slug];
      const seriesConfig = SERIES_CONFIG[product.series];

      if (!marketingDesc) {
        console.log(`⚠️  No marketing data for: ${slug}`);
        skipped++;
        continue;
      }

      if (!seriesConfig) {
        console.log(`⚠️  No series config for: ${product.series}`);
        skipped++;
        continue;
      }

      const dealContent = buildDealContent(product, marketingDesc, seriesConfig);

      await client.query(
        'UPDATE vendor_products SET deal_content = $1 WHERE id = $2',
        [JSON.stringify(dealContent), product.id]
      );

      console.log(`✓ ${product.series} - ${product.name}`);
      updated++;
    }

    console.log(`\n✅ Updated ${updated} products`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} products (missing data)`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
