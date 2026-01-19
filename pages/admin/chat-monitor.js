// pages/admin/chat-monitor.js
// Admin dashboard for Ty to monitor and intervene in chat conversations

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { usePusher } from '../../hooks/use-pusher';
import { CHAT_EVENTS, getAdminChannelName } from '../../lib/chat/pusher';
import { formatMessageTime, getStatusColor, getStatusText, truncateMessage } from '../../lib/chat/chat-utils';

// Simple password protection
function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password, setError);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-xl font-bold text-[#1E1A15] mb-2">Chat Monitor</h1>
        <p className="text-sm text-[#8A7F71] mb-6">Enter admin password to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-2 border border-[#D6D1C8] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#1E1A15]"
          />
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#1E1A15] text-white py-2 rounded-lg font-semibold hover:bg-black transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// Conversation list item
function ConversationItem({ conversation, isSelected, onClick }) {
  const statusColor = getStatusColor(conversation.status, conversation.requiresHuman);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-[#E8E4DD] hover:bg-[#F7F5F1] transition-colors ${
        isSelected ? 'bg-[#F7F5F1]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                statusColor === 'red' ? 'bg-red-500' :
                statusColor === 'yellow' ? 'bg-yellow-500' :
                statusColor === 'green' ? 'bg-green-500' :
                statusColor === 'blue' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}
            />
            <span className="text-xs font-medium text-[#8A7F71]">
              {getStatusText(conversation.status, conversation.assignedTo)}
            </span>
          </div>
          <p className="text-sm text-[#1E1A15] truncate">
            {conversation.lastMessage ? truncateMessage(conversation.lastMessage, 40) : 'No messages yet'}
          </p>
          <p className="text-xs text-[#8A7F71] mt-1">
            {conversation.messageCount} messages • {formatMessageTime(conversation.updatedAt)}
          </p>
        </div>
        {conversation.requiresHuman && (
          <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Needs attention
          </span>
        )}
      </div>
    </button>
  );
}

// Conversation detail view
function ConversationDetail({ conversation, adminSecret, onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/get-conversation?sessionId=${conversation.sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversation.sessionId]);

  // Subscribe to real-time updates
  const { channel } = usePusher(`private-chat-${conversation.sessionId}`);

  useEffect(() => {
    if (!channel) return;

    channel.bind(CHAT_EVENTS.NEW_MESSAGE, (data) => {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, {
          id: data.id,
          sender: data.sender,
          message: data.message,
          createdAt: data.createdAt
        }];
      });
    });

    return () => {
      channel.unbind(CHAT_EVENTS.NEW_MESSAGE);
    };
  }, [channel]);

  // Handle actions
  const handleAction = async (action, message = null) => {
    setSending(true);
    try {
      const res = await fetch('/api/chat/ty-intervene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({
          sessionId: conversation.sessionId,
          action,
          message
        })
      });

      if (res.ok) {
        if (action === 'send_message' || action === 'take_over') {
          setReplyText('');
        }
        onUpdate();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      handleAction('send_message', replyText.trim());
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E4DD] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1E1A15]">
              Conversation #{conversation.id}
            </h2>
            <p className="text-xs text-[#8A7F71]">
              Started {formatMessageTime(conversation.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {conversation.assignedTo !== 'ty' && (
              <button
                onClick={() => handleAction('take_over')}
                disabled={sending}
                className="px-3 py-1.5 bg-[#1E1A15] text-white text-sm font-medium rounded-lg hover:bg-black disabled:opacity-50"
              >
                Take Over
              </button>
            )}
            {conversation.assignedTo === 'ty' && (
              <button
                onClick={() => handleAction('hand_back_to_ai')}
                disabled={sending}
                className="px-3 py-1.5 border border-[#D6D1C8] text-[#1E1A15] text-sm font-medium rounded-lg hover:bg-[#F7F5F1] disabled:opacity-50"
              >
                Hand to AI
              </button>
            )}
            <button
              onClick={() => handleAction('resolve', 'Thanks for chatting! Feel free to reach out anytime.')}
              disabled={sending}
              className="px-3 py-1.5 border border-[#D6D1C8] text-[#1E1A15] text-sm font-medium rounded-lg hover:bg-[#F7F5F1] disabled:opacity-50"
            >
              Resolve
            </button>
          </div>
        </div>

        {/* Context info */}
        {conversation.context && (
          <div className="mt-2 p-2 bg-[#F7F5F1] rounded text-xs text-[#8A7F71]">
            {conversation.context.pageUrl && (
              <p>Page: {conversation.context.pageUrl}</p>
            )}
            {conversation.context.productViewed && (
              <p>Product: {conversation.context.productViewed}</p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#F7F5F1]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#1E1A15] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl ${
                    msg.sender === 'customer'
                      ? 'bg-white border border-[#E8E4DD]'
                      : msg.sender === 'ty'
                      ? 'bg-green-600 text-white'
                      : 'bg-[#1E1A15] text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      msg.sender === 'customer' ? 'text-[#8A7F71]' :
                      'text-white/80'
                    }`}>
                      {msg.sender === 'customer' ? 'Customer' :
                       msg.sender === 'ty' ? 'Ty' : 'AI'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.sender === 'customer' ? 'text-[#8A7F71]' : 'text-white/60'
                  }`}>
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <form onSubmit={handleSendReply} className="p-4 border-t border-[#E8E4DD] bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a message as Ty..."
            className="flex-1 px-4 py-2 border border-[#D6D1C8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E1A15]"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="px-4 py-2 bg-[#1E1A15] text-white font-medium rounded-lg hover:bg-black disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// Main dashboard component
export default function ChatMonitor() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for stored auth
  useEffect(() => {
    const stored = sessionStorage.getItem('chat_admin_secret');
    if (stored) {
      setAdminSecret(stored);
      setAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = async (password, setError) => {
    try {
      const res = await fetch('/api/admin/chat/list-conversations', {
        headers: { 'x-admin-secret': password }
      });

      if (res.ok) {
        setAdminSecret(password);
        sessionStorage.setItem('chat_admin_secret', password);
        setAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection error');
    }
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!adminSecret) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/chat/list-conversations', {
        headers: { 'x-admin-secret': adminSecret }
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    if (authenticated) {
      loadConversations();
      // Refresh every 30 seconds
      const interval = setInterval(loadConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, loadConversations]);

  // Subscribe to admin channel for real-time updates
  const { channel } = usePusher(authenticated ? getAdminChannelName() : null);

  useEffect(() => {
    if (!channel) return;

    channel.bind(CHAT_EVENTS.NEW_CONVERSATION, () => {
      loadConversations();
    });

    channel.bind(CHAT_EVENTS.NEEDS_ATTENTION, () => {
      loadConversations();
    });

    channel.bind(CHAT_EVENTS.NEW_MESSAGE, () => {
      loadConversations();
    });

    return () => {
      channel.unbind_all();
    };
  }, [channel, loadConversations]);

  if (!authenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <>
      <Head>
        <title>Chat Monitor | Victoria Flooring Outlet</title>
      </Head>

      <div className="min-h-screen bg-[#F7F5F1]">
        {/* Header */}
        <header className="bg-white border-b border-[#E8E4DD] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1E1A15]">Chat Monitor</h1>
              <p className="text-sm text-[#8A7F71]">Monitor and respond to customer conversations</p>
            </div>
            <div className="flex items-center gap-4">
              {stats && (
                <div className="flex gap-4 text-sm">
                  <span className="text-[#8A7F71]">
                    Active: <strong className="text-[#1E1A15]">{stats.activeCount}</strong>
                  </span>
                  <span className="text-[#8A7F71]">
                    Needs attention: <strong className="text-red-600">{stats.needsAttentionCount}</strong>
                  </span>
                  <span className="text-[#8A7F71]">
                    Today: <strong className="text-[#1E1A15]">{stats.newToday}</strong>
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  sessionStorage.removeItem('chat_admin_secret');
                  setAuthenticated(false);
                  setAdminSecret('');
                }}
                className="text-sm text-[#8A7F71] hover:text-[#1E1A15]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex h-[calc(100vh-73px)]">
          {/* Conversation list */}
          <div className="w-80 border-r border-[#E8E4DD] bg-white overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#1E1A15] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-[#8A7F71]">
                <p>No active conversations</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation?.id === conv.id}
                  onClick={() => setSelectedConversation(conv)}
                />
              ))
            )}
          </div>

          {/* Conversation detail */}
          <div className="flex-1 bg-white">
            {selectedConversation ? (
              <ConversationDetail
                conversation={selectedConversation}
                adminSecret={adminSecret}
                onUpdate={loadConversations}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#8A7F71]">
                <div className="text-center">
                  <p className="text-lg mb-2">Select a conversation</p>
                  <p className="text-sm">Click on a conversation from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
