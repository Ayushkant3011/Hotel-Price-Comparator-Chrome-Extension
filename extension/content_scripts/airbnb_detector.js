// Airbnb detector wrapper - uses shared parser (parsers/airbnb.js)
(function () {
  function sendIfFound(data) {
    if (!data) return;
    const has = data.title || data.price || data.location;
    if (has) {
      chrome.runtime.sendMessage({ type: 'DETECT_RESULT', payload: { site: 'airbnb.com', ...data } });
      console.log('airbnb_detector sent', data);
    }
  }

  try {
    if (typeof window.parseAirbnb === 'function') {
      const initial = window.parseAirbnb();
      sendIfFound(initial);
    } else {
      console.warn('parseAirbnb not available yet');
    }
  } catch (err) {
    console.error('airbnb_detector error', err);
  }

  const observer = new MutationObserver(() => {
    try {
      if (typeof window.parseAirbnb === 'function') {
        const r = window.parseAirbnb();
        sendIfFound(r);
      }
    } catch (e) {
      console.error('airbnb_detector observer error', e);
    }
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
})();
