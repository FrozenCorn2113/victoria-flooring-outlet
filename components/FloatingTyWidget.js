// components/FloatingTyWidget.js

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatInterface } from './chat/ChatInterface';

export function FloatingTyWidget() {
  const [mounted, setMounted] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrollTriggered, setHasScrollTriggered] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatEnabled] = useState(process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true');

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initial delay - show bubble after 2.5 seconds
    const delayTimer = setTimeout(() => {
      setShowBubble(true);
    }, 2500);

    // Scroll listener - reshow bubble if user scrolls 20% down
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercent > 20 && bubbleDismissed && !hasScrollTriggered) {
        setShowBubble(true);
        setHasScrollTriggered(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(delayTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [bubbleDismissed, hasScrollTriggered]);

  const handleDismissBubble = (e) => {
    e.stopPropagation();
    setShowBubble(false);
    setBubbleDismissed(true);
  };

  const handleAvatarClick = () => {
    if (showChat) {
      // If chat is open, just toggle it
      setShowChat(false);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleOpenChat = () => {
    setIsExpanded(false);
    setShowBubble(false);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showChat) {
        setShowChat(false);
      } else if (isExpanded) {
        setIsExpanded(false);
      }
    }
  };

  useEffect(() => {
    if (isExpanded || showChat) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, showChat]);

  const handleClickOutside = (e) => {
    if (isExpanded && e.target.closest('.floating-ty-widget') === null) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="floating-ty-widget fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Interface */}
      {showChat && (
        <div className="animate-fade-in-up w-[350px] sm:w-[380px] h-[500px] sm:h-[550px] mb-2">
          <ChatInterface
            onClose={handleCloseChat}
            onMinimize={handleCloseChat}
          />
        </div>
      )}

      {/* Speech Bubble */}
      {showBubble && !isExpanded && !showChat && (
        <div className="animate-fade-in-up bg-white rounded-xl shadow-lg border border-[#D6D1C8] p-4 max-w-[280px] relative">
          {/* Close button */}
          <button
            onClick={handleDismissBubble}
            className="absolute top-2 right-2 text-[#8A7F71] hover:text-[#1E1A15] transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          {/* Bubble content */}
          <p className="text-sm text-[#4A4237] leading-relaxed pr-4">
            <span className="font-medium text-[#1E1A15]">
              Not sure if this floor is right for your home?
            </span>{" "}
            {chatEnabled ? 'Chat with us or text Ty — we\'re here to help!' : 'Text Ty — he\'s flooring-obsessed and happy to help.'}
          </p>

          {/* Tail */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-[#D6D1C8] transform rotate-45"></div>
        </div>
      )}

      {/* Expanded Contact Options */}
      {isExpanded && !showChat && (
        <div
          className="animate-fade-in-up bg-white rounded-xl shadow-lg border border-[#D6D1C8] p-4 w-[280px]"
          role="dialog"
          aria-labelledby="ty-widget-title"
        >
          <p className="text-sm text-[#4A4237] leading-relaxed mb-4">
            <span id="ty-widget-title" className="font-medium text-[#1E1A15]">Talk to Ty</span>
            <br />
            <span className="text-xs text-[#8A7F71]">Local Victoria flooring expert</span>
          </p>

          <div className="flex flex-col gap-2">
            {/* Live Chat Button - only show if enabled */}
            {chatEnabled && (
              <button
                onClick={handleOpenChat}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E1A15] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Live Chat
              </button>
            )}
            <a
              href="sms:7788717681"
              aria-label="Send text message to Ty at 778-871-7681"
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                chatEnabled
                  ? 'border border-[#D6D1C8] bg-white text-[#1E1A15] hover:bg-[#F7F5F1]'
                  : 'bg-[#1E1A15] text-white hover:bg-black'
              }`}
            >
              📱 Text Ty
            </a>
            <a
              href="tel:7788717681"
              aria-label="Call Ty at 778-871-7681"
              className="inline-flex items-center justify-center rounded-full border border-[#D6D1C8] bg-white px-5 py-2.5 text-sm font-semibold text-[#1E1A15] hover:bg-[#F7F5F1] transition-colors"
            >
              📞 Call (778) 871-7681
            </a>
          </div>

          <p className="mt-3 text-[11px] text-[#8A7F71] text-center">
            Monday to Friday, 9-5
          </p>

          {/* Tail */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-[#D6D1C8] transform rotate-45"></div>
        </div>
      )}

      {/* Avatar Circle */}
      <button
        onClick={handleAvatarClick}
        className="relative w-16 h-16 md:w-[70px] md:h-[70px] rounded-full overflow-hidden border-4 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
        aria-label="Open contact options to talk to Ty, Victoria flooring expert"
        aria-expanded={isExpanded}
      >
        {!imageError ? (
          <Image
            src="/images/ty-avatar-280.png"
            alt="Ty - Flooring Expert"
            fill
            sizes="140px"
            className="object-cover"
            style={{ 
              objectPosition: 'center center',
            }}
            onError={() => {
              console.error('Image failed to load');
              setImageError(true);
            }}
            quality={100}
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-[#1E1A15] flex items-center justify-center">
            <Image
              src={`https://ui-avatars.com/api/?name=Ty&background=1E1A15&color=ffffff&size=128&bold=true&font-size=0.5`}
              alt="Ty - Flooring Expert"
              fill
              className="object-cover"
            />
          </div>
        )}
      </button>
    </div>
  );
}
