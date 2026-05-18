# Hotel & Airbnb Price Comparator Chrome Extension - Documentation

## Overview
The Hotel & Airbnb Price Comparator is a Chrome Extension designed to help users find the best deals on accommodations. When a user browses a popular booking site (such as Booking.com, Airbnb, or Expedia), the extension automatically detects the listing details (hotel name, location, dates, and price). It then searches across other platforms in real-time to find and compare prices for the exact same or similar listings, presenting the user with an intuitive, glassmorphic UI to view price comparisons, historical data, and AI-powered recommendations.

> **Important Policy**: Going forward, with every change or new feature added to the project, this documentation file **must be updated** to reflect the latest state of the application.

---

## Project Structure
The repository is split into three main parts:

- **`/extension`**: The core Chrome Extension files (Manifest V3). It handles the content scraping, background tasks, price watching, and injection of the UI.
- **`/Client`**: The React-based frontend. This is built using Vite, React, and TailwindCSS, and serves as the UI for the extension's popup and side panel.
- **`/Server`**: The Node.js and Express backend API. It handles search aggregation, complex matching logic, watch registration, and (in the future) email notifications and database storage.

---

## How It's Implemented

### 1. The Chrome Extension (`/extension`)
- **Manifest V3**: Uses the modern Chrome extension architecture.
- **Content Scripts (`/content_scripts`)**: Injected into supported booking sites. They use DOM heuristics to locate hotel details on the page.
- **Parsers (`/parsers`)**: Site-specific parsing logic (e.g., `expedia.js`, `booking_detector.js`). They use multiple strategies (data-testid, CSS selectors, JSON-LD, Meta tags, URL parsing) to reliably extract data even if the site structure changes.
- **Background Scripts (`/background`)**: The service worker orchestrates communication between the content scripts, the React UI, and the backend Server. It manages:
  - **Price Watching**: Persists a list of watched hotels in `chrome.storage.local` via `WATCH_HOTEL`, `UNWATCH_HOTEL`, and `CHECK_WATCH_STATUS` messages.
  - **Background Polling**: Uses `chrome.alarms` to poll the backend every 6 hours (`performPricePoll`). Compares current prices against stored prices and fires Chrome notifications on drops.
  - **Backend Forwarding**: Sends watch requests to `POST /api/watch` for server-side processing.

### 2. The Client UI (`/Client`)
- **React & TailwindCSS**: Delivers a premium, high-fidelity, glassmorphic user interface.
- **State Management**: Uses Zustand (`useStore.js`) to manage global state including detected hotel, competitor prices, and watch status (`isWatched`, `toggleWatch`).
- **Data Visualization**: Integrates `Chart.js` (`PriceChart.jsx`) to display animated bar charts or line graphs of historical price data.
- **Build Tooling**: Uses Vite to compile the React app into static assets output to `/extension/popup/`.
- **Price Watch UI**: The `CurrentListing.jsx` component includes a "Watch Price" button that prompts for an email address via a glassmorphic modal before registering the watch.

### 3. The Server Backend (`/Server`)
- **Express API**: Exposes RESTful endpoints:
  - `POST /api/detect` — Receive and store a detection from the extension.
  - `GET /api/compare` — Search competitor prices by hotel name and location.
  - `POST /api/compare` — Same as above, via JSON body.
  - `GET /api/detections` — List all stored detections (debug/admin).
  - `POST /api/watch` — Register a watch request (hotel + email) and send confirmation.
  - `POST /api/price-drop` — Send a price drop email alert.
- **Architecture**: Follows a standard MVC-like pattern (`/routes`, `/controllers`, `/services`, `/utils`, `/middleware`, `/models`).
- **Database**: Uses **MongoDB (Mongoose)** for persistent storage. The `Detection` model includes a compound index (`normalizedName` + `site`) to ensure only the latest price is kept per site, and a TTL index to automatically purge data older than 24 hours.
- **Currency Service**: Uses a static exchange rate map to normalize all incoming foreign currencies to a base USD value (`normalizedPriceUSD`) for fair comparison sorting.
- **Matching Engine**: Employs Dice's coefficient (bigram similarity) to match hotels across platforms.

