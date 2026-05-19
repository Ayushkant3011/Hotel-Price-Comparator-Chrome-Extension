/**
 * firebase.js — Server-side Firebase Admin initialization
 */
const admin = require('firebase-admin');

// TODO: Replace with the path to your actual downloaded service account JSON file
// or load from environment variables in production.
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  console.warn('[Firebase] Service account JSON not found. Auth will fail.');
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[Firebase] Admin SDK initialized successfully');
}

module.exports = admin;
