/**
 * booking_detector.js — Booking.com content script detector
 * Uses DetectorUtils for debounced observation, dedup, and retry.
 * Relies on parseBooking / parseBookingList from parsers/booking.js.
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'booking.com';

  function run() {
    const pageType = window.getBookingPageType();
    console.log(`[${SITE}] page type: ${pageType}`);

    if (pageType === 'detail') {
      // Initial parse with retry (page may still be loading)
      D.parseWithRetry(window.parseBooking, (result) => {
        D.sendDetection(SITE, result);
      });

      // Watch for dynamic content updates
      D.createDebouncedObserver(() => {
        try {
          const result = window.parseBooking();
          D.sendDetection(SITE, result);
        } catch (e) {
          console.error(`[${SITE}] observer parse error`, e);
        }
      }, { delay: 1000 });

    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseBookingList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });

      D.createDebouncedObserver(() => {
        try {
          const listings = window.parseBookingList();
          if (listings.length) D.sendBatchDetection(SITE, listings);
        } catch (e) {
          console.error(`[${SITE}] search observer error`, e);
        }
      }, { delay: 1500 });

    } else {
      // Unknown page — try detail parse anyway
      D.parseWithRetry(window.parseBooking, (result) => {
        D.sendDetection(SITE, result);
      }, { maxRetries: 2 });
    }
  }

  // Ensure parsers are loaded
  if (typeof window.parseBooking === 'function') {
    run();
  } else {
    console.warn(`[${SITE}] parser not loaded yet, retrying in 500ms`);
    setTimeout(() => {
      if (typeof window.parseBooking === 'function') run();
      else console.error(`[${SITE}] parser still not available`);
    }, 500);
  }
})();
