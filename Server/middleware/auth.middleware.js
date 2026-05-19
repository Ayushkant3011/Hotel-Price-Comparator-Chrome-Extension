/**
 * auth.middleware.js — Verifies Firebase ID tokens
 */
const admin = require('../utils/firebase');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // If admin isn't initialized properly (missing JSON), this will throw
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    // Attach the user's Firebase UID and email to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

module.exports = requireAuth;
