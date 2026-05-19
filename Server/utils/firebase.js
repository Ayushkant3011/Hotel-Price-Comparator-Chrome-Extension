/**
 * firebase.js — Server-side Firebase Admin initialization
 */
const admin = require('firebase-admin');

// TODO: Replace with the path to your actual downloaded service account JSON file
// or load from environment variables in production.
let serviceAccount;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    serviceAccount = require(serviceAccountPath);
  } else {
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH not found in .env');
  }
} catch (error) {
  console.warn(`[Firebase] Service account JSON not found at path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}. Auth will fail.`);
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[Firebase] Admin SDK initialized successfully');
}

module.exports = admin;
