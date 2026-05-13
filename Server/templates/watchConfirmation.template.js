/**
 * watchConfirmation.template.js — HTML template for watch confirmation emails
 */

function watchConfirmationTemplate({ email, title, location, price, currency }) {
  return `
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
}

module.exports = watchConfirmationTemplate;
