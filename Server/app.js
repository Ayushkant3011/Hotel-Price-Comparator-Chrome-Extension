/**
 * app.js — Express application setup
 *
 * Configures middleware and mounts route modules.
 * Separated from server.js for testability.
 */

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const compareRoutes = require('./routes/compare.routes');

const app = express();

/* ── Middleware ── */
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

/* ── Health check ── */
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'Hotel Price Comparator API', version: '0.2.0' });
});

/* ── API routes ── */
app.use('/api', compareRoutes);

/* ── Error handler (must be last) ── */
app.use(errorHandler);

module.exports = app;
