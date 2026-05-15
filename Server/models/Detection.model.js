/**
 * Detection.model.js — Mongoose Schema for hotel price detections
 */

const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  normalizedName: { type: String, required: true, index: true },
  site: { type: String, required: true },
  location: { type: String, default: null },
  normalizedLocation: { type: String, default: null },
  price: { type: Number, default: null },
  currency: { type: String, default: null },
  normalizedPriceUSD: { type: Number, default: null },
  priceRaw: { type: String, default: null },
  url: { type: String, default: null },
  checkIn: { type: String, default: null },
  checkOut: { type: String, default: null },
  rating: { type: String, default: null },
  imageUrl: { type: String, default: null },
  detectedAt: { type: Date, default: Date.now },
  storedAt: { type: Date, default: Date.now, expires: 86400 } // TTL index: auto-deletes docs after 24 hours (86400 seconds)
});

// Compound index to ensure fast lookups and unique entries per hotel per site
detectionSchema.index({ normalizedName: 1, site: 1 }, { unique: true });

module.exports = mongoose.model('Detection', detectionSchema);
