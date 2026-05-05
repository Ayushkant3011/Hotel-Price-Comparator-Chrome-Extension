/**
 * airbnb.js — Airbnb parser
 * Multi-strategy extraction via ParserUtils.
 * Handles detail pages and search result pages.
 *
 * Exposes: window.parseAirbnb(), window.parseAirbnbList(), window.getAirbnbPageType()
 */
(function () {
  'use strict';
  const P = window.ParserUtils;

  const PAGE_PATTERNS = [
    { type: 'detail', pattern: /airbnb\.[^/]+\/rooms\//i },
    { type: 'search', pattern: /airbnb\.[^/]+\/s\//i },
  ];

  function getAirbnbPageType() {
    for (const { type, pattern } of PAGE_PATTERNS) {
      if (pattern.test(window.location.href)) return type;
    }
    return 'unknown';
  }

  function parseAirbnb() {
    const title =
      P.trySelectors([
        'h1[data-testid="listing-title"]', 'h1[elementtiming="pageTitle"]',
        'h1._14i3z6h', 'h1._fecoyn4', 'div[data-section-id="TITLE_DEFAULT"] h1', 'h1',
      ]) || P.tryMetaTags(['og:title', 'twitter:title']);

    const location =
      P.trySelectors([
        '[data-testid="listing-location"]', 'button[data-testid="listing-location-link"]',
        'span._1tanv1h', '._152qbzi', '._bq7e6q',
        '[data-section-id="LOCATION_DEFAULT"] button',
      ]) || P.tryMetaTags(['og:locality', 'og:region']);

    let priceRaw = P.trySelectors([
      '[data-testid="price-element"]', 'span._tyxjp1', '.a8jt5op',
      'span._14y1gc', '[data-testid="book-it-default"] span._1y74zjx', '.price',
    ]);
    if (!priceRaw) {
      const jd = P.tryJsonLd(['LodgingBusiness', 'Product', 'Accommodation']);
      if (jd && jd.offers) {
        const offer = Array.isArray(jd.offers) ? jd.offers[0] : jd.offers;
        if (offer && offer.price) priceRaw = String(offer.price);
      }
    }
    if (!priceRaw) priceRaw = P.tryMetaTags(['og:price:amount', 'product:price:amount']);

    const price = P.normalizePrice(priceRaw);
    if (!price.currency) {
      const mc = P.tryMetaTags(['og:price:currency', 'product:price:currency']);
      if (mc) price.currency = mc;
    }

    const priceQualifier = P.trySelectors(['[data-testid="price-element-qualifier"]', '.price-qualifier']);
    const isPerNight = priceQualifier ? /night/i.test(priceQualifier) : true;

    const rating = P.trySelectors([
      '[data-testid="pdp-reviews-highlight-banner-host-rating"] span',
      'span.r1dxllyb', 'span._17p6nbba',
    ]);
    const reviewCount = P.trySelectors([
      '[data-testid="pdp-reviews-highlight-banner-host-review-count"]', 'span._s65ijh7',
    ]);
    const imageUrl = P.trySelectorsAttr([
      '[data-testid="hero-image"] img', 'picture img', '.FMP-target img',
    ], 'src') || P.tryMetaTags(['og:image']);

    const dates = P.extractDatesFromUrl([['check_in', 'check_out'], ['checkin', 'checkout']]);

    const result = {
      title: title || null, location: location || null,
      price: price.value, currency: price.currency, priceRaw: price.raw,
      isPerNight,
      checkIn: dates.checkIn, checkOut: dates.checkOut,
      rating: parseFloat(rating) || null,
      reviewCount: extractNum(reviewCount),
      imageUrl: imageUrl || null, url: window.location.href,
    };
    result.confidence = P.computeConfidence(result);
    return result;
  }

  function parseAirbnbList() {
    const cards = P.trySelectorsAll([
      '[data-testid="card-container"]', '[itemprop="itemListElement"]', '.c4mnd7m',
    ]);
    if (!cards.length) return [];

    return cards.slice(0, 20).map((card) => {
      const title = txt(card, ['[data-testid="listing-card-title"]', 'div[id^="title_"]', '.t1jojoys']);
      const priceRaw = txt(card, ['[data-testid="price-element"]', 'span._1y74zjx', '.price']);
      const price = P.normalizePrice(priceRaw);
      const rating = txt(card, ['span.r1dxllyb', 'span.t5eq1io']);
      const imageUrl = attr(card, ['picture img', 'img'], 'src');
      const link = attr(card, ['a[href*="/rooms/"]', 'a'], 'href');

      return {
        title: title || null, location: null,
        price: price.value, currency: price.currency, priceRaw: price.raw,
        rating: parseFloat(rating) || null, imageUrl: imageUrl || null,
        url: link ? new URL(link, window.location.origin).href : null,
      };
    }).filter(i => i.title || i.price);
  }

  function txt(parent, sels) {
    for (const s of sels) {
      try {
        const el = parent.querySelector(s);
        if (el) { const t = (el.innerText || el.textContent || '').trim(); if (t) return t; }
      } catch (_) {}
    }
    return null;
  }
  function attr(parent, sels, a) {
    for (const s of sels) {
      try { const el = parent.querySelector(s); if (el && el.getAttribute(a)) return el.getAttribute(a).trim(); } catch (_) {}
    }
    return null;
  }
  function extractNum(str) {
    if (!str) return null;
    const m = str.replace(/,/g, '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  window.parseAirbnb = parseAirbnb;
  window.parseAirbnbList = parseAirbnbList;
  window.getAirbnbPageType = getAirbnbPageType;
})();
