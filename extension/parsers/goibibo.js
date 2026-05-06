/**
 * goibibo.js — Goibibo parser
 * Multi-strategy extraction via ParserUtils.
 */
(function () {
  'use strict';
  const P = window.ParserUtils;

  function getGoibiboPageType() {
    if (window.location.pathname.includes('/hotels/')) {
      if (window.location.pathname.split('/').length > 3) return 'detail';
      return 'search';
    }
    return 'unknown';
  }

  function parseGoibibo() {
    const title = P.trySelectors(['h1', '[data-testid="hotel-name"]']) || P.tryMetaTags(['og:title', 'twitter:title']);
    const location = P.trySelectors(['[data-testid="hotel-address"]', '.address']) || P.tryMetaTags(['og:locality']);
    
    let priceRaw = P.trySelectors(['[data-testid="price"]', '.price', '.offer-price']);
    if (!priceRaw) {
      const jd = P.tryJsonLd(['Hotel', 'LodgingBusiness']);
      if (jd && jd.offers) {
        const offer = Array.isArray(jd.offers) ? jd.offers[0] : jd.offers;
        if (offer && offer.price) priceRaw = String(offer.price);
      }
    }
    const price = P.normalizePrice(priceRaw);

    const imageUrl = P.trySelectorsAttr(['img[data-testid="hero-image"]', '.hero-image img'], 'src') || P.tryMetaTags(['og:image']);

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

  function parseGoibiboList() {
    return []; // Placeholder for search page parsing
  }

  window.parseGoibibo = parseGoibibo;
  window.parseGoibiboList = parseGoibiboList;
  window.getGoibiboPageType = getGoibiboPageType;
})();
