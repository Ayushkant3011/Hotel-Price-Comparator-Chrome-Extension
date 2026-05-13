/**
 * email.service.js — Email notification service using Nodemailer
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

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
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; color: #fff;">🔔 Price Watch Active</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 8px; color: #fff; font-size: 18px;">${title}</h2>
        <p style="margin: 0 0 16px; color: #94a3b8; font-size: 14px;">📍 ${location || 'Unknown location'}</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px;">Watching Price</p>
          <p style="margin: 0; color: #34d399; font-size: 24px; font-weight: bold;">${currency} ${Number(price).toLocaleString()}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          We'll notify you at <strong style="color: #e2e8f0;">${email}</strong> when this price drops. 
          Our system checks prices every 6 hours.
        </p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 11px;">Hotel Price Comparator Extension</p>
      </div>
    </div>
  `;

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
  const percent = Math.round((savings / oldPrice) * 100);

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; color: #fff;">📉 Price Drop Alert!</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 8px; color: #fff; font-size: 18px;">${title}</h2>
        <p style="margin: 0 0 16px; color: #94a3b8; font-size: 14px;">📍 ${location || 'Unknown location'}</p>
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <div style="flex: 1; background: #1e293b; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 11px;">Was</p>
            <p style="margin: 0; color: #f87171; font-size: 18px; font-weight: bold; text-decoration: line-through;">${currency} ${Number(oldPrice).toLocaleString()}</p>
          </div>
          <div style="flex: 1; background: #1e293b; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 11px;">Now</p>
            <p style="margin: 0; color: #34d399; font-size: 18px; font-weight: bold;">${currency} ${Number(newPrice).toLocaleString()}</p>
          </div>
        </div>
        <div style="background: #059669; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0; color: #fff; font-size: 16px; font-weight: bold;">You save ${currency} ${savings.toLocaleString()} (${percent}%)</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Found on <strong style="color: #e2e8f0;">${site}</strong></p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 11px;">Hotel Price Comparator Extension</p>
      </div>
    </div>
  `;

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
