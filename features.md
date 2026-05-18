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

### ✅ 4. Real-time updates & notifications
* **Status:** `[DONE]`
* **Description:** Background service worker to poll/watch prices, send Chrome notifications on drops, and dispatch emails.
* **Implementation:** Watch/unwatch via `chrome.storage.local`, 6-hour polling alarm via `chrome.alarms`, Chrome notifications on price drops. Server endpoints `/api/watch` and `/api/price-drop` integrated with Nodemailer for automated email delivery.

### ✅ 5. Data storage & sync
* **Status:** `[DONE]`
* **Description:** Persistent backend database (MongoDB) to store scraped prices across server restarts and cross-device sync.
* **Implementation:** Successfully migrated from an in-memory `Map()` to MongoDB via Mongoose. Data now persists across server restarts.

### ✅ 6. Currency, localization & UX
* **Status:** `[DONE]`
* **Description:** Auto currency conversion to USD for fair comparison.
* **Implementation:** `currency.service.js` uses static exchange rates to normalize incoming prices to USD. MongoDB stores `normalizedPriceUSD`. Search results sort by normalized price. UI displays estimated USD conversion if the original price was in a different currency.

### ⏳ 7. Authentication & personalization
* **Status:** `[IN PROGRESS]`
* **Description:** Firebase / Google Auth for saved favorites, cross-device watch list sync, and personalized settings.
* **Implementation:** Setting up Firebase Auth on the extension (Google Sign-In) and `firebase-admin` on the Node backend to securely verify users and sync their `chrome.storage.local` data to MongoDB.

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
