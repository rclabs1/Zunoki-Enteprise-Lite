import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { MessagingPlatform, RealtimeMessage } from '@/lib/realtime-messaging';

export interface BroadcastMessageData {
  conversationId: string;
  platform: MessagingPlatform;
  content: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
  direction: 'inbound' | 'outbound';
  senderType: 'customer' | 'agent' | 'bot';
  contactId?: string;
  mediaUrl?: string;
  platformMessageId?: string;
  metadata?: Record<string, any>;
}

export interface BroadcastConversationData {
  conversationId: string;
  platform: MessagingPlatform;
  lastMessage?: string;
  lastMessageAt?: string;
  status?: 'active' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  unreadCount?: number;
}

class RealtimeBroadcastService {
  
  /**
   * Broadcast a new message to all connected clients
   * This triggers Supabase Realtime automatically when message is inserted into database
   */
  async broadcastNewMessage(userId: string, messageData: BroadcastMessageData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📡 Broadcasting new ${messageData.platform} message for user ${userId}`);
      
      // Insert message into database - this will trigger Supabase Realtime automatically
      const { data: message, error } = await supabase
        .from('whatsapp_messages') // Using whatsapp_messages table for all platforms
        .insert({
          user_id: userId,
          conversation_id: messageData.conversationId,
          platform: messageData.platform,
          message_text: messageData.content,
          message_type: messageData.messageType || 'text',
          direction: messageData.direction,
          is_from_bot: messageData.senderType === 'bot',
          bot_name: messageData.senderType === 'bot' ? `${messageData.platform} Bot` : null,
          contact_id: messageData.contactId,
          media_url: messageData.mediaUrl,
          platform_message_id: messageData.platformMessageId,
          metadata: messageData.metadata || {},
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error broadcasting message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Message broadcasted successfully:', message.id);
      
      // Also update the conversation's last message
      await this.updateConversationLastMessage(userId, messageData.conversationId, {
        lastMessage: messageData.content,
        lastMessageAt: new Date().toISOString(),
        platform: messageData.platform,
      });

      return { success: true, messageId: message.id };
      
    } catch (error) {
      console.error('❌ Error in broadcastNewMessage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Broadcast a message status update (read, delivered, failed, etc.)
   */
  async broadcastMessageUpdate(userId: string, messageId: string, updates: Partial<RealtimeMessage>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📡 Broadcasting message update for message ${messageId}`);
      
      // Update message in database - this will trigger Supabase Realtime automatically
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Message update broadcasted successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in broadcastMessageUpdate:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Broadcast conversation updates
   */
  async broadcastConversationUpdate(userId: string, conversationData: BroadcastConversationData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📡 Broadcasting conversation update for ${conversationData.conversationId}`);
      
      // Update conversation in database - this will trigger Supabase Realtime automatically
      const { error } = await supabase
        .from('crm_conversations')
        .update({
          last_message_text: conversationData.lastMessage?.substring(0, 100),
          last_message_at: conversationData.lastMessageAt || new Date().toISOString(),
          status: conversationData.status,
          priority: conversationData.priority,
          unread_count: conversationData.unreadCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationData.conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating conversation:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Conversation update broadcasted successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in broadcastConversationUpdate:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update conversation's last message details
   */
  private async updateConversationLastMessage(
    userId: string, 
    conversationId: string, 
    data: { lastMessage: string; lastMessageAt: string; platform: MessagingPlatform }
  ): Promise<void> {
    try {
      await supabase
        .from('crm_conversations')
        .update({
          last_message_text: data.lastMessage.substring(0, 100),
          last_message_at: data.lastMessageAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);
        
    } catch (error) {
      console.error('❌ Error updating conversation last message:', error);
    }
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTypingIndicator(
    userId: string, 
    conversationId: string, 
    platform: MessagingPlatform,
    isTyping: boolean,
    agentName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For typing indicators, we can use Supabase's presence feature
      // This would be implemented in the client-side hook
      console.log(`⌨️  Broadcasting typing indicator for conversation ${conversationId} on ${platform}: ${isTyping}`);
      
      // Return success since typing indicators are handled client-side via presence
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in broadcastTypingIndicator:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get platform-specific broadcast configuration
   */
  getPlatformConfig(platform: MessagingPlatform) {
    const configs = {
      whatsapp: {
        supportsReadReceipts: true,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 0, // Instant
      },
      telegram: {
        supportsReadReceipts: false,
        supportsTypingIndicators: true,
        supportsPresence: false,
        broadcastDelay: 0,
      },
      instagram: {
        supportsReadReceipts: true,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 100, // Slight delay for Instagram API
      },
      facebook: {
        supportsReadReceipts: true,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 100,
      },
      gmail: {
        supportsReadReceipts: true,
        supportsTypingIndicators: false,
        supportsPresence: false,
        broadcastDelay: 0,
      },
      slack: {
        supportsReadReceipts: false,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 0,
      },
      discord: {
        supportsReadReceipts: false,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 0,
      },
      youtube: {
        supportsReadReceipts: false,
        supportsTypingIndicators: false,
        supportsPresence: false,
        broadcastDelay: 200, // Higher delay for YouTube
      },
      tiktok: {
        supportsReadReceipts: false,
        supportsTypingIndicators: false,
        supportsPresence: false,
        broadcastDelay: 200,
      },
      'website-chat': {
        supportsReadReceipts: true,
        supportsTypingIndicators: true,
        supportsPresence: true,
        broadcastDelay: 0,
      },
    };

    return configs[platform] || configs['website-chat'];
  }

  /**
   * Broadcast bulk message updates (for batch operations)
   */
  async broadcastBulkMessageUpdates(
    userId: string, 
    updates: Array<{ messageId: string; updates: Partial<RealtimeMessage> }>
  ): Promise<{ success: boolean; results: Array<{ messageId: string; success: boolean; error?: string }> }> {
    const results = [];
    
    for (const update of updates) {
      const result = await this.broadcastMessageUpdate(userId, update.messageId, update.updates);
      results.push({
        messageId: update.messageId,
        success: result.success,
        error: result.error,
      });
    }

    const allSuccessful = results.every(r => r.success);
    
    return {
      success: allSuccessful,
      results,
    };
  }
}

// Export singleton instance
export const realtimeBroadcast = new RealtimeBroadcastService();

// Export helper functions for common operations
export const broadcastNewMessage = (userId: string, messageData: BroadcastMessageData) => 
  realtimeBroadcast.broadcastNewMessage(userId, messageData);

export const broadcastMessageUpdate = (userId: string, messageId: string, updates: Partial<RealtimeMessage>) =>
  realtimeBroadcast.broadcastMessageUpdate(userId, messageId, updates);

export const broadcastConversationUpdate = (userId: string, conversationData: BroadcastConversationData) =>
  realtimeBroadcast.broadcastConversationUpdate(userId, conversationData);

export const broadcastTypingIndicator = (
  userId: string, 
  conversationId: string, 
  platform: MessagingPlatform,
  isTyping: boolean,
  agentName?: string
) => realtimeBroadcast.broadcastTypingIndicator(userId, conversationId, platform, isTyping, agentName);

export default realtimeBroadcast;