import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import crypto from 'crypto';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface WebsiteChatConfig {
  widgetId: string;
  websiteDomain: string;
  businessName: string;
  welcomeMessage?: string;
  chatPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  autoReply?: boolean;
  autoReplyMessage?: string;
  offlineMessage?: string;
  allowFileUpload?: boolean;
  requireEmail?: boolean;
  requireName?: boolean;
  workingHours?: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string; enabled: boolean }>;
  };
  customCss?: string;
  apiKey?: string; // For widget authentication
}

export interface WebsiteChatMessage extends BaseMessage {
  platform: 'website-chat';
  sessionId?: string;
  visitorId?: string;
  visitorEmail?: string;
  visitorName?: string;
  visitorIp?: string;
  pageUrl?: string;
  pageTitle?: string;
  userAgent?: string;
  isOffline?: boolean;
  chatStarted?: boolean;
}

export interface ParsedWebsiteChatEvent {
  eventType: 'message' | 'chat_started' | 'chat_ended' | 'visitor_typing' | 'agent_typing';
  messageId: string;
  sessionId: string;
  visitorId: string;
  visitorEmail?: string;
  visitorName?: string;
  visitorIp?: string;
  content: string;
  timestamp: string;
  pageUrl?: string;
  pageTitle?: string;
  userAgent?: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

class WebsiteChatProviderProduction {
  
  // Send message = Reply to website chat visitor
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as WebsiteChatConfig;
      const chatMessage = message as WebsiteChatMessage;

