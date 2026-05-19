/**
 * User.model.js — Mongoose Schema for authenticated users
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  displayName: { type: String, default: null },
  // We'll store their watched hotels directly in the user document for simplicity
  watchedHotels: [{
    title: String,
    location: String,
    price: Number,
    currency: String,
    site: String,
    watchedAt: Date,
    lastPriceDropAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
