// Basic Booking.com detector - heuristic selectors
(function () {
  function findText(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length) return el.innerText.trim();
    }
    return null;
  }

  const payload = {
    site: 'booking.com',
    title: findText(['h2.hp__hotel-name', 'h1#hp_hotel_name', 'h1'] ),
    location: findText(['span.hp_address_subtitle', '.hp_address_subtitle', '.address']),
    price: findText(['.bui-price-display__value', '.prco-valign-middle-helper', '.price'])
  };

  // send detection result to background
  chrome.runtime.sendMessage({ type: 'DETECT_RESULT', payload });
})();
