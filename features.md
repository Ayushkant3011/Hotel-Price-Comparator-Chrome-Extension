# Project Features Roadmap

*High‑impact features we can add to the Hotel Price Comparator (prioritized)*

---

### ✅ 1. Core detection & scraping
* **Status:** `[DONE]`
* **Description:** Content scripts that detect listings (hotel name, location, price) on popular sites.
* **Implementation:** Heuristics + site-specific parsers (Booking, Airbnb, Expedia) implemented with multi-strategy fallback (data-testid → CSS → JSON-LD → Meta tags → URL).

### ✅ 2. Matching & search
* **Status:** `[DONE]`
* **Description:** Fuzzy matching / normalized place + hotel name resolution.
* **Implementation:** Backend search aggregator using Dice's coefficient (bigram similarity) to match and sort competitor prices accurately.

### ✅ 3. Price comparison UI (extension popup + side panel)
* **Status:** `[DONE]`
* **Description:** Side popup overlay showing competitor prices, badges for best price, quick links.
* **Implementation:** In-popup charts (price history) using Chart.js, built with React and TailwindCSS.

### ⏳ 4. Real-time updates & notifications
* **Status:** `[IN PROGRESS]`
* **Description:** Background service worker to poll/watch prices and send Chrome notifications on drops.
* **Implementation:** Watch/unwatch via `chrome.storage.local`, 6-hour polling alarm via `chrome.alarms`, Chrome notifications on price drops. Email prompt modal in the UI. Server `POST /api/watch` endpoint exists but Nodemailer email delivery is not yet wired up.

### ⏳ 5. Data storage & sync
* **Status:** `[IN PROGRESS]`
* **Description:** Local IndexedDB for fast caching; optional backend (Express + MongoDB/Firebase) for cross-device sync and history.
* **Implementation:** Watched hotels stored in `chrome.storage.local`. Full IndexedDB and cross-device sync not yet implemented.

### ⏳ 6. Currency, localization & UX
* **Status:** `[TODO]`
* **Description:** Auto currency conversion, time zone handling, multi-language support (i18n).

### ⏳ 7. Authentication & personalization
* **Status:** `[TODO]`
* **Description:** Optional Firebase / Google OAuth for saved favorites, alerts, preferences.

### ⏳ 8. Privacy & security
* **Status:** `[IN PROGRESS]`
* **Description:** Minimal permissions in Manifest V3, explicit explanations, opt-in for data sharing.

### ⏳ 9. Performance & reliability
* **Status:** `[TODO]`
* **Description:** Rate-limiting, exponential backoff for API/scrape requests; caching layer.

### ⏳ 10. ML / recommendations (advanced)
* **Status:** `[TODO]`
* **Description:** "Best time to book" models (rule-based to start), personalized suggestions.

### ⏳ 11. Developer & QA
* **Status:** `[IN PROGRESS]`
* **Description:** Manifest V3, content scripts, service worker, popup, options pages, context menu.
* **Implementation:** Automated tests: unit tests for parsers, E2E for extension flows, CI builds.

### ⏳ 12. Analytics & monetization (opt-in)
* **Status:** `[TODO]`
* **Description:** Anonymous usage metrics, affiliate integration (optional).
