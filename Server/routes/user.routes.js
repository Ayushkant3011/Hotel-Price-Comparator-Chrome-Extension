/**
 * user.routes.js — Routes for user profile and sync
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const requireAuth = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(requireAuth);

// Get the user's saved watch list from the cloud
router.get('/watchlist', userController.getWatchList);

// Sync the local browser watch list to the cloud
router.post('/watchlist', userController.syncWatchList);

module.exports = router;
