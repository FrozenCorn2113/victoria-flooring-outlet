// components/chat/ChatHeader.js
// Chat window header component

import Image from 'next/image';
import { XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';

export function ChatHeader({
  onClose,
  onMinimize,
  status = 'ai', // 'ai', 'ty', 'connecting', 'offline'
  tyOnline = false
}) {
  const getStatusText = () => {
    switch (status) {
      case 'ty':
        return 'Ty is here to help';
      case 'connecting':
        return 'Connecting...';
      case 'offline':
        return 'Offline - Leave a message';
      case 'ai':
      default:
        return tyOnline ? 'Ty is online' : 'AI Assistant';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ty':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      case 'ai':
      default:
        return tyOnline ? 'bg-green-500' : 'bg-blue-500';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#1E1A15] text-white rounded-t-xl">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
          <Image
            src="/images/ty-avatar-280.png"
            alt="Ty"
            fill
            className="object-cover"
            onError={(e) => {
              e.target.src = 'https://ui-avatars.com/api/?name=Ty&background=1E1A15&color=ffffff&size=80&bold=true';
            }}
          />
          {/* Status indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-[#1E1A15]`}
          />
        </div>

        {/* Name and status */}
        <div>
          <h3 className="text-sm font-semibold">Talk to Ty</h3>
          <p className="text-xs text-gray-300">{getStatusText()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Minimize chat"
          >
            <MinusIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close chat"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
