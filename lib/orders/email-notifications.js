// lib/orders/email-notifications.js
// Order confirmation and notification emails using Resend

const RESEND_API_URL = 'https://api.resend.com/emails';

function getEmailConfig() {
  const adminEmail = process.env.ORDER_NOTIFY_EMAIL || process.env.LEAD_NOTIFY_EMAIL;
  if (!adminEmail) {
    console.warn('ORDER_NOTIFY_EMAIL or LEAD_NOTIFY_EMAIL not configured');
  }
  return {
    apiKey: process.env.RESEND_API_KEY,
    adminEmail: adminEmail || null,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'hello@victoriaflooringoutlet.ca',
    fromName: 'Victoria Flooring Outlet',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca',
  };
}

async function sendEmail({ to, subject, text, html }) {
  const config = getEmailConfig();
  if (!config.apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { skipped: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorText}`);
  }

  return { success: true };
}

function formatCurrency(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatAddress(address) {
  if (!address) return 'N/A';
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country
  ].filter(Boolean);
  return parts.join('<br>');
}

function formatAddressText(address) {
  if (!address) return 'N/A';
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country
  ].filter(Boolean);
  return parts.join('\n');
}

function buildItemsHtml(items) {
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');
}

function buildItemsText(items) {
  return items.map(item =>
    `- ${item.name} x${item.quantity}: ${formatCurrency(item.total)}`
  ).join('\n');
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail({ order, session }) {
  const config = getEmailConfig();
  const customerEmail = order.customer_email || session?.customer_details?.email;

  if (!customerEmail) {
    console.warn('No customer email available, skipping confirmation email');
    return { skipped: true, reason: 'no_email' };
  }

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const orderNumber = order.id || order.stripe_session_id?.slice(-8) || 'N/A';
  const customerName = order.customer_name || session?.customer_details?.name || 'Customer';

  const subject = `Order confirmed - Victoria Flooring Outlet (#${orderNumber})`;

  const text = `
Hi ${customerName},

Thank you for your order! We've received your payment and will begin processing your order.

ORDER #${orderNumber}
${'-'.repeat(40)}

ITEMS:
${buildItemsText(items)}

Subtotal: ${formatCurrency(order.subtotal)}
Shipping: ${formatCurrency(order.shipping)}
Total: ${formatCurrency(order.total)}

SHIPPING TO:
${formatAddressText(shippingAddress)}

We'll send you another email when your order ships.

Questions? Reply to this email or text Ty at 778-871-7681.

Thank you for shopping with Victoria Flooring Outlet!
${config.siteUrl}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1E1A15; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Victoria Flooring Outlet</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px; color: #1E1A15; font-size: 20px;">Thank you for your order!</h2>
              <p style="margin: 0 0 24px; color: #666; font-size: 14px;">
                Hi ${customerName}, we've received your payment and will begin processing your order.
              </p>

              <p style="margin: 0 0 16px; color: #1E1A15; font-weight: 600; font-size: 14px;">
                ORDER #${orderNumber}
              </p>

              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #eee; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600;">ITEM</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; color: #666; font-weight: 600;">QTY</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; color: #666; font-weight: 600;">PRICE</th>
                </tr>
                ${buildItemsHtml(items)}
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subtotal</td>
                  <td style="padding: 8px 0; text-align: right; color: #333;">${formatCurrency(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Shipping</td>
                  <td style="padding: 8px 0; text-align: right; color: #333;">${formatCurrency(order.shipping)}</td>
                </tr>
                <tr style="border-top: 2px solid #1E1A15;">
                  <td style="padding: 12px 0; color: #1E1A15; font-weight: 600; font-size: 16px;">Total</td>
                  <td style="padding: 12px 0; text-align: right; color: #1E1A15; font-weight: 600; font-size: 16px;">${formatCurrency(order.total)}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 12px; font-weight: 600;">SHIPPING TO</p>
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.5;">
                  ${formatAddress(shippingAddress)}
                </p>
              </div>

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                We'll send you another email when your order ships.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
                Questions? Reply to this email or text Ty at <a href="sms:7788717681" style="color: #1E1A15; font-weight: 600;">778-871-7681</a>
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                <a href="${config.siteUrl}" style="color: #999;">Victoria Flooring Outlet</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const result = await sendEmail({ to: customerEmail, subject, text, html });
    return result;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error.message);
    return { error: error.message };
  }
}

/**
 * Send order notification email to admin
 */
export async function sendOrderNotificationEmail({ order, session }) {
  const config = getEmailConfig();

  if (!config.adminEmail) {
    console.warn('Admin email not configured, skipping order notification');
    return { skipped: true, reason: 'no_admin_email' };
  }

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const orderNumber = order.id || order.stripe_session_id?.slice(-8) || 'N/A';
  const customerName = order.customer_name || session?.customer_details?.name || 'Unknown';
  const customerEmail = order.customer_email || session?.customer_details?.email || 'N/A';
  const customerPhone = order.customer_phone || session?.customer_details?.phone || 'N/A';

  const subject = `New order from ${customerName} - ${formatCurrency(order.total)}`;

  const text = `
NEW ORDER #${orderNumber}
${'='.repeat(40)}

Customer: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

ITEMS:
${buildItemsText(items)}

Subtotal: ${formatCurrency(order.subtotal)}
Shipping: ${formatCurrency(order.shipping)}
Total: ${formatCurrency(order.total)}

SHIPPING TO:
${formatAddressText(shippingAddress)}

Postal Code: ${order.postal_code || 'N/A'}
Shipping Zone: ${order.shipping_zone || 'N/A'}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <h2 style="margin: 0 0 16px; color: #16a34a;">New Order Received!</h2>

  <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 500px; border: 1px solid #ddd; border-radius: 6px;">
    <tr style="background: #f9f9f9;">
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #ddd;">
        Order #${orderNumber}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; font-weight: 600; color: #666; border-bottom: 1px solid #eee; width: 120px;">Customer</td>
      <td style="padding: 10px 12px; color: #333; border-bottom: 1px solid #eee;">${customerName}</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; font-weight: 600; color: #666; border-bottom: 1px solid #eee;">Email</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">
        <a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; font-weight: 600; color: #666; border-bottom: 1px solid #eee;">Phone</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">
        <a href="tel:${customerPhone}" style="color: #2563eb;">${customerPhone}</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; font-weight: 600; color: #666; border-bottom: 1px solid #eee;">Total</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #16a34a; font-size: 18px;">
        ${formatCurrency(order.total)}
      </td>
    </tr>
  </table>

  <h3 style="margin: 24px 0 12px; color: #1E1A15;">Items Ordered</h3>
  <table style="border-collapse: collapse; width: 100%; max-width: 500px; border: 1px solid #ddd; border-radius: 6px;">
    <tr style="background: #f9f9f9;">
      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666;">Item</th>
      <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #666;">Qty</th>
      <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #666;">Price</th>
    </tr>
    ${buildItemsHtml(items)}
    <tr style="background: #f9f9f9;">
      <td style="padding: 10px 12px;" colspan="2">Subtotal</td>
      <td style="padding: 10px 12px; text-align: right;">${formatCurrency(order.subtotal)}</td>
    </tr>
    <tr style="background: #f9f9f9;">
      <td style="padding: 10px 12px;" colspan="2">Shipping (${order.shipping_zone || 'N/A'})</td>
      <td style="padding: 10px 12px; text-align: right;">${formatCurrency(order.shipping)}</td>
    </tr>
  </table>

  <h3 style="margin: 24px 0 12px; color: #1E1A15;">Ship To</h3>
  <div style="background: #f9f9f9; padding: 12px 16px; border-radius: 6px; max-width: 300px;">
    <p style="margin: 0; color: #333; line-height: 1.6;">
      ${formatAddress(shippingAddress)}
    </p>
  </div>
</body>
</html>
  `;

  try {
    const result = await sendEmail({ to: config.adminEmail, subject, text, html });
    return result;
  } catch (error) {
    console.error('Failed to send order notification email:', error);
    return { error: error.message };
  }
}
