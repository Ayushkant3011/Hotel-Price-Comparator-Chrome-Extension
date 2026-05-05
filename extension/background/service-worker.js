/**
 * Background service worker (MV3)
 *
 * Responsibilities:
 *  - Receive DETECT_RESULT and DETECT_RESULTS_BATCH from content scripts
 *  - Store detections per-tab in chrome.storage.session (or local fallback)
 *  - Serve detections to popup via GET_DETECTIONS
 *  - Forward detections to backend server via COMPARE_REQUEST
 *  - Price-drop alarm stub for future polling
 */
try {
  console.log('Background service worker running');

  // Use session storage if available (MV3), else fall back to local
  const store = chrome.storage.session || chrome.storage.local;

  /* ──────────────────────────────────────────────
   * Installation
   * ────────────────────────────────────────────── */
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed / updated');
  });

  /* ──────────────────────────────────────────────
   * Configuration
   * ────────────────────────────────────────────── */
  const API_BASE = 'http://localhost:3000/api';

  /* ──────────────────────────────────────────────
   * Message handler
   * ────────────────────────────────────────────── */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    const tabId = sender.tab ? sender.tab.id : 'popup';

    switch (message.type) {

      /* ── Single detection from content script ── */
      case 'DETECT_RESULT': {
        const detection = message.payload;
        storeDetection(tabId, detection);
        forwardToBackend(detection);
        break;
      }

      /* ── Batch detections from search pages ── */
      case 'DETECT_RESULTS_BATCH': {
        const { listings, site, url, detectedAt } = message.payload;
        if (listings && listings.length) {
          // Store the first listing as primary for popup
          storeDetection(tabId, { site, ...listings[0], url, detectedAt });
          // Store full list
          storeBatchDetections(tabId, { site, listings, url, detectedAt });
          // Forward each to backend
          listings.forEach(l => forwardToBackend({ site, ...l, url, detectedAt }));
        }
        break;
      }

      /* ── Popup requests detections for current tab ── */
      case 'GET_DETECTIONS': {
        const requestTabId = message.tabId || tabId;
        store.get([`det_${requestTabId}`, `batch_${requestTabId}`], (res) => {
          sendResponse({
            detection: res[`det_${requestTabId}`] || null,
            batch: res[`batch_${requestTabId}`] || null,
          });
        });
        return true; // async sendResponse
      }

      /* ── Popup requests comparison from backend ── */
      case 'COMPARE_REQUEST': {
        const { hotelName, location } = message;
        fetchComparison(hotelName, location)
          .then(data => sendResponse({ ok: true, data }))
          .catch(err => sendResponse({ ok: false, error: err.message }));
        return true; // async sendResponse
      }

      /* ── Legacy: GET_LAST_DETECT (backward compat) ── */
      case 'GET_LAST_DETECT': {
        chrome.storage.local.get(['lastDetect'], (res) => {
          sendResponse({ lastDetect: res.lastDetect || null });
        });
        return true;
      }

      default:
        break;
    }
  });

  /* ──────────────────────────────────────────────
   * Storage helpers
   * ────────────────────────────────────────────── */

  function storeDetection(tabId, detection) {
    const key = `det_${tabId}`;
    store.set({ [key]: detection }, () => {
      console.log(`Stored detection for tab ${tabId}`, detection.title || detection.site);
    });
    // Also keep legacy lastDetect for backward compat
    chrome.storage.local.set({ lastDetect: detection });
  }

  function storeBatchDetections(tabId, batchData) {
    const key = `batch_${tabId}`;
    store.set({ [key]: batchData });
  }

  /* ──────────────────────────────────────────────
   * Backend API communication
   * ────────────────────────────────────────────── */

  async function forwardToBackend(detection) {
    try {
      const resp = await fetch(`${API_BASE}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detection),
      });
      if (!resp.ok) console.warn('Backend /detect returned', resp.status);
    } catch (err) {
      // Backend may not be running — that's fine
      console.debug('Backend not reachable:', err.message);
    }
  }

  async function fetchComparison(hotelName, location) {
    const params = new URLSearchParams();
    if (hotelName) params.set('q', hotelName);
    if (location) params.set('location', location);
    const resp = await fetch(`${API_BASE}/compare?${params}`);
    if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
    return resp.json();
  }

  /* ──────────────────────────────────────────────
   * Notifications helper
   * ────────────────────────────────────────────── */

  function notify(title, message) {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.svg',
        title,
        message,
      });
    } catch (err) {
      console.error('Notification error', err);
    }
  }

  /* ──────────────────────────────────────────────
   * Alarms (future price polling)
   * ────────────────────────────────────────────── */
  if (chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'pricePoll') {
        console.log('pricePoll alarm fired');
        // Future: poll stored hotels for price changes
      }
    });
  } else {
    console.warn('chrome.alarms API not available — skipping alarm setup');
  }

  /* ──────────────────────────────────────────────
   * Clean up tab storage when tab is closed
   * ────────────────────────────────────────────── */
  chrome.tabs.onRemoved.addListener((tabId) => {
    store.remove([`det_${tabId}`, `batch_${tabId}`]);
  });

} catch (err) {
  console.error('Service worker initialization error:', err);
}
