import { getSupabaseService } from './supabase-service';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface PlatformMessage {
  id?: string;
  userId: string;
  conversationId: string;
  contactId?: string | null;
  platform: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'twilio-sms' | 'website-chat';
  content: string;
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction';
  mediaUrl?: string;
  platformMessageId?: string;
  replyToMessageId?: string;
  isFromBot?: boolean;
  botName?: string;
  agentId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface MessageQueryOptions {
  limit?: number;
  offset?: number;
  platform?: string;
  direction?: 'inbound' | 'outbound';
  messageType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * MessageService - Clean abstraction over the message storage system
 * Hides the confusing "whatsapp_messages" table name behind a clean interface
 */
export class MessageService {
  private static instance: MessageService;

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Store a message from any platform
   * @param message - The message data to store
   * @returns Promise<{ success: boolean; messageId?: string; error?: string }>
   */
  async store(message: PlatformMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📝 MessageService.store called for platform: ${message.platform}`, {
        userId: message.userId,
        conversationId: message.conversationId,
        contactId: message.contactId,
        content: message.content?.substring(0, 50),
        direction: message.direction
      });
      
      // Get contact_id from conversation if not provided
      let contactId = message.contactId;
      if (!contactId && message.conversationId) {
        console.log('🔍 Getting contact_id from conversation...');
        const { data: conversation, error: convError } = await supabaseService
          .from('crm_conversations')
          .select('contact_id')
          .eq('id', message.conversationId)
          .single();
        
        if (convError) {
          console.error('❌ Failed to get conversation:', convError);
          return { success: false, error: `Failed to get conversation: ${convError.message}` };
        }
        
        contactId = conversation?.contact_id;
        console.log('📍 Found contact_id from conversation:', contactId);
      }

      if (!contactId) {
        console.error('❌ No contact_id available');
        return { success: false, error: 'No contact_id available for message storage' };
      }
      
      const insertData = {
        user_id: message.userId,
        conversation_id: message.conversationId,
        contact_id: contactId,
        message_text: message.content,
        direction: message.direction,
        message_type: message.messageType || 'text',
        media_url: message.mediaUrl,
        agent_id: message.agentId,
        is_from_bot: message.isFromBot || false,
        bot_name: message.botName,
        platform: message.platform, // This is what makes it multi-platform
        platform_message_id: message.platformMessageId,
        reply_to_message_id: message.replyToMessageId,
        status: message.status || 'sent',
        timestamp: message.timestamp || new Date().toISOString(),
        metadata: message.metadata || {},
      };

      console.log('📝 Inserting message:', insertData);

      const { data, error } = await supabaseService
        .from('whatsapp_messages') // NOTE: Using unified messages table despite confusing name
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ MessageService.store failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MessageService.store successful for platform: ${message.platform}, messageId: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error: any) {
      console.error('❌ MessageService.store exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for a conversation
   * @param conversationId - The conversation ID
   * @param options - Query options
   * @returns Promise<PlatformMessage[]>
   */
  async getByConversation(conversationId: string, options: MessageQueryOptions = {}): Promise<PlatformMessage[]> {
    try {
      console.log(`📖 MessageService.getByConversation called for conversation: ${conversationId}`);
      
      let query = supabaseService
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId);

      // Apply filters
      if (options.platform) {
        query = query.eq('platform', options.platform);
      }
      if (options.direction) {
        query = query.eq('direction', options.direction);
      }
      if (options.messageType) {
        query = query.eq('message_type', options.messageType);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: true })
        .limit(options.limit || 1000);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ MessageService.getByConversation failed:', error);
        return [];
      }

      const messages = (data || []).map(this.transformFromDb);
      console.log(`✅ MessageService.getByConversation returned ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ MessageService.getByConversation exception:', error);
      return [];
    }
  }

  /**
   * Get messages by platform
   * @param userId - The user ID
   * @param platform - The platform to filter by
   * @param options - Query options
   * @returns Promise<PlatformMessage[]>
   */
  async getByPlatform(userId: string, platform: string, options: MessageQueryOptions = {}): Promise<PlatformMessage[]> {
    try {
      console.log(`📖 MessageService.getByPlatform called for user: ${userId}, platform: ${platform}`);
      
      let query = supabaseService
        .from('whatsapp_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform);

      // Apply filters
      if (options.direction) {
        query = query.eq('direction', options.direction);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 100);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ MessageService.getByPlatform failed:', error);
        return [];
      }

      const messages = (data || []).map(this.transformFromDb);
      console.log(`✅ MessageService.getByPlatform returned ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ MessageService.getByPlatform exception:', error);
      return [];
    }
  }

  /**
   * Mark message as read
   * @param messageId - The message ID
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async markAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📖 MessageService.markAsRead called for message: ${messageId}`);
      
      const { error } = await supabaseService
        .from('whatsapp_messages')
        .update({ 
          status: 'read',
          metadata: { read_at: new Date().toISOString() }
        })
        .eq('id', messageId);

      if (error) {
        console.error('❌ MessageService.markAsRead failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ MessageService.markAsRead successful for message: ${messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ MessageService.markAsRead exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get message statistics for a user
   * @param userId - The user ID
   * @param platform - Optional platform filter
   * @returns Promise<MessageStats>
   */
  async getStats(userId: string, platform?: string): Promise<{
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    unreadMessages: number;
    platformBreakdown: Record<string, number>;
  }> {
    try {
      console.log(`📊 MessageService.getStats called for user: ${userId}, platform: ${platform}`);
      
      let query = supabaseService
        .from('whatsapp_messages')
        .select('direction, platform, status')
        .eq('user_id', userId);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ MessageService.getStats failed:', error);
        return {
          totalMessages: 0,
          inboundMessages: 0,
          outboundMessages: 0,
          unreadMessages: 0,
          platformBreakdown: {},
        };
      }

      const messages = data || [];
      const stats = {
        totalMessages: messages.length,
        inboundMessages: messages.filter(m => m.direction === 'inbound').length,
        outboundMessages: messages.filter(m => m.direction === 'outbound').length,
        unreadMessages: messages.filter(m => m.direction === 'inbound' && m.status !== 'read').length,
        platformBreakdown: messages.reduce((acc, m) => {
          acc[m.platform] = (acc[m.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      console.log(`✅ MessageService.getStats returned:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ MessageService.getStats exception:', error);
      return {
        totalMessages: 0,
        inboundMessages: 0,
        outboundMessages: 0,
        unreadMessages: 0,
        platformBreakdown: {},
      };
    }
  }

  /**
   * Transform database row to PlatformMessage interface
   * @private
   */
  private transformFromDb(dbRow: any): PlatformMessage {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      conversationId: dbRow.conversation_id,
      contactId: dbRow.contact_id,
      platform: dbRow.platform,
      content: dbRow.message_text,
      direction: dbRow.direction,
      messageType: dbRow.message_type,
      mediaUrl: dbRow.media_url,
      platformMessageId: dbRow.platform_message_id,
      replyToMessageId: dbRow.reply_to_message_id,
      isFromBot: dbRow.is_from_bot,
      botName: dbRow.bot_name,
      agentId: dbRow.agent_id,
      status: dbRow.status,
      metadata: dbRow.metadata,
      timestamp: dbRow.timestamp,
    };
  }
}

// Export singleton instance
export const messageService = MessageService.getInstance();
export default messageService;