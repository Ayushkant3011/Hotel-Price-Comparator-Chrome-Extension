/**
 * base_detector.js — Shared detector utilities for all site-specific detectors.
 * Loaded before any site detector via manifest content_scripts.
 *
 * Exposes window.DetectorUtils with helpers for:
 *  - Debounced MutationObserver
 *  - Result deduplication
 *  - SPA navigation detection
 *  - Wait-for-element utility
 *  - Page type detection
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   * 1. Debounced MutationObserver
   * ────────────────────────────────────────────── */

  /**
   * Create a MutationObserver that calls `callback` at most once
   * every `delayMs` milliseconds (trailing edge).
   *
   * @param {Function} callback - called with no arguments on DOM changes
   * @param {object}   [options]
   * @param {number}   [options.delay=800]       - debounce delay in ms
   * @param {boolean}  [options.subtree=true]     - observe subtree
   * @param {boolean}  [options.childList=true]   - observe child additions/removals
   * @param {boolean}  [options.attributes=false] - observe attribute changes
   * @param {Element}  [options.target]           - element to observe (default: document.body)
   * @returns {{ observer: MutationObserver, disconnect: Function }}
   */
  function createDebouncedObserver(callback, options = {}) {
    const delay = options.delay ?? 800;
    let timer = null;

    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          callback();
        } catch (err) {
          console.error('[DetectorUtils] observer callback error:', err);
        }
      }, delay);
    });

    const target = options.target || document.body || document.documentElement;
    observer.observe(target, {
      childList: options.childList !== false,
      subtree: options.subtree !== false,
      attributes: options.attributes === true,
    });

    return {
      observer,
      disconnect: () => {
        if (timer) clearTimeout(timer);
        observer.disconnect();
      },
    };
  }

  /* ──────────────────────────────────────────────
   * 2. Result deduplication
   * ────────────────────────────────────────────── */

  // Keep track of the last sent result per site to avoid duplicate messages
  const _lastSent = {};

  /**
   * Check if the new result is meaningfully different from the last one sent.
   * Compares stringified versions of key fields.
   *
   * @param {string} site - site identifier (e.g. 'booking.com')
   * @param {object} newResult - parsed listing data
   * @returns {boolean} true if this is a new/different result
   */
  function isDifferent(site, newResult) {
    if (!newResult) return false;
    const key = JSON.stringify({
      title: newResult.title,
      price: newResult.price,
      location: newResult.location,
    });
    if (_lastSent[site] === key) return false;
    _lastSent[site] = key;
    return true;
  }

  /**
   * Reset deduplication cache for a site (useful on navigation).
   * @param {string} site
   */
  function resetDedup(site) {
    delete _lastSent[site];
  }

  /* ──────────────────────────────────────────────
   * 3. Page type detection
   * ────────────────────────────────────────────── */

  /**
   * Determine the page type based on URL patterns.
   *
   * @param {Array<{ type: string, pattern: RegExp }>} patterns
   * @param {string} [url] - defaults to window.location.href
   * @returns {string} matched type or 'unknown'
   */
  function detectPageType(patterns, url) {
    const target = url || window.location.href;
    for (const { type, pattern } of patterns) {
      if (pattern.test(target)) return type;
    }
    return 'unknown';
  }

  /* ──────────────────────────────────────────────
   * 4. Wait for element
   * ────────────────────────────────────────────── */

  /**
   * Wait for a CSS selector to appear in the DOM.
   *
   * @param {string}  selector
   * @param {number}  [timeout=5000] - max wait in ms
   * @param {Element} [root=document]
   * @returns {Promise<Element|null>}
   */
  function waitForElement(selector, timeout = 5000, root = document) {
    return new Promise((resolve) => {
      const existing = root.querySelector(selector);
      if (existing) { resolve(existing); return; }

      const timer = setTimeout(() => {
        obs.disconnect();
        resolve(null);
      }, timeout);

      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
          clearTimeout(timer);
          obs.disconnect();
          resolve(el);
        }
      });
      obs.observe(root.body || root.documentElement || root, {
        childList: true, subtree: true,
      });
    });
  }

  /* ──────────────────────────────────────────────
   * 5. SPA Navigation listener
   * ────────────────────────────────────────────── */

  /**
   * Listen for URL changes in SPAs (pushState / replaceState / popstate).
   * Calls `callback(newUrl)` whenever the URL changes.
   *
   * @param {Function} callback - receives the new URL string
   * @returns {Function} cleanup function to remove listeners
   */
  function onUrlChange(callback) {
    let lastUrl = window.location.href;

    // Monkey-patch pushState and replaceState
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function (...args) {
      origPush.apply(this, args);
      checkUrl();
    };
    history.replaceState = function (...args) {
      origReplace.apply(this, args);
      checkUrl();
    };

    function checkUrl() {
      const newUrl = window.location.href;
      if (newUrl !== lastUrl) {
        lastUrl = newUrl;
        try { callback(newUrl); } catch (e) {
          console.error('[DetectorUtils] URL change callback error:', e);
        }
      }
    }

    window.addEventListener('popstate', checkUrl);

    // Also poll as a safety net (some SPAs use hash changes or custom routing)
    const pollId = setInterval(checkUrl, 1500);

    return function cleanup() {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener('popstate', checkUrl);
      clearInterval(pollId);
    };
  }

  /* ──────────────────────────────────────────────
   * 6. Send result to background
   * ────────────────────────────────────────────── */

  /**
   * Send a single detection result to the service worker,
   * only if it differs from the last sent value.
   *
   * @param {string} site - e.g. 'booking.com'
   * @param {object} data - parsed listing object
   */
  function sendDetection(site, data) {
    if (!data) return;
    const hasContent = data.title || data.price || data.location;
    if (!hasContent) return;
    if (!isDifferent(site, data)) return;

    const payload = {
      site,
      ...data,
      url: window.location.href,
      detectedAt: new Date().toISOString(),
    };

    try {
      chrome.runtime.sendMessage({ type: 'DETECT_RESULT', payload });
      console.log(`[${site}] detection sent`, payload);
    } catch (err) {
      console.error(`[${site}] sendMessage error`, err);
    }
  }

  /**
   * Send a batch of detection results (for search result pages).
   *
   * @param {string}   site
   * @param {object[]} listings - array of parsed listing objects
   */
  function sendBatchDetection(site, listings) {
    if (!listings || !listings.length) return;
    const payload = {
      site,
      listings,
      url: window.location.href,
      detectedAt: new Date().toISOString(),
    };
    try {
      chrome.runtime.sendMessage({ type: 'DETECT_RESULTS_BATCH', payload });
      console.log(`[${site}] batch detection sent (${listings.length} listings)`);
    } catch (err) {
      console.error(`[${site}] batch sendMessage error`, err);
    }
  }

  /* ──────────────────────────────────────────────
   * 7. Initial parse with retry
   * ────────────────────────────────────────────── */

  /**
   * Run parser immediately, and retry with exponential backoff if it
   * returns empty (page may still be loading).
   *
   * @param {Function} parseFn   - parser function to call
   * @param {Function} handleFn  - function to handle the result
   * @param {object}   [options]
   * @param {number}   [options.maxRetries=3]
   * @param {number}   [options.baseDelay=500]
   */
  function parseWithRetry(parseFn, handleFn, options = {}) {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.baseDelay ?? 500;
    let attempt = 0;

    function tryParse() {
      try {
        const result = parseFn();
        const hasContent = result && (result.title || result.price);
        if (hasContent) {
          handleFn(result);
          return;
        }
        attempt++;
        if (attempt <= maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          setTimeout(tryParse, delay);
        }
      } catch (err) {
        console.error('[DetectorUtils] parseWithRetry error:', err);
        attempt++;
        if (attempt <= maxRetries) {
          setTimeout(tryParse, baseDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    tryParse();
  }

  /* ──────────────────────────────────────────────
   * Expose globally
   * ────────────────────────────────────────────── */

  window.DetectorUtils = {
    createDebouncedObserver,
    isDifferent,
    resetDedup,
    detectPageType,
    waitForElement,
    onUrlChange,
    sendDetection,
    sendBatchDetection,
    parseWithRetry,
  };
})();
