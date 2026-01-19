// lib/chat/pusher.js
// Pusher configuration for real-time messaging

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (for API routes)
let pusherServer = null;

export function getPusherServer() {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true
    });
  }
  return pusherServer;
}

// Client-side Pusher instance (for React components)
let pusherClient = null;

export function getPusherClient() {
  if (typeof window === 'undefined') return null;

  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/chat/pusher-auth',
    });
  }
  return pusherClient;
}

// Channel naming conventions
export function getChatChannelName(sessionId) {
  return `private-chat-${sessionId}`;
}

export function getAdminChannelName() {
  return 'private-admin-chat';
}

export function getPresenceChannelName() {
  return 'presence-chat-status';
}

// Event types
export const CHAT_EVENTS = {
  NEW_MESSAGE: 'new-message',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  CONVERSATION_UPDATED: 'conversation-updated',
  TY_JOINED: 'ty-joined',
  TY_LEFT: 'ty-left',
  AI_RESPONDING: 'ai-responding',
  AI_DONE: 'ai-done',
  CONVERSATION_RESOLVED: 'conversation-resolved',
  NEW_CONVERSATION: 'new-conversation', // For admin dashboard
  NEEDS_ATTENTION: 'needs-attention', // For admin dashboard
};

// Server-side: Trigger an event on a channel
export async function triggerChatEvent(sessionId, event, data) {
  const pusher = getPusherServer();
  const channelName = getChatChannelName(sessionId);

  await pusher.trigger(channelName, event, data);
}

// Server-side: Trigger an event to admin channel
export async function triggerAdminEvent(event, data) {
  const pusher = getPusherServer();
  await pusher.trigger(getAdminChannelName(), event, data);
}

// Server-side: Broadcast a new message to both customer and admin
export async function broadcastNewMessage(sessionId, message) {
  const data = {
    id: message.id,
    sender: message.sender,
    message: message.message,
    createdAt: message.created_at,
    metadata: message.metadata
  };

  // Send to customer channel
  await triggerChatEvent(sessionId, CHAT_EVENTS.NEW_MESSAGE, data);

  // Also send to admin channel for monitoring
  await triggerAdminEvent(CHAT_EVENTS.NEW_MESSAGE, {
    ...data,
    sessionId
  });
}

// Server-side: Notify admin of new conversation
export async function notifyNewConversation(conversation) {
  await triggerAdminEvent(CHAT_EVENTS.NEW_CONVERSATION, {
    id: conversation.id,
    sessionId: conversation.session_id,
    status: conversation.status,
    createdAt: conversation.created_at,
    context: conversation.context
  });
}

// Server-side: Notify admin that conversation needs attention
export async function notifyNeedsAttention(sessionId, reason) {
  await triggerAdminEvent(CHAT_EVENTS.NEEDS_ATTENTION, {
    sessionId,
    reason,
    timestamp: new Date().toISOString()
  });
}

// Server-side: Broadcast typing indicator
export async function broadcastTyping(sessionId, sender, isTyping) {
  const event = isTyping ? CHAT_EVENTS.TYPING_START : CHAT_EVENTS.TYPING_STOP;
  await triggerChatEvent(sessionId, event, { sender });
}

// Server-side: Broadcast that AI is processing
export async function broadcastAIResponding(sessionId, isResponding) {
  const event = isResponding ? CHAT_EVENTS.AI_RESPONDING : CHAT_EVENTS.AI_DONE;
  await triggerChatEvent(sessionId, event, {});
}

// Server-side: Broadcast that Ty joined/left the conversation
export async function broadcastTyStatus(sessionId, joined) {
  const event = joined ? CHAT_EVENTS.TY_JOINED : CHAT_EVENTS.TY_LEFT;
  await triggerChatEvent(sessionId, event, {
    timestamp: new Date().toISOString()
  });
}

// Server-side: Broadcast conversation resolved
export async function broadcastConversationResolved(sessionId) {
  await triggerChatEvent(sessionId, CHAT_EVENTS.CONVERSATION_RESOLVED, {
    timestamp: new Date().toISOString()
  });
}
