// pages/api/chat/ty-intervene.js
// Handle Ty taking over a conversation

import {
  getConversationBySessionId,
  addMessage,
  updateConversationStatus
} from '../../../lib/chat/db-chat';
import {
  broadcastNewMessage,
  broadcastTyStatus
} from '../../../lib/chat/pusher';
import { validateMessage } from '../../../lib/chat/chat-utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, message, action } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const conversation = await getConversationBySessionId(sessionId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Handle different actions
    switch (action) {
      case 'take_over':
        // Ty takes over the conversation
        await updateConversationStatus(sessionId, 'human_handling', {
          assignedTo: 'ty',
          requiresHuman: false // Ty is handling it now
        });

        await broadcastTyStatus(sessionId, true);

        // Send takeover message if provided
        if (message) {
          const validation = validateMessage(message);
          if (validation.valid) {
            const tyMessage = await addMessage({
              conversationId: conversation.id,
              sender: 'ty',
              message: validation.message,
              metadata: { action: 'take_over' }
            });

            await broadcastNewMessage(sessionId, tyMessage);
          }
        }

        return res.status(200).json({
          success: true,
          action: 'take_over',
          status: 'human_handling'
        });

      case 'send_message':
        // Ty sends a message
        const validation = validateMessage(message);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }

        // Update status if not already human handling
        if (conversation.assigned_to !== 'ty') {
          await updateConversationStatus(sessionId, 'human_handling', {
            assignedTo: 'ty'
          });
          await broadcastTyStatus(sessionId, true);
        }

        const tyMessage = await addMessage({
          conversationId: conversation.id,
          sender: 'ty',
          message: validation.message,
          metadata: {}
        });

        await broadcastNewMessage(sessionId, tyMessage);

        return res.status(200).json({
          success: true,
          action: 'send_message',
          messageId: tyMessage.id
        });

      case 'hand_back_to_ai':
        // Ty hands conversation back to AI
        await updateConversationStatus(sessionId, 'ai_handling', {
          assignedTo: 'ai'
        });

        await broadcastTyStatus(sessionId, false);

        return res.status(200).json({
          success: true,
          action: 'hand_back_to_ai',
          status: 'ai_handling'
        });

      case 'resolve':
        // Mark conversation as resolved
        await updateConversationStatus(sessionId, 'resolved');

        // Optionally send closing message
        if (message) {
          const closeValidation = validateMessage(message);
          if (closeValidation.valid) {
            const closeMessage = await addMessage({
              conversationId: conversation.id,
              sender: 'ty',
              message: closeValidation.message,
              metadata: { action: 'resolve' }
            });

            await broadcastNewMessage(sessionId, closeMessage);
          }
        }

        return res.status(200).json({
          success: true,
          action: 'resolve',
          status: 'resolved'
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error in ty-intervene:', error);
    return res.status(500).json({ error: 'Failed to process action' });
  }
}
