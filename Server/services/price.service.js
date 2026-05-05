/**
 * price.service.js — In-memory price detection store
 *
 * Stores recent detections from the Chrome extension and provides
 * competitor price lookup by fuzzy hotel name matching.
 */

const { normalizeHotelName, normalizeLocation, parsePrice } = require('../utils/normalize');
const { findMatches } = require('./matcher.service');

/**
 * In-memory store of detections.
 * Key: normalized hotel name
 * Value: Map<site, detection>
 *
 * In production this would be backed by MongoDB/Redis.
 */
const detections = new Map();

/**
 * Maximum age of a detection before it's considered stale (ms).
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Store a detection from the extension.
 *
 * @param {object} detection
 * @param {string} detection.site   - e.g. 'booking.com'
 * @param {string} detection.title  - hotel name
 * @param {string} [detection.location]
 * @param {number} [detection.price]
 * @param {string} [detection.currency]
 * @param {string} [detection.priceRaw]
 * @param {string} [detection.url]
 * @returns {{ stored: boolean, key: string }}
 */
function storeDetection(detection) {
  if (!detection || !detection.title) {
    return { stored: false, key: null };
  }

  const key = normalizeHotelName(detection.title);
  if (!key) return { stored: false, key: null };

  // Parse price if it comes as a raw string
  let price = detection.price;
  let currency = detection.currency;
  if (!price && detection.priceRaw) {
    const parsed = parsePrice(detection.priceRaw);
    price = parsed.value;
    currency = currency || parsed.currency;
  }

  const entry = {
    name: detection.title,
    normalizedName: key,
    site: detection.site,
    location: detection.location || null,
    normalizedLocation: normalizeLocation(detection.location),
    price: price || null,
    currency: currency || null,
    priceRaw: detection.priceRaw || null,
    url: detection.url || null,
    checkIn: detection.checkIn || null,
    checkOut: detection.checkOut || null,
    rating: detection.rating || null,
    imageUrl: detection.imageUrl || null,
    storedAt: new Date().toISOString(),
    detectedAt: detection.detectedAt || new Date().toISOString(),
  };

  // Get or create the hotel's detection map
  if (!detections.has(key)) {
    detections.set(key, new Map());
  }
  detections.get(key).set(detection.site, entry);

  console.log(`[PriceService] Stored: "${detection.title}" (${detection.site}) → ${price} ${currency || ''}`);
  return { stored: true, key };
}

/**
 * Find competitor prices for a given hotel.
 *
 * @param {string} hotelName
 * @param {string} [location]
 * @returns {{ query: string, location: string, matches: object[] }}
 */
function findCompetitorPrices(hotelName, location) {
  if (!hotelName) {
    return { query: hotelName, location, matches: [] };
  }

  // Build flat list of all stored detections
  const allDetections = [];
  for (const [, siteMap] of detections) {
    for (const [, entry] of siteMap) {
      // Skip stale entries
      const age = Date.now() - new Date(entry.storedAt).getTime();
      if (age > MAX_AGE_MS) continue;
      allDetections.push(entry);
    }
  }

  // Find fuzzy matches
  const matched = findMatches(hotelName, location, allDetections, 0.5);

  // Group by site — only keep best match per site
  const bySite = new Map();
  for (const { candidate, similarity } of matched) {
    const existing = bySite.get(candidate.site);
    if (!existing || existing.similarity < similarity) {
      bySite.set(candidate.site, { ...candidate, similarity });
    }
  }

  const matches = Array.from(bySite.values()).sort((a, b) => {
    // Sort by price ascending (cheapest first), nulls last
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return {
    query: hotelName,
    location: location || null,
    matchCount: matches.length,
    matches,
  };
}

/**
 * Get all stored detections (for debugging/admin).
 * @returns {object[]}
 */
function getAllDetections() {
  const all = [];
  for (const [, siteMap] of detections) {
    for (const [, entry] of siteMap) {
      all.push(entry);
    }
  }
  return all;
}

/**
 * Clear stale entries from the store.
 */
function cleanup() {
  let removed = 0;
  for (const [key, siteMap] of detections) {
    for (const [site, entry] of siteMap) {
      const age = Date.now() - new Date(entry.storedAt).getTime();
      if (age > MAX_AGE_MS) {
        siteMap.delete(site);
        removed++;
      }
    }
    if (siteMap.size === 0) detections.delete(key);
  }
  if (removed > 0) console.log(`[PriceService] Cleaned up ${removed} stale entries`);
}

// Run cleanup every hour
setInterval(cleanup, 60 * 60 * 1000);

module.exports = {
  storeDetection,
  findCompetitorPrices,
  getAllDetections,
  cleanup,
};
