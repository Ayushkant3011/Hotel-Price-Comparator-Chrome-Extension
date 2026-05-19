/**
 * user.controller.js — Handles user authentication and watch list syncing
 */
const User = require('../models/User.model');

/**
 * GET /api/user/watchlist
 * Retrieves the user's watch list from MongoDB.
 * Protected by auth middleware.
 */
async function getWatchList(req, res, next) {
  try {
    const firebaseUid = req.user.uid;
    
    // Find user or create if they don't exist yet
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({
        firebaseUid,
        email: req.user.email,
        displayName: req.user.name,
        watchedHotels: []
      });
    }

    res.json({ ok: true, watchedHotels: user.watchedHotels });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/user/watchlist
 * Syncs the local browser watch list to MongoDB.
 * Protected by auth middleware.
 */
async function syncWatchList(req, res, next) {
  try {
    const firebaseUid = req.user.uid;
    const { watchedHotels } = req.body;

    if (!Array.isArray(watchedHotels)) {
      return res.status(400).json({ error: 'watchedHotels must be an array' });
    }

    // Upsert the user with the new watch list
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        $set: { 
          email: req.user.email,
          displayName: req.user.name,
          watchedHotels,
          lastLoginAt: new Date()
        } 
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: 'Watch list synced', count: user.watchedHotels.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWatchList,
  syncWatchList
};
