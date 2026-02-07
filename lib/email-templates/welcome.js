// lib/email-templates/welcome.js
// Welcome email template for new subscribers

import { wrapInLayout, button, BRAND } from './base';

/**
 * Generate welcome email HTML
 * @param {Object} params
 * @param {string} params.email - Subscriber email
 * @param {string} [params.firstName] - Optional first name
 * @returns {string} HTML email content
 */
export function generateWelcomeEmail({ email, firstName }) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  const bodyHtml = `
    <h2 style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; font-family: ${BRAND.fontStack};">
      ${greeting},
    </h2>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Welcome to the <strong>Victoria Flooring Outlet Insider Club</strong>!
    </p>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      You're now part of an exclusive community that gets first access to our best flooring deals. Here's what you can expect:
    </p>

    <div style="background-color: ${BRAND.bgSection}; padding: 20px; border-radius: 6px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: ${BRAND.textPrimary}; font-size: 16px; font-weight: 600; font-family: ${BRAND.fontStack};">
        🎯 Your VIP Benefits
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: ${BRAND.textPrimary}; font-size: 15px; line-height: 1.8; font-family: ${BRAND.fontStack};">
        <li><strong>24-hour early access</strong> to every Deal of the Week (Sunday midnight, before the public sees it Monday)</li>
        <li><strong>Full product previews</strong> with specs, images, and why we picked it</li>
        <li><strong>One email per week</strong> – no spam, no fluff, just beautiful floors at outlet pricing</li>
        <li><strong>Phone support</strong> at ${BRAND.phone} for any questions</li>
      </ul>
    </div>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      <strong>What's next?</strong> Check your inbox every <strong>Sunday evening</strong> for a full preview of next week's featured floor, complete with early access to shop before everyone else.
    </p>

    ${button('Browse Current Deals', `${siteUrl}/products`)}

    <p style="margin: 24px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Questions? Call us at <a href="tel:7788717681" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">${BRAND.phone}</a>
    </p>

    <p style="margin: 16px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      – The team at Victoria Flooring Outlet
    </p>
  `;

  return wrapInLayout(bodyHtml, {
    preheader: 'Welcome to the VFO Insider Club! You now get 24-hour early access to every Deal of the Week.',
    email,
    showUnsubscribe: true,
  });
}

/**
 * Generate plain text version of welcome email
 */
export function generateWelcomeEmailText({ firstName }) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  return `
${greeting},

Welcome to the Victoria Flooring Outlet Insider Club!

You're now part of an exclusive community that gets first access to our best flooring deals. Here's what you can expect:

🎯 Your VIP Benefits:
• 24-hour early access to every Deal of the Week (Sunday midnight, before the public sees it Monday)
• Full product previews with specs, images, and why we picked it
• One email per week – no spam, no fluff, just beautiful floors at outlet pricing
• Phone support at ${BRAND.phone} for any questions

What's next? Check your inbox every Sunday evening for a full preview of next week's featured floor, complete with early access to shop before everyone else.

Browse Current Deals: ${siteUrl}/products

Questions? Call us at ${BRAND.phone}

– The team at Victoria Flooring Outlet

---
Victoria Flooring Outlet · Victoria, BC, Canada
Unsubscribe: ${siteUrl}/api/unsubscribe
  `.trim();
}
