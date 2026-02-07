// lib/email-templates/abandoned-cart.js
// Abandoned cart reminder emails (2 versions: 12hr and 24hr)

import { wrapInLayout, button, formatCurrency, BRAND } from './base';

/**
 * Generate abandoned cart reminder email (Version 1: 12 hours)
 * Gentle reminder with product recap
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {Object} params.cart - Cart snapshot { items, subtotal, shipping, total }
 * @param {string} params.checkoutUrl - URL to restore cart and proceed to checkout
 * @param {string} [params.dealEndsAt] - ISO timestamp when deal expires (optional)
 * @returns {string} HTML email content
 */
export function generateAbandonedCartEmail1({ email, cart, checkoutUrl, dealEndsAt }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  // Calculate time remaining if deal expires
  let timeRemainingText = '';
  if (dealEndsAt) {
    const hoursRemaining = Math.round((new Date(dealEndsAt) - new Date()) / (1000 * 60 * 60));
    if (hoursRemaining > 0) {
      timeRemainingText = `<p style="margin: 16px 0; padding: 12px; background-color: #FFF9EB; border-left: 4px solid ${BRAND.accent}; color: ${BRAND.textPrimary}; font-size: 14px; font-family: ${BRAND.fontStack};">
        ⏰ <strong>This deal expires in ${hoursRemaining} hours</strong> – complete your order soon!
      </p>`;
    }
  }

  // Build cart items HTML
  const itemsHtml = cart.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.border};">
        <div style="font-size: 15px; font-weight: 600; color: ${BRAND.textPrimary}; font-family: ${BRAND.fontStack};">
          ${item.name}
        </div>
        <div style="font-size: 13px; color: ${BRAND.textMuted}; margin-top: 4px; font-family: ${BRAND.fontStack};">
          Qty: ${item.quantity}${item.sqft ? ` (${item.sqft} sq ft)` : ''}
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.border}; text-align: right;">
        <div style="font-size: 15px; font-weight: 600; color: ${BRAND.textPrimary}; font-family: ${BRAND.fontStack};">
          ${formatCurrency(item.price * item.quantity)}
        </div>
      </td>
    </tr>
  `).join('');

  const bodyHtml = `
    <h2 style="margin: 0 0 12px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; font-family: ${BRAND.fontStack};">
      You left something behind...
    </h2>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      We noticed you were checking out our flooring, but didn't complete your order. No worries – we saved your cart for you!
    </p>

    ${timeRemainingText}

    <div style="background-color: ${BRAND.bgSection}; padding: 20px; border-radius: 6px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; font-weight: 600; font-family: ${BRAND.fontStack};">
        Your Cart:
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
        <tr>
          <td style="padding: 12px 0 8px; font-size: 14px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
            Subtotal:
          </td>
          <td style="padding: 12px 0 8px; text-align: right; font-size: 14px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
            ${formatCurrency(cart.subtotal)}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px; font-size: 14px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
            Shipping:
          </td>
          <td style="padding: 0 0 12px; text-align: right; font-size: 14px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
            ${formatCurrency(cart.shipping)}
          </td>
        </tr>
        <tr>
          <td style="padding-top: 12px; border-top: 2px solid ${BRAND.border}; font-size: 18px; font-weight: 700; color: ${BRAND.textPrimary}; font-family: ${BRAND.fontStack};">
            Total:
          </td>
          <td style="padding-top: 12px; border-top: 2px solid ${BRAND.border}; text-align: right; font-size: 18px; font-weight: 700; color: ${BRAND.trust}; font-family: ${BRAND.fontStack};">
            ${formatCurrency(cart.total)}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      ${button('Complete Your Order', checkoutUrl, { bgColor: BRAND.trust })}
      <p style="margin: 8px 0 0; font-size: 13px; color: ${BRAND.textMuted}; font-family: ${BRAND.fontStack};">
        Your cart is waiting – checkout takes less than 2 minutes
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 32px 0;">

    <div style="background-color: ${BRAND.bgSection}; padding: 16px; border-radius: 6px;">
      <p style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 14px; font-weight: 600; font-family: ${BRAND.fontStack};">
        Questions about your order?
      </p>
      <p style="margin: 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
        Text Ty at <a href="sms:7788717681" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">${BRAND.phone}</a> – he's happy to help with sizing, shipping, or anything else!
      </p>
    </div>

    <p style="margin: 24px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      – The team at Victoria Flooring Outlet
    </p>
  `;

  return wrapInLayout(bodyHtml, {
    preheader: `Complete your order – ${cart.items[0]?.name || 'your flooring'} is waiting!`,
    email,
    showUnsubscribe: false, // Don't show unsubscribe in transactional emails
  });
}

/**
 * Generate abandoned cart reminder email (Version 2: 24 hours)
 * More urgent tone with emphasis on deal expiry
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {Object} params.cart - Cart snapshot { items, subtotal, shipping, total }
 * @param {string} params.checkoutUrl - URL to restore cart and proceed to checkout
 * @param {string} [params.dealEndsAt] - ISO timestamp when deal expires (optional)
 * @returns {string} HTML email content
 */
export function generateAbandonedCartEmail2({ email, cart, checkoutUrl, dealEndsAt }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  // Calculate time remaining if deal expires
  let urgencyHtml = '';
  if (dealEndsAt) {
    const hoursRemaining = Math.round((new Date(dealEndsAt) - new Date()) / (1000 * 60 * 60));
    if (hoursRemaining > 0 && hoursRemaining <= 24) {
      urgencyHtml = `
      <div style="background-color: #FFF3E0; border: 2px solid #FF9800; padding: 20px; border-radius: 6px; margin: 24px 0; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">⏰</div>
        <h3 style="margin: 0 0 8px; color: #E65100; font-size: 18px; font-weight: 700; font-family: ${BRAND.fontStack};">
          DEAL EXPIRES IN ${hoursRemaining} HOURS!
        </h3>
        <p style="margin: 0; color: ${BRAND.textPrimary}; font-size: 14px; font-family: ${BRAND.fontStack};">
          This Deal of the Week pricing won't last – complete your order before it's gone!
        </p>
      </div>
      `;
    }
  }

  const firstItem = cart.items[0];
  const itemCount = cart.items.length;
  const itemCountText = itemCount > 1 ? `${itemCount} items` : `${firstItem.name}`;

  const bodyHtml = `
    <h2 style="margin: 0 0 12px; color: ${BRAND.textPrimary}; font-size: 24px; font-weight: 700; font-family: ${BRAND.fontStack};">
      Don't miss out on your flooring deal
    </h2>

    <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 16px; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Hi there! You have <strong>${itemCountText}</strong> saved in your cart, but we're running out of time to secure this price.
    </p>

    ${urgencyHtml}

    <div style="background-color: ${BRAND.bgSection}; padding: 20px; border-radius: 6px; margin: 24px 0; text-align: center;">
      <div style="font-size: 14px; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-family: ${BRAND.fontStack};">
        Your Total:
      </div>
      <div style="font-size: 36px; font-weight: 700; color: ${BRAND.trust}; margin-bottom: 8px; font-family: ${BRAND.fontStack};">
        ${formatCurrency(cart.total)}
      </div>
      <div style="font-size: 13px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
        Includes ${itemCount} ${itemCount === 1 ? 'item' : 'items'} + shipping
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      ${button('Complete Your Order Now', checkoutUrl, { bgColor: BRAND.trust })}
      <p style="margin: 16px 0 0; font-size: 13px; color: ${BRAND.textMuted}; font-family: ${BRAND.fontStack};">
        Your cart is ready to go – just click above to finish checking out
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 32px 0;">

    <div style="text-align: center;">
      <p style="margin: 0 0 12px; color: ${BRAND.textPrimary}; font-size: 15px; font-weight: 600; font-family: ${BRAND.fontStack};">
        Need help deciding?
      </p>
      <p style="margin: 0; color: ${BRAND.textSecondary}; font-size: 14px; line-height: 1.6; font-family: ${BRAND.fontStack};">
        Text Ty at <a href="sms:7788717681" style="color: ${BRAND.accent}; text-decoration: none; font-weight: 600;">${BRAND.phone}</a><br>
        He can answer questions about installation, durability, shipping – anything!
      </p>
    </div>

    <p style="margin: 32px 0 0; color: ${BRAND.textSecondary}; font-size: 14px; text-align: center; line-height: 1.6; font-family: ${BRAND.fontStack};">
      Thanks for considering Victoria Flooring Outlet,<br>
      – Ty & the VFO team
    </p>
  `;

  return wrapInLayout(bodyHtml, {
    preheader: `⏰ Deal expires soon! Complete your order: ${formatCurrency(cart.total)}`,
    email,
    showUnsubscribe: false, // Don't show unsubscribe in transactional emails
  });
}

/**
 * Generate plain text version of abandoned cart email (version 1)
 */
export function generateAbandonedCartEmail1Text({ cart, checkoutUrl, dealEndsAt }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  let timeRemainingText = '';
  if (dealEndsAt) {
    const hoursRemaining = Math.round((new Date(dealEndsAt) - new Date()) / (1000 * 60 * 60));
    if (hoursRemaining > 0) {
      timeRemainingText = `\n⏰ This deal expires in ${hoursRemaining} hours – complete your order soon!\n`;
    }
  }

  const itemsText = cart.items.map(item => 
    `${item.name} (Qty: ${item.quantity}${item.sqft ? `, ${item.sqft} sq ft` : ''}) - ${formatCurrency(item.price * item.quantity)}`
  ).join('\n');

  return `
