// Background service worker (MV3)
console.log('Background service worker running');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Simple message handler to receive data from content scripts and forward to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'DETECT_RESULT') {
    // store last result in chrome.storage for popup retrieval
    chrome.storage.local.set({ lastDetect: message.payload }, () => {
      console.log('Saved detect result', message.payload);
    });
  }
  if (message && message.type === 'GET_LAST_DETECT') {
    chrome.storage.local.get(['lastDetect'], (res) => {
      sendResponse({ lastDetect: res.lastDetect || null });
    });
    return true; // indicates async sendResponse
  }
});

// Simple notification helper
function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.svg',
    title: title,
    message: message,
  });
}

// Example: listen for alarms (future price polling)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pricePoll') {
    // polling logic would go here
    console.log('pricePoll alarm');
  }
});
