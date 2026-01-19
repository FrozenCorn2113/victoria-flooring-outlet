// hooks/use-pusher.js
// React hook for Pusher real-time connection

import { useState, useEffect, useRef } from 'react';
import PusherClient from 'pusher-js';

let pusherInstance = null;

function getPusherClient() {
  if (typeof window === 'undefined') return null;

  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn('Pusher credentials not configured');
      return null;
    }

    pusherInstance = new PusherClient(key, {
      cluster,
      authEndpoint: '/api/chat/pusher-auth',
    });

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      pusherInstance.connection.bind('connected', () => {
        console.log('Pusher connected');
      });
      pusherInstance.connection.bind('error', (err) => {
        console.error('Pusher connection error:', err);
      });
    }
  }

  return pusherInstance;
}

export function usePusher(channelName) {
  const [channel, setChannel] = useState(null);
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!channelName) return;

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn('Pusher client not available');
      return;
    }

    // Track connection state
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    pusher.connection.bind('connected', handleConnected);
    pusher.connection.bind('disconnected', handleDisconnected);

    // Set initial connection state
    setConnected(pusher.connection.state === 'connected');

    // Subscribe to channel
    const subscribedChannel = pusher.subscribe(channelName);
    subscriptionRef.current = subscribedChannel;
    setChannel(subscribedChannel);

    // Handle subscription success/error
    subscribedChannel.bind('pusher:subscription_succeeded', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Subscribed to ${channelName}`);
      }
    });

    subscribedChannel.bind('pusher:subscription_error', (status) => {
      console.error(`Subscription error for ${channelName}:`, status);
    });

    // Cleanup
    return () => {
      pusher.connection.unbind('connected', handleConnected);
      pusher.connection.unbind('disconnected', handleDisconnected);

      if (subscriptionRef.current) {
        pusher.unsubscribe(channelName);
        subscriptionRef.current = null;
      }
      setChannel(null);
    };
  }, [channelName]);

  return {
    channel,
    connected,
    pusher: getPusherClient()
  };
}

// Hook for presence channel (admin dashboard)
export function usePusherPresence(channelName) {
  const [members, setMembers] = useState([]);
  const [myId, setMyId] = useState(null);
  const { channel, connected, pusher } = usePusher(channelName);

  useEffect(() => {
    if (!channel || !channelName?.startsWith('presence-')) return;

    channel.bind('pusher:subscription_succeeded', (membersData) => {
      setMyId(membersData.myID);
      const membersList = [];
      membersData.each((member) => {
        membersList.push({ id: member.id, info: member.info });
      });
      setMembers(membersList);
    });

    channel.bind('pusher:member_added', (member) => {
      setMembers(prev => [...prev, { id: member.id, info: member.info }]);
    });

    channel.bind('pusher:member_removed', (member) => {
      setMembers(prev => prev.filter(m => m.id !== member.id));
    });

    return () => {
      channel.unbind('pusher:subscription_succeeded');
      channel.unbind('pusher:member_added');
      channel.unbind('pusher:member_removed');
    };
  }, [channel, channelName]);

  return {
    channel,
    connected,
    members,
    myId,
    pusher
  };
}
