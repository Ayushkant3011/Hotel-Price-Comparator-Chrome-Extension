/**
 * db.js — MongoDB connection utility using Mongoose
 */

const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn('[DB] No MONGO_URI provided in environment variables.');
      console.warn('[DB] Running without persistent database connection.');
      return false;
    }

    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    process.exit(1); // Exit process with failure
  }
}

module.exports = connectDB;
