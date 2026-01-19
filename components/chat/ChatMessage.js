// components/chat/ChatMessage.js
// Individual message bubble component

import { formatMessageTime } from '../../lib/chat/chat-utils';

export function ChatMessage({ message, isLastMessage }) {
  const isCustomer = message.sender === 'customer';
  const isTy = message.sender === 'ty';
  const isAI = message.sender === 'ai';

  // Determine sender label
  const senderLabel = isCustomer
    ? 'You'
    : isTy
    ? 'Ty'
    : "Ty's Assistant";

  return (
    <div
      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[85%] ${
          isCustomer
            ? 'bg-[#1E1A15] text-white rounded-2xl rounded-br-md'
            : 'bg-[#F7F5F1] text-[#1E1A15] rounded-2xl rounded-bl-md border border-[#E8E4DD]'
        } px-4 py-2.5`}
      >
        {/* Sender label for non-customer messages */}
        {!isCustomer && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-[#8A7F71]">
              {senderLabel}
            </span>
            {isTy && (
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Ty is helping" />
            )}
          </div>
        )}

        {/* Message content */}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
          isCustomer ? 'text-white' : 'text-[#4A4237]'
        }`}>
          {message.message}
        </p>

        {/* Timestamp */}
        <div className={`mt-1 text-[10px] ${
          isCustomer ? 'text-gray-300' : 'text-[#8A7F71]'
        }`}>
          {formatMessageTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ sender = 'ai' }) {
  const label = sender === 'ty' ? 'Ty is typing' : "Ty's assistant is thinking";

  return (
    <div className="flex justify-start mb-3">
      <div className="bg-[#F7F5F1] rounded-2xl rounded-bl-md border border-[#E8E4DD] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A7F71]">{label}</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[#8A7F71] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-[#8A7F71] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-[#8A7F71] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WelcomeMessage({ message, suggestedQuestions, onQuestionClick }) {
  return (
    <div className="mb-4">
      {/* Welcome message */}
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] bg-[#F7F5F1] text-[#1E1A15] rounded-2xl rounded-bl-md border border-[#E8E4DD] px-4 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-[#8A7F71]">Ty&apos;s Assistant</span>
          </div>
          <p className="text-sm leading-relaxed text-[#4A4237]">
            {message}
          </p>
        </div>
      </div>

      {/* Suggested questions */}
      {suggestedQuestions && suggestedQuestions.length > 0 && (
        <div className="pl-2">
          <p className="text-xs text-[#8A7F71] mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#D6D1C8] text-[#4A4237] hover:bg-[#F7F5F1] hover:border-[#1E1A15] transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
