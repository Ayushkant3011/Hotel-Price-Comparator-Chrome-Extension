// Popup script: request last detect from background and display
document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  const resultEl = document.getElementById('result');

  status.textContent = 'Requesting last detect...';

  chrome.runtime.sendMessage({ type: 'GET_LAST_DETECT' }, (response) => {
    status.textContent = 'Detection result:';
    if (response && response.lastDetect) {
      resultEl.textContent = JSON.stringify(response.lastDetect, null, 2);
    } else {
      resultEl.textContent = 'No detection yet for this tab.';
    }
  });
});
