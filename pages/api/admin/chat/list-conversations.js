// pages/api/admin/chat/list-conversations.js
// Get all conversations for admin dashboard

import {
  getActiveConversations,
  getConversationsNeedingAttention,
  getChatStats
} from '../../../../lib/chat/db-chat';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { filter } = req.query;

    let conversations;

    if (filter === 'needs_attention') {
      conversations = await getConversationsNeedingAttention();
    } else {
      conversations = await getActiveConversations(50);
    }

    // Get stats
    const stats = await getChatStats();

    return res.status(200).json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        sessionId: conv.session_id,
        status: conv.status,
        assignedTo: conv.assigned_to,
        requiresHuman: conv.requires_human,
        sentiment: conv.sentiment,
        messageCount: parseInt(conv.message_count || 0, 10),
        lastMessage: conv.last_message,
        lastSender: conv.last_sender,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        context: conv.context
      })),
      stats: {
        activeCount: parseInt(stats.active_count || 0, 10),
        needsAttentionCount: parseInt(stats.needs_attention_count || 0, 10),
        resolvedToday: parseInt(stats.resolved_today || 0, 10),
        newToday: parseInt(stats.new_today || 0, 10),
        aiHandlingCount: parseInt(stats.ai_handling_count || 0, 10),
        tyHandlingCount: parseInt(stats.ty_handling_count || 0, 10)
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}
