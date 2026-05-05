// Booking.com parser - exposes `parseBooking()` in the content-script environment
(function () {
  function trySelectors(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const txt = el.innerText || el.textContent || '';
        if (txt && txt.trim()) return txt.trim();
      }
    }
    return null;
  }

  function tryJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.innerText);
        if (data && (data.name || data.offers)) return data;
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  function normalizePrice(priceStr) {
    if (!priceStr) return null;
    // remove non-numeric except dot and comma and currency symbols
    const cleaned = priceStr.replace(/[^0-9.,]/g, '').trim();
    return cleaned || priceStr;
  }

  function parseBooking() {
    const title = trySelectors(['h2.hp__hotel-name', 'h1#hp_hotel_name', 'h1', '.sr-hotel__name']);
    const location = trySelectors(['span.hp_address_subtitle', '.hp_address_subtitle', '.bui-review-score__subtitle', '.address']);
    let price = trySelectors(['.bui-price-display__value', '.prco-valign-middle-helper', '.price', '[data-testid="price-and-discounted-price"]']);

    if (!price) {
      const jd = tryJsonLd();
      if (jd && jd.offers && jd.offers.price) price = jd.offers.price;
      if (!price && jd && jd.price) price = jd.price;
    }

    return { title: title || null, location: location || null, price: normalizePrice(price) };
  }

  // expose globally for the detector wrapper
  window.parseBooking = parseBooking;
})();
