// hooks/use-chat.js
// React hook for chat functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePusher } from './use-pusher';
import {
  getOrCreateSessionId,
  buildPageContext,
  checkRateLimit
} from '../lib/chat/chat-utils';
import { CHAT_EVENTS, getChatChannelName } from '../lib/chat/pusher';

export function useChat(initialContext = {}) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState('ai');
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [tyOnline, setTyOnline] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const contextRef = useRef(initialContext);

  // Get Pusher channel
  const channelName = sessionId ? getChatChannelName(sessionId) : null;
  const { channel, connected } = usePusher(channelName);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedSessionId = getOrCreateSessionId();
        const pageContext = buildPageContext();
        const context = { ...contextRef.current, ...pageContext };

        const response = await fetch('/api/chat/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: storedSessionId,
            context
          })
        });

        if (!response.ok) {
          throw new Error('Failed to start chat session');
        }

        const data = await response.json();

        setSessionId(data.sessionId);
        setSessionStatus(data.status);

        if (!data.isExisting) {
          setWelcomeMessage(data.welcomeMessage);
          setSuggestedQuestions(data.suggestedQuestions || []);
        } else {
          // Load existing messages
          await loadMessages(data.sessionId);
        }

        setInitialized(true);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to connect to chat. Please try again.');
        setInitialized(true);
      }
    };

    initSession();
  }, []);

  // Load existing messages
  const loadMessages = async (sid) => {
    try {
      const response = await fetch(`/api/chat/get-conversation?sessionId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSessionStatus(data.status);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Subscribe to Pusher events
  useEffect(() => {
    if (!channel) return;

    // New message received
    channel.bind(CHAT_EVENTS.NEW_MESSAGE, (data) => {
      setMessages(prev => {
        // Avoid duplicates - check by ID or by matching temp messages from same sender
        if (prev.some(m => m.id === data.id)) {
          return prev;
        }

        // For customer messages, check if we already have an optimistic version
        // and replace it with the real one instead of adding a duplicate
        if (data.sender === 'customer') {
          const tempIndex = prev.findIndex(m =>
            m.id.toString().startsWith('temp_') &&
            m.sender === 'customer' &&
            m.message === data.message
          );
          if (tempIndex !== -1) {
            // Replace the temp message with the real one
            const newMessages = [...prev];
            newMessages[tempIndex] = {
              id: data.id,
              sender: data.sender,
              message: data.message,
              createdAt: data.createdAt,
              metadata: data.metadata
            };
            return newMessages;
          }
        }

        return [...prev, {
          id: data.id,
          sender: data.sender,
          message: data.message,
          createdAt: data.createdAt,
          metadata: data.metadata
        }];
      });
      setIsTyping(false);
    });

    // Typing indicators
    channel.bind(CHAT_EVENTS.TYPING_START, (data) => {
      setIsTyping(true);
      setTypingSender(data.sender || 'ai');
    });

    channel.bind(CHAT_EVENTS.TYPING_STOP, () => {
      setIsTyping(false);
    });

    // AI responding
    channel.bind(CHAT_EVENTS.AI_RESPONDING, () => {
      setIsTyping(true);
      setTypingSender('ai');
    });

    channel.bind(CHAT_EVENTS.AI_DONE, () => {
      setIsTyping(false);
    });

    // Ty status
    channel.bind(CHAT_EVENTS.TY_JOINED, () => {
      setSessionStatus('human_handling');
      setTyOnline(true);
    });

    channel.bind(CHAT_EVENTS.TY_LEFT, () => {
      setSessionStatus('ai_handling');
    });

    // Conversation resolved
    channel.bind(CHAT_EVENTS.CONVERSATION_RESOLVED, () => {
      setSessionStatus('resolved');
    });

    return () => {
      channel.unbind_all();
    };
  }, [channel]);

  // Send message
  const sendMessage = useCallback(async (text) => {
    if (!sessionId || !text.trim()) return;

    // Rate limiting
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setError(rateCheck.error);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Optimistically add message to UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender: 'customer',
      message: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Clear suggested questions after first message
    setSuggestedQuestions([]);
    setWelcomeMessage(null);

    try {
      const pageContext = buildPageContext();
      const context = { ...contextRef.current, ...pageContext };

      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text.trim(),
          context
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update the temp message with real ID
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, id: data.messageId } : m
        )
      );

      // If Pusher is unavailable, fall back to API response
      if (data.aiResponse && data.aiResponse.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.aiResponse.id)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: data.aiResponse.id,
              sender: 'ai',
              message: data.aiResponse.message,
              createdAt: new Date().toISOString(),
              metadata: { confidence: data.aiResponse.confidence }
            }
          ];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    messages,
    isLoading,
    isTyping,
    typingSender,
    error,
    sessionStatus,
    tyOnline,
    welcomeMessage,
    suggestedQuestions,
    sendMessage,
    initialized,
    connected,
    sessionId
  };
}
