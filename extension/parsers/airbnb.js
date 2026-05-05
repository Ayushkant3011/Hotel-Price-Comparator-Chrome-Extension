// Airbnb parser - exposes `parseAirbnb()` in the content-script environment
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
    const cleaned = priceStr.replace(/[^0-9.,]/g, '').trim();
    return cleaned || priceStr;
  }

  function parseAirbnb() {
    const title = trySelectors(['h1._14i3z6h', 'h1._fecoyn4', 'h1', 'h1._1x0fg2j']);
    const location = trySelectors(['._1tanv1h', '.mapboxgl-ctrl-geocoder--input', '.location', '._bq7e6q']);
    let price = trySelectors(['span._tyxjp1', '.a8jt5op', '.price', '[data-testid="price"]']);

    if (!price) {
      const jd = tryJsonLd();
      if (jd && jd.offers && jd.offers.price) price = jd.offers.price;
      if (!price && jd && jd.price) price = jd.price;
    }

    return { title: title || null, location: location || null, price: normalizePrice(price) };
  }

  window.parseAirbnb = parseAirbnb;
})();
