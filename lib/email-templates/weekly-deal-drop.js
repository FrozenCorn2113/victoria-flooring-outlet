// lib/email-templates/weekly-deal-drop.js
// Weekly deal drop email showcasing THIS week's deal AND next week's preview

import { wrapInLayout, button, badge, formatCurrency, BRAND, stripHtml } from './base';

/**
 * Generate weekly deal drop email HTML
 * Two sections: THIS WEEK (live now, with CTA) + NEXT WEEK (preview, no CTA)
 * 
 * @param {Object} params
 * @param {string} params.email - Subscriber email
 * @param {Object} params.currentDeal - This week's active deal
 * @param {Object} [params.nextDeal] - Next week's preview deal (optional)
 * @returns {string} HTML email content
 */
export function generateWeeklyDealDropEmail({ email, currentDeal, nextDeal }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  // Calculate savings percentage if compare price exists
  let savingsPercent = null;
  if (currentDeal.compareAtPricePerSqFt && currentDeal.pricePerSqFt) {
    const saved = currentDeal.compareAtPricePerSqFt - currentDeal.pricePerSqFt;
    savingsPercent = Math.round((saved / currentDeal.compareAtPricePerSqFt) * 100);
  }

  const currentDealSection = `
    <div style="margin-bottom: 40px;">
      <div style="text-align: center; margin-bottom: 16px;">
        ${badge('🔥 LIVE NOW – Early Access', { bgColor: BRAND.trust, textColor: '#ffffff' })}
      </div>

      <h2 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 26px; font-weight: 700; text-align: center; font-family: ${BRAND.fontStack};">
        This Week: ${currentDeal.name}
      </h2>

      <p style="margin: 0 0 24px; color: ${BRAND.textSecondary}; font-size: 15px; text-align: center; font-family: ${BRAND.fontStack};">
        ${currentDeal.vendor || ''} ${currentDeal.series ? `· ${currentDeal.series}` : ''}
      </p>

      ${currentDeal.image ? `
      <div style="margin-bottom: 24px; text-align: center;">
        <img src="${currentDeal.image}" alt="${currentDeal.name}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
      </div>
      ` : ''}

      <div style="background-color: ${BRAND.bgSection}; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
          <tr>
            <td style="text-align: center; padding-bottom: 12px;">
              <div style="font-size: 14px; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-family: ${BRAND.fontStack};">
                Deal Price
              </div>
              <div style="font-size: 32px; font-weight: 700; color: ${BRAND.trust}; font-family: ${BRAND.fontStack};">
                ${formatCurrency(Math.round(currentDeal.pricePerSqFt * 100))}/sq ft
              </div>
              ${currentDeal.compareAtPricePerSqFt ? `
              <div style="font-size: 16px; color: ${BRAND.textMuted}; text-decoration: line-through; font-family: ${BRAND.fontStack};">
                ${formatCurrency(Math.round(currentDeal.compareAtPricePerSqFt * 100))}/sq ft
              </div>
              ` : ''}
              ${savingsPercent ? `
              <div style="margin-top: 8px;">
                ${badge(`Save ${savingsPercent}%`, { bgColor: BRAND.trust, textColor: '#ffffff' })}
              </div>
              ` : ''}
            </td>
          </tr>
        </table>

        ${currentDeal.description ? `
        <p style="margin: 0 0 16px; color: ${BRAND.textPrimary}; font-size: 15px; line-height: 1.6; font-family: ${BRAND.fontStack};">
          ${currentDeal.description}
        </p>
        ` : ''}

        ${currentDeal.features && currentDeal.features.length > 0 ? `
        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${BRAND.fontStack};">
            Why We Love It:
          </h4>
          <ul style="margin: 0; padding-left: 20px; color: ${BRAND.textPrimary}; font-size: 14px; line-height: 1.7; font-family: ${BRAND.fontStack};">
            ${currentDeal.features.slice(0, 4).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${currentDeal.specs ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${BRAND.border};">
          <h4 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${BRAND.fontStack};">
            Specs:
          </h4>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: ${BRAND.textSecondary}; font-family: ${BRAND.fontStack};">
            ${currentDeal.specs.thickness ? `
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Thickness:</td>
              <td style="padding: 4px 0;">${currentDeal.specs.thickness}</td>
            </tr>
            ` : ''}
            ${currentDeal.specs.width ? `
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Width:</td>
              <td style="padding: 4px 0;">${currentDeal.specs.width}</td>
            </tr>
            ` : ''}
            ${currentDeal.specs.length ? `
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Length:</td>
              <td style="padding: 4px 0;">${currentDeal.specs.length}</td>
            </tr>
            ` : ''}
            ${currentDeal.specs.finish ? `
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Finish:</td>
              <td style="padding: 4px 0;">${currentDeal.specs.finish}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}
      </div>

      <div style="text-align: center;">
        ${button('Shop This Deal Now', `${siteUrl}/products/${currentDeal.id}`, { bgColor: BRAND.trust })}
        <p style="margin: 8px 0 0; color: ${BRAND.textMuted}; font-size: 13px; font-family: ${BRAND.fontStack};">
          ⏰ You have 24-hour early access before the public sees this Monday
        </p>
      </div>
    </div>
  `;

  // Next week's preview (optional, blurred/teaser)
  let nextDealSection = '';
  if (nextDeal) {
    nextDealSection = `
    <hr style="border: none; border-top: 2px solid ${BRAND.border}; margin: 40px 0;">

    <div style="margin-top: 40px;">
      <div style="text-align: center; margin-bottom: 16px;">
        ${badge('👀 Coming Next Week', { bgColor: BRAND.accent, textColor: '#ffffff' })}
      </div>

      <h3 style="margin: 0 0 8px; color: ${BRAND.textPrimary}; font-size: 22px; font-weight: 600; text-align: center; font-family: ${BRAND.fontStack};">
        Preview: ${nextDeal.name}
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

      <p style="margin: 0; color: ${BRAND.textMuted}; font-size: 13px; text-align: center; font-family: ${BRAND.fontStack};">
        Full details and early access arriving next Sunday evening.
      </p>
    </div>
    `;
  }

  const bodyHtml = currentDealSection + nextDealSection;

  return wrapInLayout(bodyHtml, {
    preheader: `${currentDeal.name} is live now! ${nextDeal ? `Plus a sneak peek at next week: ${nextDeal.name}` : ''}`,
    email,
    showUnsubscribe: true,
  });
}

/**
 * Generate plain text version of weekly deal drop email
 */
export function generateWeeklyDealDropEmailText({ currentDeal, nextDeal }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca').replace(/\/$/, '');

  let text = `
🔥 LIVE NOW – Early Access

This Week: ${currentDeal.name}
${currentDeal.vendor || ''} ${currentDeal.series ? `· ${currentDeal.series}` : ''}

Deal Price: ${formatCurrency(Math.round(currentDeal.pricePerSqFt * 100))}/sq ft
${currentDeal.compareAtPricePerSqFt ? `Compare at: ${formatCurrency(Math.round(currentDeal.compareAtPricePerSqFt * 100))}/sq ft` : ''}

${currentDeal.description || ''}

Shop This Deal Now: ${siteUrl}/products/${currentDeal.id}

⏰ You have 24-hour early access before the public sees this Monday
`;

  if (nextDeal) {
    text += `

---

👀 Coming Next Week

Preview: ${nextDeal.name}
${nextDeal.vendor || ''} ${nextDeal.series ? `· ${nextDeal.series}` : ''}

${nextDeal.description || ''}

Deal launches next Sunday at: ${formatCurrency(Math.round(nextDeal.pricePerSqFt * 100))}/sq ft

Full details and early access arriving next Sunday evening.
`;
  }

  text += `

---
Victoria Flooring Outlet · Victoria, BC, Canada
Questions? Text Ty at ${BRAND.phone}
`;

  return text.trim();
}
