// Booking detector wrapper - uses shared parser (parsers/booking.js)
(function () {
  function sendIfFound(data) {
    if (!data) return;
    const has = data.title || data.price || data.location;
    if (has) {
      chrome.runtime.sendMessage({ type: 'DETECT_RESULT', payload: { site: 'booking.com', ...data } });
      console.log('booking_detector sent', data);
    }
  }

  try {
    if (typeof window.parseBooking === 'function') {
      const initial = window.parseBooking();
      sendIfFound(initial);
    } else {
      console.warn('parseBooking not available yet');
    }
  } catch (err) {
    console.error('booking_detector error', err);
  }

  // watch for dynamic changes
  const observer = new MutationObserver(() => {
    try {
      if (typeof window.parseBooking === 'function') {
        const r = window.parseBooking();
        sendIfFound(r);
      }
    } catch (e) {
      console.error('booking_detector observer error', e);
    }
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
})();
