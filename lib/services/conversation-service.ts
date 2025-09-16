import { getSupabaseService } from './supabase-service';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface PlatformConversation {
  id?: string;
  userId: string;
  contactId: string;
  platform: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'twilio-sms' | 'website-chat';
  platformThreadId?: string; // Chat ID for Telegram, Thread ID for Gmail, etc.
  status: 'active' | 'pending' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high';
  assignedAgentId?: string;
  assignedAgentName?: string;
  handoffReason?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationQueryOptions {
  limit?: number;
  offset?: number;
  platform?: string;
  status?: string;
  priority?: string;
  assignedAgentId?: string;
  includeArchived?: boolean;
}

export interface ConversationWithContact extends PlatformConversation {
  contact: {
    id: string;
    platformId: string;
    platformUsername?: string;
    displayName?: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    lifecycleStage?: string;
    leadScore?: number;
    tags?: string[];
    metadata?: Record<string, any>;
    lastSeen?: string;
  };
}

/**
 * ConversationService - Clean abstraction over the conversation management system
 * Handles cross-platform conversations with a unified interface
 */
export class ConversationService {
  private static instance: ConversationService;

  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  /**
   * Get conversations for a user with optional filtering
   * @param userId - The user ID
   * @param options - Query options
   * @returns Promise<ConversationWithContact[]>
   */
  async getConversations(userId: string, options: ConversationQueryOptions = {}): Promise<ConversationWithContact[]> {
    try {
      console.log(`📖 ConversationService.getConversations called for user: ${userId}, options:`, options);
      
      // Build query
      let query = supabaseService
        .from('crm_conversations')
        .select(`
          id,
          user_id,
          contact_id,
          platform,
          platform_thread_id,
          status,
          priority,
          assigned_agent_id,
          assigned_agent_name,
          handoff_reason,
          last_message_text,
          last_message_at,
          unread_count,
          metadata,
          created_at,
          updated_at,
          contact:crm_contacts!contact_id(
            id,
            platform_id,
            platform_username,
            display_name,
            phone_number,
            profile_picture_url,
            lifecycle_stage,
            lead_score,
            tags,
            metadata,
            last_seen,
            created_at
          )
        `)
        .eq('user_id', userId);

      // Apply filters
      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }
      if (options.assignedAgentId) {
        query = query.eq('assigned_agent_id', options.assignedAgentId);
      }
      if (!options.includeArchived) {
        query = query.neq('status', 'archived');
      }

      // Apply ordering and pagination
      query = query
        .order('updated_at', { ascending: false })
        .limit(options.limit || 50);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ ConversationService.getConversations failed:', error);
        return [];
      }

      const conversations = (data || []).map(this.transformFromDb);
      console.log(`✅ ConversationService.getConversations returned ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ ConversationService.getConversations exception:', error);
      return [];
    }
  }

  /**
   * Get a single conversation by ID
   * @param conversationId - The conversation ID
   * @returns Promise<ConversationWithContact | null>
   */
  async getById(conversationId: string): Promise<ConversationWithContact | null> {
    try {
      console.log(`📖 ConversationService.getById called for conversation: ${conversationId}`);
      
      const { data, error } = await supabaseService
        .from('crm_conversations')
        .select(`
          id,
          user_id,
          contact_id,
          platform,
          platform_thread_id,
          status,
          priority,
          assigned_agent_id,
          assigned_agent_name,
          handoff_reason,
          last_message_text,
          last_message_at,
          unread_count,
          metadata,
          created_at,
          updated_at,
          contact:crm_contacts!contact_id(
            id,
            platform_id,
            platform_username,
            display_name,
            phone_number,
            profile_picture_url,
            lifecycle_stage,
            lead_score,
            tags,
            metadata,
            last_seen,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('❌ ConversationService.getById failed:', error);
        return null;
      }

      const conversation = this.transformFromDb(data);
      console.log(`✅ ConversationService.getById returned conversation for platform: ${conversation.platform}`);
      return conversation;
    } catch (error) {
      console.error('❌ ConversationService.getById exception:', error);
      return null;
    }
  }

  /**
   * Create a new conversation
   * @param conversation - The conversation data
   * @returns Promise<{ success: boolean; conversationId?: string; error?: string }>
   */
  async create(conversation: PlatformConversation): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      console.log(`📝 ConversationService.create called for platform: ${conversation.platform}`);
      
      const { data, error } = await supabaseService
        .from('crm_conversations')
        .insert({
          user_id: conversation.userId,
          contact_id: conversation.contactId,
          platform: conversation.platform,
          platform_thread_id: conversation.platformThreadId,
          status: conversation.status || 'active',
          priority: conversation.priority || 'medium',
          assigned_agent_id: conversation.assignedAgentId,
          assigned_agent_name: conversation.assignedAgentName,
          handoff_reason: conversation.handoffReason,
          last_message_text: conversation.lastMessageText,
          last_message_at: conversation.lastMessageAt || new Date().toISOString(),
          unread_count: conversation.unreadCount || 0,
          metadata: conversation.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ ConversationService.create failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.create successful for platform: ${conversation.platform}, conversationId: ${data.id}`);
      return { success: true, conversationId: data.id };
    } catch (error: any) {
      console.error('❌ ConversationService.create exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create a conversation for a contact and platform
   * @param userId - The user ID
   * @param contactId - The contact ID
   * @param platform - The platform
   * @param platformThreadId - The platform-specific thread ID
   * @returns Promise<{ success: boolean; conversation?: ConversationWithContact; error?: string }>
   */
  async getOrCreate(
    userId: string, 
    contactId: string, 
    platform: string, 
    platformThreadId?: string
  ): Promise<{ success: boolean; conversation?: ConversationWithContact; error?: string }> {
    try {
      console.log(`🔍 ConversationService.getOrCreate called for contact: ${contactId}, platform: ${platform}`);
      
      // Check for existing active conversation
      let query = supabaseService
        .from('crm_conversations')
        .select(`
          id,
          user_id,
          contact_id,
          platform,
          platform_thread_id,
          status,
          priority,
          assigned_agent_id,
          assigned_agent_name,
          handoff_reason,
          last_message_text,
          last_message_at,
          unread_count,
          metadata,
          created_at,
          updated_at,
          contact:crm_contacts!contact_id(
            id,
            platform_id,
            platform_username,
            display_name,
            phone_number,
            profile_picture_url,
            lifecycle_stage,
            lead_score,
            tags,
            metadata,
            last_seen,
            created_at
          )
        `)
        .eq('contact_id', contactId)
        .eq('platform', platform)
        .eq('status', 'active');

      if (platformThreadId) {
        query = query.eq('platform_thread_id', platformThreadId);
      }

      const { data: existingConversation } = await query.single();

      if (existingConversation) {
        const conversation = this.transformFromDb(existingConversation);
        console.log(`✅ ConversationService.getOrCreate found existing conversation: ${conversation.id}`);
        return { success: true, conversation };
      }

      // Create new conversation
      const createResult = await this.create({
        userId,
        contactId,
        platform: platform as any,
        platformThreadId,
        status: 'active',
        priority: 'medium',
        lastMessageAt: new Date().toISOString(),
      });

      if (!createResult.success || !createResult.conversationId) {
        return { success: false, error: createResult.error };
      }

      // Get the created conversation with contact data
      const newConversation = await this.getById(createResult.conversationId);
      if (!newConversation) {
        return { success: false, error: 'Failed to retrieve created conversation' };
      }

      console.log(`✅ ConversationService.getOrCreate created new conversation: ${newConversation.id}`);
      return { success: true, conversation: newConversation };
    } catch (error: any) {
      console.error('❌ ConversationService.getOrCreate exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update last message for a conversation
   * @param conversationId - The conversation ID
   * @param messageText - The message text
   * @param timestamp - The message timestamp
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async updateLastMessage(
    conversationId: string, 
    messageText: string, 
    timestamp?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ConversationService.updateLastMessage called for conversation: ${conversationId}`);
      
      const { error } = await supabaseService
        .from('crm_conversations')
        .update({
          last_message_text: messageText.substring(0, 200), // Truncate to avoid DB limits
          last_message_at: timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ ConversationService.updateLastMessage failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.updateLastMessage successful for conversation: ${conversationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ConversationService.updateLastMessage exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update conversation status
   * @param conversationId - The conversation ID
   * @param status - The new status
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async updateStatus(
    conversationId: string, 
    status: 'active' | 'pending' | 'resolved' | 'archived'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ConversationService.updateStatus called for conversation: ${conversationId}, status: ${status}`);
      
      const { error } = await supabaseService
        .from('crm_conversations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ ConversationService.updateStatus failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.updateStatus successful for conversation: ${conversationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ConversationService.updateStatus exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign conversation to an agent
   * @param conversationId - The conversation ID
   * @param agentId - The agent ID
   * @param agentName - The agent name
   * @param handoffReason - Optional handoff reason
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async assignToAgent(
    conversationId: string, 
    agentId: string, 
    agentName: string, 
    handoffReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ConversationService.assignToAgent called for conversation: ${conversationId}, agent: ${agentId}`);
      
      const { error } = await supabaseService
        .from('crm_conversations')
        .update({
          assigned_agent_id: agentId,
          assigned_agent_name: agentName,
          handoff_reason: handoffReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ ConversationService.assignToAgent failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.assignToAgent successful for conversation: ${conversationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ConversationService.assignToAgent exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment unread count for a conversation
   * @param conversationId - The conversation ID
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async incrementUnreadCount(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ConversationService.incrementUnreadCount called for conversation: ${conversationId}`);
      
      const { error } = await supabaseService.rpc('increment_unread_count', {
        conversation_id: conversationId
      });

      if (error) {
        console.error('❌ ConversationService.incrementUnreadCount failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.incrementUnreadCount successful for conversation: ${conversationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ConversationService.incrementUnreadCount exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset unread count for a conversation
   * @param conversationId - The conversation ID
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async resetUnreadCount(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 ConversationService.resetUnreadCount called for conversation: ${conversationId}`);
      
      const { error } = await supabaseService
        .from('crm_conversations')
        .update({
          unread_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ ConversationService.resetUnreadCount failed:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ ConversationService.resetUnreadCount successful for conversation: ${conversationId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ ConversationService.resetUnreadCount exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transform database row to ConversationWithContact interface
   * @private
   */
  private transformFromDb(dbRow: any): ConversationWithContact {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      contactId: dbRow.contact_id,
      platform: dbRow.platform,
      platformThreadId: dbRow.platform_thread_id,
      status: dbRow.status,
      priority: dbRow.priority,
      assignedAgentId: dbRow.assigned_agent_id,
      assignedAgentName: dbRow.assigned_agent_name,
      handoffReason: dbRow.handoff_reason,
      lastMessageText: dbRow.last_message_text,
      lastMessageAt: dbRow.last_message_at,
      unreadCount: dbRow.unread_count || 0,
      metadata: dbRow.metadata || {},
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      contact: {
        id: dbRow.contact?.id,
        platformId: dbRow.contact?.platform_id,
        platformUsername: dbRow.contact?.platform_username,
        displayName: dbRow.contact?.display_name,
        phoneNumber: dbRow.contact?.phone_number,
        profilePictureUrl: dbRow.contact?.profile_picture_url,
        lifecycleStage: dbRow.contact?.lifecycle_stage,
        leadScore: dbRow.contact?.lead_score,
        tags: dbRow.contact?.tags || [],
        metadata: dbRow.contact?.metadata || {},
        lastSeen: dbRow.contact?.last_seen,
      },
    };
  }
}

// Export singleton instance
export const conversationService = ConversationService.getInstance();
export default conversationService;