/**
 * compare.controller.js — Request handlers for price comparison endpoints
 */

const priceService = require('../services/price.service');
const emailService = require('../services/email.service');

/**
 * POST /api/detect
 * Receive a detection from the Chrome extension and store it.
 */
function handleDetect(req, res) {
  const detection = req.body;

  if (!detection || !detection.title) {
    return res.status(400).json({
      error: 'Missing required field: title',
      hint: 'Send a JSON body with at least { title, site }',
    });
  }

  if (!detection.site) {
    return res.status(400).json({
      error: 'Missing required field: site',
      hint: 'Send a JSON body with at least { title, site }',
    });
  }

  const result = priceService.storeDetection(detection);
  res.status(201).json({
    ok: true,
    stored: result.stored,
    key: result.key,
  });
}

/**
 * GET /api/compare?q=hotel+name&location=city
 * Search for competitor prices by hotel name and optional location.
 */
function handleCompare(req, res) {
  const { q, location } = req.query;

  if (!q) {
    return res.status(400).json({
      error: 'Missing required query parameter: q',
      hint: 'Usage: GET /api/compare?q=hotel+name&location=city',
    });
  }

  const result = priceService.findCompetitorPrices(q, location);
  res.json(result);
}

/**
 * POST /api/compare
 * Search for competitor prices using a JSON body.
 */
function handleComparePost(req, res) {
  const { hotelName, title, location } = req.body;
  const name = hotelName || title;

  if (!name) {
    return res.status(400).json({
      error: 'Missing required field: hotelName or title',
    });
  }

  const result = priceService.findCompetitorPrices(name, location);
  res.json(result);
}

/**
 * GET /api/detections
 * List all stored detections (debug/admin endpoint).
 */
function handleListDetections(req, res) {
  const all = priceService.getAllDetections();
  res.json({
    count: all.length,
    detections: all,
  });
}

/**
 * POST /api/watch
 * Receive a watch request (hotel + email) from the extension.
 * Sends a confirmation email if SMTP is configured.
 */
async function handleWatch(req, res) {
  const { title, location, price, currency, email } = req.body;

  if (!title || !email) {
    return res.status(400).json({
      error: 'Missing required fields: title and email',
    });
  }

  console.log(`[Watch] ${email} is now watching "${title}" at ${currency} ${price}`);

  // Send confirmation email (non-blocking — don't fail the request if email fails)
  try {
    await emailService.sendWatchConfirmation({ email, title, location, price, currency });
    console.log(`[Watch] Confirmation email sent to ${email}`);
  } catch (err) {
    console.warn(`[Watch] Email failed (SMTP may not be configured): ${err.message}`);
  }

  res.status(201).json({ ok: true, message: 'Watch registered' });
}

module.exports = {
  handleDetect,
  handleCompare,
  handleComparePost,
  handleListDetections,
  handleWatch,
};
