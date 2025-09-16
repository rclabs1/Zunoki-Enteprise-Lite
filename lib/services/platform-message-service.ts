/**
 * Platform-specific message service for production-ready multi-platform CRM
 * Handles proper platform isolation and unified message queries
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export type Platform = 'telegram' | 'whatsapp' | 'instagram' | 'facebook' | 'gmail' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'sms' | 'website_chat';

export interface MessageQuery {
  userId: string;
  platform?: Platform;
  conversationId?: string;
  limit?: number;
  offset?: number;
  includePlatformSpecific?: boolean;
}

export interface ConversationQuery {
  userId: string;
  platform?: Platform;
  status?: string;
  limit?: number;
  offset?: number;
}

export class PlatformMessageService {
  
  /**
   * Get conversations with proper platform-specific message loading
   */
  static async getConversations(query: ConversationQuery) {
    try {
      const { userId, platform, status, limit = 50, offset = 0 } = query;

      // Build base conversation query
      let conversationQuery = supabase
        .from('crm_conversations')
        .select(`
          *,
          contact:crm_contacts(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by platform if specified
      if (platform) {
        conversationQuery = conversationQuery.eq('platform', platform);
      }

      // Filter by status if specified
      if (status) {
        conversationQuery = conversationQuery.eq('status', status);
      }

      const { data: conversations, error: convError } = await conversationQuery;

      if (convError) {
        throw convError;
      }

      if (!conversations || conversations.length === 0) {
        return { success: true, conversations: [] };
      }

      // Load messages for each conversation using the correct platform table
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          try {
            const messages = await this.getMessagesForConversation(
              conv.id,
              conv.platform as Platform,
              userId
            );

            return {
              ...conv,
              messages: messages || []
            };
          } catch (error) {
            console.error(`Error loading messages for conversation ${conv.id}:`, error);
            return {
              ...conv,
              messages: []
            };
          }
        })
      );

      return {
        success: true,
        conversations: conversationsWithMessages
      };

    } catch (error) {
      console.error('Error in getConversations:', error);
      return {
        success: false,
        error: 'Failed to fetch conversations',
        conversations: []
      };
    }
  }

  /**
   * Get messages for a specific conversation from the correct platform table
   */
  static async getMessagesForConversation(
    conversationId: string,
    platform: Platform,
    userId: string,
    limit: number = 100
  ) {
    try {
      const tableName = `${platform}_messages`;
      
      console.log(`🔍 Loading messages from ${tableName} for conversation ${conversationId}`);
      
      const { data: messages, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ Error loading messages from ${tableName}:`, error);
        throw error;
      }

      console.log(`✅ Found ${messages?.length || 0} messages in ${tableName} for conversation ${conversationId}`);
      return messages || [];
    } catch (error) {
      console.error(`Error fetching messages from ${platform}_messages:`, error);
      return [];
    }
  }

  /**
   * Get messages across all platforms using unified view
   */
  static async getUnifiedMessages(query: MessageQuery) {
    try {
      const { userId, platform, conversationId, limit = 100, offset = 0 } = query;

      let messageQuery = supabase
        .from('unified_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (platform) {
        messageQuery = messageQuery.eq('platform', platform);
      }

      if (conversationId) {
        messageQuery = messageQuery.eq('conversation_id', conversationId);
      }

      const { data: messages, error } = await messageQuery;

      if (error) {
        throw error;
      }

      return {
        success: true,
        messages: messages || []
      };
    } catch (error) {
      console.error('Error in getUnifiedMessages:', error);
      return {
        success: false,
        error: 'Failed to fetch unified messages',
        messages: []
      };
    }
  }

  /**
   * Create a new message in the correct platform table
   */
  static async createMessage(platform: Platform, messageData: any) {
    try {
      const tableName = `${platform}_messages`;
      
      // Ensure platform field matches the table
      const messageWithPlatform = {
        ...messageData,
        platform: platform,
        created_at: new Date().toISOString(),
        timestamp: messageData.timestamp || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(messageWithPlatform)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: data
      };
    } catch (error) {
      console.error(`Error creating message in ${platform}_messages:`, error);
      return {
        success: false,
        error: `Failed to create ${platform} message`
      };
    }
  }

  /**
   * Update conversation timestamp when new message is added
   */
  static async updateConversationTimestamp(
    conversationId: string,
    userId: string,
    lastMessageText?: string
  ) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      };

      if (lastMessageText) {
        updateData.last_message_text = lastMessageText;
      }

      const { error } = await supabase
        .from('crm_conversations')
        .update(updateData)
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
      return { success: false, error: 'Failed to update conversation' };
    }
  }

  /**
   * Get platform-specific integration settings
   */
  static async getPlatformIntegration(userId: string, platform: Platform) {
    try {
      const { data, error } = await supabase
        .from('messaging_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('status', 'active')
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        integration: data
      };
    } catch (error) {
      console.error(`Error fetching ${platform} integration:`, error);
      return {
        success: false,
        error: `No active ${platform} integration found`
      };
    }
  }

  /**
   * Create or find conversation for a platform contact
   */
  static async findOrCreateConversation(
    userId: string,
    platform: Platform,
    contactId: string,
    platformContactId: string
  ) {
    try {
      // First, try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('contact_id', contactId)
        .eq('status', 'active')
        .single();

      if (!findError && existing) {
        return {
          success: true,
          conversation: existing
        };
      }

      // Create new conversation
      const conversationData = {
        user_id: userId,
        platform: platform,
        contact_id: contactId,
        platform_conversation_id: platformContactId,
        status: 'active',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newConversation, error: createError } = await supabase
        .from('crm_conversations')
        .insert(conversationData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return {
        success: true,
        conversation: newConversation
      };
    } catch (error) {
      console.error('Error finding/creating conversation:', error);
      return {
        success: false,
        error: 'Failed to find or create conversation'
      };
    }
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStatistics(userId: string) {
    try {
      const { data: stats, error } = await supabase
        .from('platform_statistics')
        .select('*')
        .order('total_messages', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter stats by user if needed (this would require updating the view)
      return {
        success: true,
        statistics: stats || []
      };
    } catch (error) {
      console.error('Error fetching platform statistics:', error);
      return {
        success: false,
        error: 'Failed to fetch platform statistics',
        statistics: []
      };
    }
  }

  /**
   * Validate platform support
   */
  static isValidPlatform(platform: string): platform is Platform {
    const validPlatforms: Platform[] = [
      'telegram', 'whatsapp', 'instagram', 'facebook', 'gmail', 
      'slack', 'discord', 'youtube', 'tiktok', 'sms', 'website_chat'
    ];
    return validPlatforms.includes(platform as Platform);
  }

  /**
   * Get supported platforms
   */
  static getSupportedPlatforms(): Platform[] {
    return [
      'telegram', 'whatsapp', 'instagram', 'facebook', 'gmail', 
      'slack', 'discord', 'youtube', 'tiktok', 'sms', 'website_chat'
    ];
  }
}