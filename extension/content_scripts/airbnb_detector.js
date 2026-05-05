/**
 * airbnb_detector.js — Airbnb content script detector
 * Uses DetectorUtils for debounced observation, dedup, retry, and SPA nav.
 * Relies on parseAirbnb / parseAirbnbList from parsers/airbnb.js.
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'airbnb.com';

  function runForCurrentPage() {
    D.resetDedup(SITE);
    const pageType = window.getAirbnbPageType();
    console.log(`[${SITE}] page type: ${pageType}`);

    if (pageType === 'detail') {
      D.parseWithRetry(window.parseAirbnb, (result) => {
        D.sendDetection(SITE, result);
      });
    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseAirbnbList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });
    } else {
      D.parseWithRetry(window.parseAirbnb, (result) => {
        D.sendDetection(SITE, result);
      }, { maxRetries: 2 });
    }
  }

  function run() {
    runForCurrentPage();

    // Debounced observer for dynamic content
    D.createDebouncedObserver(() => {
      try {
        const pageType = window.getAirbnbPageType();
        if (pageType === 'detail') {
          const result = window.parseAirbnb();
          D.sendDetection(SITE, result);
        } else if (pageType === 'search') {
          const listings = window.parseAirbnbList();
          if (listings.length) D.sendBatchDetection(SITE, listings);
        }
      } catch (e) {
        console.error(`[${SITE}] observer error`, e);
      }
    }, { delay: 1200 });

    // Airbnb is a SPA — listen for URL changes
    D.onUrlChange(() => {
      console.log(`[${SITE}] URL changed, re-parsing`);
      setTimeout(runForCurrentPage, 800);
    });
  }

  if (typeof window.parseAirbnb === 'function') {
    run();
  } else {
    setTimeout(() => {
      if (typeof window.parseAirbnb === 'function') run();
      else console.error(`[${SITE}] parser not available`);
    }, 500);
  }
})();
