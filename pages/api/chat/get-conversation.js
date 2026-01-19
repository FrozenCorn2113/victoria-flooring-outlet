// pages/api/chat/get-conversation.js
// Fetch chat history for a session

import { getConversationWithMessages } from '../../../lib/chat/db-chat';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const conversation = await getConversationWithMessages(sessionId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json({
      id: conversation.id,
      sessionId: conversation.session_id,
      status: conversation.status,
      assignedTo: conversation.assigned_to,
      requiresHuman: conversation.requires_human,
      customerName: conversation.customer_name || conversation.context?.lead?.name || null,
      customerEmail: conversation.customer_email || conversation.context?.lead?.email || null,
      customerPhone: conversation.customer_phone || conversation.context?.lead?.phone || null,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        message: msg.message,
        createdAt: msg.created_at,
        metadata: msg.metadata
      }))
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}
