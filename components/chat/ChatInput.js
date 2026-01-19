// components/chat/ChatInput.js
// Message input component

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export function ChatInput({ onSend, disabled, placeholder = "Type a message..." }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const charCount = message.length;
  const maxChars = 2000;
  const isOverLimit = charCount > maxChars;

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#E8E4DD] bg-white p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full resize-none rounded-2xl border ${
              isOverLimit ? 'border-red-400' : 'border-[#D6D1C8]'
            } bg-[#F7F5F1] px-4 py-2.5 text-sm text-[#1E1A15] placeholder-[#8A7F71] focus:outline-none focus:ring-2 focus:ring-[#1E1A15] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Character count (only show when near limit) */}
          {charCount > 1800 && (
            <span className={`absolute bottom-1 right-3 text-[10px] ${
              isOverLimit ? 'text-red-500' : 'text-[#8A7F71]'
            }`}>
              {charCount}/{maxChars}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !message.trim() || isOverLimit}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#1E1A15] text-white hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Hint text */}
      <p className="mt-1.5 text-[10px] text-[#8A7F71] text-center">
        Press Enter to send • Shift+Enter for new line
      </p>
    </form>
  );
}