---

## Price Watching & Notifications Flow

1. User clicks "Watch Price" on a detected hotel in the popup.
2. A glassmorphic modal prompts for their email address.
3. The email + hotel details are sent to the background service worker via `WATCH_HOTEL`.
4. The service worker saves the hotel to `chrome.storage.local` and creates a `pricePoll` alarm (6-hour interval).
5. The service worker also forwards the request to `POST /api/watch` on the backend, which sends an immediate watch confirmation email.
6. Every 6 hours, `performPricePoll` iterates all watched hotels, fetches current prices via the backend, and if a price drop is detected:
   - Fires a local Chrome Desktop notification.
   - Triggers `POST /api/price-drop` on the backend to send a price drop email alert.
7. After a drop notification, the stored price is updated to prevent duplicate alerts.

---

## Core Concepts Explained

### DOM Parsing & Heuristics
Because booking sites frequently change their DOM structure, relying on a single CSS selector is brittle. The extension employs a **multi-strategy fallback mechanism**:
1. **`data-testid`**: Checks for testing attributes which rarely change.
2. **CSS Selectors**: Standard DOM traversal for common class names.
3. **JSON-LD**: Looks for structured data scripts (`<script type="application/ld+json">`) injected for SEO.
4. **Meta Tags**: Extracts Open Graph (`og:title`) or standard meta tags.
5. **URL**: Parses query parameters and pathnames as a last resort.

### Fuzzy Matching (Dice's Coefficient)
When the extension finds a hotel named "The Grand Plaza Hotel" in New York, it needs to find that exact hotel on other platforms. However, another platform might list it as "Grand Plaza Hotel, NYC". 
To solve this, the backend uses **Fuzzy Matching**, specifically **Dice's coefficient (bigram similarity)**. It breaks the strings into two-character chunks (bigrams) and calculates the percentage of shared bigrams. If the similarity score crosses a certain threshold, the listings are considered a match.

### Background Polling & State Sync
The service worker uses `chrome.alarms` to poll the backend every 6 hours for updated prices on watched hotels. Watch data is persisted in `chrome.storage.local` so it survives browser restarts. The popup auto-checks the watch status on open via `CHECK_WATCH_STATUS`.

### Currency Normalization
To ensure fair comparison, all scraped prices are converted to a base currency (USD) before comparison. 
1. When a price is detected (e.g., `EUR 90`), the backend `currency.service.js` calculates its equivalent USD value (e.g., `~$97.20`) using static exchange rates.
2. Both values are saved to MongoDB.
3. Competitor search results are sorted by `normalizedPriceUSD`.
4. The React UI displays the raw currency, and if it's not USD, it displays a subtitle showing the estimated USD equivalent so the user understands the sorting.

---

## Features

### ✅ Completed
- **Core detection & scraping**: Content scripts that detect listings (hotel name, location, price) on popular sites using multi-strategy fallbacks.
- **Matching & search**: Backend search aggregator using Dice's coefficient to match and sort competitor prices accurately.
- **Price comparison UI**: Side popup overlay showing competitor prices, badges for best price, quick links, and in-popup charts (Chart.js).
- **Price Watching & Notifications**: Client-side storage of watched hotels via `chrome.storage.local`. Background polling every 6 hours via `chrome.alarms`. Complete server-side email integration (Nodemailer) for watch confirmations and price drop alerts.
- **Data storage & sync**: Persistent backend database using **MongoDB** (via Mongoose) to store scraped prices across server restarts. Features TTL indexes for automatic data cleanup.
- **Currency Normalization**: Auto currency conversion to USD for fair cross-platform price sorting and UI localization.

### ⏳ In Progress / Planned
- **Authentication & personalization**: Integrating Firebase Auth (Google Sign-In) to make login required for the "Watch Price" feature, allowing users to sync their watched hotels across devices.
- **Privacy & security**: Minimal Manifest V3 permissions and opt-in data sharing.
- **Performance & reliability**: Rate-limiting, caching layers, and exponential backoff.
- **ML / recommendations**: "Best time to book" models and personalized suggestions.

---
*End of documentation. Remember to update this file with new features and architectural changes as they are implemented.*

