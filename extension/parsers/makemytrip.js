/**
 * makemytrip.js — MakeMyTrip parser
 * Multi-strategy extraction via ParserUtils.
 */
(function () {
  'use strict';
  const P = window.ParserUtils;

  function getMakeMyTripPageType() {
    if (window.location.pathname.includes('/hotels/detail')) return 'detail';
    if (window.location.pathname.includes('/hotels/hotel-listing')) return 'search';
    return 'unknown';
  }

  function parseMakeMyTrip() {
    const title = P.trySelectors(['h1[id="detpg_hotel_name"]', 'h1']) || P.tryMetaTags(['og:title']);
    const location = P.trySelectors(['span[id="detpg_hotel_location"]', '.loc-details']) || P.tryMetaTags(['og:locality']);
    
    let priceRaw = P.trySelectors(['[id="detpg_hotel_price"]', '.price', '.latoBlack']);
    if (!priceRaw) {
      const jd = P.tryJsonLd(['Hotel', 'LodgingBusiness']);
      if (jd && jd.offers) {
        const offer = Array.isArray(jd.offers) ? jd.offers[0] : jd.offers;
        if (offer && offer.price) priceRaw = String(offer.price);
      }
    }
    const price = P.normalizePrice(priceRaw);

    const imageUrl = P.trySelectorsAttr(['img[id="detpg_header_image"]', '.slider-image'], 'src') || P.tryMetaTags(['og:image']);

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

  function parseMakeMyTripList() {
    return []; // Placeholder for search page
  }

  window.parseMakeMyTrip = parseMakeMyTrip;
  window.parseMakeMyTripList = parseMakeMyTripList;
  window.getMakeMyTripPageType = getMakeMyTripPageType;
})();
