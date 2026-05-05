/**
 * matcher.service.js — Fuzzy hotel name matching
 *
 * Uses Dice's coefficient (bigram similarity) for string comparison.
 * No external dependencies — pure implementation.
 */

const { normalizeHotelName, normalizeLocation } = require('../utils/normalize');

/**
 * Generate bigrams (pairs of adjacent characters) from a string.
 * @param {string} str
 * @returns {Map<string, number>} bigram → count
 */
function getBigrams(str) {
  const bigrams = new Map();
  for (let i = 0; i < str.length - 1; i++) {
    const bigram = str.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }
  return bigrams;
}

/**
 * Compute Dice's coefficient between two strings.
 * Returns a value between 0 (no similarity) and 1 (identical).
 *
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 0–1
 */
function computeSimilarity(str1, str2) {
  const a = normalizeHotelName(str1);
  const b = normalizeHotelName(str2);

  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);

  let intersection = 0;
  for (const [bigram, countA] of bigramsA) {
    const countB = bigramsB.get(bigram) || 0;
    intersection += Math.min(countA, countB);
  }

  const totalBigrams =
    Array.from(bigramsA.values()).reduce((s, c) => s + c, 0) +
    Array.from(bigramsB.values()).reduce((s, c) => s + c, 0);

  return totalBigrams > 0 ? (2 * intersection) / totalBigrams : 0;
}

/**
 * Check if two locations are similar enough to be considered a match.
 * @param {string} loc1
 * @param {string} loc2
 * @returns {boolean}
 */
function locationsMatch(loc1, loc2) {
  if (!loc1 || !loc2) return true; // if either is unknown, don't penalize
  const a = normalizeLocation(loc1);
  const b = normalizeLocation(loc2);
  if (a === b) return true;
  // Check if one contains the other (e.g. "Mumbai" matches "Mumbai, Maharashtra")
  return a.includes(b) || b.includes(a) || computeRawSimilarity(a, b) > 0.5;
}

/**
 * Compute raw Dice's coefficient without hotel name normalization.
 */
function computeRawSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const biA = getBigrams(a);
  const biB = getBigrams(b);
  let inter = 0;
  for (const [bg, cA] of biA) inter += Math.min(cA, biB.get(bg) || 0);
  const total = [...biA.values()].reduce((s, c) => s + c, 0) + [...biB.values()].reduce((s, c) => s + c, 0);
  return total > 0 ? (2 * inter) / total : 0;
}

/**
 * Find all candidates that match a query above a similarity threshold.
 *
 * @param {string}   queryName      - hotel name to search for
 * @param {string}   queryLocation  - location to filter by
 * @param {object[]} candidates     - array of { name, location, ...rest }
 * @param {number}   [threshold=0.55] - minimum similarity score
 * @returns {Array<{ candidate: object, similarity: number }>}
 */
function findMatches(queryName, queryLocation, candidates, threshold = 0.55) {
  const results = [];

  for (const candidate of candidates) {
    const sim = computeSimilarity(queryName, candidate.name || candidate.title || '');
    if (sim >= threshold && locationsMatch(queryLocation, candidate.location)) {
      results.push({ candidate, similarity: Math.round(sim * 100) / 100 });
    }
  }

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

module.exports = {
  computeSimilarity,
  locationsMatch,
  findMatches,
  getBigrams,
  normalizeHotelName,
  normalizeLocation,
};
