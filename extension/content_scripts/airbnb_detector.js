// Basic Airbnb detector - heuristic selectors
(function () {
  function findText(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length) return el.innerText.trim();
    }
    return null;
  }

  const payload = {
    site: 'airbnb.com',
    title: findText(['h1._14i3z6h', 'h1._fecoyn4', 'h1']),
    location: findText(['._1tanv1h', '.mapboxgl-ctrl-geocoder--input', '.location']),
    price: findText(['span._tyxjp1', '.a8jt5op', '.price'])
  };

  chrome.runtime.sendMessage({ type: 'DETECT_RESULT', payload });
})();
