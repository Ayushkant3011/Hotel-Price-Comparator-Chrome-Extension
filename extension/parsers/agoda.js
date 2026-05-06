/**
 * agoda.js — Agoda parser
 * Multi-strategy extraction via ParserUtils.
 */
(function () {
  'use strict';
  const P = window.ParserUtils;

  function getAgodaPageType() {
    if (window.location.pathname.includes('/hotel/')) return 'detail';
    if (window.location.pathname.includes('/search')) return 'search';
    return 'unknown';
  }

  function parseAgoda() {
    const title = P.trySelectors(['h1[data-selenium="hotel-header-name"]', 'h1']) || P.tryMetaTags(['og:title']);
    const location = P.trySelectors(['[data-selenium="hotel-address-map"]', '.address']) || P.tryMetaTags(['og:locality']);
    
    let priceRaw = P.trySelectors(['[data-selenium="price-label"]', '.price', '.pd-price']);
    if (!priceRaw) {
      const jd = P.tryJsonLd(['Hotel', 'LodgingBusiness']);
      if (jd && jd.offers) {
        const offer = Array.isArray(jd.offers) ? jd.offers[0] : jd.offers;
        if (offer && offer.price) priceRaw = String(offer.price);
      }
    }
    const price = P.normalizePrice(priceRaw);

    const imageUrl = P.trySelectorsAttr(['img[data-selenium="hero-image"]', '.hero-image'], 'src') || P.tryMetaTags(['og:image']);

    const result = {
      title: title || null, 
      location: location || null,
      price: price.value, 
      currency: price.currency, 
      priceRaw: price.raw,
      imageUrl: imageUrl || null, 
      url: window.location.href,
    };
    result.confidence = P.computeConfidence(result);
    return result;
  }

  function parseAgodaList() {
    return []; // Placeholder for search page
  }

  window.parseAgoda = parseAgoda;
  window.parseAgodaList = parseAgodaList;
  window.getAgodaPageType = getAgodaPageType;
})();