You left something behind...

We noticed you were checking out our flooring, but didn't complete your order. No worries – we saved your cart for you!
${timeRemainingText}
Your Cart:
${itemsText}

Subtotal: ${formatCurrency(cart.subtotal)}
Shipping: ${formatCurrency(cart.shipping)}
Total: ${formatCurrency(cart.total)}

Complete Your Order: ${checkoutUrl}

Your cart is waiting – checkout takes less than 2 minutes.

Questions about your order? Text Ty at ${BRAND.phone} – he's happy to help with sizing, shipping, or anything else!

– The team at Victoria Flooring Outlet
  `.trim();
}

/**
 * Generate plain text version of abandoned cart email (version 2)
 */
export function generateAbandonedCartEmail2Text({ cart, checkoutUrl, dealEndsAt }) {
  let urgencyText = '';
  if (dealEndsAt) {
    const hoursRemaining = Math.round((new Date(dealEndsAt) - new Date()) / (1000 * 60 * 60));
    if (hoursRemaining > 0 && hoursRemaining <= 24) {
      urgencyText = `\n⏰ DEAL EXPIRES IN ${hoursRemaining} HOURS!\n\nThis Deal of the Week pricing won't last – complete your order before it's gone!\n`;
    }
  }

  const firstItem = cart.items[0];
  const itemCount = cart.items.length;
  const itemCountText = itemCount > 1 ? `${itemCount} items` : `${firstItem.name}`;

  return `
Don't miss out on your flooring deal

Hi there! You have ${itemCountText} saved in your cart, but we're running out of time to secure this price.
${urgencyText}
Your Total: ${formatCurrency(cart.total)}
(Includes ${itemCount} ${itemCount === 1 ? 'item' : 'items'} + shipping)

Complete Your Order Now: ${checkoutUrl}

Your cart is ready to go – just click above to finish checking out.

---

Need help deciding? Text Ty at ${BRAND.phone}
He can answer questions about installation, durability, shipping – anything!

Thanks for considering Victoria Flooring Outlet,
– Ty & the VFO team
  `.trim();
}
