// pages/api/chat/send-message.js
// Handle incoming customer messages

import {
  getConversationBySessionId,
  addMessage,
  updateConversationStatus,
  getMessages,
  getMessageCount
} from '../../../lib/chat/db-chat';
import {
  broadcastNewMessage,
  broadcastAIResponding,
  notifyNeedsAttention
} from '../../../lib/chat/pusher';
import {
  generateAIResponse,
  buildContext,
  analyzeSentiment
} from '../../../lib/chat/openai';
import { validateMessage } from '../../../lib/chat/chat-utils';

// Simple in-memory rate limiting
const rateLimitMap = new Map();

function checkRateLimit(sessionId) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 15;

  const requests = rateLimitMap.get(sessionId) || [];
  const recentRequests = requests.filter(time => time > now - windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(sessionId, recentRequests);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, message, context = {} } = req.body;

  // Validate inputs
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const validation = validateMessage(message);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Rate limiting
  if (!checkRateLimit(sessionId)) {
    return res.status(429).json({
      error: 'Too many messages. Please wait a moment.',
      retryAfter: 60
    });
  }

  // Build context for AI (used for both normal and degraded mode)
  const aiContext = buildContext({
    pageUrl: context.pageUrl,
    productViewed: context.productViewed,
    cartContents: context.cartContents
  });

  try {
    // Get conversation
    let conversation = null;
    try {
      conversation = await getConversationBySessionId(sessionId);
    } catch (dbLookupError) {
      console.error('Chat DB lookup failed, continuing in degraded mode:', dbLookupError);
    }

    if (!conversation) {
      const aiResult = await generateAIResponse({
        messages: [{ sender: 'customer', message: validation.message }],
        context: aiContext
      });

      return res.status(200).json({
        success: true,
        messageId: `temp_${Date.now()}`,
        aiResponse: {
          id: `ai_${Date.now()}`,
          message: aiResult.message,
          confidence: aiResult.confidence
        },
        needsHuman: aiResult.needsHuman,
        humanHandling: false,
        degraded: true
      });
    }

    // Check if conversation is resolved
    if (conversation.status === 'resolved') {
      return res.status(400).json({
        error: 'This conversation has been closed. Please start a new chat.'
      });
    }

    // Analyze sentiment of customer message
    const sentimentAnalysis = analyzeSentiment(validation.message);

    // Save customer message
    const customerMessage = await addMessage({
      conversationId: conversation.id,
      sender: 'customer',
      message: validation.message,
      metadata: {
        sentiment: sentimentAnalysis.sentiment,
        context
      }
    });

    // Broadcast customer message
    await broadcastNewMessage(sessionId, customerMessage);

    // If human is handling, don't generate AI response
    if (conversation.assigned_to === 'ty' || conversation.status === 'human_handling') {
      return res.status(200).json({
        success: true,
        messageId: customerMessage.id,
        aiResponse: null,
        humanHandling: true
      });
    }

    // Let client know AI is processing
    await broadcastAIResponding(sessionId, true);

    // Get message history for context
    const messageHistory = await getMessages(conversation.id);
    const messageCount = await getMessageCount(conversation.id);

    // Generate AI response
    const aiResult = await generateAIResponse({
      messages: messageHistory,
      context: aiContext
    });

    // Save AI response
    const aiMessage = await addMessage({
      conversationId: conversation.id,
      sender: 'ai',
      message: aiResult.message,
      metadata: {
        confidence: aiResult.confidence,
        tokensUsed: aiResult.tokensUsed,
        needsHuman: aiResult.needsHuman
      }
    });

    // Broadcast AI message
    await broadcastNewMessage(sessionId, aiMessage);
    await broadcastAIResponding(sessionId, false);

    // Check if conversation needs human attention
    const needsHuman =
      aiResult.needsHuman ||
      sentimentAnalysis.requiresHuman ||
      aiResult.confidence < 0.6 ||
      messageCount > 15;

    if (needsHuman && conversation.status !== 'needs_attention') {
      await updateConversationStatus(sessionId, 'needs_attention', {
        requiresHuman: true,
        sentiment: sentimentAnalysis.sentiment
      });

      const reason = aiResult.needsHuman
        ? 'AI flagged for human attention'
        : sentimentAnalysis.requiresHuman
        ? `Customer sentiment: ${sentimentAnalysis.sentiment}`
        : aiResult.confidence < 0.6
        ? 'Low AI confidence'
        : 'Long conversation';

      await notifyNeedsAttention(sessionId, reason);
    }

    return res.status(200).json({
      success: true,
      messageId: customerMessage.id,
      aiResponse: {
        id: aiMessage.id,
        message: aiResult.message,
        confidence: aiResult.confidence
      },
      needsHuman,
      humanHandling: false
    });

  } catch (error) {
    console.error('Error processing message:', error);

    // Try to broadcast error state
    try {
      await broadcastAIResponding(sessionId, false);
    } catch {}

    // Degraded fallback: attempt AI response without DB persistence
    const aiResult = await generateAIResponse({
      messages: [{ sender: 'customer', message: validation.message }],
      context: aiContext
    });

    return res.status(200).json({
      success: true,
      messageId: `temp_${Date.now()}`,
      aiResponse: {
        id: `ai_${Date.now()}`,
        message: aiResult.message,
        confidence: aiResult.confidence
      },
      needsHuman: aiResult.needsHuman,
      humanHandling: false,
      degraded: true
    });
  }
}
