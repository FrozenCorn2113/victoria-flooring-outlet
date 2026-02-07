// lib/email-templates/base.js
// Shared branded email layout and helpers
// Extracted from lib/orders/email-notifications.js patterns

import { generateUnsubscribeUrl } from '../consent';

const BRAND = {
  name: 'Victoria Flooring Outlet',
  headerBg: '#1E1A15',
  headerColor: '#ffffff',
  accent: '#8B7355',
  trust: '#4A7C59',
  textPrimary: '#1E1A15',
  textSecondary: '#666666',
  textMuted: '#999999',
  bgLight: '#f5f5f5',
  bgCard: '#ffffff',
  bgSection: '#f9f9f9',
  border: '#eeeeee',
  phone: '778-871-7681',
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * Format cents to currency string
 */
export function formatCurrency(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generate a branded CTA button
 */
export function button(text, url, { bgColor, textColor } = {}) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: ${bgColor || BRAND.headerBg};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; color: ${textColor || '#ffffff'}; text-decoration: none; font-size: 16px; font-weight: 600; font-family: ${BRAND.fontStack};">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate CASL-compliant unsubscribe footer
 */
export function unsubscribeFooter(email) {
  const unsubscribeUrl = generateUnsubscribeUrl(email);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  return `
    <tr>
      <td style="padding: 24px; text-align: center; border-top: 1px solid ${BRAND.border}; background-color: ${BRAND.bgSection};">
        <p style="margin: 0 0 8px; color: ${BRAND.textSecondary}; font-size: 14px; font-family: ${BRAND.fontStack};">
          Questions? Text Ty at <a href="sms:7788717681" style="color: ${BRAND.textPrimary}; font-weight: 600;">778-871-7681</a>
        </p>
        <p style="margin: 0 0 12px; color: ${BRAND.textMuted}; font-size: 12px; font-family: ${BRAND.fontStack};">
          Victoria Flooring Outlet &middot; Victoria, BC, Canada
        </p>
        <p style="margin: 0; color: ${BRAND.textMuted}; font-size: 12px; font-family: ${BRAND.fontStack};">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.textMuted}; text-decoration: underline;">Unsubscribe</a>
          &nbsp;&middot;&nbsp;
          <a href="${siteUrl}" style="color: ${BRAND.textMuted}; text-decoration: underline;">Visit our website</a>
        </p>
      </td>
    </tr>
  `;
}

/**
 * Wrap email body content in the branded layout
 * @param {string} bodyHtml - The inner content HTML
 * @param {Object} options
 * @param {string} [options.preheader] - Preview text shown in inbox (hidden in email body)
 * @param {string} [options.email] - Recipient email for unsubscribe link
 * @param {boolean} [options.showUnsubscribe=true] - Whether to include unsubscribe footer
 */
export function wrapInLayout(bodyHtml, { preheader, email, showUnsubscribe = true } = {}) {
  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: ${BRAND.fontStack}; background-color: ${BRAND.bgLight};">
  ${preheaderHtml}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.bgLight}; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.bgCard}; border-radius: 8px; overflow: hidden; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND.headerBg}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: ${BRAND.headerColor}; font-size: 24px; font-weight: 600; font-family: ${BRAND.fontStack};">
                Victoria Flooring Outlet
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; font-family: ${BRAND.fontStack};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          ${showUnsubscribe && email ? unsubscribeFooter(email) : `
          <tr>
            <td style="padding: 24px; text-align: center; border-top: 1px solid ${BRAND.border}; background-color: ${BRAND.bgSection};">
              <p style="margin: 0 0 8px; color: ${BRAND.textSecondary}; font-size: 14px; font-family: ${BRAND.fontStack};">
                Questions? Text Ty at <a href="sms:7788717681" style="color: ${BRAND.textPrimary}; font-weight: 600;">778-871-7681</a>
              </p>
              <p style="margin: 0; color: ${BRAND.textMuted}; font-size: 12px; font-family: ${BRAND.fontStack};">
                <a href="${(process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '')}" style="color: ${BRAND.textMuted};">Victoria Flooring Outlet</a>
              </p>
            </td>
          </tr>
          `}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate a section divider
 */
export function divider() {
  return `<hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0;">`;
}

/**
 * Generate a highlight box (teal/green background)
 */
export function highlightBox(content) {
  return `
    <div style="background-color: ${BRAND.bgSection}; padding: 16px; border-radius: 6px; margin: 16px 0;">
      ${content}
    </div>
  `;
}

/**
 * Generate a badge (e.g., "Early Access", "Save 23%")
 */
export function badge(text, { bgColor, textColor } = {}) {
  return `
    <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; background-color: ${bgColor || BRAND.accent}; color: ${textColor || '#ffffff'}; font-size: 12px; font-weight: 600; font-family: ${BRAND.fontStack};">
      ${text}
    </span>
  `;
}

/**
 * Strip HTML tags for plain text version
 */
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Export brand constants for use in templates
export { BRAND };
