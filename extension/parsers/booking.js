/**
 * booking.js — Booking.com parser
 * Extracts hotel listing data from Booking.com pages using
 * a multi-strategy fallback chain via ParserUtils.
 *
 * Handles both:
 *  - Hotel detail pages (single listing)
 *  - Search result pages (multiple listings)
 *
 * Exposes: window.parseBooking()      → single listing
 *          window.parseBookingList()   → array of listings (search page)
 *          window.getBookingPageType() → 'detail' | 'search' | 'unknown'
 */
(function () {
  'use strict';

  const P = window.ParserUtils;

  /* ──────────────────────────────────────────────
   * Page type detection
   * ────────────────────────────────────────────── */

  const PAGE_PATTERNS = [
    { type: 'detail', pattern: /booking\.com\/hotel\//i },
    { type: 'search', pattern: /booking\.com\/searchresults/i },
  ];

  function getBookingPageType() {
    for (const { type, pattern } of PAGE_PATTERNS) {
      if (pattern.test(window.location.href)) return type;
    }
    return 'unknown';
  }

  /* ──────────────────────────────────────────────
   * Single listing — hotel detail page
   * ────────────────────────────────────────────── */

  function parseBooking() {
    // ── Title ──
    const title =
      P.trySelectors([
        '[data-testid="title"]',
        'h2.pp-header__title',
        'h2.hp__hotel-name',
        'h1#hp_hotel_name',
        '.hp__hotel-name',
        'h1',
      ]) ||
      P.tryMetaTags(['og:title', 'twitter:title']) ||
      extractTitleFromUrl();

    // ── Location ──
    const location =
      P.trySelectors([
        '[data-testid="address"]',
        'span.hp_address_subtitle',
        '.hp_address_subtitle',
        '[data-node_tt_id="location_score_tooltip"]',
        '.bui-link[data-atlas-latlng]',
        '.address',
      ]) ||
      P.tryMetaTags(['og:locality', 'og:region']);

    // ── Price ──
    let priceRaw =
      P.trySelectors([
        '[data-testid="price-and-discounted-price"]',
        '[data-testid="price-for-x-nights"]',
        '.bui-price-display__value',
        '.prco-valign-middle-helper',
        '.hprt-price-price',
        '[data-testid="price-element"]',
        '.price',
      ]);

    // Fallback: JSON-LD
    if (!priceRaw) {
      const jd = P.tryJsonLd(['Hotel', 'LodgingBusiness']);
      if (jd) {
        if (jd.offers && jd.offers.price) priceRaw = String(jd.offers.price);
        else if (jd.priceRange) priceRaw = jd.priceRange;
      }
    }

    const price = P.normalizePrice(priceRaw);

    // ── Rating ──
    const rating =
      P.trySelectors([
        '[data-testid="review-score-component"] .ac4a7896c7',
        '.bui-review-score__badge',
        '[data-testid="review-score-right-component"] .a3b8729ab1',
        '.review-score-badge',
      ]);

    const reviewCount =
      P.trySelectors([
        '[data-testid="review-score-component"] .abf093bdfe',
        '.bui-review-score__text',
        '[data-testid="review-score-right-component"] .db63693c62',
      ]);

    // ── Image ──
    const imageUrl =
      P.trySelectorsAttr([
        '[data-testid="hero-banner-photo"] img',
        '.bh-photo-grid img',
        '#photo_wrapper img',
        '.hp--gallery img',
      ], 'src') ||
      P.tryMetaTags(['og:image']);

    // ── Dates (from URL) ──
    const dates = P.extractDatesFromUrl([
      ['checkin', 'checkout'],
      ['ci', 'co'],
    ]);

    const result = {
      title: title || null,
      location: cleanLocation(location),
      price: price.value,
      currency: price.currency,
      priceRaw: price.raw,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      rating: parseFloat(rating) || null,
      reviewCount: extractNumber(reviewCount),
      imageUrl: imageUrl || null,
      url: window.location.href,
    };

    result.confidence = P.computeConfidence(result);
    return result;
  }

  /* ──────────────────────────────────────────────
   * Multiple listings — search results page
   * ────────────────────────────────────────────── */

  function parseBookingList() {
    const cardSelectors = [
      '[data-testid="property-card"]',
      '.sr_property_block',
      '.js-sr-card',
    ];

    const cards = P.trySelectorsAll(cardSelectors);
    if (!cards.length) return [];

    return cards.slice(0, 20).map((card) => {
      const title = textFrom(card, [
        '[data-testid="title"]',
        '.sr-hotel__name',
        'h3',
      ]);

      const location = textFrom(card, [
        '[data-testid="address"]',
        '[data-testid="distance"]',
        '.bui-card__subtitle',
      ]);

      const priceRaw = textFrom(card, [
        '[data-testid="price-and-discounted-price"]',
        '.bui-price-display__value',
        '.prco-valign-middle-helper',
        '.price',
      ]);

      const price = P.normalizePrice(priceRaw);

      const rating = textFrom(card, [
        '[data-testid="review-score"] .ac4a7896c7',
        '.bui-review-score__badge',
      ]);

      const imageUrl = attrFrom(card, [
        '.hotel_image img',
        'img[data-testid="image"]',
        'img',
      ], 'src');

      const link = attrFrom(card, [
        'a[data-testid="title-link"]',
        'a.js-sr-hotel-link',
        'a',
      ], 'href');

      return {
        title: title || null,
        location: cleanLocation(location),
        price: price.value,
        currency: price.currency,
        priceRaw: price.raw,
        rating: parseFloat(rating) || null,
        imageUrl: imageUrl || null,
        url: link ? new URL(link, window.location.origin).href : null,
      };
    }).filter(item => item.title || item.price);
  }

  /* ──────────────────────────────────────────────
   * Helpers
   * ────────────────────────────────────────────── */

  function textFrom(parent, selectors) {
    for (const sel of selectors) {
      try {
        const el = parent.querySelector(sel);
        if (el) {
          const txt = (el.innerText || el.textContent || '').trim();
          if (txt) return txt;
        }
      } catch (_) { /* skip */ }
    }
    return null;
  }

  function attrFrom(parent, selectors, attr) {
    for (const sel of selectors) {
      try {
        const el = parent.querySelector(sel);
        if (el && el.getAttribute(attr)) return el.getAttribute(attr).trim();
      } catch (_) { /* skip */ }
    }
    return null;
  }

  function extractTitleFromUrl() {
    // Booking URLs: /hotel/in/hotel-name-here.html
    const m = window.location.pathname.match(/\/hotel\/[^/]+\/([^/.]+)/);
    if (m) return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return null;
  }

  function cleanLocation(loc) {
    if (!loc) return null;
    // Remove "Show on map" links, extra whitespace
    return loc.replace(/show\s+on\s+map/gi, '').replace(/\s+/g, ' ').trim() || null;
  }

  function extractNumber(str) {
    if (!str) return null;
    const m = str.replace(/,/g, '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ──────────────────────────────────────────────
   * Expose globally
   * ────────────────────────────────────────────── */

  window.parseBooking = parseBooking;
  window.parseBookingList = parseBookingList;
  window.getBookingPageType = getBookingPageType;
})();
