/**
 * email.service.js — Email notification service using Nodemailer
 * 
 * Templates are stored separately in /templates for clean separation.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const watchConfirmationTemplate = require('../templates/watchConfirmation.template');
const priceDropAlertTemplate = require('../templates/priceDropAlert.template');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a watch confirmation email to the user.
 */
async function sendWatchConfirmation({ email, title, location, price, currency }) {
  const html = watchConfirmationTemplate({ email, title, location, price, currency });

  return transporter.sendMail({
    from: `"Price Comparator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔔 Watching: ${title}`,
    html,
  });
}

/**
 * Send a price drop alert email to the user.
 */
async function sendPriceDropAlert({ email, title, location, oldPrice, newPrice, currency, site }) {
  const savings = Math.round(oldPrice - newPrice);
  const html = priceDropAlertTemplate({ email, title, location, oldPrice, newPrice, currency, site });

  return transporter.sendMail({
    from: `"Price Comparator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📉 Price Drop: ${title} — Save ${currency} ${savings}!`,
    html,
  });
}

/**
 * Verify the transporter connection on startup.
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (err) {
    console.warn('[Email] SMTP not configured or unreachable:', err.message);
    return false;
  }
}

module.exports = { sendWatchConfirmation, sendPriceDropAlert, verifyConnection };
