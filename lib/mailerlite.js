// lib/mailerlite.js
// Unified MailerLite API client using the new API (connect.mailerlite.com)
// Replaces scattered inline calls in subscribe.js and v2 API in send-weekly-sneak.js

const BASE_URL = 'https://connect.mailerlite.com/api';

function getApiKey() {
  return process.env.MAILERLITE_API_KEY || null;
}

function getHeaders() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('MAILERLITE_API_KEY is not configured');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

async function request(method, path, body = null, { retries = 1 } = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: getHeaders(),
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on rate limit or server error
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailerLite ${method} ${path} failed (${response.status}): ${errorText}`);
      }

      // Some endpoints return 204 with no body
      if (response.status === 204) return { success: true };

      return response.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }
  throw lastError;
}

/**
 * Check if MailerLite is configured
 */
export function isMailerLiteConfigured() {
  return Boolean(getApiKey());
}

/**
 * Add or update a subscriber
 * @param {Object} params
 * @param {string} params.email
 * @param {string[]} [params.groups] - Group IDs to add subscriber to
 * @param {Object} [params.fields] - Custom field values (e.g. { source: 'checkout' })
 * @param {string} [params.status] - 'active' | 'unsubscribed' | 'unconfirmed'
 * @returns {Object} Subscriber data from MailerLite
 */
export async function addSubscriber({ email, groups, fields, status = 'active' }) {
  const body = {
    email,
    status,
    ...(fields ? { fields } : {}),
    ...(groups && groups.length > 0 ? { groups } : {}),
  };
  return request('POST', '/subscribers', body);
}

/**
 * Update an existing subscriber by email
 */
export async function updateSubscriber(subscriberId, updates) {
  const body = {};
  if (updates.fields) body.fields = updates.fields;
  if (updates.groups) body.groups = updates.groups;
  if (updates.status) body.status = updates.status;
  return request('PUT', `/subscribers/${subscriberId}`, body);
}

/**
 * Get a subscriber by email
 * Returns null if not found (404)
 */
export async function getSubscriber(email) {
  try {
    const result = await request('GET', `/subscribers/${encodeURIComponent(email)}`);
    return result?.data || null;
  } catch (err) {
    if (err.message.includes('404')) return null;
    throw err;
  }
}

/**
 * Add a subscriber to a group
 */
export async function addToGroup(subscriberId, groupId) {
  return request('POST', `/subscribers/${subscriberId}/groups/${groupId}`);
}

/**
 * Remove a subscriber from a group
 */
export async function removeFromGroup(subscriberId, groupId) {
  return request('DELETE', `/subscribers/${subscriberId}/groups/${groupId}`);
}

/**
 * Unsubscribe (set status to unsubscribed)
 */
export async function unsubscribe(subscriberId) {
  return request('PUT', `/subscribers/${subscriberId}`, { status: 'unsubscribed' });
}

/**
 * Create a campaign and optionally send it
 * MailerLite new API campaign workflow:
 *   1. Create campaign
 *   2. Set campaign content
 *   3. Schedule or send campaign
 */
export async function createAndSendCampaign({
  subject,
  fromName,
  fromEmail,
  html,
  groups,
  plainText,
}) {
  // 1. Create campaign
  const campaignBody = {
    name: subject, // internal name
    type: 'regular',
    emails: [{
      subject,
      from_name: fromName || process.env.MAILERLITE_FROM_NAME || 'Victoria Flooring Outlet',
      from: fromEmail || process.env.MAILERLITE_FROM_EMAIL || 'hello@victoriaflooringoutlet.ca',
      content: html,
    }],
  };

  // Filter to specific groups if provided
  if (groups && groups.length > 0) {
    campaignBody.groups = groups;
  }

  const campaign = await request('POST', '/campaigns', campaignBody);
  const campaignId = campaign?.data?.id;

  if (!campaignId) {
    throw new Error('Failed to create campaign: no campaign ID returned');
  }

  // 2. Schedule for immediate send
  await request('POST', `/campaigns/${campaignId}/schedule`, {
    delivery: 'instant',
  });

  return campaignId;
}

/**
 * Get all groups (for setup/debugging)
 */
export async function listGroups() {
  const result = await request('GET', '/groups?limit=100');
  return result?.data || [];
}

/**
 * Get configured group IDs from environment
 */
export function getGroupIds() {
  return {
    subscribers: process.env.MAILERLITE_GROUP_SUBSCRIBER || null,
    customers: process.env.MAILERLITE_GROUP_CUSTOMER || null,
    repeatCustomer: process.env.MAILERLITE_GROUP_REPEAT_CUSTOMER || null,
  };
}
