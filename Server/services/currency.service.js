/**
 * currency.service.js — Handles currency normalization
 *
 * Uses static exchange rates for simplicity. In a production environment,
 * this would fetch daily rates from an API like Open Exchange Rates.
 */

// Base currency is USD. Rates are how much 1 unit of foreign currency is worth in USD.
// Alternatively, how many USD you get for 1 unit of foreign currency.
// e.g. 1 EUR = ~1.08 USD
const STATIC_RATES_TO_USD = {
  USD: 1.000,
  EUR: 1.080,
  GBP: 1.250,
  INR: 0.012, // 1 INR = 0.012 USD (~83 INR/USD)
  JPY: 0.0066,
  AUD: 0.650,
  CAD: 0.730,
  SGD: 0.740,
  THB: 0.027,
  HKD: 0.128,
  AED: 0.272,
};

/**
 * Normalizes a given price to USD for fair comparison.
 * @param {number} amount
 * @param {string} currencyCode - ISO 3-letter code (e.g. 'EUR')
 * @returns {number|null} - The normalized amount in USD, or null if currency unknown
 */
function normalizeToUSD(amount, currencyCode) {
  if (amount == null) return null;
  
  // If no currency is provided, we can't safely normalize it.
  // We'll return the raw amount, assuming it's the base currency (USD) or
  // hoping all sites return the same currency.
  if (!currencyCode) return amount;

  const code = currencyCode.toUpperCase();
  const rate = STATIC_RATES_TO_USD[code];

  if (!rate) {
    console.warn(`[CurrencyService] Unknown currency code: ${code}. Cannot normalize.`);
    return amount; // Fallback to raw amount
  }

  // Convert to USD and round to 2 decimal places
  const usdValue = amount * rate;
  return Math.round(usdValue * 100) / 100;
}

/**
 * Converts a normalized USD amount back to a target currency.
 */
function convertFromUSD(amountUSD, targetCurrencyCode) {
    if (amountUSD == null || !targetCurrencyCode) return amountUSD;
    
    const code = targetCurrencyCode.toUpperCase();
    const rate = STATIC_RATES_TO_USD[code];
    
    if (!rate) return amountUSD;
    
    const targetValue = amountUSD / rate;
    return Math.round(targetValue * 100) / 100;
}

module.exports = {
  normalizeToUSD,
  convertFromUSD,
  STATIC_RATES_TO_USD
};
