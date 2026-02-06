// pages/api/chat/start-session.js
// Initialize a new chat session

import { createConversation, getConversationBySessionId, upsertChatSession } from '../../../lib/chat/db-chat';
import { getChatChannelName, notifyNewConversation } from '../../../lib/chat/pusher';
import { generateSessionId } from '../../../lib/chat/chat-utils';
import { getSuggestedQuestions } from '../../../lib/chat/openai';
import { sendNewConversationEmail } from '../../../lib/chat/email-notifications';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId: existingSessionId, context = {} } = req.body;

    // Check if session already exists
    let needsNewSessionId = false;
    if (existingSessionId) {
      try {
        const existingConversation = await getConversationBySessionId(existingSessionId);

        if (existingConversation && existingConversation.status !== 'resolved') {
          // Return existing session
          return res.status(200).json({
            sessionId: existingSessionId,
            conversationId: existingConversation.id,
            isExisting: true,
            status: existingConversation.status,
            welcomeMessage: null, // Don't show welcome for existing session
            suggestedQuestions: getSuggestedQuestions()
          });
        }

        // If conversation exists but is resolved, we need a new session ID
        // to avoid unique constraint violation
        if (existingConversation && existingConversation.status === 'resolved') {
          needsNewSessionId = true;
        }
      } catch (dbError) {
        console.error('Chat DB lookup failed for existing session, continuing:', dbError);
      }
    }

    // Create new session - generate new ID if old conversation was resolved
    const sessionId = needsNewSessionId ? generateSessionId() : (existingSessionId || generateSessionId());
    const pusherChannel = getChatChannelName(sessionId);

    let conversation = null;

    try {
      // Create conversation in database
      conversation = await createConversation({
        sessionId,
        context: {
          ...context,
          startedAt: new Date().toISOString(),
          userAgent: req.headers['user-agent'],
        }
      });

      // Create chat session record
      await upsertChatSession({
        sessionId,
        conversationId: conversation.id,
        pusherChannel
      });

      // Notify admin of new conversation (Pusher real-time)
      await notifyNewConversation(conversation);

      // Send email notification for new conversation
      try {
        await sendNewConversationEmail({
          sessionId,
          context: {
            ...context,
            userAgent: req.headers['user-agent']
          },
          createdAt: conversation.created_at
        });
      } catch (emailError) {
        console.error('New conversation email error:', emailError);
      }
    } catch (dbError) {
      console.error('Chat DB init failed, continuing in degraded mode:', dbError);
    }

    // Welcome message
    const welcomeMessage = "Hi! I'm Ty's AI assistant. I can help answer questions about flooring, products, and services. What can I help you with today?";

    return res.status(200).json({
      sessionId,
      conversationId: conversation?.id || null,
      isExisting: false,
      status: 'active',
      welcomeMessage,
      suggestedQuestions: getSuggestedQuestions(),
      degraded: !conversation
    });

  } catch (error) {
    console.error('Error starting chat session:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Failed to start chat session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallbackMessage: "Sorry, chat isn't available right now. Please text Ty at 778-871-7681!"
    });
  }
}
