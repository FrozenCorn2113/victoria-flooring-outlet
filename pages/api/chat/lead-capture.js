// pages/api/chat/lead-capture.js
// Capture required lead info and notify via email

import { getConversationBySessionId, updateConversationLead, createConversation } from '../../../lib/chat/db-chat';
import { sendLeadCapturedEmail } from '../../../lib/chat/email-notifications';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    let conversation;
    try {
      conversation = await getConversationBySessionId(sessionId);
    } catch (lookupErr) {
      console.error('Lead capture - DB lookup failed:', lookupErr);
      // Continue to try creating a conversation
    }

    // If conversation doesn't exist (degraded mode), create it now
    if (!conversation) {
      try {
        conversation = await createConversation({
          sessionId,
          context: { createdFromLeadCapture: true }
        });
      } catch (createErr) {
        console.error('Failed to create conversation for lead capture:', createErr);
        return res.status(500).json({ error: 'Failed to save lead info - database unavailable' });
      }
    }

    try {
      await updateConversationLead(sessionId, {
        name: name.trim().slice(0, 255),
        email: email.trim().toLowerCase().slice(0, 255),
        phone: phone.trim().slice(0, 25)
      });
    } catch (updateErr) {
      console.error('Lead capture - update failed:', updateErr);
      return res.status(500).json({ error: 'Failed to save lead info - update failed' });
    }

    try {
      await sendLeadCapturedEmail({
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
