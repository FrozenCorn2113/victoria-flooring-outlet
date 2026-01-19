// pages/api/chat/pusher-auth.js
// Authenticate Pusher private channels

import { getPusherServer } from '../../../lib/chat/pusher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { socket_id, channel_name } = req.body;

  if (!socket_id || !channel_name) {
    return res.status(400).json({ error: 'Missing socket_id or channel_name' });
  }

  try {
    const pusher = getPusherServer();

    // For private channels, just authenticate
    if (channel_name.startsWith('private-')) {
      const auth = pusher.authorizeChannel(socket_id, channel_name);
      return res.status(200).json(auth);
    }

    // For presence channels, include user data
    if (channel_name.startsWith('presence-')) {
      // Check if this is an admin user (you could add more sophisticated auth here)
      const isAdmin = req.headers['x-admin-secret'] === process.env.ADMIN_SECRET_KEY;

      const presenceData = {
        user_id: isAdmin ? 'ty' : `customer_${socket_id}`,
        user_info: {
          name: isAdmin ? 'Ty' : 'Customer',
          isAdmin
        }
      };

      const auth = pusher.authorizeChannel(socket_id, channel_name, presenceData);
      return res.status(200).json(auth);
    }

    return res.status(403).json({ error: 'Unauthorized channel' });

  } catch (error) {
    console.error('Pusher auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
