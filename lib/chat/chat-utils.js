// lib/chat/chat-utils.js
// Utility functions for chat functionality

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique session ID for a chat conversation
 */
export function generateSessionId() {
  return `chat_${uuidv4()}`;
}

/**
 * Get or create session ID from cookies/localStorage
 */
export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null;

  const STORAGE_KEY = 'vfo_chat_session';

  // Try to get existing session
  let sessionId = localStorage.getItem(STORAGE_KEY);

  // Check if session is still valid (less than 2 hours old)
  const sessionTimestamp = localStorage.getItem(`${STORAGE_KEY}_timestamp`);
  if (sessionTimestamp) {
    const age = Date.now() - parseInt(sessionTimestamp, 10);
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (age > TWO_HOURS) {
      sessionId = null; // Session expired
    }
  }

  // Create new session if needed
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(STORAGE_KEY, sessionId);
    localStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString());
  }

  return sessionId;
}

/**
 * Clear the current chat session
 */
export function clearChatSession() {
  if (typeof window === 'undefined') return;

  const STORAGE_KEY = 'vfo_chat_session';
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}_timestamp`);
}

/**
 * Format timestamp for display
 */
function normalizeTimestamp(timestamp) {
  if (!timestamp) return timestamp;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') {
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(timestamp);
    return hasTimezone ? timestamp : `${timestamp}Z`;
  }
  return timestamp;
}

export function formatMessageTime(timestamp) {
  const date = new Date(normalizeTimestamp(timestamp));
  const now = new Date();

  // If today, show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // If this week, show day and time
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-CA', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Otherwise show full date
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Truncate message for preview
 */
export function truncateMessage(message, maxLength = 50) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength).trim() + '...';
}

/**
 * Get status color for admin dashboard
 */
export function getStatusColor(status, requiresHuman) {
  if (requiresHuman) return 'red';

  switch (status) {
    case 'active':
    case 'ai_handling':
      return 'green';
    case 'needs_attention':
      return 'yellow';
    case 'human_handling':
      return 'blue';
    case 'resolved':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get status display text
 */
export function getStatusText(status, assignedTo) {
  switch (status) {
    case 'active':
    case 'ai_handling':
      return 'AI Handling';
    case 'needs_attention':
      return 'Needs Attention';
    case 'human_handling':
      return assignedTo === 'ty' ? 'Ty Handling' : 'Human Handling';
    case 'resolved':
      return 'Resolved';
    default:
      return status;
  }
}

/**
 * Validate message before sending
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Message is too long (max 2000 characters)' };
  }

  return { valid: true, message: trimmed };
}

/**
 * Simple rate limiting check (client-side)
 */
const messageTimestamps = [];

export function checkRateLimit(maxMessages = 10, windowMs = 60000) {
  const now = Date.now();

  // Remove old timestamps
  while (messageTimestamps.length > 0 && messageTimestamps[0] < now - windowMs) {
    messageTimestamps.shift();
  }

  if (messageTimestamps.length >= maxMessages) {
    return {
      allowed: false,
      error: 'Please wait a moment before sending more messages'
    };
  }

  messageTimestamps.push(now);
  return { allowed: true };
}

/**
 * Build page context for AI
 */
export function buildPageContext() {
  if (typeof window === 'undefined') return {};

  const url = window.location.pathname;
  const context = { pageUrl: url };

  // Check if on a product page
  const productMatch = url.match(/\/products\/([^/]+)/);
  if (productMatch) {
    context.productViewed = productMatch[1];
  }

  return context;
}

/**
 * Extract contact info from a message (simple regex)
 */
export function extractContactInfo(message) {
  if (!message || typeof message !== 'string') return {};

  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = message.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);

  return {
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null
  };
}
