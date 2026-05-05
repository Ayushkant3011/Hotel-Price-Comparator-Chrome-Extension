/**
 * expedia.js — Expedia parser
 * Multi-strategy extraction via ParserUtils.
 * Handles detail pages and search result pages.
 *
 * Exposes: window.parseExpedia(), window.parseExpediaList(), window.getExpediaPageType()
 */
(function () {
  'use strict';
  const P = window.ParserUtils;

  const PAGE_PATTERNS = [
    { type: 'detail', pattern: /expedia\.[^/]+\/.*[Hh]otel-[Ii]nformation/i },
    { type: 'detail', pattern: /expedia\.[^/]+\/.*\.h\d+\./i },
    { type: 'search', pattern: /expedia\.[^/]+\/Hotel-Search/i },
  ];

  function getExpediaPageType() {
    for (const { type, pattern } of PAGE_PATTERNS) {
      if (pattern.test(window.location.href)) return type;
    }
    return 'unknown';
  }

  function parseExpedia() {
    const title =
      P.trySelectors([
        '[data-testid="lodging-header-name"]', '[data-stid="content-hotel-title"]',
        'h1[itemprop="name"]', 'h1.uitk-heading', 'h1',
      ]) || P.tryMetaTags(['og:title', 'twitter:title']) || extractTitleFromUrl();

    const location =
      P.trySelectors([
        '[data-testid="property-address"]', '[data-stid="content-hotel-address"]',
        'div[itemprop="address"]', '.uitk-text.uitk-text-spacing-half',
      ]) || P.tryMetaTags(['og:locality', 'og:region']);

    let priceRaw = P.trySelectors([
      '[data-testid="price-summary-message-line"]', '[data-stid="price-lockup-text"]',
      '[data-testid="price-element"]', '.uitk-type-500.uitk-type-bold',
      '.price-summary span', '.price',
    ]);
    if (!priceRaw) {
      const jd = P.tryJsonLd(['Hotel', 'LodgingBusiness']);
      if (jd && jd.offers) {
        const offer = Array.isArray(jd.offers) ? jd.offers[0] : jd.offers;
        if (offer && offer.price) priceRaw = String(offer.price);
      }
    }
    const price = P.normalizePrice(priceRaw);

    const rating = P.trySelectors([
      '[data-testid="reviews-score"]', '[itemprop="ratingValue"]',
      '.uitk-badge-base-text',
    ]);
    const reviewCount = P.trySelectors([
      '[data-testid="reviews-count"]', '[itemprop="reviewCount"]',
    ]);
    const imageUrl =
      P.trySelectorsAttr(['[data-testid="hero-image"] img', '.uitk-image img', 'img[itemprop="image"]'], 'src')
      || P.tryMetaTags(['og:image']);

    const dates = P.extractDatesFromUrl([
      ['chkin', 'chkout'], ['startDate', 'endDate'], ['checkin', 'checkout'],
    ]);

    const result = {
      title: title || null, location: location || null,
      price: price.value, currency: price.currency, priceRaw: price.raw,
      checkIn: dates.checkIn, checkOut: dates.checkOut,
      rating: parseFloat(rating) || null,
      reviewCount: extractNum(reviewCount),
      imageUrl: imageUrl || null, url: window.location.href,
    };
    result.confidence = P.computeConfidence(result);
    return result;
  }

  function parseExpediaList() {
    const cards = P.trySelectorsAll([
      '[data-testid="property-listing"]', '[data-stid="property-listing"]',
      '.uitk-card.uitk-card-roundcorner-all',
    ]);
    if (!cards.length) return [];

    return cards.slice(0, 20).map((card) => {
      const title = txt(card, [
        '[data-testid="header-hotel-name"]', '[data-stid="content-hotel-title"]',
        'h3', '.uitk-heading',
      ]);
      const priceRaw = txt(card, [
        '[data-testid="price-summary-message-line"]', '[data-stid="price-lockup-text"]',
        '.uitk-type-500', '.price',
      ]);
      const price = P.normalizePrice(priceRaw);
      const rating = txt(card, ['[data-testid="reviews-score"]', '.uitk-badge-base-text']);
      const imageUrl = attr(card, ['img[data-testid="property-image"]', 'img'], 'src');
      const link = attr(card, ['a[data-testid="property-card-link"]', 'a'], 'href');

      return {
        title: title || null, location: null,
        price: price.value, currency: price.currency, priceRaw: price.raw,
        rating: parseFloat(rating) || null, imageUrl: imageUrl || null,
        url: link ? new URL(link, window.location.origin).href : null,
      };
    }).filter(i => i.title || i.price);
  }

  function txt(el, sels) {
    for (const s of sels) {
      try { const e = el.querySelector(s); if (e) { const t = (e.innerText || e.textContent || '').trim(); if (t) return t; } } catch (_) {}
    }
    return null;
  }
  function attr(el, sels, a) {
    for (const s of sels) {
      try { const e = el.querySelector(s); if (e && e.getAttribute(a)) return e.getAttribute(a).trim(); } catch (_) {}
    }
    return null;
  }
  function extractTitleFromUrl() {
    const m = window.location.pathname.match(/\/([^/]+)-Hotel/i);
    if (m) return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return null;
  }
  function extractNum(str) {
    if (!str) return null;
    const m = str.replace(/,/g, '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  window.parseExpedia = parseExpedia;
  window.parseExpediaList = parseExpediaList;
  window.getExpediaPageType = getExpediaPageType;
})();
