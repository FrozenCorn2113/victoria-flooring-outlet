// lib/email-templates/post-purchase.js
// Post-purchase email (sent 3 days after delivery) to encourage repeat purchases

import { wrapInLayout, button, badge, BRAND } from './base';

/**
 * Generate post-purchase follow-up email HTML
 * Sent 3 days after order delivery to thank customer, position as insider, tease next deal
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {string} [params.firstName] - Optional first name
 * @param {Object} params.order - Order details
 * @param {Object} [params.nextDeal] - Next week's preview deal (optional)
 * @returns {string} HTML email content
 */
export function generatePostPurchaseEmail({ email, firstName, order, nextDeal }) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  // Extract product name from order items (first item if multiple)
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const productName = firstItem?.name || 'your flooring';

  const bodyHtml = `
    <h2 style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; font-family: ${BRAND.fontStack};">
      ${greeting},
    </h2>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      We hope <strong>${productName}</strong> is settling in beautifully! 
    </p>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      As a <strong>Victoria Flooring Outlet customer</strong>, you're now part of our exclusive Insider Club. Here's what that means:
    </p>

    <div style="background-color: ${BRAND.bgSection}; padding: 20px; border-radius: 6px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: ${BRAND.textPrimary}; font-size: 16px; font-weight: 600; font-family: ${BRAND.fontStack};">
        🎯 Your VIP Perks
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: ${BRAND.textPrimary}; font-size: 15px; line-height: 1.8; font-family: ${BRAND.fontStack};">
        <li><strong>24-hour early access</strong> to every Deal of the Week</li>
        <li><strong>Weekly previews</strong> every Sunday with full product details</li>
        <li><strong>Insider pricing</strong> on outlet flooring before the public</li>
        <li><strong>Text support from Ty</strong> at ${BRAND.phone} anytime</li>
      </ul>
    </div>

    ${nextDeal ? `
    <div style="margin: 32px 0;">
      <div style="text-align: center; margin-bottom: 12px;">
        ${badge('👀 Sneak Peek: Next Week\'s Deal', { bgColor: BRAND.accent, textColor: '#ffffff' })}
      </div>

      <h3 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 20px; font-weight: 600; text-align: center; font-family: ${BRAND.fontStack};">
        ${nextDeal.name}
      </h3>

      <p style="margin: 0 0 16px; color: ${BRAND.textSecondary}; font-size: 14px; text-align: center; font-family: ${BRAND.fontStack};">
        ${nextDeal.vendor || ''} ${nextDeal.series ? `· ${nextDeal.series}` : ''}
      </p>

      ${nextDeal.image ? `
      <div style="margin-bottom: 16px; text-align: center;">
        <img src="${nextDeal.image}" alt="${nextDeal.name}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
      </div>
      ` : ''}

      <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 15px; text-align: center; line-height: 1.6; font-family: ${BRAND.fontStack};">
        ${nextDeal.description || 'A beautiful new floor at outlet pricing.'}
      </p>

      <div style="text-align: center;">
        ${button('View Next Week\'s Deal', `${siteUrl}/products`)}
      </div>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      ${button('Browse This Week\'s Deals', `${siteUrl}/products`)}
    </div>
    `}

    <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 32px 0;">

    <div style="background-color: #FFF9EB; padding: 20px; border-radius: 6px; border-left: 4px solid ${BRAND.accent};">
      <h3 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 16px; font-weight: 600; font-family: ${BRAND.fontStack};">
        💬 Referral Bonus
      </h3>
      <p style="margin: 0; color: ${BRAND.textPrimary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
        Know someone who needs flooring? Send them to <a href="${siteUrl}" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">VictoriaFlooringOutlet.ca</a> and have them mention your name. We'll make sure they're taken care of!
      </p>
    </div>

    <p style="margin: 24px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Questions or feedback? Text Ty at <a href="sms:7788717681" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">${BRAND.phone}</a> – we'd love to hear how your project is going!
    </p>

    <p style="margin: 16px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Thanks for choosing Victoria Flooring Outlet,<br>
      – Ty & the VFO team
    </p>
  `;

  return wrapInLayout(bodyHtml, {
    preheader: 'How is your new flooring? Plus a sneak peek at next week\'s Deal of the Week.',
    email,
    showUnsubscribe: true,
  });
}

/**
 * Generate plain text version of post-purchase email
 */
export function generatePostPurchaseEmailText({ firstName, order, nextDeal }) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const productName = firstItem?.name || 'your flooring';

  let text = `
${greeting},

We hope ${productName} is settling in beautifully!

As a Victoria Flooring Outlet customer, you're now part of our exclusive Insider Club. Here's what that means:

🎯 Your VIP Perks:
• 24-hour early access to every Deal of the Week
• Weekly previews every Sunday with full product details
• Insider pricing on outlet flooring before the public
• Text support from Ty at ${BRAND.phone} anytime
`;

  if (nextDeal) {
    text += `

👀 Sneak Peek: Next Week's Deal

${nextDeal.name}
${nextDeal.vendor || ''} ${nextDeal.series ? `· ${nextDeal.series}` : ''}

${nextDeal.description || 'A beautiful new floor at outlet pricing.'}

View Next Week's Deal: ${siteUrl}/products
`;
  } else {
    text += `

Browse This Week's Deals: ${siteUrl}/products
`;
  }

  text += `

---

💬 Referral Bonus

Know someone who needs flooring? Send them to VictoriaFlooringOutlet.ca and have them mention your name. We'll make sure they're taken care of!

---

Questions or feedback? Text Ty at ${BRAND.phone} – we'd love to hear how your project is going!

Thanks for choosing Victoria Flooring Outlet,
– Ty & the VFO team

---
Victoria Flooring Outlet · Victoria, BC, Canada
`;

  return text.trim();
}
