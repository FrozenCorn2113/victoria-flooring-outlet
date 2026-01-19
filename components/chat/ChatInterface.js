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
    initialized
  } = useChat(context);

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

        {/* Welcome message (only if no messages yet) */}
        {initialized && messages.length === 0 && welcomeMessage && (
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
        disabled={isLoading || !initialized}
        placeholder={
          !initialized
            ? 'Connecting...'
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
