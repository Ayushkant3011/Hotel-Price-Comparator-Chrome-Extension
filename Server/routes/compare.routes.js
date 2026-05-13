/**
 * compare.routes.js — Route definitions for price comparison API
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/compare.controller');

// Receive a detection from the Chrome extension
router.post('/detect', controller.handleDetect);

// Search for competitor prices (GET with query params)
router.get('/compare', controller.handleCompare);

// Search for competitor prices (POST with JSON body)
router.post('/compare', controller.handleComparePost);

// List all stored detections (debug/admin)
router.get('/detections', controller.handleListDetections);

// Receive a watch request (hotel + email) from the extension
router.post('/watch', controller.handleWatch);

module.exports = router;
