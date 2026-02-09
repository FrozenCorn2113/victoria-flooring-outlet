// lib/email-templates/next-week-deal-subscriber.js
// Follow-up email for new subscribers: "Next week's deal" preview (sent ~1 day after welcome)

import { wrapInLayout, button, badge, formatCurrency, BRAND } from './base';

/**
 * Generate "next week's deal" subscriber follow-up email HTML
 * Sent to new subscribers a day after welcome; shows upcoming deal preview.
 *
 * @param {Object} params
 * @param {string} params.email - Subscriber email
 * @param {string} [params.firstName] - Optional first name
 * @param {Object} [params.nextDeal] - Next week's deal (from getNextWeeklyDealFromDb)
 * @returns {string} HTML email content
 */
export function generateNextWeekDealSubscriberEmail({ email, firstName, nextDeal }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  let dealSection = '';
  if (nextDeal) {
    dealSection = `
    <div style="margin-top: 24px;">
      <div style="text-align: center; margin-bottom: 16px;">
        ${badge('👀 Coming Next Week', { bgColor: BRAND.accent, textColor: '#ffffff' })}
      </div>

      <h3 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; text-align: center; font-family: ${BRAND.fontStack};">
        ${nextDeal.name}
      </h3>

      <p style="margin: 0 0 20px; color: ${BRAND.textSecondary}; font-size: 14px; text-align: center; font-family: ${BRAND.fontStack};">
        ${nextDeal.vendor || ''} ${nextDeal.series ? `· ${nextDeal.series}` : ''}
      </p>

      ${nextDeal.image ? `
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${nextDeal.image}" alt="${nextDeal.name}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
      </div>
      ` : ''}

      ${nextDeal.description ? `
      <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 15px; line-height: 1.6; text-align: center; font-family: ${BRAND.fontStack};">
        ${nextDeal.description}
      </p>
      ` : ''}

      ${nextDeal.pricePerSqFt ? `
      <div style="background-color: ${BRAND.bgSection}; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 16px;">
        <div style="font-size: 14px; color: ${BRAND.textMuted}; margin-bottom: 4px; font-family: ${BRAND.fontStack};">
          Deal launches next Sunday at:
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${BRAND.accent}; font-family: ${BRAND.fontStack};">
          ${formatCurrency(Math.round(nextDeal.pricePerSqFt * 100))}/sq ft
        </div>
      </div>
      ` : ''}

      <p style="margin: 0 0 24px; color: ${BRAND.textMuted}; font-size: 13px; text-align: center; font-family: ${BRAND.fontStack};">
        You'll get the full email with early access next Sunday evening—then 24 hours before everyone else.
      </p>

      <div style="text-align: center;">
        ${button('Browse Current Deals', `${siteUrl}/products`)}
      </div>
    </div>
    `;
  } else {
    dealSection = `
    <p style="margin: 24px 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      We're lining up the next Deal of the Week. Check your inbox <strong>Sunday evening</strong> for the full preview and your early-access link.
    </p>
    <div style="text-align: center;">
      ${button('Browse Current Deals', `${siteUrl}/products`)}
    </div>
    `;
  }

  const bodyHtml = `
    <h2 style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; font-family: ${BRAND.fontStack};">
      ${greeting},
    </h2>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      As a new Insider, here's a sneak peek at <strong>next week's Deal of the Week</strong>—so you know what to look for when the full email lands Sunday.
    </p>

    ${dealSection}

    <p style="margin: 24px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Questions? Call us at <a href="tel:7788717681" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">${BRAND.phone}</a>
    </p>

    <p style="margin: 16px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      – The team at Victoria Flooring Outlet
    </p>
  `;

  const preheader = nextDeal
    ? `Sneak peek: Next week's deal – ${nextDeal.name}`
    : "Your next Deal of the Week preview is coming Sunday.";

  return wrapInLayout(bodyHtml, {
    preheader,
    email,
    showUnsubscribe: true,
  });
}

/**
 * Generate plain text version
 */
export function generateNextWeekDealSubscriberEmailText({ firstName, nextDeal }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  let body = `
${greeting},

As a new Insider, here's a sneak peek at next week's Deal of the Week—so you know what to look for when the full email lands Sunday.
`;

  if (nextDeal) {
    body += `

👀 Coming Next Week

${nextDeal.name}
${nextDeal.vendor || ''} ${nextDeal.series ? `· ${nextDeal.series}` : ''}

${nextDeal.description || ''}

Deal launches next Sunday at: ${nextDeal.pricePerSqFt ? `${formatCurrency(Math.round(nextDeal.pricePerSqFt * 100))}/sq ft` : 'TBA'}

You'll get the full email with early access next Sunday evening—then 24 hours before everyone else.

Browse current deals: ${siteUrl}/products
`;
  } else {
    body += `

We're lining up the next Deal of the Week. Check your inbox Sunday evening for the full preview and your early-access link.

Browse current deals: ${siteUrl}/products
`;
  }

  body += `

Questions? Call us at ${BRAND.phone}

– The team at Victoria Flooring Outlet

---
Victoria Flooring Outlet · Victoria, BC, Canada
Unsubscribe: ${siteUrl}/api/unsubscribe
`;

  return body.trim();
}
