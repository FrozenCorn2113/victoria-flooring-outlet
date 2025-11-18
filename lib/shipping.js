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
 * Get postal code prefix (first 3 characters) for remote area detection
 * @param {string} postalCode - Postal code
 * @returns {string} Postal code prefix (e.g., "V0A")
 */
export function getPostalCodePrefix(postalCode) {
  if (!postalCode) return '';
  const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();
  return cleaned.slice(0, 3);
}

/**
 * Remote postal code prefixes that require surcharge
 * These are typically rural/remote areas in BC
 */
const REMOTE_POSTAL_PREFIXES = [
  'V0A', 'V0B', 'V0C', 'V0E', 'V0G', 'V0H', 'V0J', 'V0K', 'V0L', 'V0M', 'V0N', 'V0P', 'V0R', 'V0S', 'V0T', 'V0V', 'V0W', 'V0X',
  'V1A', 'V1B', 'V1C', 'V1E', 'V1G', 'V1H', 'V1J', 'V1K', 'V1L', 'V1M', 'V1N', 'V1P', 'V1R', 'V1S', 'V1T', 'V1V', 'V1W', 'V1X', 'V1Y', 'V1Z',
  'V9A', 'V9B', 'V9C', 'V9E', 'V9G', 'V9H', 'V9J', 'V9K', 'V9L', 'V9M', 'V9N', 'V9P', 'V9R', 'V9S', 'V9T', 'V9V', 'V9W', 'V9X', 'V9Y', 'V9Z'
];

/**
 * Check if postal code is in a remote area
 * @param {string} postalCode - Postal code to check
 * @returns {boolean} True if remote area
 */
export function isRemoteArea(postalCode) {
  const prefix = getPostalCodePrefix(postalCode);
  return REMOTE_POSTAL_PREFIXES.includes(prefix);
}

/**
 * Calculate shipping cost based on postal code and total square feet
 * @param {Object} params - Shipping calculation parameters
 * @param {string} params.postalCode - Canadian postal code
 * @param {number} params.totalSqFt - Total square feet of flooring
 * @returns {Object} Shipping calculation result
 */
export function calculateShipping({ postalCode, totalSqFt = 0 }) {
  // Validate postal code
  if (!validateCanadianPostalCode(postalCode)) {
    return {
      valid: false,
      error: 'Invalid Canadian postal code format',
      shipping: 0,
      baseRate: 0,
      sqFtCharge: 0,
      remoteSurcharge: 0,
    };
  }

  // Shipping rates (in cents)
  const BASE_RATE = 2500; // $25.00 base shipping
  const FREE_SHIPPING_THRESHOLD = 500; // Free shipping over 500 sq ft
  const PER_SQFT_RATE = 50; // $0.50 per sq ft over threshold
  const THRESHOLD = 100; // First 100 sq ft included in base rate
  const REMOTE_SURCHARGE = 1500; // $15.00 surcharge for remote areas

  let baseRate = BASE_RATE;
  let sqFtCharge = 0;
  let remoteSurcharge = 0;

  // Calculate square footage charge
  if (totalSqFt > THRESHOLD) {
    const sqFtOverThreshold = totalSqFt - THRESHOLD;
    sqFtCharge = Math.ceil(sqFtOverThreshold * PER_SQFT_RATE);
  }

  // Free shipping for large orders
  if (totalSqFt >= FREE_SHIPPING_THRESHOLD) {
    baseRate = 0;
    sqFtCharge = 0;
  }

  // Remote area surcharge
  if (isRemoteArea(postalCode)) {
    remoteSurcharge = REMOTE_SURCHARGE;
  }

  const totalShipping = baseRate + sqFtCharge + remoteSurcharge;

  return {
    valid: true,
    shipping: totalShipping,
    baseRate,
    sqFtCharge,
    remoteSurcharge,
    isRemote: isRemoteArea(postalCode),
    formattedPostalCode: formatCanadianPostalCode(postalCode),
  };
}

