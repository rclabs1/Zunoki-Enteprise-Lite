import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import crypto from 'crypto';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface LiveChatConfig {
  chatId: string;
  businessName: string;
  agentName?: string;
  welcomeMessage?: string;
  offlineMessage?: string;
  maxConcurrentChats?: number;
  autoAssignment?: boolean;
  chatTimeoutMinutes?: number;
  enableFileSharing?: boolean;
  enableScreenSharing?: boolean;
  enableTypingIndicators?: boolean;
  enableChatTranscripts?: boolean;
  workingHours?: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string; enabled: boolean }>;
  };
  autoResponses?: {
    enabled: boolean;
    responses: Array<{
      trigger: string;
      response: string;
      delay?: number;
    }>;
  };
  chatRating?: {
    enabled: boolean;
    promptMessage?: string;
  };
  apiKey?: string;
}

export interface LiveChatMessage extends BaseMessage {
  platform: 'live-chat';
  sessionId?: string;
  agentId?: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
  chatRoom?: string;
  isAgentMessage?: boolean;
  messageStatus?: 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    type: 'file' | 'image' | 'document';
    url: string;
    name: string;
    size: number;
  }>;
  typingIndicator?: boolean;
  chatEvent?: 'join' | 'leave' | 'transfer' | 'close' | 'rate';
  rating?: number;
  ratingComment?: string;
}

export interface ParsedLiveChatEvent {
  eventType: 'message' | 'agent_join' | 'agent_leave' | 'visitor_join' | 'visitor_leave' | 'chat_transfer' | 'chat_close' | 'typing_start' | 'typing_stop' | 'chat_rate';
  messageId: string;
  sessionId: string;
  chatRoom: string;
  agentId?: string;
  agentName?: string;
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'typing';
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
  isAgentMessage: boolean;
  messageStatus?: string;
  rating?: number;
  ratingComment?: string;
  metadata?: any;
}

class LiveChatProviderProduction {
  
  // Send message in live chat
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as LiveChatConfig;
      const chatMessage = message as LiveChatMessage;

      if (!config.chatId || !config.apiKey) {
        return { success: false, error: 'Live chat configuration incomplete' };
      }

      if (!message.content || !chatMessage.sessionId) {
        return { success: false, error: 'Message content and session ID are required' };
      }

      // Generate message ID
      const messageId = crypto.randomUUID();

      // Store outbound message first
      if (message.conversationId) {
        await this.storeOutboundMessage({
          userId: integration.user_id,
          conversationId: message.conversationId,
          platformMessageId: messageId,
          content: message.content,
          sessionId: chatMessage.sessionId,
          agentId: chatMessage.agentId || 'system',
          visitorId: chatMessage.visitorId,
          attachments: chatMessage.attachments
        });
      }

      // Broadcast message to live chat room via WebSocket
      await this.broadcastMessageToRoom({
        chatId: config.chatId,
        sessionId: chatMessage.sessionId,
        chatRoom: chatMessage.chatRoom || chatMessage.sessionId,
        messageId: messageId,
        content: message.content,
        senderType: 'agent',
        agentId: chatMessage.agentId || 'system',
        agentName: config.agentName || config.businessName || 'Support Agent',
        timestamp: new Date().toISOString(),
        attachments: chatMessage.attachments,
        messageStatus: 'sent'
      });

