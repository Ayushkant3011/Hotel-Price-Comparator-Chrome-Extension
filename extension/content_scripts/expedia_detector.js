/**
 * expedia_detector.js — Expedia content script detector
 * Uses DetectorUtils for debounced observation, dedup, and retry.
 * Relies on parseExpedia / parseExpediaList from parsers/expedia.js.
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'expedia.com';

  function run() {
    const pageType = window.getExpediaPageType();
    console.log(`[${SITE}] page type: ${pageType}`);

    if (pageType === 'detail') {
      D.parseWithRetry(window.parseExpedia, (result) => {
        D.sendDetection(SITE, result);
      });

      D.createDebouncedObserver(() => {
        try {
          const result = window.parseExpedia();
          D.sendDetection(SITE, result);
        } catch (e) {
          console.error(`[${SITE}] observer error`, e);
        }
      }, { delay: 1000 });

    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseExpediaList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });

      D.createDebouncedObserver(() => {
        try {
          const listings = window.parseExpediaList();
          if (listings.length) D.sendBatchDetection(SITE, listings);
        } catch (e) {
          console.error(`[${SITE}] search observer error`, e);
        }
      }, { delay: 1500 });

    } else {
      D.parseWithRetry(window.parseExpedia, (result) => {
        D.sendDetection(SITE, result);
      }, { maxRetries: 2 });
    }
  }

  if (typeof window.parseExpedia === 'function') {
    run();
  } else {
    setTimeout(() => {
      if (typeof window.parseExpedia === 'function') run();
      else console.error(`[${SITE}] parser not available`);
    }, 500);
  }
})();
