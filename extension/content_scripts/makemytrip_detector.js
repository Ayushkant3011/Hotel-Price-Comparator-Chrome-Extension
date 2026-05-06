/**
 * makemytrip_detector.js
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'makemytrip.com';

  function run() {
    const pageType = window.getMakeMyTripPageType();
    if (pageType === 'detail') {
      D.parseWithRetry(window.parseMakeMyTrip, (result) => D.sendDetection(SITE, result));
      D.createDebouncedObserver(() => {
        try { D.sendDetection(SITE, window.parseMakeMyTrip()); } catch (e) {}
      }, { delay: 1000 });
    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseMakeMyTripList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });
    } else {
      D.parseWithRetry(window.parseMakeMyTrip, (result) => D.sendDetection(SITE, result), { maxRetries: 2 });
    }
  }

  if (typeof window.parseMakeMyTrip === 'function') run();
  else setTimeout(() => { if (typeof window.parseMakeMyTrip === 'function') run(); }, 500);
})();