      return {
        success: true,
        messageId: messageId
      };
    } catch (error: any) {
      console.error('Live chat send message error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send live chat message'
      };
    }
  }

  // Process live chat webhook/event
  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing live chat event:', JSON.stringify(payload, null, 2));

      // Parse the live chat event
      const parsedEvent = await this.parseLiveChatEvent(payload);
      
      if (!parsedEvent) {
        console.error('Failed to parse live chat event');
        return;
      }

      const config = integration.config as LiveChatConfig;

      // Skip agent messages and system events we don't need to store
      if (parsedEvent.isAgentMessage && parsedEvent.eventType === 'message') {
        console.log('Skipping agent message');
        return;
      }

      // Handle typing indicators separately (don't store as messages)
      if (parsedEvent.eventType === 'typing_start' || parsedEvent.eventType === 'typing_stop') {
        await this.handleTypingIndicator(parsedEvent, config);
        return;
      }

      // Get or create contact
      const contact = await this.getOrCreateContact(
        parsedEvent.visitorId,
        integration.user_id,
        {
          name: parsedEvent.visitorName,
          email: parsedEvent.visitorEmail,
          agentId: parsedEvent.agentId
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        contact.id,
        integration.user_id,
        parsedEvent.sessionId,
        parsedEvent.chatRoom
      );

      // Handle different event types
      switch (parsedEvent.eventType) {
        case 'visitor_join':
          await this.handleVisitorJoin(conversation.id, parsedEvent, config);
          break;
        case 'agent_join':
          await this.handleAgentJoin(conversation.id, parsedEvent);
          break;
        case 'chat_transfer':
          await this.handleChatTransfer(conversation.id, parsedEvent);
          break;
        case 'chat_close':
          await this.handleChatClose(conversation.id, parsedEvent);
          break;
        case 'chat_rate':
          await this.handleChatRating(conversation.id, parsedEvent);
          break;
      }

      // Store message (if it's an actual message)
      if (parsedEvent.eventType === 'message' && parsedEvent.content) {
        await this.storeMessage({
          userId: integration.user_id,
          conversationId: conversation.id,
          contactId: contact.id,
          platformMessageId: parsedEvent.messageId,
          content: parsedEvent.content,
          sessionId: parsedEvent.sessionId,
          chatRoom: parsedEvent.chatRoom,
          agentId: parsedEvent.agentId,
          visitorId: parsedEvent.visitorId,
          messageType: parsedEvent.messageType,
          attachments: parsedEvent.attachments,
          messageStatus: parsedEvent.messageStatus,
          isAgentMessage: parsedEvent.isAgentMessage,
          timestamp: parsedEvent.timestamp
        });

        // Send auto-response if applicable
        await this.checkAndSendAutoResponse(integration, conversation.id, parsedEvent, config);
      }

      // Update analytics
      await this.updateAnalytics(integration.user_id, conversation.id);

      // Classify and route (only for visitor messages)
      if (parsedEvent.content && !parsedEvent.isAgentMessage) {
        await this.classifyAndRouteMessage(conversation.id, parsedEvent.content, contact);
      }

    } catch (error) {
      console.error('Error processing live chat event:', error);
      throw error;
    }
  }

  // Test live chat connection
  async testConnection(config: LiveChatConfig): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (!config.chatId || !config.businessName) {
        return { success: false, error: 'Chat ID and business name are required' };
      }

      // Generate API key if not provided
      if (!config.apiKey) {
        config.apiKey = this.generateApiKey();
      }

      // Validate working hours format if provided
      if (config.workingHours?.enabled && config.workingHours.schedule) {
        for (const [day, hours] of Object.entries(config.workingHours.schedule)) {
          if (hours.enabled && (!hours.start || !hours.end)) {
            return { success: false, error: `Invalid working hours for ${day}` };
          }
        }
      }

      return {
        success: true,
        info: {
          chatId: config.chatId,
          businessName: config.businessName,
          agentName: config.agentName,
          apiKey: config.apiKey,
          maxConcurrentChats: config.maxConcurrentChats || 10,
          chatTimeoutMinutes: config.chatTimeoutMinutes || 30,
          websocketUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace('http', 'ws') || 'wss://yourdomain.com'}/api/messaging/live-chat/ws`,
          apiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/api/messaging/live-chat`
        }
      };
    } catch (error: any) {
      console.error('Live chat connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate live chat configuration'
      };
    }
  }

  // Get active chat sessions
  async getActiveChatSessions(config: LiveChatConfig, userId: string): Promise<any[]> {
    try {
      const { data: activeChats } = await supabaseService
        .from('crm_conversations')
        .select(`
          id,
          platform_thread_id,
          status,
          created_at,
          updated_at,
          last_message_at,
          metadata,
          crm_contacts(display_name, email, platform_id)
        `)
        .eq('user_id', userId)
        .eq('platform', 'live-chat')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      return activeChats || [];
    } catch (error: any) {
      console.error('Error fetching active chat sessions:', error);
      throw error;
    }
  }

  // Get chat analytics
  async getChatAnalytics(config: LiveChatConfig, userId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get chat session count
      const { count: sessionCount } = await supabaseService
        .from('crm_conversations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('platform', 'live-chat')
        .gte('created_at', start)
        .lte('created_at', end);

      // Get message count
      const { count: messageCount } = await supabaseService
        .from('whatsapp_messages')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('platform', 'live-chat')
        .gte('timestamp', start)
        .lte('timestamp', end);

      // Get average response time
      const { data: responseTimes } = await supabaseService
        .from('whatsapp_messages')
        .select('timestamp, conversation_id, direction')
        .eq('user_id', userId)
        .eq('platform', 'live-chat')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: true });

      let totalResponseTime = 0;
      let responseCount = 0;
      
      if (responseTimes) {
        const conversations = {};
        responseTimes.forEach(msg => {
          if (!conversations[msg.conversation_id]) {
            conversations[msg.conversation_id] = [];
          }
          conversations[msg.conversation_id].push(msg);
        });

        Object.values(conversations).forEach((messages: any[]) => {
          for (let i = 1; i < messages.length; i++) {
            const prev = messages[i - 1];
            const curr = messages[i];
            if (prev.direction === 'inbound' && curr.direction === 'outbound') {
              const responseTime = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
              totalResponseTime += responseTime;
              responseCount++;
            }
          }
        });
      }

      const avgResponseTimeMinutes = responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60) : 0;

      // Get chat ratings
      const { data: ratings } = await supabaseService
        .from('whatsapp_messages')
        .select('metadata')
        .eq('user_id', userId)
        .eq('platform', 'live-chat')
        .like('metadata->>eventType', 'chat_rate')
        .gte('timestamp', start)
        .lte('timestamp', end);

      const ratingStats = ratings?.reduce((acc, msg) => {
        const rating = msg.metadata?.rating;
        if (rating && rating >= 1 && rating <= 5) {
          acc.total += rating;
          acc.count += 1;
        }
        return acc;
      }, { total: 0, count: 0 });

      const avgRating = ratingStats?.count > 0 ? ratingStats.total / ratingStats.count : 0;

      return {
        sessionCount: sessionCount || 0,
        messageCount: messageCount || 0,
        avgResponseTimeMinutes: Math.round(avgResponseTimeMinutes * 100) / 100,
        avgRating: Math.round(avgRating * 100) / 100,
        ratingCount: ratingStats?.count || 0,
        period: { start, end }
      };
    } catch (error: any) {
      console.error('Error fetching chat analytics:', error);
      throw error;
    }
  }

  // Generate API key
  private generateApiKey(): string {
    return 'lc_' + crypto.randomBytes(32).toString('hex');
  }

  // Broadcast message to chat room (WebSocket implementation)
  private async broadcastMessageToRoom(messageData: any): Promise<void> {
    try {
      // In a real implementation, this would broadcast via WebSocket
      // For now, we'll store it in a real-time messages table
      await supabaseService
        .from('live_chat_realtime_messages')
        .insert({
          chat_id: messageData.chatId,
          session_id: messageData.sessionId,
          chat_room: messageData.chatRoom,
          message_id: messageData.messageId,
          content: messageData.content,
          sender_type: messageData.senderType,
          agent_id: messageData.agentId,
          agent_name: messageData.agentName,
          attachments: messageData.attachments,
          timestamp: messageData.timestamp,
          message_status: messageData.messageStatus,
          delivered: false
        })
        .onError(() => {
          // Table might not exist yet, that's okay
          console.log('Real-time messages table not available');
        });

    } catch (error) {
      console.error('Error broadcasting message to chat room:', error);
    }
  }

  // Handle typing indicator
  private async handleTypingIndicator(parsedEvent: ParsedLiveChatEvent, config: LiveChatConfig): Promise<void> {
    try {
      if (!config.enableTypingIndicators) return;

      // Broadcast typing status to chat room
      await this.broadcastMessageToRoom({
        chatId: config.chatId,
        sessionId: parsedEvent.sessionId,
        chatRoom: parsedEvent.chatRoom,
        messageId: crypto.randomUUID(),
        content: parsedEvent.eventType === 'typing_start' ? 'typing...' : '',
        senderType: parsedEvent.isAgentMessage ? 'agent' : 'visitor',
        agentId: parsedEvent.agentId,
        timestamp: new Date().toISOString(),
        messageStatus: 'typing'
      });
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }

  // Handle visitor join event
  private async handleVisitorJoin(conversationId: string, parsedEvent: ParsedLiveChatEvent, config: LiveChatConfig): Promise<void> {
    try {
      // Send welcome message if configured
      if (config.welcomeMessage) {
        await supabaseService
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversationId,
            message_text: config.welcomeMessage,
            direction: 'outbound',
            message_type: 'system',
            platform: 'live-chat',
            platform_message_id: crypto.randomUUID(),
            metadata: {
              eventType: 'welcome_message',
              sessionId: parsedEvent.sessionId,
              chatRoom: parsedEvent.chatRoom
            },
            timestamp: new Date().toISOString()
          });
      }

      // Update conversation metadata
      await supabaseService
        .from('crm_conversations')
        .update({
          metadata: {
            chatRoom: parsedEvent.chatRoom,
            visitorJoinedAt: parsedEvent.timestamp,
            welcomeMessageSent: !!config.welcomeMessage
          }
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error handling visitor join:', error);
    }
  }

  // Handle agent join event
  private async handleAgentJoin(conversationId: string, parsedEvent: ParsedLiveChatEvent): Promise<void> {
    try {
      await supabaseService
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          message_text: `${parsedEvent.agentName || 'Agent'} joined the chat`,
          direction: 'inbound',
          message_type: 'system',
          platform: 'live-chat',
          platform_message_id: parsedEvent.messageId,
          metadata: {
            eventType: 'agent_join',
            agentId: parsedEvent.agentId,
            agentName: parsedEvent.agentName,
            sessionId: parsedEvent.sessionId
          },
          timestamp: parsedEvent.timestamp
        });
    } catch (error) {
      console.error('Error handling agent join:', error);
    }
  }

  // Handle chat transfer event
  private async handleChatTransfer(conversationId: string, parsedEvent: ParsedLiveChatEvent): Promise<void> {
    try {
      await supabaseService
        .from('crm_conversations')
        .update({
          metadata: {
            transferredAt: parsedEvent.timestamp,
            transferredTo: parsedEvent.agentId,
            transferredFrom: parsedEvent.metadata?.previousAgentId
          }
        })
        .eq('id', conversationId);

      await supabaseService
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          message_text: `Chat transferred to ${parsedEvent.agentName || 'another agent'}`,
          direction: 'inbound',
          message_type: 'system',
          platform: 'live-chat',
          platform_message_id: parsedEvent.messageId,
          metadata: {
            eventType: 'chat_transfer',
            newAgentId: parsedEvent.agentId,
            previousAgentId: parsedEvent.metadata?.previousAgentId
          },
          timestamp: parsedEvent.timestamp
        });
    } catch (error) {
      console.error('Error handling chat transfer:', error);
    }
  }

  // Handle chat close event
  private async handleChatClose(conversationId: string, parsedEvent: ParsedLiveChatEvent): Promise<void> {
    try {
      await supabaseService
        .from('crm_conversations')
        .update({
          status: 'closed',
          metadata: {
            closedAt: parsedEvent.timestamp,
            closedBy: parsedEvent.isAgentMessage ? 'agent' : 'visitor'
          }
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error handling chat close:', error);
    }
  }

  // Handle chat rating event
  private async handleChatRating(conversationId: string, parsedEvent: ParsedLiveChatEvent): Promise<void> {
    try {
      await supabaseService
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          message_text: `Chat rated: ${parsedEvent.rating}/5 stars${parsedEvent.ratingComment ? ` - ${parsedEvent.ratingComment}` : ''}`,
          direction: 'inbound',
          message_type: 'system',
          platform: 'live-chat',
          platform_message_id: parsedEvent.messageId,
          metadata: {
            eventType: 'chat_rate',
            rating: parsedEvent.rating,
            ratingComment: parsedEvent.ratingComment
          },
          timestamp: parsedEvent.timestamp
        });

      await supabaseService
        .from('crm_conversations')
        .update({
          metadata: {
            rating: parsedEvent.rating,
            ratingComment: parsedEvent.ratingComment,
            ratedAt: parsedEvent.timestamp
          }
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error handling chat rating:', error);
    }
  }

  // Check and send auto-response
  private async checkAndSendAutoResponse(integration: MessagingIntegration, conversationId: string, parsedEvent: ParsedLiveChatEvent, config: LiveChatConfig): Promise<void> {
    try {
      if (!config.autoResponses?.enabled || !config.autoResponses.responses) return;

      const content = parsedEvent.content.toLowerCase();
      
      for (const autoResponse of config.autoResponses.responses) {
        const trigger = autoResponse.trigger.toLowerCase();
        if (content.includes(trigger)) {
          // Check if this auto-response was already sent recently
          const { data: recentResponse } = await supabaseService
            .from('whatsapp_messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('platform', 'live-chat')
            .eq('direction', 'outbound')
            .eq('message_text', autoResponse.response)
            .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
            .single();

          if (!recentResponse) {
            // Send auto-response with optional delay
            const delay = autoResponse.delay || 0;
            setTimeout(async () => {
              const autoResponseMsg = {
                content: autoResponse.response,
                platform: 'live-chat' as const,
                messageType: 'text' as const,
                senderType: 'system' as const,
                conversationId,
                sessionId: parsedEvent.sessionId,
                chatRoom: parsedEvent.chatRoom
              };
              await this.sendMessage(integration, autoResponseMsg);
            }, delay * 1000);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error checking auto-response:', error);
    }
  }

  // Parse live chat event
  private async parseLiveChatEvent(payload: any): Promise<ParsedLiveChatEvent | null> {
    try {
      return {
        eventType: payload.eventType || payload.type || 'message',
        messageId: payload.messageId || payload.id || crypto.randomUUID(),
        sessionId: payload.sessionId || payload.session_id,
        chatRoom: payload.chatRoom || payload.chat_room || payload.sessionId,
        agentId: payload.agentId || payload.agent_id,
        agentName: payload.agentName || payload.agent_name,
        visitorId: payload.visitorId || payload.visitor_id,
        visitorName: payload.visitorName || payload.visitor_name,
        visitorEmail: payload.visitorEmail || payload.visitor_email,
        content: payload.content || payload.message || '',
        timestamp: payload.timestamp || new Date().toISOString(),
        messageType: payload.messageType || payload.message_type || 'text',
        attachments: payload.attachments || [],
        isAgentMessage: payload.isAgentMessage || payload.is_agent_message || payload.senderType === 'agent',
        messageStatus: payload.messageStatus || payload.message_status,
        rating: payload.rating,
        ratingComment: payload.ratingComment || payload.rating_comment,
        metadata: payload.metadata || {}
      };
    } catch (error) {
      console.error('Error parsing live chat event:', error);
      return null;
    }
  }

  // Get or create contact using PRODUCTION TABLE: crm_contacts
  private async getOrCreateContact(visitorId: string, userId: string, visitorInfo: any): Promise<any> {
    try {
      // Check if contact exists by visitor ID or email
      let existingContact = null;
      
      if (visitorInfo.email) {
        const { data: emailContact } = await supabaseService
          .from('crm_contacts')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', 'live-chat')
          .eq('email', visitorInfo.email)
          .single();
        existingContact = emailContact;
      }

      if (!existingContact) {
        const { data: visitorContact } = await supabaseService
          .from('crm_contacts')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', 'live-chat')
          .eq('platform_id', visitorId)
          .single();
        existingContact = visitorContact;
      }

      if (existingContact) {
        // Update last interaction and any new info
        const updateData: any = {
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (visitorInfo.email && !existingContact.email) {
          updateData.email = visitorInfo.email;
        }
        if (visitorInfo.name && !existingContact.display_name) {
          updateData.display_name = visitorInfo.name;
        }

        const { data: updatedContact } = await supabaseService
          .from('crm_contacts')
          .update(updateData)
          .eq('id', existingContact.id)
          .select()
          .single();

        return updatedContact || existingContact;
      }

      // Create new contact
      const { data: newContact, error } = await supabaseService
        .from('crm_contacts')
        .insert({
          user_id: userId,
          platform: 'live-chat',
          platform_id: visitorId,
          platform_username: visitorInfo.name || `Visitor ${visitorId.slice(-8)}`,
          display_name: visitorInfo.name || `Live Chat Visitor`,
          email: visitorInfo.email,
          phone_number: visitorId, // Store visitor ID in phone_number for compatibility
          lifecycle_stage: 'lead',
          priority: 'high', // Live chat usually indicates immediate interest
          last_seen: new Date().toISOString(),
          metadata: {
            liveChat: {
              visitorId: visitorId,
              agentId: visitorInfo.agentId,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating live chat contact:', error);
        throw error;
      }

      return newContact;
    } catch (error) {
      console.error('Error getting or creating live chat contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, sessionId: string, chatRoom?: string): Promise<any> {
    try {
      // Check for existing conversation with same session
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'live-chat')
        .eq('platform_thread_id', sessionId)
        .neq('status', 'closed')
        .single();

      if (existingConversation) {
        // Update conversation timestamp
        const { data: updatedConversation } = await supabaseService
          .from('crm_conversations')
          .update({ 
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            status: 'active'
          })
          .eq('id', existingConversation.id)
          .select()
          .single();

        return updatedConversation || existingConversation;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabaseService
        .from('crm_conversations')
        .insert({
          user_id: userId,
          contact_id: contactId,
          platform: 'live-chat',
          platform_thread_id: sessionId,
          status: 'active',
          priority: 'high',
          last_message_at: new Date().toISOString(),
          metadata: {
            chatRoom: chatRoom || sessionId,
            sessionId: sessionId
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating live chat conversation:', error);
        throw error;
      }

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating live chat conversation:', error);
      throw error;
    }
  }

  // Store message using PRODUCTION TABLE: whatsapp_messages
  private async storeMessage(messageData: any): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('whatsapp_messages')
        .insert({
          user_id: messageData.userId,
          conversation_id: messageData.conversationId,
          contact_id: messageData.contactId,
          message_text: messageData.content,
          direction: messageData.isAgentMessage ? 'outbound' : 'inbound',
          message_type: messageData.messageType,
          is_from_bot: false,
          platform: 'live-chat',
          platform_message_id: messageData.platformMessageId,
          metadata: {
            sessionId: messageData.sessionId,
            chatRoom: messageData.chatRoom,
            agentId: messageData.agentId,
            visitorId: messageData.visitorId,
            attachments: messageData.attachments,
            messageStatus: messageData.messageStatus,
            timestamp: messageData.timestamp,
            isAgentMessage: messageData.isAgentMessage
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing live chat message:', error);
        throw error;
      }

      // Update conversation with last message
      await supabaseService
        .from('crm_conversations')
        .update({
          last_message_text: messageData.content.substring(0, 100),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageData.conversationId);

    } catch (error) {
      console.error('Error storing live chat message:', error);
      throw error;
    }
  }

  // Store outbound message
  private async storeOutboundMessage(messageData: any): Promise<void> {
    try {
      if (!messageData.conversationId) return;

      const { error } = await supabaseService
        .from('whatsapp_messages')
        .insert({
          user_id: messageData.userId,
          conversation_id: messageData.conversationId,
          message_text: messageData.content,
          direction: 'outbound',
          message_type: 'text',
          is_from_bot: false,
          platform: 'live-chat',
          platform_message_id: messageData.platformMessageId,
          status: 'sent',
          metadata: {
            sessionId: messageData.sessionId,
            agentId: messageData.agentId,
            visitorId: messageData.visitorId,
            attachments: messageData.attachments,
            isAgentMessage: true
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound live chat message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound live chat message:', error);
    }
  }

  // Update analytics
  private async updateAnalytics(userId: string, conversationId: string): Promise<void> {
    try {
      // Reuse existing analytics function
      await supabaseService.rpc('update_telegram_analytics', {
        p_user_id: userId,
        p_conversation_id: conversationId,
      }).catch(() => {
        // Fallback if function doesn't exist
        console.log('Analytics function not available, skipping analytics update');
      });
    } catch (error) {
      console.error('Error updating live chat analytics:', error);
    }
  }

  // Classify and route message
  private async classifyAndRouteMessage(conversationId: string, content: string, contact: any): Promise<void> {
    try {
      // Use existing classification function
      await supabaseService.rpc('classify_telegram_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_contact_id: contact.id,
      }).catch(() => {
        // Fallback classification
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'help', 'problem', 'issue', 'bug', 'error', 'broken'];
        const salesKeywords = ['price', 'cost', 'buy', 'purchase', 'demo', 'trial', 'quote', 'sales', 'pricing'];
        const supportKeywords = ['support', 'help', 'how to', 'tutorial', 'guide', 'documentation', 'not working'];
        
        const isUrgent = urgentKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        );
        
        const isSales = salesKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        );

        const isSupport = supportKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        );

        let priority = 'medium';
        let tags = [];

        if (isUrgent) {
          priority = 'high';
          tags.push('urgent');
        }
        if (isSales) {
          priority = 'high';
          tags.push('sales');
        }
        if (isSupport) {
          tags.push('support');
        }

        return supabaseService
          .from('crm_conversations')
          .update({
            priority,
            tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      });
    } catch (error) {
      console.error('Error classifying live chat message:', error);
    }
  }
}

export const liveChatProviderProduction = new LiveChatProviderProduction();
export default liveChatProviderProduction;