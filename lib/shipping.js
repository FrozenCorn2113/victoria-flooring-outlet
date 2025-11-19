/**
 * Shipping calculation for Victoria Flooring Outlet
 * Zone-based per-box pricing
 */

/**
 * Shipping zones and their per-box rates (in cents)
 */
const SHIPPING_ZONES = {
  // Zone 1: Greater Victoria - $8/box
  victoria: {
    name: 'Greater Victoria',
    ratePerBox: 800, // $8.00 per box
    prefixes: ['V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V8Z', 'V9A', 'V9B', 'V9C']
  },
  // Zone 2: Rest of Vancouver Island - $15/box
  island: {
    name: 'Vancouver Island',
    ratePerBox: 1500, // $15.00 per box
    prefixes: ['V9E', 'V9G', 'V9J', 'V9K', 'V9L', 'V9M', 'V9N', 'V9P', 'V9R', 'V9S', 'V9T', 'V9V', 'V9W', 'V9X', 'V9Y', 'V9Z', 'V0R']
  },
  // Zone 3: Lower Mainland & Fraser Valley - $12/box (close to Richmond warehouse)
  mainland: {
    name: 'Lower Mainland',
    ratePerBox: 1200, // $12.00 per box
    prefixes: ['V1M', 'V2S', 'V2T', 'V2V', 'V2W', 'V2X', 'V2Y', 'V2Z', 'V3A', 'V3B', 'V3C', 'V3E', 'V3G', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Y', 'V3Z', 'V4A', 'V4B', 'V4C', 'V4E', 'V4G', 'V4K', 'V4L', 'V4M', 'V4N', 'V4P', 'V4R', 'V4S', 'V4T', 'V4V', 'V4W', 'V4X', 'V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6V', 'V6W', 'V6X', 'V6Y', 'V6Z', 'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V7X', 'V7Y']
  },
  // Zone 4: Rest of BC - $20/box
  bcInterior: {
    name: 'BC Interior',
    ratePerBox: 2000, // $20.00 per box
    prefixes: ['V0A', 'V0B', 'V0C', 'V0E', 'V0G', 'V0H', 'V0J', 'V0K', 'V0L', 'V0M', 'V0N', 'V0P', 'V0S', 'V0T', 'V0V', 'V0W', 'V0X', 'V1A', 'V1B', 'V1C', 'V1E', 'V1G', 'V1H', 'V1J', 'V1K', 'V1L', 'V1N', 'V1P', 'V1R', 'V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z', 'V2A', 'V2B', 'V2C', 'V2E', 'V2G', 'V2H', 'V2J', 'V2K', 'V2L', 'V2M', 'V2N', 'V2P', 'V2R', 'V4Z', 'V8A', 'V8B', 'V8C', 'V8E', 'V8G', 'V8J', 'V8K', 'V8L', 'V8M']
  }
};

/**
 * Validate Canadian postal code format (A1A 1A1)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if valid format
 */
export function validateCanadianPostalCode(postalCode) {
  if (!postalCode) return false;

  // Remove spaces and convert to uppercase
  const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();

  // Canadian postal code pattern: A1A1A1 (6 characters, alternating letter/number)
  const pattern = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;

  return pattern.test(cleaned);
}

/**
 * Format Canadian postal code (A1A 1A1)
 * @param {string} postalCode - Postal code to format
 * @returns {string} Formatted postal code or original if invalid
 */
export function formatCanadianPostalCode(postalCode) {
  if (!postalCode) return '';

  const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();

  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }

  return postalCode;
}

/**
 * Get postal code prefix (first 3 characters)
 * @param {string} postalCode - Postal code
 * @returns {string} Postal code prefix (e.g., "V8V")
 */
export function getPostalCodePrefix(postalCode) {
  if (!postalCode) return '';
  const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();
  return cleaned.slice(0, 3);
}

/**
 * Determine shipping zone from postal code
 * @param {string} postalCode - Postal code
 * @returns {Object|null} Zone object or null if not serviceable
 */
export function getShippingZone(postalCode) {
  const prefix = getPostalCodePrefix(postalCode);

  for (const [zoneKey, zone] of Object.entries(SHIPPING_ZONES)) {
    if (zone.prefixes.includes(prefix)) {
      return { key: zoneKey, ...zone };
    }
  }

  return null;
}

/**
 * Calculate number of boxes from cart items
 * @param {Object} cartDetails - Cart details object
 * @returns {number} Total number of boxes
 */
export function calculateTotalBoxes(cartDetails) {
  let totalBoxes = 0;

  const items = Array.isArray(cartDetails)
    ? cartDetails
    : Object.values(cartDetails || {});

  items.forEach(item => {
    if (item.pricePerSqFt && item.coverageSqFtPerBox) {
      // Flooring product - calculate boxes from sq ft
      const boxes = Math.ceil(item.quantity / item.coverageSqFtPerBox);
      totalBoxes += boxes;
    } else if (item.quantity) {
      // Accessory or other product - count as items (not boxes for shipping)
      // Accessories don't add to box count for shipping
    }
  });

  return totalBoxes;
}

/**
 * Calculate shipping cost based on postal code and cart
 * @param {Object} params - Shipping calculation parameters
 * @param {string} params.postalCode - Canadian postal code
 * @param {number} params.totalBoxes - Total number of boxes
 * @returns {Object} Shipping calculation result
 */
export function calculateShipping({ postalCode, totalSqFt = 0, totalBoxes = 0, cartDetails = null }) {
  // Validate postal code
  if (!validateCanadianPostalCode(postalCode)) {
    return {
      valid: false,
      error: 'Invalid Canadian postal code format',
      shipping: 0,
      zone: null,
      boxes: 0,
      ratePerBox: 0,
    };
  }

  // Determine zone
  const zone = getShippingZone(postalCode);

  if (!zone) {
    return {
      valid: false,
      error: 'Sorry, we currently only ship to Vancouver Island',
      shipping: 0,
      zone: null,
      boxes: 0,
      ratePerBox: 0,
    };
  }

  // Calculate boxes if cartDetails provided
  let boxes = totalBoxes;
  if (cartDetails && !totalBoxes) {
    boxes = calculateTotalBoxes(cartDetails);
  }

  // Calculate shipping cost
  const shipping = boxes * zone.ratePerBox;

  return {
    valid: true,
    shipping,
    zone: zone.name,
    boxes,
    ratePerBox: zone.ratePerBox,
    formattedPostalCode: formatCanadianPostalCode(postalCode),
  };
}
