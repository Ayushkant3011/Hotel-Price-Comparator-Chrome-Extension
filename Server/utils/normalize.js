/**
 * normalize.js — Shared normalization utilities
 * Used by services for hotel name, location, price, and currency normalization.
 */

/**
 * Words to strip from hotel names for matching purposes.
 */
const STOP_WORDS = new Set([
  'hotel', 'hotels', 'resort', 'resorts', 'inn', 'inns', 'motel', 'motels',
  'suites', 'suite', 'lodge', 'lodges', 'hostel', 'hostels', 'villa', 'villas',
  'the', 'a', 'an', 'and', '&', 'by', 'at', 'of', 'in', 'on',
]);

/**
 * Normalize a hotel name for fuzzy matching.
 * - Lowercase
 * - Remove common stop words (hotel, resort, the, etc.)
 * - Remove special characters
 * - Collapse whitespace
 *
 * @param {string} name
 * @returns {string}
 */
function normalizeHotelName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  // Remove star ratings like "5-star" or "★★★"
  n = n.replace(/\d[\s-]*star/gi, '').replace(/[★☆]/g, '');
  // Remove special characters except spaces and alphanumeric
  n = n.replace(/[^a-z0-9\s]/g, ' ');
  // Remove stop words
  n = n.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 0).join(' ');
  // Collapse whitespace
  return n.replace(/\s+/g, ' ').trim();
}

/**
 * Normalize a location string for matching.
 * - Lowercase, trim
 * - Remove common suffixes like "area", "district", "city"
 * - Remove country names for local matching
 *
 * @param {string} location
 * @returns {string}
 */
function normalizeLocation(location) {
  if (!location) return '';
  let loc = location.toLowerCase().trim();
  // Remove "show on map" text
  loc = loc.replace(/show\s+on\s+map/gi, '');
  // Remove common suffixes
  loc = loc.replace(/\b(area|district|region|city|town|center|centre)\b/g, '');
  // Remove special chars except comma (city, state)
  loc = loc.replace(/[^a-z0-9,\s]/g, ' ');
  return loc.replace(/\s+/g, ' ').trim();
}

/**
 * Currency symbol to ISO code mapping.
 */
const CURRENCY_MAP = {
  '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
  'A$': 'AUD', 'C$': 'CAD', 'R$': 'BRL', '₩': 'KRW',
  '฿': 'THB', '₫': 'VND', 'S$': 'SGD', 'HK$': 'HKD',
};

/**
 * Parse a raw price string into { value, currency }.
 * @param {string} rawPrice
 * @returns {{ value: number|null, currency: string|null }}
 */
function parsePrice(rawPrice) {
  if (!rawPrice && typeof rawPrice !== 'number') return { value: null, currency: null };

  if (typeof rawPrice === 'number') return { value: rawPrice, currency: null };

  const raw = String(rawPrice).trim();
  let currency = null;

  // Detect from symbol
  for (const [sym, code] of Object.entries(CURRENCY_MAP)) {
    if (raw.includes(sym)) { currency = code; break; }
  }
  // Detect from 3-letter code
  if (!currency) {
    const m = raw.match(/\b([A-Z]{3})\b/);
    if (m) currency = m[1];
  }

  // Extract numeric value
  let numStr = raw.replace(/[^\d.,]/g, '');
  if (!numStr) return { value: null, currency };

  const lastComma = numStr.lastIndexOf(',');
  const lastDot = numStr.lastIndexOf('.');
  if (lastComma > lastDot && numStr.length - lastComma <= 3) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  } else {
    numStr = numStr.replace(/,/g, '');
  }

  const value = parseFloat(numStr);
  return { value: isNaN(value) ? null : value, currency };
}

module.exports = {
  normalizeHotelName,
  normalizeLocation,
  parsePrice,
  STOP_WORDS,
  CURRENCY_MAP,
};
