/**
 * price.service.js — MongoDB price detection store
 *
 * Stores recent detections from the Chrome extension and provides
 * competitor price lookup by fuzzy hotel name matching.
 */

const { normalizeHotelName, normalizeLocation, parsePrice } = require('../utils/normalize');
const { findMatches } = require('./matcher.service');
const { normalizeToUSD } = require('./currency.service');
const Detection = require('../models/Detection.model');

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
 * @returns {Promise<{ stored: boolean, key: string }>}
 */
async function storeDetection(detection) {
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

  // Normalize the price to USD for fair comparison
  const normalizedPriceUSD = normalizeToUSD(price, currency);

  const updateData = {
    name: detection.title,
    normalizedName: key,
    site: detection.site,
    location: detection.location || null,
    normalizedLocation: normalizeLocation(detection.location),
    price: price || null,
    currency: currency || null,
    normalizedPriceUSD: normalizedPriceUSD,
    priceRaw: detection.priceRaw || null,
    url: detection.url || null,
    checkIn: detection.checkIn || null,
    checkOut: detection.checkOut || null,
    rating: detection.rating || null,
    imageUrl: detection.imageUrl || null,
    detectedAt: detection.detectedAt || new Date().toISOString(),
    storedAt: new Date() // Updates TTL
  };

  try {
    // Upsert: Update if normalizedName + site exists, otherwise insert
    await Detection.findOneAndUpdate(
      { normalizedName: key, site: detection.site },
      { $set: updateData },
      { upsert: true, new: true }
    );

    console.log(`[PriceService] Stored in DB: "${detection.title}" (${detection.site}) → ${price} ${currency || ''}`);
    return { stored: true, key };
  } catch (err) {
    console.error(`[PriceService] Error storing detection:`, err);
    return { stored: false, key: null };
  }
}

/**
 * Find competitor prices for a given hotel.
 *
 * @param {string} hotelName
 * @param {string} [location]
 * @returns {Promise<{ query: string, location: string, matches: object[] }>}
 */
async function findCompetitorPrices(hotelName, location) {
  if (!hotelName) {
    return { query: hotelName, location, matches: [] };
  }

  try {
    // Fetch all active detections from the database
    // The TTL index automatically removes docs older than 24h
    const allDetections = await Detection.find({}).lean();

    // Find fuzzy matches using existing logic
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
      // Sort by normalizedPriceUSD ascending (cheapest first), nulls last
      if (a.normalizedPriceUSD == null && b.normalizedPriceUSD == null) {
        // Fallback to raw price if neither has normalized
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      }
      if (a.normalizedPriceUSD == null) return 1;
      if (b.normalizedPriceUSD == null) return -1;
      return a.normalizedPriceUSD - b.normalizedPriceUSD;
    });

    return {
      query: hotelName,
      location: location || null,
      matchCount: matches.length,
      matches,
    };
  } catch (err) {
    console.error(`[PriceService] Error finding competitor prices:`, err);
    return { query: hotelName, location, matches: [] };
  }
}

/**
 * Get all stored detections (for debugging/admin).
 * @returns {Promise<object[]>}
 */
async function getAllDetections() {
  try {
    return await Detection.find({}).lean();
  } catch (err) {
    console.error(`[PriceService] Error getting all detections:`, err);
    return [];
  }
}

/**
 * Clear stale entries from the store.
 * Note: MongoDB handles TTL deletion automatically via the `storedAt` index.
 * This function is kept for API compatibility if called elsewhere.
 */
function cleanup() {
  console.log(`[PriceService] Cleanup called, but MongoDB handles TTL automatically.`);
}

module.exports = {
  storeDetection,
  findCompetitorPrices,
  getAllDetections,
  cleanup,
};
