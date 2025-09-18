import axios from 'axios';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { broadcastNewMessage } from '@/lib/services/realtime-broadcast';
import { AgentAutoReplyService } from '@/lib/services/agent-auto-reply-service';
import { n8nWebhookService } from '@/lib/n8n/webhook-service';

// Types for WhatsApp integration
export interface WhatsAppMessage {
  id?: string;
  conversationId?: string;
  whatsappMessageId?: string;
  senderType: 'customer' | 'agent' | 'system' | 'ai_agent';
  senderId?: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact';
  mediaUrl?: string;
  to: string;
  from: string;
  timestamp?: Date;
}

export interface WhatsAppWebhookPayload {
  messaging?: TwilioWebhookMessage[];
  // WhatsApp Business API webhook structure
  entry?: WhatsAppBusinessMessage[];
}

export interface TwilioWebhookMessage {
  AccountSid: string;
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  NumMedia: string;
}

export interface WhatsAppBusinessMessage {
  id: string;
  changes: Array<{
    value: {
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: 'text' | 'image' | 'audio' | 'video' | 'document';
        text?: { body: string };
        image?: { id: string; mime_type: string };
        audio?: { id: string; mime_type: string };
        video?: { id: string; mime_type: string };
        document?: { id: string; filename: string; mime_type: string };
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
      }>;
    };
  }>;
}

export interface WhatsAppIntegration {
  id: string;
  userId: string;
  provider: 'twilio' | 'whatsapp_business';
  phoneNumber: string;
  accountSid?: string;
  authToken?: string;
  businessAccountId?: string;
  webhookUrl?: string;
  status: 'active' | 'inactive' | 'error';
}

export interface Customer {
  id?: string;
  userId: string;
  whatsappNumber: string;
  name?: string;
  email?: string;
  profilePictureUrl?: string;
  lifecycleStage: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churned';
  acquisitionSource?: string;
  lastInteractionAt?: Date;
}

export interface Conversation {
  id?: string;
  userId: string;
  customerId: string;
  status: 'open' | 'pending' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'acquisition' | 'engagement' | 'retention' | 'support' | 'general';
  assignedAgentId?: string;
  assignedTeamId?: string;
  tags?: string[];
}

