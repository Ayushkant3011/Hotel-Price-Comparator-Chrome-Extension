# Extension scaffold

This folder contains a minimal Chrome Manifest V3 scaffold for the Hotel & Airbnb Price Comparator.

Files added:
- `manifest.json` - extension manifest
- `background/service-worker.js` - background worker to store detection results and notifications
- `content_scripts/booking_detector.js` - simple heuristics for booking.com
- `content_scripts/airbnb_detector.js` - simple heuristics for airbnb.com
- `popup/popup.html` & `popup/popup.js` - minimal UI to show the last detected listing

Next steps:
- Wire the React popup from `Client` build into `extension/popup` (Vite build now outputs there).
- Improve content script parsers for each target site and add robust matching.
