# Hotel & Airbnb Price Comparator Chrome Extension - Documentation

## Overview
The Hotel & Airbnb Price Comparator is a Chrome Extension designed to help users find the best deals on accommodations. When a user browses a popular booking site (such as Booking.com, Airbnb, or Expedia), the extension automatically detects the listing details (hotel name, location, dates, and price). It then searches across other platforms in real-time to find and compare prices for the exact same or similar listings, presenting the user with an intuitive, glassmorphic UI to view price comparisons, historical data, and AI-powered recommendations.

> **Important Policy**: Going forward, with every change or new feature added to the project, this documentation file **must be updated** to reflect the latest state of the application.

---

## Project Structure
The repository is split into three main parts:

- **`/extension`**: The core Chrome Extension files (Manifest V3). It handles the content scraping, background tasks, and injection of the UI.
- **`/Client`**: The React-based frontend. This is built using Vite, React, and TailwindCSS, and serves as the UI for the extension's popup and side panel.
- **`/Server`**: The Node.js and Express backend API. It handles search aggregation, complex matching logic, and (in the future) user authentication and database storage.

---

## How It's Implemented

### 1. The Chrome Extension (`/extension`)
- **Manifest V3**: Uses the modern Chrome extension architecture.
- **Content Scripts (`/content_scripts`)**: Injected into supported booking sites. They use DOM heuristics to locate hotel details on the page.
- **Parsers (`/parsers`)**: Site-specific parsing logic (e.g., `expedia.js`, `booking_detector.js`). They use multiple strategies (data-testid, CSS selectors, JSON-LD, Meta tags, URL parsing) to reliably extract data even if the site structure changes.
- **Background Scripts (`/background`)**: The service worker orchestrates communication between the content scripts, the React UI, and the backend Server. It manages background polling for price drops and notification dispatching.

### 2. The Client UI (`/Client`)
- **React & TailwindCSS**: Delivers a premium, high-fidelity, glassmorphic user interface.
- **State Management**: Uses Zustand (`useStore.js`) to manage global state such as the currently detected hotel, competitor prices, and UI toggles.
- **Data Visualization**: Integrates `Chart.js` (`PriceChart.jsx`) to display animated bar charts or line graphs of historical price data.
- **Build Tooling**: Uses Vite to compile the React app into static assets that can be loaded in the extension's `popup.html` or side panel.

### 3. The Server Backend (`/Server`)
- **Express API**: Exposes RESTful endpoints for the extension to fetch cross-platform prices.
- **Architecture**: Follows a standard MVC-like pattern (`/routes`, `/controllers`, `/services`, `/utils`, `/middleware`).
- **Matching Engine**: Employs string similarity algorithms (see "Concepts Explained" below) to ensure that the hotel detected on one site matches the hotel queried on another.

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
The extension utilizes the Service Worker to occasionally poll the backend for updated prices on saved items. It leverages `IndexedDB` (for fast local caching of previous prices) to avoid hitting the backend repeatedly for the same data and to provide instant load times when the popup is opened.

---

## Features

### ✅ Completed
- **Core detection & scraping**: Content scripts that detect listings (hotel name, location, price) on popular sites using multi-strategy fallbacks.
- **Matching & search**: Backend search aggregator using Dice's coefficient to match and sort competitor prices accurately.

### ⏳ In Progress / Planned
- **Price comparison UI**: Side popup overlay showing competitor prices, badges for best price, quick links, and in-popup charts (Chart.js).
- **Real-time updates & notifications**: Background service worker to poll prices and send Chrome notifications on drops.
- **Data storage & sync**: Local IndexedDB for caching and optional backend for cross-device sync.
- **Currency, localization & UX**: Auto currency conversion, time zone handling, and i18n.
- **Authentication & personalization**: Firebase / Google OAuth for saved favorites and alerts.
- **Privacy & security**: Minimal Manifest V3 permissions and opt-in data sharing.
- **Performance & reliability**: Rate-limiting, caching layers, and exponential backoff.
- **ML / recommendations**: "Best time to book" models and personalized suggestions.

---
*End of documentation. Remember to update this file with new features and architectural changes as they are implemented.*