class WhatsAppService {
  private static instance: WhatsAppService;

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Send message via Twilio
  async sendMessageViaTwilio(
    accountSid: string,
    authToken: string,
    message: WhatsAppMessage
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const twilioClient = axios.create({
        baseURL: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`,
        auth: {
          username: accountSid,
          password: authToken,
        },
      });

      const payload: any = {
        From: `whatsapp:${message.from}`,
        To: `whatsapp:${message.to}`,
        Body: message.content,
      };

      if (message.mediaUrl && message.messageType !== 'text') {
        payload.MediaUrl = message.mediaUrl;
      }

      const response = await twilioClient.post('/Messages.json', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        transformRequest: [(data) => {
          return Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');
        }],
      });

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      console.error('Twilio send message error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Send message via WhatsApp Business API
  async sendMessageViaWhatsAppBusiness(
    businessAccountId: string,
    accessToken: string,
    message: WhatsAppMessage
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: message.messageType,
      };

      if (message.messageType === 'text') {
        payload.text = { body: message.content };
      } else if (message.mediaUrl) {
        payload[message.messageType] = {
          link: message.mediaUrl,
        };
        if (message.content) {
          payload[message.messageType].caption = message.content;
        }
      }

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${businessAccountId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      console.error('WhatsApp Business API send message error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  // Process incoming webhook from Twilio
  async processTwilioWebhook(payload: TwilioWebhookMessage): Promise<void> {
    try {
      const { From, To, Body, MessageSid, MediaUrl0, MediaContentType0, NumMedia } = payload;
      
      // Clean phone numbers (remove whatsapp: prefix)
      const customerPhone = From.replace('whatsapp:', '');
      const businessPhone = To.replace('whatsapp:', '');

      // Get or create customer
      const customer = await this.getOrCreateCustomer(customerPhone, businessPhone);
      
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(customer.id!, customer.userId);

      // Determine message type
      let messageType: WhatsAppMessage['messageType'] = 'text';
      let mediaUrl: string | undefined;
      
      if (parseInt(NumMedia) > 0 && MediaUrl0) {
        mediaUrl = MediaUrl0;
        if (MediaContentType0?.startsWith('image/')) messageType = 'image';
        else if (MediaContentType0?.startsWith('audio/')) messageType = 'audio';
        else if (MediaContentType0?.startsWith('video/')) messageType = 'video';
        else messageType = 'document';
      }

      // Store message in database
      await this.storeMessage({
        conversationId: conversation.id!,
        whatsappMessageId: MessageSid,
        senderType: 'customer',
        content: Body || '',
        messageType,
        mediaUrl,
        to: businessPhone,
        from: customerPhone,
      });

      // Classify message and update conversation
      await this.classifyAndRouteMessage(conversation.id!, Body || '', customer);

      // Broadcast real-time message update via Supabase Realtime
      try {
        await broadcastNewMessage(customer.userId, {
          conversationId: conversation.id!,
          platform: 'whatsapp',
          content: Body || '',
          messageType: messageType || 'text',
          direction: 'inbound',
          senderType: 'customer',
          contactId: customer.id,
          mediaUrl,
          platformMessageId: MessageSid,
          metadata: {
            twilio: {
              messageSid: MessageSid,
              from: From,
              to: To,
              numMedia: NumMedia,
              mediaContentType: MediaContentType0,
            }
          }
        });

        console.log('✅ Real-time WhatsApp message (Twilio) broadcasted successfully');
      } catch (broadcastError) {
        console.error('❌ Error broadcasting real-time WhatsApp message:', broadcastError);
      }

      // ✨ NEW: Trigger auto-reply if agent is assigned
      try {
        await AgentAutoReplyService.handleWebhookMessage(
          'whatsapp',
          conversation.id!,
          customer.userId,
          Body || '',
          customerPhone,
          {
            customerName: customer.name,
            customerPhone: customerPhone,
            platform: 'whatsapp'
          }
        );
      } catch (autoReplyError) {
        console.error('❌ Error in auto-reply processing:', autoReplyError);
        // Don't let auto-reply errors break the webhook
      }

      // 🚀 ENHANCED: Trigger comprehensive n8n workflows for fintech/insurance
      try {
        await this.triggerFinancialN8nWorkflows(conversation.id!, customer, Body || '', 'twilio');
      } catch (n8nError) {
        console.error('❌ Error triggering n8n workflows:', n8nError);
        // Don't let n8n errors break the webhook - critical for production
      }

    } catch (error) {
      console.error('Error processing Twilio webhook:', error);
      throw error;
    }
  }

  // Process incoming webhook from WhatsApp Business API
  async processWhatsAppBusinessWebhook(payload: WhatsAppBusinessMessage): Promise<void> {
    try {
      for (const entry of payload.changes) {
        if (entry.value.messages) {
          for (const message of entry.value.messages) {
            // Get customer phone and business phone
            const customerPhone = message.from;
            // You'd need to determine the business phone from the webhook or config
            const businessPhone = 'YOUR_BUSINESS_PHONE'; // This should come from your integration config

            // Get or create customer
            const customer = await this.getOrCreateCustomer(customerPhone, businessPhone);
            
            // Get or create conversation
            const conversation = await this.getOrCreateConversation(customer.id!, customer.userId);

            // Extract message content based on type
            let content = '';
            let mediaUrl: string | undefined;

            if (message.type === 'text' && message.text) {
              content = message.text.body;
            }
            // Handle media messages - you'd need to download media using Facebook Graph API
            
            // Store message in database
            await this.storeMessage({
              conversationId: conversation.id!,
              whatsappMessageId: message.id,
              senderType: 'customer',
              content,
              messageType: message.type as WhatsAppMessage['messageType'],
              mediaUrl,
              to: businessPhone,
              from: customerPhone,
            });

            // Classify message and update conversation
            await this.classifyAndRouteMessage(conversation.id!, content, customer);

            // Broadcast real-time message update via Supabase Realtime
            try {
              await broadcastNewMessage(customer.userId, {
                conversationId: conversation.id!,
                platform: 'whatsapp',
                content,
                messageType: message.type as any || 'text',
                direction: 'inbound',
                senderType: 'customer',
                contactId: customer.id,
                mediaUrl,
                platformMessageId: message.id,
                metadata: {
                  facebook: {
                    messageId: message.id,
                    timestamp: message.timestamp,
                    from: message.from,
                    type: message.type,
                  }
                }
              });

              console.log('✅ Real-time WhatsApp message (Facebook) broadcasted successfully');
            } catch (broadcastError) {
              console.error('❌ Error broadcasting real-time WhatsApp message:', broadcastError);
            }

            // ✨ NEW: Trigger auto-reply if agent is assigned
            try {
              await AgentAutoReplyService.handleWebhookMessage(
                'whatsapp',
                conversation.id!,
                customer.userId,
                content,
                customerPhone,
                {
                  customerName: customer.name,
                  customerPhone: customerPhone,
                  platform: 'whatsapp'
                }
              );
            } catch (autoReplyError) {
              console.error('❌ Error in auto-reply processing:', autoReplyError);
              // Don't let auto-reply errors break the webhook
            }

            // 🚀 ENHANCED: Trigger comprehensive n8n workflows for fintech/insurance
            try {
              await this.triggerFinancialN8nWorkflows(conversation.id!, customer, content, 'whatsapp_business');
            } catch (n8nError) {
              console.error('❌ Error triggering n8n workflows:', n8nError);
              // Don't let n8n errors break the webhook - critical for production
            }
          }
        }

        // Handle message status updates
        if (entry.value.statuses) {
          for (const status of entry.value.statuses) {
            await this.updateMessageStatus(status.id, status.status, new Date(parseInt(status.timestamp) * 1000));
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp Business webhook:', error);
      throw error;
    }
  }

  // Get or create customer
  private async getOrCreateCustomer(whatsappNumber: string, businessPhone: string): Promise<Customer> {
    try {
      // First, find the SPECIFIC user who owns this business phone number from messaging_integrations
      // CRITICAL: Must match the exact phone number to ensure proper tenant isolation
      const { data: integrations } = await supabase
        .from('messaging_integrations')
        .select('user_id, config')
        .eq('platform', 'whatsapp')
        .eq('status', 'active');

      if (!integrations || integrations.length === 0) {
        throw new Error(`No WhatsApp integrations found for business phone: ${businessPhone}`);
      }

      // Find the integration that matches this specific business phone number
      const matchingIntegration = integrations.find(int => 
        int.config?.phoneNumber === businessPhone ||
        int.config?.phoneNumber === `whatsapp:${businessPhone}` ||
        int.config?.phoneNumber === businessPhone.replace('whatsapp:', '')
      );

      if (!matchingIntegration) {
        console.error(`TENANT ISOLATION ERROR: No integration found for phone ${businessPhone}`);
        console.error(`Available integrations:`, integrations.map(i => ({
          user_id: i.user_id,
          phone: i.config?.phoneNumber
        })));
        throw new Error(`No WhatsApp integration found for business phone: ${businessPhone}`);
      }

      const userId = matchingIntegration.user_id;
      console.log(`✅ TENANT ISOLATION: Message for ${businessPhone} assigned to user ${userId}`);

      // Check if customer exists in crm_contacts table
      const { data: existingCustomer } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'whatsapp')
        .eq('platform_id', whatsappNumber)
        .single();

      if (existingCustomer) {
        // Update last interaction time
        await supabase
          .from('crm_contacts')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCustomer.id);

        return {
          id: existingCustomer.id,
          userId: existingCustomer.user_id,
          whatsappNumber: existingCustomer.phone_number,
          displayName: existingCustomer.display_name,
          profilePictureUrl: existingCustomer.profile_picture_url
        };
      }

      // Create new customer in crm_contacts table
      const { data: newCustomer, error } = await supabase
        .from('crm_contacts')
        .insert({
          user_id: userId,
          platform: 'whatsapp',
          platform_id: whatsappNumber,
          phone_number: whatsappNumber,
          display_name: whatsappNumber, // Default to phone number, can be updated later
          platform_username: null,
          whatsapp_name: null,
          lifecycle_stage: 'lead',
          priority: 'medium',
          lead_score: 0,
          is_blocked: false,
          tags: [],
          notes: null,
          metadata: {
            acquisition_source: 'whatsapp',
            first_contact: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: newCustomer.id,
        userId: newCustomer.user_id,
        whatsappNumber: newCustomer.phone_number,
        displayName: newCustomer.display_name,
        profilePictureUrl: newCustomer.profile_picture_url
      };
    } catch (error) {
      console.error('Error getting or creating customer:', error);
      throw error;
    }
  }

  // Get or create conversation
  private async getOrCreateConversation(customerId: string, userId: string): Promise<Conversation> {
    try {
      // Check for existing active conversation in crm_conversations
      const { data: existingConversation } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', customerId)
        .eq('platform', 'whatsapp')
        .eq('status', 'active')
        .single();

      if (existingConversation) {
        // Update conversation timestamp
        await supabase
          .from('crm_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingConversation.id);

        return {
          id: existingConversation.id,
          customerId: existingConversation.contact_id,
          status: existingConversation.status,
          platform: existingConversation.platform
        };
      }

      // Create new conversation in crm_conversations
      const { data: newConversation, error } = await supabase
        .from('crm_conversations')
        .insert({
          user_id: userId,
          contact_id: customerId,
          platform: 'whatsapp',
          status: 'active',
          priority: 'medium',
          category: 'general',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: newConversation.id,
        customerId: newConversation.contact_id,
        status: newConversation.status,
        platform: newConversation.platform
      };
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  // Store message in database
  private async storeMessage(message: Partial<WhatsAppMessage> & { conversationId: string }): Promise<void> {
    try {
      // Get integration info to determine user_id and contact_id
      const { data: integration } = await supabase
        .from('messaging_integrations')
        .select('user_id')
        .eq('platform', 'whatsapp')
        .eq('status', 'active')
        .single();

      if (!integration) {
        throw new Error('No active WhatsApp integration found');
      }

      // Get contact_id from the customer phone number
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('user_id', integration.user_id)
        .eq('platform', 'whatsapp')
        .eq('platform_id', message.from)
        .single();

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          user_id: integration.user_id,
          conversation_id: message.conversationId,
          contact_id: contact?.id,
          message_text: message.content,
          direction: message.senderType === 'customer' ? 'inbound' : 'outbound',
          message_type: message.messageType || 'text',
          media_url: message.mediaUrl,
          agent_id: message.senderType === 'agent' ? message.senderId : null,
          is_from_bot: message.senderType === 'ai_agent',
          bot_name: message.senderType === 'ai_agent' ? 'AI Assistant' : null,
          status: 'delivered',
          timestamp: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
          metadata: {
            from: message.from,
            to: message.to,
            whatsapp_message_id: message.whatsappMessageId
          },
          created_at: new Date().toISOString(),
          platform: 'whatsapp',
          platform_message_id: message.whatsappMessageId,
          reply_to_message_id: null
        });

      if (error) throw error;
      
      console.log('✅ WhatsApp message stored successfully in whatsapp_messages table');
    } catch (error) {
      console.error('Error storing WhatsApp message:', error);
      throw error;
    }
  }

  // Classify message and route to appropriate team/agent using advanced AI classification
  private async classifyAndRouteMessage(conversationId: string, content: string, customer: Customer): Promise<void> {
    try {
      // Import the message classifier dynamically to avoid circular dependencies
      const { messageClassifier } = await import('@/lib/message-classifier');
      
      // Build classification context
      const context = await this.buildClassificationContext(conversationId, customer);
      
      // Use AI-powered classification
      const classification = await messageClassifier.classifyMessage(content, context);

      // Update conversation with classification
      await supabase
        .from('crm_conversations')
        .update({
          priority: classification.priority,
          category: classification.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Update message with detailed classification
      await supabase
        .from('whatsapp_messages')
        .update({
          classification: classification,
          sentiment: classification.sentiment,
          urgency_score: classification.urgency_score,
          intent: classification.intent,
        })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Apply routing rules with enhanced data
      await this.applyRoutingRules(
        conversationId, 
        content, 
        classification.category, 
        classification.priority,
        classification
      );

      // Handle escalation if recommended
      if (classification.escalation_recommended) {
        await this.handleEscalation(conversationId, classification);
      }

    } catch (error) {
      console.error('Error classifying and routing message:', error);
      // Fallback to basic classification if AI fails
      await this.basicClassifyAndRoute(conversationId, content, customer);
    }
  }

  // Build classification context for AI
  private async buildClassificationContext(conversationId: string, customer: Customer) {
    try {
      // Get conversation details
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      // Get message count for this conversation
      const { count: messageCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId);

      // Get customer's conversation history
      const { count: totalConversations } = await supabase
        .from('crm_conversations')
        .select('*', { count: 'exact' })
        .eq('customer_id', customer.id);

      // Calculate last interaction days
      const lastInteractionDays = customer.lastInteractionAt
        ? Math.floor((Date.now() - new Date(customer.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Get recent classifications
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select('classification')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      const previousClassifications = recentMessages
        ?.map(m => m.classification?.category)
        .filter(Boolean) || [];

      // Business hours check
      const now = new Date();
      const hour = now.getHours();
      const isBusinessHours = hour >= 9 && hour <= 17;

      return {
        customerHistory: {
          totalConversations: totalConversations || 0,
          lastInteractionDays,
          previousPurchases: customer.lifecycleStage === 'customer',
          averageResponseTime: 300, // Default - would calculate from actual data
        },
        businessContext: {
          businessHours: isBusinessHours,
          currentLoad: 'medium', // Would determine from system metrics
          availableAgents: 5, // Would get from actual agent availability
        },
        messageContext: {
          isFirstMessage: (messageCount || 0) === 0,
          conversationLength: messageCount || 0,
          previousClassifications,
        },
      };
    } catch (error) {
      console.error('Error building classification context:', error);
      return {};
    }
  }

  // Handle escalation
  private async handleEscalation(conversationId: string, classification: any): Promise<void> {
    try {
      // Add escalation tag
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('tags')
        .eq('id', conversationId)
        .single();

      const tags = conversation?.tags || [];
      if (!tags.includes('escalated')) {
        tags.push('escalated');
        
        await supabase
          .from('crm_conversations')
          .update({
            status: 'escalated',
            tags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }

      // You could also notify supervisors here
      console.log(`Conversation ${conversationId} escalated due to: ${classification.intent}`);
      
    } catch (error) {
      console.error('Error handling escalation:', error);
    }
  }

  // Fallback basic classification
  private async basicClassifyAndRoute(conversationId: string, content: string, customer: Customer): Promise<void> {
    // Keep the original basic classification as fallback
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'help'];
    const salesKeywords = ['price', 'cost', 'buy', 'purchase', 'quote', 'demo'];
    const supportKeywords = ['bug', 'error', 'problem', 'issue', 'not working'];

    let priority: Conversation['priority'] = 'medium';
    let category: Conversation['category'] = 'general';
    let urgencyScore = 0;

    // Check for urgent keywords
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    if (hasUrgentKeywords) {
      priority = 'urgent';
      urgencyScore = 9;
    }

    // Classify category
    if (salesKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      category = 'acquisition';
      if (customer.lifecycleStage === 'unknown' || customer.lifecycleStage === 'lead') {
        priority = priority === 'urgent' ? 'urgent' : 'high';
      }
    } else if (supportKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      category = 'support';
      urgencyScore = Math.max(urgencyScore, 6);
    }

    // Update conversation
    await supabase
      .from('crm_conversations')
      .update({
        priority,
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Update message
    await supabase
      .from('whatsapp_messages')
      .update({
        classification: {
          category,
          priority,
          urgency_score: urgencyScore,
          keywords_matched: this.extractMatchedKeywords(content, [...urgentKeywords, ...salesKeywords, ...supportKeywords]),
        },
        urgency_score: urgencyScore,
      })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Apply routing rules
    await this.applyRoutingRules(conversationId, content, category, priority);
  }

  // Extract matched keywords
  private extractMatchedKeywords(content: string, keywords: string[]): string[] {
    return keywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  // Apply routing rules
  private async applyRoutingRules(
    conversationId: string, 
    content: string, 
    category: string, 
    priority: string,
    classification?: any
  ): Promise<void> {
    try {
      // Get conversation to find user_id
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      // Get routing rules for this user
      const { data: rules } = await supabase
        .from('routing_rules')
        .select('*')
        .eq('user_id', conversation.user_id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!rules) return;

      for (const rule of rules) {
        const conditions = rule.conditions;
        const actions = rule.actions;

        // Check if conditions match
        let matches = true;

        if (conditions.keywords) {
          const hasMatchingKeyword = conditions.keywords.some((keyword: string) =>
            content.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasMatchingKeyword) matches = false;
        }

        if (conditions.category && conditions.category !== category) {
          matches = false;
        }

        if (conditions.priority && conditions.priority !== priority) {
          matches = false;
        }

        // If conditions match, apply actions
        if (matches) {
          const updateData: any = {};

          if (actions.priority) {
            updateData.priority = actions.priority;
          }

          if (actions.category) {
            updateData.category = actions.category;
          }

          if (actions.assign_to_team) {
            // Find team by name
            const { data: team } = await supabase
              .from('teams')
              .select('id')
              .eq('user_id', conversation.user_id)
              .eq('name', actions.assign_to_team)
              .single();
            
            if (team) {
              updateData.assigned_team_id = team.id;
            }
          }

          if (actions.assign_to_agent) {
            // Find agent by name
            const { data: agent } = await supabase
              .from('agents')
              .select('id')
              .eq('user_id', conversation.user_id)
              .eq('name', actions.assign_to_agent)
              .single();
            
            if (agent) {
              updateData.assigned_agent_id = agent.id;
            }
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();
            
            await supabase
              .from('crm_conversations')
              .update(updateData)
              .eq('id', conversationId);
          }

          // Only apply first matching rule
          break;
        }
      }
    } catch (error) {
      console.error('Error applying routing rules:', error);
    }
  }

  // Update message status (for WhatsApp Business API)
  private async updateMessageStatus(
    whatsappMessageId: string, 
    status: 'sent' | 'delivered' | 'read' | 'failed',
    timestamp: Date
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (status === 'delivered') {
        updateData.delivered_at = timestamp.toISOString();
      } else if (status === 'read') {
        updateData.read_at = timestamp.toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('whatsapp_messages')
          .update(updateData)
          .eq('whatsapp_message_id', whatsappMessageId);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Get WhatsApp integration for user
  async getWhatsAppIntegration(userId: string): Promise<WhatsAppIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('messaging_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'whatsapp')
        .eq('status', 'active')
        .single();

      if (error || !data) return null;
      
      // Convert from messaging_integrations format to WhatsAppIntegration format
      return {
        id: data.id,
        userId: data.user_id,
        provider: data.provider as 'twilio' | 'whatsapp_business',
        phoneNumber: data.config?.phoneNumber || '',
        accountSid: data.config?.accountSid,
        authToken: data.config?.authToken,
        businessAccountId: data.config?.businessAccountId,
        webhookUrl: data.webhook_url,
        status: data.status as 'active' | 'inactive' | 'error',
      };
    } catch (error) {
      console.error('Error getting WhatsApp integration:', error);
      return null;
    }
  }

  // Send message (automatically determines provider)
  async sendMessage(userId: string, message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const integration = await this.getWhatsAppIntegration(userId);
      if (!integration) {
        return { success: false, error: 'No active WhatsApp integration found' };
      }

      let result;
      if (integration.provider === 'twilio') {
        result = await this.sendMessageViaTwilio(
          integration.accountSid!,
          integration.authToken!,
          message
        );
      } else if (integration.provider === 'whatsapp_business') {
        result = await this.sendMessageViaWhatsAppBusiness(
          integration.businessAccountId!,
          integration.authToken!, // This would be the access token
          message
        );
      } else {
        return { success: false, error: 'Unsupported provider' };
      }

      // Store sent message in database if successful
      if (result.success && message.conversationId) {
        await this.storeMessage({
          ...message,
          whatsappMessageId: result.messageId,
          senderType: message.senderType || 'agent',
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🚀 COMPREHENSIVE FINANCIAL N8N WORKFLOWS
   * Triggers advanced fintech/insurance automation for every customer interaction
   */
  private async triggerFinancialN8nWorkflows(
    conversationId: string,
    customer: Customer,
    messageContent: string,
    provider: 'twilio' | 'whatsapp_business'
  ): Promise<void> {
    try {
      // Get organization context for tenant isolation
      const organizationId = await this.getOrganizationId(customer.userId);
      if (!organizationId) return;

      // Get customer financial profile
      const customerProfile = await this.buildFinancialCustomerProfile(customer.id!);

      // Get conversation context
      const conversationContext = await this.buildConversationContext(conversationId);

      // 1. 🎯 ADVANCED LEAD SCORING for Financial Services
      await n8nWebhookService.triggerFinancialLeadScoring({
        conversation_id: conversationId,
        organization_id: organizationId,
        customer_data: customerProfile,
        interaction_data: {
          message_content: messageContent,
          sentiment_score: await this.calculateSentiment(messageContent),
          intent: await this.detectFinancialIntent(messageContent),
          urgency_level: await this.calculateUrgencyLevel(messageContent, customerProfile)
        }
      });

      // 2. 🏢 OMNICHANNEL CUSTOMER JOURNEY ORCHESTRATION
      await n8nWebhookService.triggerOmnichannelOrchestration({
        customer_id: customer.id!,
        organization_id: organizationId,
        current_channel: 'whatsapp',
        customer_journey_stage: await this.determineJourneyStage(customer, messageContent),
        interaction_history: conversationContext.interaction_history,
        preferences: {
          preferred_channel: 'whatsapp',
          preferred_time: this.getCurrentTimePreference(),
          language: await this.detectLanguage(messageContent),
          communication_frequency: customerProfile.communication_preference || 'medium'
        }
      });

      // 3. 🛡️ INTELLIGENT SUPPORT ESCALATION for Financial Issues
      const escalationData = await this.analyzeEscalationNeeds(messageContent, customerProfile);
      if (escalationData.requiresEscalation) {
        await n8nWebhookService.triggerSupportEscalation({
          conversation_id: conversationId,
          organization_id: organizationId,
          customer_tier: this.determineCustomerTier(customerProfile),
          issue_type: escalationData.issue_type,
          urgency_score: escalationData.urgency_score,
          ai_confidence: escalationData.ai_confidence,
          customer_sentiment: escalationData.sentiment_score,
          financial_impact: escalationData.financial_impact,
          regulatory_sensitive: escalationData.regulatory_sensitive
        });
      }

      // 4. 📊 REAL-TIME BUSINESS INTELLIGENCE
      await n8nWebhookService.triggerBIAnalytics({
        organization_id: organizationId,
        analytics_type: 'customer_lifetime_value',
        data_sources: ['whatsapp_conversations', 'customer_profiles', 'transaction_history'],
        time_period: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        },
        business_metrics: await this.getBusinessMetrics(organizationId)
      });

      // 5. 💰 DYNAMIC PRICING for Insurance/Investment Products
      if (await this.isPricingInquiry(messageContent)) {
        await n8nWebhookService.triggerDynamicPricing({
          customer_id: customer.id!,
          organization_id: organizationId,
          product_type: await this.detectProductType(messageContent),
          customer_profile: customerProfile,
          market_conditions: await this.getMarketConditions()
        });
      }

      // 6. ⚖️ KYC/AML COMPLIANCE MONITORING
      await n8nWebhookService.triggerComplianceMonitoring({
        organization_id: organizationId,
        event_type: 'conversation',
        compliance_category: 'kyc',
        event_data: {
          entity_id: conversationId,
          entity_type: 'conversation',
          action_performed: 'message_received',
          user_id: customer.userId,
          timestamp: new Date().toISOString(),
          data_changed: {
            message_content: messageContent,
            customer_profile: customerProfile,
            interaction_channel: 'whatsapp'
          }
        },
        risk_indicators: {
          unusual_pattern: await this.detectUnusualPatterns(customer.id!, messageContent),
          threshold_breach: customerProfile.risk_score > 8,
          regulatory_deadline: await this.getNextComplianceDeadline(organizationId)
        }
      });

      // 7. 🎯 PROACTIVE CUSTOMER SUCCESS
      await n8nWebhookService.triggerCustomerSuccess({
        customer_id: customer.id!,
        organization_id: organizationId,
        success_metrics: {
          policy_utilization: customerProfile.policy_utilization || 0,
          claim_frequency: customerProfile.claim_frequency || 0,
          payment_history_score: customerProfile.payment_history_score || 10,
          engagement_score: conversationContext.engagement_score,
          satisfaction_score: customerProfile.satisfaction_score || 8
        },
        risk_indicators: {
          churn_probability: customerProfile.churn_probability || 0.1,
          fraud_risk_score: customerProfile.fraud_risk_score || 0,
          default_risk_score: customerProfile.default_risk_score || 0,
          regulatory_risk: customerProfile.regulatory_risk || false
        },
        lifecycle_stage: this.mapLifecycleStage(customer.lifecycleStage),
        portfolio_value: customerProfile.portfolio_value || 0
      });

      // 8. 📈 CAMPAIGN ATTRIBUTION & ROI TRACKING
      await n8nWebhookService.triggerCampaignAttribution({
        organization_id: organizationId,
        campaign_data: {
          campaign_id: conversationContext.acquisition_campaign || 'organic_whatsapp',
          campaign_type: 'acquisition',
          channel: 'whatsapp',
          targeting_criteria: customerProfile.demographics,
          budget_allocated: conversationContext.campaign_budget || 0
        },
        conversion_events: [{
          customer_id: customer.id!,
          event_type: 'lead',
          value: await this.calculateInteractionValue(messageContent, customerProfile),
          timestamp: new Date().toISOString(),
          attribution_path: ['whatsapp', 'ai_agent']
        }],
        financial_metrics: {
          customer_acquisition_cost: conversationContext.acquisition_cost || 50,
          lifetime_value: customerProfile.estimated_ltv || 5000,
          policy_value: customerProfile.current_policy_value || 0,
          commission_paid: customerProfile.total_commissions || 0
        }
      });

      // 9. 🏦 ENTERPRISE SYSTEM INTEGRATION
      if (customerProfile.requires_crm_sync || customerProfile.policy_changes_pending) {
        await n8nWebhookService.triggerEnterpriseIntegration({
          organization_id: organizationId,
          integration_type: 'crm_sync',
          target_system: 'salesforce', // Could be dynamic based on org config
          operation: 'update',
          entity_data: {
            customer_id: customer.id,
            conversation_data: conversationContext,
            updated_fields: ['last_interaction', 'engagement_score', 'lead_score']
          },
          business_rules: {
            approval_required: false,
            validation_rules: ['customer_exists', 'data_complete'],
            workflow_stage: 'active_conversation'
          }
        });
      }

      // 10. 📋 SPECIALIZED INSURANCE WORKFLOWS
      if (await this.isInsuranceRelated(messageContent)) {
        // Insurance Quote Generation
        if (await this.isQuoteRequest(messageContent)) {
          await n8nWebhookService.triggerInsuranceQuoting({
            quote_request_id: `quote_${conversationId}_${Date.now()}`,
            organization_id: organizationId,
            customer_id: customer.id!,
            product_type: await this.detectInsuranceType(messageContent),
            customer_profile: customerProfile,
            coverage_requirements: await this.extractCoverageRequirements(messageContent),
            underwriting_data: {
              risk_factors: customerProfile.risk_factors || [],
              medical_history: customerProfile.medical_history,
              driving_record: customerProfile.driving_record,
              property_details: customerProfile.property_details
            }
          });
        }

        // Claims Processing
        if (await this.isClaimSubmission(messageContent)) {
          await n8nWebhookService.triggerClaimsProcessing({
            claim_id: `claim_${conversationId}_${Date.now()}`,
            organization_id: organizationId,
            customer_id: customer.id!,
            policy_id: customerProfile.primary_policy_id || '',
            claim_type: await this.detectClaimType(messageContent),
            claim_amount: await this.extractClaimAmount(messageContent),
            incident_data: {
              date_of_loss: await this.extractIncidentDate(messageContent),
              description: messageContent,
              supporting_documents: [],
              witnesses: []
            },
            fraud_indicators: {
              risk_score: await this.calculateFraudRisk(messageContent, customerProfile),
              suspicious_patterns: await this.detectSuspiciousPatterns(messageContent),
              requires_investigation: await this.requiresInvestigation(messageContent, customerProfile)
            }
          });
        }
      }

      // 11. 💼 INVESTMENT & WEALTH MANAGEMENT
      if (await this.isInvestmentRelated(messageContent)) {
        await n8nWebhookService.triggerInvestmentRecommendations({
          customer_id: customer.id!,
          organization_id: organizationId,
          financial_profile: {
            risk_tolerance: customerProfile.risk_tolerance || 'moderate',
            investment_goals: customerProfile.investment_goals || ['growth'],
            time_horizon: customerProfile.investment_horizon || 5,
            current_portfolio: customerProfile.current_portfolio || [],
            available_capital: customerProfile.liquid_assets || 0
          },
          market_conditions: await this.getMarketConditions(),
          regulatory_constraints: {
            suitability_requirements: ['kyc_verified', 'risk_assessed'],
            disclosure_needed: true,
            cooling_off_period: customerProfile.requires_cooling_off || false
          }
        });
      }

      console.log(`✅ Triggered comprehensive n8n financial workflows for conversation ${conversationId}`);

    } catch (error) {
      console.error('❌ Error in comprehensive financial n8n workflows:', error);
      // Log for debugging but don't break the main flow
      throw error; // Re-throw to be caught by the main webhook handler
    }
  }

  // Helper methods for financial workflows
  private async getOrganizationId(userId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('uid', userId)
        .single();
      return data?.organization_id || null;
    } catch {
      return null;
    }
  }

  private async buildFinancialCustomerProfile(customerId: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('crm_contacts')
        .select(`
          *,
          financial_profile:customer_financial_profiles(*)
        `)
        .eq('id', customerId)
        .single();

      return {
        customer_id: customerId,
        risk_profile: data?.financial_profile?.risk_profile || 'medium',
        aml_status: data?.financial_profile?.aml_status || 'pending',
        kyc_status: data?.financial_profile?.kyc_status || 'incomplete',
        credit_score: data?.financial_profile?.credit_score,
        annual_income: data?.financial_profile?.annual_income,
        policy_value: data?.financial_profile?.total_policy_value,
        claim_history: data?.financial_profile?.claim_count || 0,
        risk_score: data?.lead_score || 5,
        communication_preference: data?.metadata?.communication_preference || 'medium',
        // Additional fintech/insurance specific fields
        portfolio_value: data?.financial_profile?.portfolio_value || 0,
        policy_utilization: data?.financial_profile?.policy_utilization || 0,
        claim_frequency: data?.financial_profile?.claim_frequency || 0,
        payment_history_score: data?.financial_profile?.payment_history_score || 10,
        satisfaction_score: data?.financial_profile?.satisfaction_score || 8,
        churn_probability: data?.financial_profile?.churn_probability || 0.1,
        fraud_risk_score: data?.financial_profile?.fraud_risk_score || 0,
        default_risk_score: data?.financial_profile?.default_risk_score || 0,
        regulatory_risk: data?.financial_profile?.regulatory_risk || false,
        estimated_ltv: data?.financial_profile?.estimated_ltv || 5000,
        current_policy_value: data?.financial_profile?.current_policy_value || 0,
        total_commissions: data?.financial_profile?.total_commissions || 0,
        requires_crm_sync: data?.metadata?.requires_crm_sync || false,
        policy_changes_pending: data?.metadata?.policy_changes_pending || false,
        risk_factors: data?.financial_profile?.risk_factors || [],
        medical_history: data?.financial_profile?.medical_history,
        driving_record: data?.financial_profile?.driving_record,
        property_details: data?.financial_profile?.property_details,
        primary_policy_id: data?.financial_profile?.primary_policy_id,
        risk_tolerance: data?.financial_profile?.risk_tolerance || 'moderate',
        investment_goals: data?.financial_profile?.investment_goals || ['growth'],
        investment_horizon: data?.financial_profile?.investment_horizon || 5,
        current_portfolio: data?.financial_profile?.current_portfolio || [],
        liquid_assets: data?.financial_profile?.liquid_assets || 0,
        requires_cooling_off: data?.financial_profile?.requires_cooling_off || false,
        demographics: {
          age: data?.financial_profile?.age,
          income_bracket: data?.financial_profile?.income_bracket,
          education: data?.financial_profile?.education,
          occupation: data?.financial_profile?.occupation
        }
      };
    } catch (error) {
      console.error('Error building financial customer profile:', error);
      return {
        customer_id: customerId,
        risk_profile: 'medium',
        aml_status: 'pending',
        kyc_status: 'incomplete',
        risk_score: 5
      };
    }
  }

  private async buildConversationContext(conversationId: string): Promise<any> {
    try {
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      const interactionHistory = messages?.map(msg => ({
        channel: 'whatsapp',
        timestamp: msg.created_at,
        interaction_type: msg.direction,
        outcome: msg.classification?.category || 'general'
      })) || [];

      return {
        interaction_history: interactionHistory,
        engagement_score: this.calculateEngagementScore(messages || []),
        acquisition_campaign: 'organic_whatsapp', // Would be dynamic
        campaign_budget: 0,
        acquisition_cost: 50
      };
    } catch (error) {
      return {
        interaction_history: [],
        engagement_score: 5,
        acquisition_campaign: 'organic_whatsapp',
        campaign_budget: 0,
        acquisition_cost: 50
      };
    }
  }

  // AI-powered analysis methods (simplified implementations - would use actual ML models)
  private async calculateSentiment(message: string): Promise<number> {
    // Simplified sentiment analysis - in production, use actual AI models
    const positiveWords = ['great', 'excellent', 'good', 'thanks', 'perfect', 'love'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'problem', 'issue', 'frustrated'];

    const lowerMessage = message.toLowerCase();
    let score = 5; // neutral

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 1;
    });

    return Math.max(0, Math.min(10, score));
  }

  private async detectFinancialIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'pricing_inquiry';
    }
    if (lowerMessage.includes('claim') || lowerMessage.includes('accident') || lowerMessage.includes('damage')) {
      return 'claim_submission';
    }
    if (lowerMessage.includes('invest') || lowerMessage.includes('portfolio') || lowerMessage.includes('return')) {
      return 'investment_inquiry';
    }
    if (lowerMessage.includes('policy') || lowerMessage.includes('coverage') || lowerMessage.includes('premium')) {
      return 'policy_inquiry';
    }

    return 'general_inquiry';
  }

  private async calculateUrgencyLevel(message: string, customerProfile: any): Promise<number> {
    let urgency = 3; // baseline

    const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'immediately'];
    const claimKeywords = ['claim', 'accident', 'theft', 'damage', 'incident'];

    if (urgentKeywords.some(word => message.toLowerCase().includes(word))) {
      urgency += 3;
    }

    if (claimKeywords.some(word => message.toLowerCase().includes(word))) {
      urgency += 2;
    }

    // High-value customers get priority
    if (customerProfile.portfolio_value > 100000) {
      urgency += 1;
    }

    return Math.min(10, urgency);
  }

  private async determineJourneyStage(customer: Customer, message: string): Promise<string> {
    if (customer.lifecycleStage === 'unknown') return 'awareness';
    if (customer.lifecycleStage === 'lead') return 'consideration';
    if (customer.lifecycleStage === 'prospect') return 'application';
    if (customer.lifecycleStage === 'customer') {
      if (message.toLowerCase().includes('claim')) return 'claims';
      if (message.toLowerCase().includes('renew')) return 'renewal';
      return 'policy_active';
    }
    return 'awareness';
  }

  private getCurrentTimePreference(): string {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 12) return 'morning';
    if (hour >= 13 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 21) return 'evening';
    return 'flexible';
  }

  private async detectLanguage(message: string): Promise<string> {
    // Simplified language detection - in production, use proper language detection
    if (/[^\x00-\x7F]/.test(message)) {
      return 'non-english'; // Contains non-ASCII characters
    }
    return 'english';
  }

  private async analyzeEscalationNeeds(message: string, customerProfile: any): Promise<any> {
    const escalationKeywords = ['complaint', 'unsatisfied', 'manager', 'escalate', 'legal', 'regulatory'];
    const requiresEscalation = escalationKeywords.some(word =>
      message.toLowerCase().includes(word)
    ) || customerProfile.portfolio_value > 500000; // High-value customers

    return {
      requiresEscalation,
      issue_type: await this.detectIssueType(message),
      urgency_score: await this.calculateUrgencyLevel(message, customerProfile),
      ai_confidence: 0.85,
      sentiment_score: await this.calculateSentiment(message),
      financial_impact: this.calculateFinancialImpact(message, customerProfile),
      regulatory_sensitive: this.isRegulatorySensitive(message)
    };
  }

  private async detectIssueType(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('claim')) return 'claims';
    if (lowerMessage.includes('bill') || lowerMessage.includes('payment')) return 'billing';
    if (lowerMessage.includes('policy') || lowerMessage.includes('coverage')) return 'product_inquiry';
    if (lowerMessage.includes('technical') || lowerMessage.includes('app') || lowerMessage.includes('website')) return 'technical';
    if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation')) return 'compliance';
    if (lowerMessage.includes('fraud') || lowerMessage.includes('suspicious')) return 'fraud_alert';
    return 'general';
  }

  private calculateFinancialImpact(message: string, customerProfile: any): number {
    // Calculate potential financial impact based on customer value and issue type
    let impact = customerProfile.portfolio_value * 0.001; // Base impact

    if (message.toLowerCase().includes('claim')) {
      impact *= 5; // Claims have higher financial impact
    }
    if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('leave')) {
      impact = customerProfile.estimated_ltv || 5000; // Churn impact
    }

    return Math.max(0, impact);
  }

  private isRegulatorySensitive(message: string): boolean {
    const regulatoryKeywords = ['compliance', 'regulation', 'audit', 'investigation', 'violation', 'breach'];
    return regulatoryKeywords.some(word => message.toLowerCase().includes(word));
  }

  private determineCustomerTier(customerProfile: any): 'basic' | 'premium' | 'enterprise' {
    if (customerProfile.portfolio_value > 500000) return 'enterprise';
    if (customerProfile.portfolio_value > 50000) return 'premium';
    return 'basic';
  }

  private async getBusinessMetrics(organizationId: string): Promise<any> {
    // In production, this would fetch real metrics from your analytics
    return {
      customer_acquisition_cost: 450,
      average_policy_value: 12000,
      claims_ratio: 0.15,
      retention_rate: 0.85
    };
  }

  // Product and intent detection methods
  private async isPricingInquiry(message: string): Promise<boolean> {
    const pricingKeywords = ['price', 'cost', 'quote', 'premium', 'rate', 'how much'];
    return pricingKeywords.some(word => message.toLowerCase().includes(word));
  }

  private async detectProductType(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('life insurance') || lowerMessage.includes('life policy')) return 'life_insurance';
    if (lowerMessage.includes('health insurance') || lowerMessage.includes('medical')) return 'health_insurance';
    if (lowerMessage.includes('auto') || lowerMessage.includes('car') || lowerMessage.includes('vehicle')) return 'auto_insurance';
    if (lowerMessage.includes('invest') || lowerMessage.includes('mutual fund') || lowerMessage.includes('stocks')) return 'investment';
    if (lowerMessage.includes('loan') || lowerMessage.includes('mortgage') || lowerMessage.includes('credit')) return 'loan';
    return 'general_insurance';
  }

  private async getMarketConditions(): Promise<any> {
    // In production, this would fetch real market data
    return {
      interest_rates: 4.5,
      market_volatility: 0.15,
      competitor_pricing: [10000, 12000, 15000]
    };
  }

  private async detectUnusualPatterns(customerId: string, message: string): Promise<boolean> {
    // Simplified pattern detection - in production, use ML models
    const suspiciousPatterns = ['urgent money', 'quick cash', 'emergency loan', 'immediate payout'];
    return suspiciousPatterns.some(pattern => message.toLowerCase().includes(pattern));
  }

  private async getNextComplianceDeadline(organizationId: string): Promise<string> {
    // Return next regulatory deadline - would be dynamic in production
    const nextQuarter = new Date();
    nextQuarter.setMonth(nextQuarter.getMonth() + 3);
    return nextQuarter.toISOString();
  }

  private mapLifecycleStage(stage: string): string {
    const mapping: any = {
      'unknown': 'onboarding',
      'lead': 'onboarding',
      'prospect': 'active',
      'customer': 'active',
      'churned': 'churned'
    };
    return mapping[stage] || 'onboarding';
  }

  private async calculateInteractionValue(message: string, customerProfile: any): Promise<number> {
    let value = 10; // Base interaction value

    if (await this.isPricingInquiry(message)) value += 50;
    if (message.toLowerCase().includes('buy') || message.toLowerCase().includes('purchase')) value += 100;

    // Scale by customer tier
    if (customerProfile.portfolio_value > 100000) value *= 2;
    if (customerProfile.portfolio_value > 500000) value *= 5;

    return value;
  }

  private calculateEngagementScore(messages: any[]): number {
    if (messages.length === 0) return 1;

    // Simple engagement calculation based on message frequency and recency
    const recentMessages = messages.filter(msg => {
      const messageDate = new Date(msg.created_at);
      const daysDiff = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Messages from last 7 days
    });

    return Math.min(10, recentMessages.length);
  }

  // Insurance-specific methods
  private async isInsuranceRelated(message: string): Promise<boolean> {
    const insuranceKeywords = ['insurance', 'policy', 'coverage', 'premium', 'claim', 'deductible', 'beneficiary'];
    return insuranceKeywords.some(word => message.toLowerCase().includes(word));
  }

  private async isQuoteRequest(message: string): Promise<boolean> {
    const quoteKeywords = ['quote', 'estimate', 'price', 'cost', 'premium', 'rate'];
    return quoteKeywords.some(word => message.toLowerCase().includes(word));
  }

  private async detectInsuranceType(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('auto') || lowerMessage.includes('car') || lowerMessage.includes('vehicle')) return 'auto';
    if (lowerMessage.includes('home') || lowerMessage.includes('house') || lowerMessage.includes('property')) return 'home';
    if (lowerMessage.includes('life') || lowerMessage.includes('term')) return 'life';
    if (lowerMessage.includes('health') || lowerMessage.includes('medical')) return 'health';
    if (lowerMessage.includes('business') || lowerMessage.includes('commercial')) return 'commercial';
    return 'auto'; // Default
  }

  private async extractCoverageRequirements(message: string): Promise<any> {
    // Extract coverage details from message - simplified implementation
    const amount = message.match(/\$?([\d,]+)/);
    return {
      coverage_amount: amount ? parseInt(amount[1].replace(/,/g, '')) : 100000,
      deductible: 1000, // Default
      additional_coverage: []
    };
  }

  private async isClaimSubmission(message: string): Promise<boolean> {
    const claimKeywords = ['claim', 'accident', 'incident', 'damage', 'theft', 'loss', 'file a claim'];
    return claimKeywords.some(word => message.toLowerCase().includes(word));
  }

  private async detectClaimType(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('accident') || lowerMessage.includes('collision')) return 'auto_accident';
    if (lowerMessage.includes('medical') || lowerMessage.includes('hospital') || lowerMessage.includes('doctor')) return 'medical';
    if (lowerMessage.includes('property') || lowerMessage.includes('home') || lowerMessage.includes('house')) return 'property_damage';
    if (lowerMessage.includes('death') || lowerMessage.includes('passed away')) return 'life_claim';
    if (lowerMessage.includes('disability') || lowerMessage.includes('unable to work')) return 'disability';
    return 'auto_accident'; // Default
  }

  private async extractClaimAmount(message: string): Promise<number> {
    const amount = message.match(/\$?([\d,]+)/);
    return amount ? parseInt(amount[1].replace(/,/g, '')) : 5000; // Default
  }

  private async extractIncidentDate(message: string): Promise<string> {
    // Simple date extraction - in production, use proper NLP
    const today = new Date();
    if (message.toLowerCase().includes('today')) return today.toISOString().split('T')[0];
    if (message.toLowerCase().includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0]; // Default to today
  }

  private async calculateFraudRisk(message: string, customerProfile: any): Promise<number> {
    let riskScore = 0;

    // High claim amount relative to policy value
    const claimAmount = await this.extractClaimAmount(message);
    if (claimAmount > (customerProfile.current_policy_value * 0.8)) {
      riskScore += 3;
    }

    // Multiple recent claims
    if (customerProfile.claim_frequency > 2) {
      riskScore += 2;
    }

    // Suspicious language patterns
    const suspiciousWords = ['total loss', 'completely destroyed', 'no witnesses', 'immediate settlement'];
    if (suspiciousWords.some(word => message.toLowerCase().includes(word))) {
      riskScore += 2;
    }

    return Math.min(10, riskScore);
  }

  private async detectSuspiciousPatterns(message: string): Promise<string[]> {
    const patterns = [];
    if (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('immediate')) {
      patterns.push('urgency_pressure');
    }
    if (message.toLowerCase().includes('cash') || message.toLowerCase().includes('quick payment')) {
      patterns.push('cash_request');
    }
    return patterns;
  }

  private async requiresInvestigation(message: string, customerProfile: any): Promise<boolean> {
    const fraudRisk = await this.calculateFraudRisk(message, customerProfile);
    return fraudRisk >= 5 || customerProfile.claim_frequency > 3;
  }

  // Investment-related methods
  private async isInvestmentRelated(message: string): Promise<boolean> {
    const investmentKeywords = ['invest', 'portfolio', 'stocks', 'bonds', 'mutual fund', 'retirement', 'ira', '401k', 'return', 'roi'];
    return investmentKeywords.some(word => message.toLowerCase().includes(word));
  }
}

export const whatsappService = WhatsAppService.getInstance();
export default whatsappService;