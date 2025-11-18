const products = [
  {
    id: 'harbinger-contract-coastal-oak',
    slug: 'harbinger-contract-coastal-oak',
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
    pricePerSqFt: 2.69, // weekly deal price
    compareAtPricePerSqFt: 3.49, // regular price
    currency: 'CAD',
    image: '/images/Untitled design (21).png',
    swatchImage: '/images/products/contract-coastal-oak-swatch.jpg',
    badge: 'Contract Series · Glue-down',
    shortTagline: 'Durable, stylish glue-down vinyl at contractor pricing.',
    description: 'Durable, stylish and low-maintenance glue-down vinyl at contractor pricing. 100% waterproof luxury vinyl plank suitable for kitchens, basements and rentals.',
    warranty: 'Lifetime limited residential warranty / 20-year light commercial warranty',
    // Legacy fields for backward compatibility
    thickness: 2.0, // mm
    wearLayer: 12, // mil
    // Calculate price from pricePerSqFt for backward compatibility
    price: Math.round(2.69 * 48 * 100), // $129.12 = 12912 cents
    isWeeklyDeal: true,
    compareAtPrice: Math.round(3.49 * 48 * 100), // $167.52 = 16752 cents
    upsellSkus: ['price_glue_001', 'price_underlay_001', 'price_transition_001'],
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
    id: 'price_glue_001',
    name: 'Premium Flooring Adhesive - 1 Gallon',
    price: 3499, // $34.99
    currency: 'CAD',
    image: '/accessories/flooring-glue.jpg',
    description: 'Professional-grade adhesive for luxury vinyl flooring installation. Waterproof and long-lasting bond.',
    brand: 'Harbinger',
    type: 'Accessory',
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    rating: {
      count: 89,
      rate: 4.6,
    },
  },
  {
    id: 'price_underlay_001',
    name: 'Premium Underlayment - 100 sq ft Roll',
    price: 4999, // $49.99
    currency: 'CAD',
    image: '/accessories/underlay.jpg',
    description: 'High-quality foam underlayment for sound reduction and moisture protection. 100 square feet per roll.',
    brand: 'Harbinger',
    type: 'Accessory',
    coverageSqFtPerBox: 100,
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    rating: {
      count: 156,
      rate: 4.7,
    },
  },
  {
    id: 'price_transition_001',
    name: 'T-Molding Transition Strip - 48"',
    price: 1999, // $19.99
    currency: 'CAD',
    image: '/accessories/transition-strip.jpg',
    description: 'Matching T-molding transition strip for doorways and room transitions. 48 inches long.',
    brand: 'Harbinger',
    type: 'Accessory',
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    rating: {
      count: 73,
      rate: 4.5,
    },
  },
  {
    id: 'price_trim_001',
    name: 'Quarter Round Molding - 8ft',
    price: 1299, // $12.99
    currency: 'CAD',
    image: '/accessories/quarter-round.jpg',
    description: 'Quarter round molding to finish edges and cover expansion gaps. 8 feet per piece.',
    brand: 'Harbinger',
    type: 'Accessory',
    isWeeklyDeal: false,
    compareAtPrice: null,
    upsellSkus: [],
    rating: {
      count: 94,
      rate: 4.4,
    },
  },
];

export default products;
