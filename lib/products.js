import products from 'products';

/**
 * Get the current weekly deal product
 * @returns {Object|null} The product marked as weekly deal, or null if none found
 */
export function getWeeklyDeal() {
  return products.find(product => product.isWeeklyDeal === true) || null;
}

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

