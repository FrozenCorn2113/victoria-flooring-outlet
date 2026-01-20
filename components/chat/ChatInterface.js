// components/chat/ChatInterface.js
// Main chat interface component

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage, TypingIndicator, WelcomeMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/use-chat';

export function ChatInterface({ onClose, onMinimize, context = {} }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const {
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
    leadInfo,
    leadCaptured,
    setLeadInfo,
    setLeadCaptured,
    initialized,
    sessionId
  } = useChat(context);

  const [leadError, setLeadError] = useState(null);
  const [leadSaving, setLeadSaving] = useState(false);

  const handleLeadChange = (field, value) => {
    setLeadInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      setLeadError('Chat is still connecting. Please wait a moment and try again.');
      return;
    }

    setLeadError(null);
    setLeadSaving(true);

    try {
      const response = await fetch('/api/chat/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: leadInfo.name,
          email: leadInfo.email,
          phone: leadInfo.phone
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to save contact info');
      }

      setLeadCaptured(true);
    } catch (err) {
      setLeadError(err.message || 'Unable to save contact info');
    } finally {
      setLeadSaving(false);
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Handle suggested question click
  const handleQuestionClick = (question) => {
    sendMessage(question);
  };

  // Get chat status for header
  const getChatStatus = () => {
    if (!initialized) return 'connecting';
    if (sessionStatus === 'human_handling') return 'ty';
    return 'ai';
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-xl shadow-2xl border border-[#D6D1C8] overflow-hidden">
      {/* Header */}
      <ChatHeader
        onClose={onClose}
        onMinimize={onMinimize}
        status={getChatStatus()}
        tyOnline={tyOnline}
      />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-white"
        style={{ minHeight: '300px', maxHeight: '400px' }}
      >
        {/* Loading state */}
        {!initialized && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-[#1E1A15] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-[#8A7F71]">Starting chat...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Please text Ty at (778) 871-7681 for assistance.
            </p>
          </div>
        )}

        {/* Required lead capture */}
        {initialized && !leadCaptured && (
          <div className="bg-[#F7F5F1] border border-[#E8E4DD] rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-[#1E1A15] mb-2">
              Before we chat, please share your details
            </p>
            <p className="text-xs text-[#8A7F71] mb-3">
              This lets Ty follow up with you directly.
            </p>
            <form onSubmit={handleLeadSubmit} className="space-y-2">
              <input
                type="text"
                value={leadInfo.name}
                onChange={(e) => handleLeadChange('name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-[#D6D1C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E1A15]"
                required
              />
              <input
                type="email"
                value={leadInfo.email}
                onChange={(e) => handleLeadChange('email', e.target.value)}
                placeholder="Email address"
                className="w-full px-3 py-2 border border-[#D6D1C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E1A15]"
                required
              />
              <input
                type="tel"
                value={leadInfo.phone}
                onChange={(e) => handleLeadChange('phone', e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-[#D6D1C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E1A15]"
                required
              />
              {leadError && (
                <p className="text-xs text-red-600">{leadError}</p>
              )}
              <button
                type="submit"
                disabled={leadSaving}
                className="w-full bg-[#1E1A15] text-white py-2 rounded-lg text-sm font-semibold hover:bg-black disabled:opacity-50"
              >
                {leadSaving ? 'Saving...' : 'Continue to chat'}
              </button>
            </form>
          </div>
        )}

        {/* Welcome message (only if no messages yet) */}
        {initialized && leadCaptured && messages.length === 0 && welcomeMessage && (
          <WelcomeMessage
            message={welcomeMessage}
            suggestedQuestions={suggestedQuestions}
            onQuestionClick={handleQuestionClick}
          />
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLastMessage={index === messages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <TypingIndicator sender={typingSender} />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Ty is handling notice */}
      {sessionStatus === 'human_handling' && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700 text-center">
            Ty has joined the conversation
          </p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading || !initialized || !leadCaptured}
        placeholder={
          !initialized
            ? 'Connecting...'
            : !leadCaptured
            ? 'Please enter your details above to start...'
            : sessionStatus === 'human_handling'
            ? 'Message Ty...'
            : 'Ask about flooring, products, or services...'
        }
      />

      {/* Fallback contact options */}
      <div className="px-4 py-2 bg-[#F7F5F1] border-t border-[#E8E4DD]">
        <p className="text-[10px] text-[#8A7F71] text-center">
          Prefer to talk directly?{' '}
          <a href="sms:7788717681" className="underline hover:text-[#1E1A15]">
            Text Ty
          </a>
          {' '}or{' '}
          <a href="tel:7788717681" className="underline hover:text-[#1E1A15]">
            call (778) 871-7681
          </a>
        </p>
      </div>
    </div>
  );
}
