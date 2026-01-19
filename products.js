const products = [
  {
    id: 'harbinger-contract-coastal-oak',
    slug: 'harbinger-contract-coastal-oak',
    sku: 'HARB-CONTRACT-COASTALOAK', // Harbinger SKU for inventory tracking
    name: 'Harbinger Contract Series – Coastal Oak',
    brand: 'Harbinger',
    collection: 'Contract Series',
    type: 'Luxury Vinyl Plank',
    colourName: 'Coastal Oak',
    installation: 'Glue-down',
    useType: 'Light commercial & residential',
    dimensionsIn: {
      width: 6,
      length: 48,
    },
    thicknessMm: 2.0,
    wearLayerMm: 0.3, // 12 mil wear layer
    wearLayerMil: 12,
    edge: 'Micro-bevel',
    construction: 'High-pressure heat laminated',
    coating: 'Harbinger 4S coating',
    waterproof: true,
    radiantHeatCompatible: true,
    texture: 'Realistic embossed texture showing grain and knots',
    coverageSqFtPerBox: 48,
    warrantyResidential: 'Lifetime limited residential warranty',
    warrantyCommercial: '20-year light commercial warranty',
    boxesPerSkid: 84,
    pricePerSqFt: 4.99, // weekly deal price
    compareAtPricePerSqFt: 6.49, // regular price
    currency: 'CAD',
    image: '/images/optimized/harbinger-coastal-oak-hero.webp',
    swatchImage: '/images/products/contract-coastal-oak-swatch.jpg',
    badge: 'Contract Series · Glue-down',
    shortTagline: 'Durable, stylish glue-down vinyl at contractor pricing.',
    description: 'Harbinger Contract Series - Coastal Oak is a commercial-grade glue-down luxury vinyl plank with a realistic embossed oak texture. Built for busy homes and light commercial spaces, it delivers waterproof performance, scratch resistance, and easy maintenance. The 2.0 mm profile with a 12-mil wear layer keeps it durable and stable for kitchens, basements, rentals, and high-traffic areas.',
    warranty: 'Lifetime limited residential warranty / 20-year light commercial warranty',
    // Legacy fields for backward compatibility
    thickness: 2.0, // mm
    wearLayer: 12, // mil
    // Calculate price from pricePerSqFt for backward compatibility
    price: Math.round(4.99 * 48 * 100), // $239.52 = 23952 cents
    isWeeklyDeal: true,
    compareAtPrice: Math.round(6.49 * 48 * 100), // $311.52 = 31152 cents
    upsellSkus: ['uzin_ke_2000_s', 'price_underlay_001', 'price_transition_001'],
    rating: {
      count: 127,
      rate: 4.8,
    },
    highlights: [
      'Durable, stylish and low-maintenance glue-down vinyl at contractor pricing.',
      '100% waterproof luxury vinyl plank suitable for kitchens, basements and rentals.',
      'High-pressure heat laminated construction with Harbinger 4S coating for superior durability, scratch, stain and scuff resistance.',
      'Realistic embossed texture with visible grain and knots for a true wood look.',
      'Suitable for all interior floor surfaces above, on or below grade.',
      'Lifetime limited residential finish warranty and 20-year commercial warranty.',
    ],
  },
  {
    id: 'uzin_ke_2000_s',
    slug: 'uzin-ke-2000-s-adhesive',
    name: 'UZIN KE 2000 S - Universal Adhesive (1 Gallon)',
    brand: 'UZIN',
    type: 'Accessory',
    subType: 'Adhesive',
    price: 8999, // $89.99 per gallon
    currency: 'CAD',
    image: '/images/uzin-ke-2000-s.png',
    description: 'Professional-grade universal adhesive for resilient flooring installations. This wet or pressure-sensitive dispersion adhesive works with most vinyl, textile, and wall coverings and pairs with UZIN underlays. Coverage ranges from 75-210 sq ft per gallon depending on trowel notch and substrate conditions, making it a reliable choice for both small repairs and full room installs.',
    shortTagline: 'Professional-grade universal adhesive for all resilient flooring.',
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    coverage: {
      sqFtPerUnit: 150, // Conservative middle estimate (between 75-210 range)
      buffer: 1.0, // No buffer - exact coverage
      recommendedFor: ['Luxury Vinyl Plank', 'Laminate'], // Flooring types this adhesive works with
    },
    rating: {
      count: 45,
      rate: 4.8,
    },
    highlights: [
      'Universal wet and pressure sensitive adhesive',
      'Covers 75-210 sq ft per gallon (depending on application method and flooring type)',
      'Short waiting time for faster installation',
      'Excellent application properties',
      'Good grab with stringing for easy positioning',
      'Suitable for all common resilient coverings, textile coverings, and wall coverings',
      'Compatible with UZIN insulation/installation underlays',
      'Professional-grade dispersion adhesive',
    ],
    specifications: {
      size: '1 Gallon (3.78 L)',
      coverage: '75-210 sq ft per gallon (varies by application method and flooring type)',
      waitingTime: '24-72 hours before walking on floor',
      applicationMethod: 'Trowel application',
      temperature: 'Best used at room temperature (60-77°F)',
      shelfLife: '12 months when stored properly',
    },
  },
  {
    id: 'price_underlay_001',
    slug: 'quietwalk-plus-underlayment',
    name: 'QuietWalk PLUS Premium Underlayment - 360 sq ft Roll',
    brand: 'QuietWalk',
    type: 'Accessory',
    subType: 'Underlayment',
    price: 12999, // $129.99 - typical price for 360 sq ft roll
    currency: 'CAD',
    image: '/images/underlayment-optimized.jpg',
    description: 'Premium 360 sq ft underlayment roll with DriWick Technology for hardwood, laminate, engineered wood, and bamboo floors. It includes a moisture-managing vapor barrier, reduces noise transmission, and smooths minor subfloor imperfections. Ideal for glue-down or floating installs where added comfort and sound control are important.',
    shortTagline: 'Premium acoustic underlayment with moisture protection.',
    coverageSqFtPerBox: 360,
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    rating: {
      count: 156,
      rate: 4.7,
    },
    highlights: [
      'Covers 360 sq ft - Roll Size: 60 ft x 6 ft x 1/8 in',
      'DriWick Technology wicks away subfloor moisture while protecting flooring materials',
      'Antimicrobial treated recycled fibers for moisture protection',
      'Superior noise reduction - absorbs sound and keeps it from traveling to other rooms',
      'Performance upgrade over poly foams - economical alternative to rubber and cork',
      'Vapor barrier specially formulated to accept glue-down installations',
      'Use with hardwood, laminate, engineered wood, and bamboo',
      'Compatible with both glue-down and floating applications',
      'NOT for luxury vinyl plank - see QuietWalk Luxury Vinyl for LVP',
    ],
    specifications: {
      model: 'QW360PLUS',
      sku: '1001755087',
      rollSize: '60 ft x 6 ft x 1/8 in',
      packageSize: '73 in x 13 in x 13 in',
      coverage: '360 sq ft per roll',
      thickness: '1/8 inch',
      applications: 'Glue-down and floating installations',
      compatibleWith: 'Hardwood, laminate, engineered wood, bamboo',
      notCompatibleWith: 'Luxury vinyl plank (use QuietWalk Luxury Vinyl instead)',
    },
  },
];

export default products;
