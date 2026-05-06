/**
 * agoda_detector.js
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'agoda.com';

  function run() {
    const pageType = window.getAgodaPageType();
    if (pageType === 'detail') {
      D.parseWithRetry(window.parseAgoda, (result) => D.sendDetection(SITE, result));
      D.createDebouncedObserver(() => {
        try { D.sendDetection(SITE, window.parseAgoda()); } catch (e) {}
      }, { delay: 1000 });
    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseAgodaList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });
    } else {
      D.parseWithRetry(window.parseAgoda, (result) => D.sendDetection(SITE, result), { maxRetries: 2 });
    }
  }

  if (typeof window.parseAgoda === 'function') run();
  else setTimeout(() => { if (typeof window.parseAgoda === 'function') run(); }, 500);
})();
