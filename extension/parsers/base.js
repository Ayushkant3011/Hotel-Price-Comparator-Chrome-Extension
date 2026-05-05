/**
 * base.js — Shared parser utilities for all site-specific parsers.
 * Loaded before any site parser via manifest content_scripts.
 *
 * Exposes window.ParserUtils with helper methods that each parser
 * can call to extract data through a multi-strategy fallback chain:
 *   1. data-testid selectors
 *   2. Semantic CSS selectors
 *   3. JSON-LD structured data
 *   4. Meta / Open Graph tags
 *   5. URL pattern extraction
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   * 1. DOM Selector helpers
   * ────────────────────────────────────────────── */

  /**
   * Try an ordered list of CSS selectors, returning the trimmed
   * text content of the first element that matches and has text.
   * @param {string[]} selectors
   * @returns {string|null}
   */
  function trySelectors(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const txt = (el.innerText || el.textContent || '').trim();
          if (txt) return txt;
        }
      } catch (_) {
        // invalid selector — skip
      }
    }
    return null;
  }

  /**
   * Return ALL matching elements for a list of selectors.
   * Useful for search result pages with multiple listing cards.
   * @param {string[]} selectors
   * @returns {Element[]}
   */
  function trySelectorsAll(selectors) {
    const results = [];
    for (const sel of selectors) {
      try {
        const els = document.querySelectorAll(sel);
        if (els.length) {
          results.push(...els);
          break; // use the first selector that finds anything
        }
      } catch (_) {
        // invalid selector — skip
      }
    }
    return results;
  }

  /**
   * Extract the text of a specific attribute from the first matching element.
   * @param {string[]} selectors
   * @param {string} attr - attribute name (e.g. 'content', 'href')
   * @returns {string|null}
   */
  function trySelectorsAttr(selectors, attr) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.getAttribute(attr)) {
          return el.getAttribute(attr).trim();
        }
      } catch (_) {
        // invalid selector — skip
      }
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 2. JSON-LD extraction
   * ────────────────────────────────────────────── */

  /**
   * Parse all <script type="application/ld+json"> on the page.
   * Optionally filter by @type.
   * @param {string|string[]} [types] - e.g. 'Hotel', ['Hotel','LodgingBusiness']
   * @returns {object|null} first matching JSON-LD object
   */
  function tryJsonLd(types) {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const typeList = types
      ? (Array.isArray(types) ? types : [types]).map(t => t.toLowerCase())
      : null;

    for (const s of scripts) {
      try {
        let data = JSON.parse(s.textContent);
        // Handle @graph arrays
        if (data && data['@graph'] && Array.isArray(data['@graph'])) {
          data = data['@graph'];
        }
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item) continue;
          if (!typeList) {
            if (item.name || item.offers) return item;
          } else {
            const itemType = (item['@type'] || '').toLowerCase();
            if (typeList.includes(itemType)) return item;
          }
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 3. Meta / Open Graph tag extraction
   * ────────────────────────────────────────────── */

  /**
   * Try to extract content from meta tags.
   * @param {string[]} names - meta tag names or properties to try
   *   e.g. ['og:title', 'twitter:title', 'title']
   * @returns {string|null}
   */
  function tryMetaTags(names) {
    for (const name of names) {
      const el =
        document.querySelector(`meta[property="${name}"]`) ||
        document.querySelector(`meta[name="${name}"]`);
      if (el) {
        const content = (el.getAttribute('content') || '').trim();
        if (content) return content;
      }
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 4. URL pattern extraction
   * ────────────────────────────────────────────── */

  /**
   * Extract a value from the current URL using named regex patterns.
   * @param {RegExp} pattern - regex with a named or numbered capture group
   * @param {string} [url] - defaults to window.location.href
   * @returns {string|null}
   */
  function extractFromUrl(pattern, url) {
    const target = url || window.location.href;
    const match = target.match(pattern);
    if (!match) return null;
    // return first named group or first capture group
    if (match.groups) {
      const values = Object.values(match.groups);
      if (values.length) return values[0];
    }
    return match[1] || null;
  }

  /**
   * Extract URL query parameters.
   * @param {string} param - query parameter name
   * @param {string} [url]
   * @returns {string|null}
   */
  function getUrlParam(param, url) {
    try {
      const u = new URL(url || window.location.href);
      return u.searchParams.get(param);
    } catch (_) {
      return null;
    }
  }

  /* ──────────────────────────────────────────────
   * 5. Price normalization
   * ────────────────────────────────────────────── */

  const CURRENCY_SYMBOLS = {
    '₹': 'INR', '\\$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
    'A\\$': 'AUD', 'C\\$': 'CAD', 'CHF': 'CHF', 'kr': 'SEK',
    'R\\$': 'BRL', '₩': 'KRW', '฿': 'THB', '₫': 'VND',
    'RM': 'MYR', 'S\\$': 'SGD', 'HK\\$': 'HKD', 'NT\\$': 'TWD',
  };

  /**
   * Normalize a raw price string into a structured price object.
   * @param {string} rawPrice - e.g. "₹4,200", "$129.00", "EUR 85"
   * @returns {{ value: number|null, currency: string|null, raw: string }}
   */
  function normalizePrice(rawPrice) {
    if (!rawPrice) return { value: null, currency: null, raw: '' };

    const raw = rawPrice.trim();
    let currency = null;

    // Detect currency from symbol
    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
      if (new RegExp(symbol).test(raw)) {
        currency = code;
        break;
      }
    }

    // Detect currency from 3-letter code in the string (e.g. "USD 120")
    if (!currency) {
      const codeMatch = raw.match(/\b([A-Z]{3})\b/);
      if (codeMatch) currency = codeMatch[1];
    }

    // Extract numeric value
    // Handle formats: 4,200  |  4.200,50  |  4,200.50  |  4200
    let numStr = raw.replace(/[^\d.,]/g, '');
    if (!numStr) return { value: null, currency, raw };

    // Determine decimal separator
    // If last separator is a comma and has 1-2 digits after it → comma is decimal
    // e.g. "4.200,50" → 4200.50
    const lastComma = numStr.lastIndexOf(',');
    const lastDot = numStr.lastIndexOf('.');

    if (lastComma > lastDot && numStr.length - lastComma <= 3) {
      // Comma is the decimal separator (European format)
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is the decimal separator (US/UK format) or no decimal
      numStr = numStr.replace(/,/g, '');
    }

    const value = parseFloat(numStr);
    return { value: isNaN(value) ? null : value, currency, raw };
  }

  /* ──────────────────────────────────────────────
   * 6. Confidence scoring
   * ────────────────────────────────────────────── */

  const FIELD_WEIGHTS = {
    title: 3,
    price: 3,
    location: 2,
    currency: 1,
    checkIn: 1,
    checkOut: 1,
    imageUrl: 0.5,
    rating: 0.5,
    reviewCount: 0.5,
  };

  /**
   * Compute a 0–1 confidence score based on how many fields
   * were successfully extracted.
   * @param {object} result - parsed listing data
   * @returns {number} 0–1
   */
  function computeConfidence(result) {
    if (!result) return 0;
    let earned = 0;
    let total = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      total += weight;
      if (result[field] !== null && result[field] !== undefined && result[field] !== '') {
        earned += weight;
      }
    }
    return total > 0 ? Math.round((earned / total) * 100) / 100 : 0;
  }

  /* ──────────────────────────────────────────────
   * 7. Date extraction helpers
   * ────────────────────────────────────────────── */

  /**
   * Try to extract check-in / check-out dates from URL parameters.
   * @param {string[][]} paramPairs - array of [checkinParam, checkoutParam] pairs
   * @returns {{ checkIn: string|null, checkOut: string|null }}
   */
  function extractDatesFromUrl(paramPairs) {
    for (const [ciParam, coParam] of paramPairs) {
      const checkIn = getUrlParam(ciParam);
      const checkOut = getUrlParam(coParam);
      if (checkIn || checkOut) {
        return { checkIn: checkIn || null, checkOut: checkOut || null };
      }
    }
    return { checkIn: null, checkOut: null };
  }

  /* ──────────────────────────────────────────────
   * Expose globally
   * ────────────────────────────────────────────── */

  window.ParserUtils = {
    trySelectors,
    trySelectorsAll,
    trySelectorsAttr,
    tryJsonLd,
    tryMetaTags,
    extractFromUrl,
    getUrlParam,
    normalizePrice,
    computeConfidence,
    extractDatesFromUrl,
  };
})();
