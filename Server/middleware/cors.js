/**
 * cors.js — CORS configuration middleware
 * Allows requests from Chrome extension and local development.
 */

const cors = require('cors');

const corsOptions = {
  origin: [
    // Chrome extension origins
    /^chrome-extension:\/\//,
    // Local development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = cors(corsOptions);