      if (!config.widgetId || !config.apiKey) {
        return { success: false, error: 'Website chat configuration incomplete' };
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
          visitorId: chatMessage.visitorId
        });
      }

      // Emit message to website chat widget via WebSocket or SSE
      await this.broadcastMessageToWidget({
        widgetId: config.widgetId,
        sessionId: chatMessage.sessionId,
        messageId: messageId,
        content: message.content,
        senderType: 'agent',
        timestamp: new Date().toISOString(),
        senderName: config.businessName || 'Support Agent'
      });

      return {
        success: true,
        messageId: messageId
      };
    } catch (error: any) {
      console.error('Website chat send message error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send website chat message'
      };
    }
  }

  // Process website chat webhook/event
  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing website chat event:', JSON.stringify(payload, null, 2));

      // Parse the website chat event
      const parsedEvent = await this.parseWebsiteChatEvent(payload);
      
      if (!parsedEvent) {
        console.error('Failed to parse website chat event');
        return;
      }

      const config = integration.config as WebsiteChatConfig;

      // Skip system messages and agent messages
      if (parsedEvent.eventType === 'agent_typing' || payload.senderType === 'agent') {
        console.log('Skipping agent message');
        return;
      }

      // Get or create contact
      const contact = await this.getOrCreateContact(
        parsedEvent.visitorId,
        integration.user_id,
        {
          email: parsedEvent.visitorEmail,
          name: parsedEvent.visitorName,
          ip: parsedEvent.visitorIp,
          userAgent: parsedEvent.userAgent
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        contact.id,
        integration.user_id,
        parsedEvent.sessionId
      );

      // Handle chat started event
      if (parsedEvent.eventType === 'chat_started') {
        await this.handleChatStarted(conversation.id, parsedEvent, config);
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
          visitorId: parsedEvent.visitorId,
          pageUrl: parsedEvent.pageUrl,
          pageTitle: parsedEvent.pageTitle,
          messageType: parsedEvent.messageType,
          fileUrl: parsedEvent.fileUrl,
          fileName: parsedEvent.fileName,
          fileSize: parsedEvent.fileSize,
          timestamp: parsedEvent.timestamp
        });

        // Send auto-reply if enabled and this is the first message
        if (config.autoReply && config.autoReplyMessage) {
          await this.sendAutoReply(integration, conversation.id, parsedEvent.sessionId, config.autoReplyMessage);
        }
      }

      // Update analytics
      await this.updateAnalytics(integration.user_id, conversation.id);

      // Classify and route
      if (parsedEvent.content) {
        await this.classifyAndRouteMessage(conversation.id, parsedEvent.content, contact);
      }

    } catch (error) {
      console.error('Error processing website chat event:', error);
      throw error;
    }
  }

  // Test website chat connection
  async testConnection(config: WebsiteChatConfig): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (!config.widgetId || !config.websiteDomain || !config.businessName) {
        return { success: false, error: 'Widget ID, website domain, and business name are required' };
      }

      // Validate domain format
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(config.websiteDomain)) {
        return { success: false, error: 'Invalid domain format' };
      }

      // Generate API key if not provided
      if (!config.apiKey) {
        config.apiKey = this.generateApiKey();
      }

      return {
        success: true,
        info: {
          widgetId: config.widgetId,
          websiteDomain: config.websiteDomain,
          businessName: config.businessName,
          apiKey: config.apiKey,
          embedCode: this.generateEmbedCode(config),
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/api/messaging/integrations/website-chat/webhook`
        }
      };
    } catch (error: any) {
      console.error('Website chat connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate website chat configuration'
      };
    }
  }

  // Generate widget embed code
  generateEmbedCode(config: WebsiteChatConfig): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';
    
    return `<!-- Website Chat Widget -->
<script>
  (function() {
    window.WebsiteChatConfig = {
      widgetId: '${config.widgetId}',
      apiKey: '${config.apiKey}',
      domain: '${config.websiteDomain}',
      businessName: '${config.businessName}',
      welcomeMessage: '${config.welcomeMessage || 'Hello! How can we help you today?'}',
      position: '${config.chatPosition || 'bottom-right'}',
      primaryColor: '${config.primaryColor || '#007bff'}',
      autoReply: ${config.autoReply || false},
      autoReplyMessage: '${config.autoReplyMessage || ''}',
      offlineMessage: '${config.offlineMessage || 'We are currently offline. Please leave a message.'}',
      allowFileUpload: ${config.allowFileUpload || false},
      requireEmail: ${config.requireEmail || false},
      requireName: ${config.requireName || false}
    };
    
    var script = document.createElement('script');
    script.src = '${baseUrl}/api/messaging/integrations/website-chat/widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '${baseUrl}/api/messaging/integrations/website-chat/widget.css';
    document.head.appendChild(style);
  })();
</script>`;
  }

  // Generate API key
  private generateApiKey(): string {
    return 'wc_' + crypto.randomBytes(32).toString('hex');
  }

  // Get widget analytics
  async getWidgetAnalytics(config: WebsiteChatConfig, userId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get conversation count
      const { count: conversationCount } = await supabaseService
        .from('crm_conversations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('platform', 'website-chat')
        .gte('created_at', start)
        .lte('created_at', end);

      // Get message count
      const { count: messageCount } = await supabaseService
        .from('whatsapp_messages')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('platform', 'website-chat')
        .gte('timestamp', start)
        .lte('timestamp', end);

      // Get unique visitors
      const { count: visitorCount } = await supabaseService
        .from('crm_contacts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('platform', 'website-chat')
        .gte('created_at', start)
        .lte('created_at', end);

      // Get popular pages
      const { data: popularPages } = await supabaseService
        .from('whatsapp_messages')
        .select('metadata')
        .eq('user_id', userId)
        .eq('platform', 'website-chat')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .not('metadata->>pageUrl', 'is', null)
        .limit(100);

      const pageStats = {};
      popularPages?.forEach(msg => {
        const pageUrl = msg.metadata?.pageUrl;
        if (pageUrl) {
          pageStats[pageUrl] = (pageStats[pageUrl] || 0) + 1;
        }
      });

      const topPages = Object.entries(pageStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }));

      return {
        conversationCount: conversationCount || 0,
        messageCount: messageCount || 0,
        visitorCount: visitorCount || 0,
        topPages,
        period: { start, end }
      };
    } catch (error: any) {
      console.error('Error fetching widget analytics:', error);
      throw error;
    }
  }

  // Broadcast message to widget (would use WebSocket in production)
  private async broadcastMessageToWidget(messageData: any): Promise<void> {
    try {
      // In a real implementation, this would send the message via WebSocket/SSE
      // For now, we'll store it in a real-time messages table that the widget can poll
      await supabaseService
        .from('website_chat_realtime_messages')
        .insert({
          widget_id: messageData.widgetId,
          session_id: messageData.sessionId,
          message_id: messageData.messageId,
          content: messageData.content,
          sender_type: messageData.senderType,
          sender_name: messageData.senderName,
          timestamp: messageData.timestamp,
          delivered: false
        })
        .onError(() => {
          // Table might not exist yet, that's okay
          console.log('Real-time messages table not available');
        });

    } catch (error) {
      console.error('Error broadcasting message to widget:', error);
    }
  }

  // Send auto-reply
  private async sendAutoReply(integration: MessagingIntegration, conversationId: string, sessionId: string, autoReplyMessage: string): Promise<void> {
    try {
      // Check if auto-reply already sent for this session
      const { data: existingReply } = await supabaseService
        .from('whatsapp_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('platform', 'website-chat')
        .eq('direction', 'outbound')
        .like('metadata->>isAutoReply', 'true')
        .single();

      if (existingReply) {
        return; // Auto-reply already sent
      }

      // Send auto-reply
      const autoReplyMsg = {
        content: autoReplyMessage,
        platform: 'website-chat' as const,
        messageType: 'text' as const,
        senderType: 'system' as const,
        from: integration.config.businessName,
        to: sessionId,
        conversationId,
        sessionId
      };

      await this.sendMessage(integration, autoReplyMsg);
    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  }

  // Handle chat started event
  private async handleChatStarted(conversationId: string, parsedEvent: ParsedWebsiteChatEvent, config: WebsiteChatConfig): Promise<void> {
    try {
      // Store chat started event
      await supabaseService
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          message_text: 'Chat started',
          direction: 'inbound',
          message_type: 'system',
          platform: 'website-chat',
          platform_message_id: parsedEvent.messageId,
          metadata: {
            eventType: 'chat_started',
            pageUrl: parsedEvent.pageUrl,
            pageTitle: parsedEvent.pageTitle,
            userAgent: parsedEvent.userAgent,
            visitorIp: parsedEvent.visitorIp
          },
          timestamp: parsedEvent.timestamp
        });

      // Update conversation with page info
      await supabaseService
        .from('crm_conversations')
        .update({
          metadata: {
            pageUrl: parsedEvent.pageUrl,
            pageTitle: parsedEvent.pageTitle,
            userAgent: parsedEvent.userAgent,
            chatStarted: true
          }
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error handling chat started:', error);
    }
  }

  // Parse website chat event
  private async parseWebsiteChatEvent(payload: any): Promise<ParsedWebsiteChatEvent | null> {
    try {
      return {
        eventType: payload.eventType || payload.type || 'message',
        messageId: payload.messageId || payload.id || crypto.randomUUID(),
        sessionId: payload.sessionId || payload.session_id,
        visitorId: payload.visitorId || payload.visitor_id,
        visitorEmail: payload.visitorEmail || payload.visitor_email,
        visitorName: payload.visitorName || payload.visitor_name,
        visitorIp: payload.visitorIp || payload.visitor_ip,
        content: payload.content || payload.message || '',
        timestamp: payload.timestamp || new Date().toISOString(),
        pageUrl: payload.pageUrl || payload.page_url,
        pageTitle: payload.pageTitle || payload.page_title,
        userAgent: payload.userAgent || payload.user_agent,
        messageType: payload.messageType || payload.message_type || 'text',
        fileUrl: payload.fileUrl || payload.file_url,
        fileName: payload.fileName || payload.file_name,
        fileSize: payload.fileSize || payload.file_size
      };
    } catch (error) {
      console.error('Error parsing website chat event:', error);
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
          .eq('platform', 'website-chat')
          .eq('email', visitorInfo.email)
          .single();
        existingContact = emailContact;
      }

      if (!existingContact) {
        const { data: visitorContact } = await supabaseService
          .from('crm_contacts')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', 'website-chat')
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
          platform: 'website-chat',
          platform_id: visitorId,
          platform_username: visitorInfo.name || `Visitor ${visitorId.slice(-8)}`,
          display_name: visitorInfo.name || `Website Visitor`,
          email: visitorInfo.email,
          phone_number: visitorId, // Store visitor ID in phone_number for compatibility
          lifecycle_stage: 'lead',
          priority: 'medium',
          last_seen: new Date().toISOString(),
          metadata: {
            websiteChat: {
              visitorId: visitorId,
              visitorIp: visitorInfo.ip,
              userAgent: visitorInfo.userAgent,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating website chat contact:', error);
        throw error;
      }

      return newContact;
    } catch (error) {
      console.error('Error getting or creating website chat contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, sessionId: string): Promise<any> {
    try {
      // Check for existing conversation with same session
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'website-chat')
        .eq('platform_thread_id', sessionId)
        .eq('status', 'active')
        .single();

      if (existingConversation) {
        // Update conversation timestamp
        const { data: updatedConversation } = await supabaseService
          .from('crm_conversations')
          .update({ 
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
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
          platform: 'website-chat',
          platform_thread_id: sessionId,
          status: 'active',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating website chat conversation:', error);
        throw error;
      }

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating website chat conversation:', error);
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
          direction: 'inbound',
          message_type: messageData.messageType,
          is_from_bot: false,
          platform: 'website-chat',
          platform_message_id: messageData.platformMessageId,
          metadata: {
            sessionId: messageData.sessionId,
            visitorId: messageData.visitorId,
            pageUrl: messageData.pageUrl,
            pageTitle: messageData.pageTitle,
            fileUrl: messageData.fileUrl,
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            timestamp: messageData.timestamp,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing website chat message:', error);
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
      console.error('Error storing website chat message:', error);
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
          platform: 'website-chat',
          platform_message_id: messageData.platformMessageId,
          status: 'sent',
          metadata: {
            sessionId: messageData.sessionId,
            visitorId: messageData.visitorId,
            isAutoReply: messageData.isAutoReply || false,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound website chat message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound website chat message:', error);
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
      console.error('Error updating website chat analytics:', error);
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
        const salesKeywords = ['price', 'cost', 'buy', 'purchase', 'demo', 'trial', 'quote', 'sales'];
        
        const isUrgent = urgentKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        );
        
        const isSales = salesKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        );

        if (isUrgent) {
          return supabaseService
            .from('crm_conversations')
            .update({
              priority: 'high',
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
        } else if (isSales) {
          return supabaseService
            .from('crm_conversations')
            .update({
              priority: 'high',
              tags: ['sales'],
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
        }
      });
    } catch (error) {
      console.error('Error classifying website chat message:', error);
    }
  }
}

export const websiteChatProviderProduction = new WebsiteChatProviderProduction();
export default websiteChatProviderProduction;