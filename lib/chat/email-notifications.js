// lib/chat/email-notifications.js
// Email notification functions for chat system using Resend

const RESEND_API_URL = 'https://api.resend.com/emails';

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    toEmail: process.env.LEAD_NOTIFY_EMAIL || 'brettlc2113@gmail.com',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'hello@victoriaflooringoutlet.ca',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca',
    newConversationEnabled: process.env.EMAIL_NEW_CONVERSATION !== 'false',
    needsAttentionEnabled: process.env.EMAIL_NEEDS_ATTENTION !== 'false',
    leadCaptureEnabled: process.env.EMAIL_LEAD_CAPTURE !== 'false',
  };
}

async function sendEmail({ subject, text, html }) {
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
      from: config.fromEmail,
      to: [config.toEmail],
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

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-CA', {
    timeZone: 'America/Vancouver',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Send email when a new conversation starts
 */
export async function sendNewConversationEmail({ sessionId, context, createdAt }) {
  const config = getEmailConfig();
  if (!config.newConversationEnabled) return { skipped: true };

  const pageUrl = context?.pageUrl || 'Unknown page';
  const productViewed = context?.productViewed || null;

  const subject = productViewed
    ? `New chat: viewing ${productViewed}`
    : 'New chat started';

  const text = [
    'A customer just started a chat.',
    '',
    `Page: ${pageUrl}`,
    productViewed ? `Product: ${productViewed}` : null,
    `Time: ${formatTime(createdAt || new Date())}`,
    '',
    `Dashboard: ${config.siteUrl}/admin/chat-monitor`
  ].filter(Boolean).join('\n');

  const html = `
    <h2 style="margin: 0 0 16px; color: #1E1A15;">New Chat Started</h2>
    <p style="margin: 0 0 16px; color: #666;">A customer just started a chat conversation.</p>
    <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 400px;">
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Page</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${pageUrl}</td>
      </tr>
      ${productViewed ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Product</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${productViewed}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15;">Time</td>
        <td style="padding: 8px 12px; color: #333;">${formatTime(createdAt || new Date())}</td>
      </tr>
    </table>
    <p style="margin: 24px 0 0;">
      <a href="${config.siteUrl}/admin/chat-monitor" style="display: inline-block; background: #1E1A15; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Open Dashboard</a>
    </p>
  `;

  try {
    return await sendEmail({ subject, text, html });
  } catch (error) {
    console.error('Failed to send new conversation email:', error);
    return { error: error.message };
  }
}

/**
 * Send email when conversation needs human attention
 */
export async function sendNeedsAttentionEmail({ sessionId, reason, customerName, lastMessage, messageCount }) {
  const config = getEmailConfig();
  if (!config.needsAttentionEnabled) return { skipped: true };

  const subject = `Chat needs attention: ${reason}`;

  const truncatedMessage = lastMessage && lastMessage.length > 100
    ? lastMessage.slice(0, 100) + '...'
    : lastMessage;

  const text = [
    'A chat requires your attention.',
    '',
    `Reason: ${reason}`,
    customerName ? `Customer: ${customerName}` : null,
    messageCount ? `Messages: ${messageCount}` : null,
    truncatedMessage ? `Last message: "${truncatedMessage}"` : null,
    '',
    `Dashboard: ${config.siteUrl}/admin/chat-monitor`
  ].filter(Boolean).join('\n');

  const html = `
    <h2 style="margin: 0 0 16px; color: #dc2626;">Chat Needs Attention</h2>
    <p style="margin: 0 0 16px; color: #666;">A conversation has been flagged for human review.</p>
    <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 400px;">
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #dc2626; border-bottom: 1px solid #eee;">Reason</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${reason}</td>
      </tr>
      ${customerName ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Customer</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${customerName}</td>
      </tr>
      ` : ''}
      ${messageCount ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Messages</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${messageCount}</td>
      </tr>
      ` : ''}
      ${truncatedMessage ? `
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; vertical-align: top;">Last message</td>
        <td style="padding: 8px 12px; color: #333; font-style: italic;">"${truncatedMessage}"</td>
      </tr>
      ` : ''}
    </table>
    <p style="margin: 24px 0 0;">
      <a href="${config.siteUrl}/admin/chat-monitor" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Conversation</a>
    </p>
  `;

  try {
    return await sendEmail({ subject, text, html });
  } catch (error) {
    console.error('Failed to send needs attention email:', error);
    return { error: error.message };
  }
}

/**
 * Send email when lead info is captured
 */
export async function sendLeadCapturedEmail({ name, email, phone, sessionId }) {
  const config = getEmailConfig();
  if (!config.leadCaptureEnabled) return { skipped: true };

  const subject = `New chat lead: ${name}`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    '',
    `Dashboard: ${config.siteUrl}/admin/chat-monitor`
  ].join('\n');

  const html = `
    <h2 style="margin: 0 0 16px; color: #1E1A15;">New Lead Captured</h2>
    <p style="margin: 0 0 16px; color: #666;">A customer provided their contact information.</p>
    <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 400px;">
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Name</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15; border-bottom: 1px solid #eee;">Email</td>
        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #eee;">
          <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; font-weight: 600; color: #1E1A15;">Phone</td>
        <td style="padding: 8px 12px; color: #333;">
          <a href="tel:${phone}" style="color: #2563eb;">${phone}</a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0;">
      <a href="${config.siteUrl}/admin/chat-monitor" style="display: inline-block; background: #1E1A15; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Dashboard</a>
    </p>
  `;

  try {
    return await sendEmail({ subject, text, html });
  } catch (error) {
    console.error('Failed to send lead captured email:', error);
    return { error: error.message };
  }
}
