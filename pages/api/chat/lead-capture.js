// pages/api/chat/lead-capture.js
// Capture required lead info and notify via email

import { getConversationBySessionId, updateConversationLead } from '../../../lib/chat/db-chat';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendLeadEmail({ name, email, phone, sessionId }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const toEmail = process.env.LEAD_NOTIFY_EMAIL || 'brettlc2113@gmail.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@victoriaflooringoutlet.ca';
  const subject = `New chat lead: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Session: ${sessionId}`
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorText}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, name, email, phone } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    return res.status(400).json({ error: 'Valid phone is required' });
  }

  try {
    const conversation = await getConversationBySessionId(sessionId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await updateConversationLead(sessionId, {
      name: name.trim().slice(0, 255),
      email: email.trim().toLowerCase().slice(0, 255),
      phone: phone.trim().slice(0, 25)
    });

    try {
      await sendLeadEmail({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        sessionId
      });
    } catch (emailError) {
      console.error('Lead notification error:', emailError);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ error: 'Failed to save lead info' });
  }
}
