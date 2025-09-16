import axios from 'axios';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { broadcastNewMessage } from '@/lib/services/realtime-broadcast';
import { AgentAutoReplyService } from '@/lib/services/agent-auto-reply-service';

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
}

export const whatsappService = WhatsAppService.getInstance();
export default whatsappService;