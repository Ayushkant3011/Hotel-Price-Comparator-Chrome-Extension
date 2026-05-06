/**
 * goibibo_detector.js
 */
(function () {
  'use strict';
  const D = window.DetectorUtils;
  const SITE = 'goibibo.com';

  function run() {
    const pageType = window.getGoibiboPageType();
    if (pageType === 'detail') {
      D.parseWithRetry(window.parseGoibibo, (result) => D.sendDetection(SITE, result));
      D.createDebouncedObserver(() => {
        try { D.sendDetection(SITE, window.parseGoibibo()); } catch (e) {}
      }, { delay: 1000 });
    } else if (pageType === 'search') {
      D.parseWithRetry(window.parseGoibiboList, (listings) => {
        if (listings.length) D.sendBatchDetection(SITE, listings);
      });
    } else {
      D.parseWithRetry(window.parseGoibibo, (result) => D.sendDetection(SITE, result), { maxRetries: 2 });
    }
  }

  if (typeof window.parseGoibibo === 'function') run();
  else setTimeout(() => { if (typeof window.parseGoibibo === 'function') run(); }, 500);
})();
