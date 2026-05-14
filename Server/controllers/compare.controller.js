/**
 * compare.controller.js — Request handlers for price comparison endpoints
 */

const priceService = require('../services/price.service');
const emailService = require('../services/email.service');

/**
 * POST /api/detect
 * Receive a detection from the Chrome extension and store it.
 */
async function handleDetect(req, res, next) {
  try {
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

    const result = await priceService.storeDetection(detection);
    res.status(201).json({
      ok: true,
      stored: result.stored,
      key: result.key,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/compare?q=hotel+name&location=city
 * Search for competitor prices by hotel name and optional location.
 */
async function handleCompare(req, res, next) {
  try {
    const { q, location } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Missing required query parameter: q',
        hint: 'Usage: GET /api/compare?q=hotel+name&location=city',
      });
    }

    const result = await priceService.findCompetitorPrices(q, location);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/compare
 * Search for competitor prices using a JSON body.
 */
async function handleComparePost(req, res, next) {
  try {
    const { hotelName, title, location } = req.body;
    const name = hotelName || title;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: hotelName or title',
      });
    }

    const result = await priceService.findCompetitorPrices(name, location);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/detections
 * List all stored detections (debug/admin endpoint).
 */
async function handleListDetections(req, res, next) {
  try {
    const all = await priceService.getAllDetections();
    res.json({
      count: all.length,
      detections: all,
    });
  } catch (err) {
    next(err);
  }
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

/**
 * POST /api/price-drop
 * Send a price drop alert email when the background poll detects a drop.
 */
async function handlePriceDrop(req, res) {
  const { email, title, location, oldPrice, newPrice, currency, site } = req.body;

  if (!email || !title || oldPrice == null || newPrice == null) {
    return res.status(400).json({
      error: 'Missing required fields: email, title, oldPrice, newPrice',
    });
  }

  try {
    await emailService.sendPriceDropAlert({ email, title, location, oldPrice, newPrice, currency, site });
    console.log(`[PriceDrop] Alert email sent to ${email} for "${title}"`);
    res.json({ ok: true, message: 'Price drop email sent' });
  } catch (err) {
    console.warn(`[PriceDrop] Email failed: ${err.message}`);
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
}

module.exports = {
  handleDetect,
  handleCompare,
  handleComparePost,
  handleListDetections,
  handleWatch,
  handlePriceDrop,
};
