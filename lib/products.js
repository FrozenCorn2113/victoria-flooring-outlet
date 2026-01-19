import products from '../products';

/**
 * Calculate total coverage in square feet from cart items
 * @param {Array|Object} cartItems - Cart items (array or object with quantity)
 * @returns {number} Total square feet coverage
 */
export function calculateTotalCoverage(cartItems) {
  let totalSqFt = 0;

  // Handle both array and object formats
  const items = Array.isArray(cartItems) 
    ? cartItems 
    : Object.values(cartItems || {});

  items.forEach(item => {
    const product = products.find(p => p.id === item.id || p.id === item.productId);
    if (product) {
      const quantity = item.quantity || 1;
      // If product has pricePerSqFt, quantity is already in square feet
      if (product.pricePerSqFt) {
        totalSqFt += quantity;
      } else if (product.coverageSqFtPerBox) {
        // Legacy: quantity is boxes, multiply by coverage per box
        totalSqFt += product.coverageSqFtPerBox * quantity;
      }
    }
  });

  return totalSqFt;
}

/**
 * Get upsell products for a given product
 * @param {string} productId - The product ID to get upsells for
 * @returns {Array} Array of upsell products
 */
export function getUpsellProducts(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.upsellSkus || product.upsellSkus.length === 0) {
    return [];
  }

  return products.filter(p => product.upsellSkus.includes(p.id));
}

/**
 * Get all accessory products (for homepage accessories section)
 * @returns {Array} Array of accessory products
 */
export function getAccessoryProducts() {
  return products.filter(p => p.type === 'Accessory');
}

/**
 * Calculate recommended quantity of an accessory based on flooring square footage
 * @param {number} flooringSqFt - Total square footage of flooring
 * @param {Object} accessory - The accessory product with coverage data
 * @returns {number} Recommended quantity (minimum 1)
 */
export function calculateAccessoryQuantity(flooringSqFt, accessory) {
  if (!accessory.coverage) return 1; // Default to 1 if no coverage data

  const { sqFtPerUnit, buffer = 1.1 } = accessory.coverage;
  const sqFtNeeded = flooringSqFt * buffer; // Add buffer for waste/overlap
  const quantity = Math.ceil(sqFtNeeded / sqFtPerUnit);

  return Math.max(1, quantity); // At least 1
}

/**
 * Get smart accessory recommendations based on cart contents
 * @param {Object} cartDetails - Cart details object from useShoppingCart
 * @returns {Object} Object with recommendations array and total flooring sq ft
 */
export function getSmartRecommendations(cartDetails) {
  // Get total flooring sq ft from cart
  const totalFlooringSqFt = Object.values(cartDetails || {})
    .filter(item => item.pricePerSqFt) // Only flooring items
    .reduce((sum, item) => sum + item.quantity, 0);

  if (totalFlooringSqFt === 0) {
    return { recommendations: [], totalFlooringSqFt: 0 };
  }

  // Get flooring types in cart
  const flooringTypes = Object.values(cartDetails || {})
    .filter(item => item.pricePerSqFt)
    .map(item => item.type);

  // Find accessories already in cart
  const accessoriesInCart = Object.values(cartDetails || {})
    .filter(item => item.type === 'Accessory')
    .map(item => item.id);

  // Get recommended accessories (exclude ones already in cart)
  const recommendations = products
    .filter(product =>
      product.type === 'Accessory' &&
      product.coverage &&
      !accessoriesInCart.includes(product.id) &&
      product.coverage.recommendedFor?.some(type => flooringTypes.includes(type))
    )
    .map(accessory => ({
      ...accessory,
      recommendedQuantity: calculateAccessoryQuantity(totalFlooringSqFt, accessory),
      coverageDescription: `Covers approximately ${accessory.coverage.sqFtPerUnit} sq ft per unit`
    }));

  return {
    recommendations,
    totalFlooringSqFt
  };
}

