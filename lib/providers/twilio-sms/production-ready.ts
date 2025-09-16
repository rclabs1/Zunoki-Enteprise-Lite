import twilio from 'twilio';
import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import crypto from 'crypto';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface TwilioSMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Twilio phone number
  messagingServiceSid?: string; // Optional messaging service SID
  webhookUrl?: string;
}

export interface TwilioSMSMessage extends BaseMessage {
  platform: 'twilio-sms';
  messageSid?: string;
  numSegments?: number;
  status?: 'queued' | 'sending' | 'sent' | 'failed' | 'delivered' | 'undelivered' | 'receiving' | 'received';
  errorCode?: number;
  errorMessage?: string;
  direction?: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  price?: string;
  priceUnit?: string;
}

export interface ParsedTwilioSMS {
  messageSid: string;
  accountSid: string;
  from: string;
  to: string;
  body: string;
  numSegments: string;
  status: string;
  direction: string;
  apiVersion: string;
  dateSent: string;
  dateCreated: string;
  errorCode?: string;
  errorMessage?: string;
  mediaUrl?: string[];
  numMedia?: string;
}

class TwilioSMSProviderProduction {
  private twilioClient: twilio.Twilio | null = null;

  // Create authenticated Twilio client
  private getAuthenticatedClient(config: TwilioSMSConfig): twilio.Twilio {
    if (!this.twilioClient || this.twilioClient.accountSid !== config.accountSid) {
      this.twilioClient = twilio(config.accountSid, config.authToken);
    }
    return this.twilioClient;
  }

  // Send SMS message
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as TwilioSMSConfig;
      const smsMessage = message as TwilioSMSMessage;

      if (!config.accountSid || !config.authToken || !config.phoneNumber) {
        return { success: false, error: 'Twilio SMS configuration incomplete' };
      }

      if (!message.to || !message.content) {
        return { success: false, error: 'Recipient phone number and message content are required' };
      }

      const client = this.getAuthenticatedClient(config);

      // Create message
      const twilioMessage = await client.messages.create({
        body: message.content,
        from: config.phoneNumber,
        to: message.to,
        ...(config.messagingServiceSid && { messagingServiceSid: config.messagingServiceSid }),
        ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] })
      });

      // Store outbound message
      if (twilioMessage.sid && message.conversationId) {
        await this.storeOutboundMessage({
          userId: integration.user_id,
          conversationId: message.conversationId,
          platformMessageId: twilioMessage.sid,
          content: message.content,
          to: message.to,
          from: config.phoneNumber,
          status: twilioMessage.status,
          direction: twilioMessage.direction,
          numSegments: twilioMessage.numSegments?.toString(),
          price: twilioMessage.price,
          priceUnit: twilioMessage.priceUnit
        });
      }

      return {
        success: true,
        messageId: twilioMessage.sid
      };
    } catch (error: any) {
      console.error('Twilio SMS send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  // Process Twilio SMS webhook
  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing Twilio SMS webhook:', JSON.stringify(payload, null, 2));

      // Parse the Twilio webhook payload
      const parsedSMS = await this.parseTwilioSMS(payload);
      
      if (!parsedSMS) {
        console.error('Failed to parse Twilio SMS webhook');
        return;
      }

      // Handle status updates for outbound messages
      if (parsedSMS.direction !== 'inbound') {
        await this.updateMessageStatus(parsedSMS);
        return;
      }

      // Process inbound message
      const config = integration.config as TwilioSMSConfig;

      // Skip messages from our own number
      if (parsedSMS.from === config.phoneNumber) {
        console.log('Skipping message from own number');
        return;
      }

      // Get or create contact
      const contact = await this.getOrCreateContact(
        parsedSMS.from,
        integration.user_id,
        {
          phoneNumber: parsedSMS.from
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        contact.id,
        integration.user_id,
        parsedSMS.from
      );

      // Handle media attachments
      let mediaUrls: string[] = [];
      if (parsedSMS.numMedia && parseInt(parsedSMS.numMedia) > 0 && parsedSMS.mediaUrl) {
        mediaUrls = parsedSMS.mediaUrl;
      }

      // Store message
      await this.storeMessage({
        userId: integration.user_id,
        conversationId: conversation.id,
        contactId: contact.id,
        platformMessageId: parsedSMS.messageSid,
        content: parsedSMS.body || '',
        from: parsedSMS.from,
        to: parsedSMS.to,
        status: parsedSMS.status,
        direction: parsedSMS.direction,
        numSegments: parsedSMS.numSegments,
        mediaUrls: mediaUrls,
        dateSent: parsedSMS.dateSent,
        dateCreated: parsedSMS.dateCreated
      });

      // Update analytics
      await this.updateAnalytics(integration.user_id, conversation.id);

      // Classify and route
      await this.classifyAndRouteMessage(conversation.id, parsedSMS.body || '', contact);

    } catch (error) {
      console.error('Error processing Twilio SMS webhook:', error);
      throw error;
    }
  }

  // Test Twilio SMS connection
  async testConnection(config: TwilioSMSConfig): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (!config.accountSid || !config.authToken || !config.phoneNumber) {
        return { success: false, error: 'Account SID, Auth Token, and Phone Number are required' };
      }

      const client = this.getAuthenticatedClient(config);

      // Test by fetching account information
      const account = await client.api.accounts(config.accountSid).fetch();

      // Verify the phone number exists
      let phoneNumberInfo = null;
      try {
        const phoneNumbers = await client.incomingPhoneNumbers.list({
          phoneNumber: config.phoneNumber,
          limit: 1
        });
        phoneNumberInfo = phoneNumbers[0] || null;
      } catch (phoneError) {
        console.log('Phone number verification failed, might be messaging service');
      }

      return {
        success: true,
        info: {
          accountSid: config.accountSid,
          phoneNumber: config.phoneNumber,
          accountFriendlyName: account.friendlyName,
          accountStatus: account.status,
          phoneNumberVerified: !!phoneNumberInfo,
          capabilities: phoneNumberInfo?.capabilities || null
        }
      };
    } catch (error: any) {
      console.error('Twilio SMS connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to Twilio SMS'
      };
    }
  }

  // Get message delivery status
  async getMessageStatus(config: TwilioSMSConfig, messageSid: string): Promise<any> {
    try {
      const client = this.getAuthenticatedClient(config);
      const message = await client.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        price: message.price,
        priceUnit: message.priceUnit,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error: any) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  // Get account usage and balance
  async getAccountInfo(config: TwilioSMSConfig): Promise<any> {
    try {
      const client = this.getAuthenticatedClient(config);
      
      // Get account info
      const account = await client.api.accounts(config.accountSid).fetch();
      
      // Get balance (if available)
      let balance = null;
      try {
        balance = await client.balance.fetch();
      } catch (balanceError) {
        console.log('Balance not available for this account type');
      }

      // Get recent usage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const usage = await client.usage.records.list({
        category: 'sms',
        startDate: startDate,
        endDate: endDate,
        limit: 10
      });

      return {
        account: {
          sid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type,
          dateCreated: account.dateCreated,
          dateUpdated: account.dateUpdated
        },
        balance: balance ? {
          currency: balance.currency,
          balance: balance.balance
        } : null,
        usage: usage.map(record => ({
          category: record.category,
          description: record.description,
          count: record.count,
          countUnit: record.countUnit,
          usage: record.usage,
          usageUnit: record.usageUnit,
          price: record.price,
          priceUnit: record.priceUnit,
          startDate: record.startDate,
          endDate: record.endDate
        }))
      };
    } catch (error: any) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  // Parse Twilio SMS webhook data
  private async parseTwilioSMS(payload: any): Promise<ParsedTwilioSMS | null> {
    try {
      // Twilio sends form-encoded data
      return {
        messageSid: payload.MessageSid || payload.SmsSid,
        accountSid: payload.AccountSid,
        from: payload.From,
        to: payload.To,
        body: payload.Body || '',
        numSegments: payload.NumSegments || '1',
        status: payload.SmsStatus || payload.MessageStatus,
        direction: payload.Direction || 'inbound',
        apiVersion: payload.ApiVersion,
        dateSent: payload.DateSent,
        dateCreated: payload.DateCreated,
        errorCode: payload.ErrorCode,
        errorMessage: payload.ErrorMessage,
        numMedia: payload.NumMedia || '0',
        mediaUrl: payload.NumMedia && parseInt(payload.NumMedia) > 0 
          ? Array.from({ length: parseInt(payload.NumMedia) }, (_, i) => payload[`MediaUrl${i}`]).filter(Boolean)
          : undefined
      };
    } catch (error) {
      console.error('Error parsing Twilio SMS:', error);
      return null;
    }
  }

  // Update message status for outbound messages
  private async updateMessageStatus(parsedSMS: ParsedTwilioSMS): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('whatsapp_messages')
        .update({
          status: parsedSMS.status,
          metadata: {
            errorCode: parsedSMS.errorCode,
            errorMessage: parsedSMS.errorMessage,
            numSegments: parsedSMS.numSegments,
            dateSent: parsedSMS.dateSent,
            updatedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('platform_message_id', parsedSMS.messageSid)
        .eq('platform', 'twilio-sms');

      if (error) {
        console.error('Error updating message status:', error);
      }
    } catch (error) {
      console.error('Error updating Twilio SMS message status:', error);
    }
  }

  // Get or create contact using PRODUCTION TABLE: crm_contacts
  private async getOrCreateContact(phoneNumber: string, userId: string, userInfo: any): Promise<any> {
    try {
      // Normalize phone number (remove +1, spaces, etc. for consistent matching)
      const normalizedPhone = phoneNumber.replace(/^\+?1?/, '').replace(/\D/g, '');
      
      // Check if contact exists
      const { data: existingContact } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'twilio-sms')
        .or(`platform_id.eq.${phoneNumber},phone_number.eq.${phoneNumber},phone_number.eq.${normalizedPhone}`)
        .single();

      if (existingContact) {
        // Update last interaction
        const { data: updatedContact } = await supabaseService
          .from('crm_contacts')
          .update({
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
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
          platform: 'twilio-sms',
          platform_id: phoneNumber,
          platform_username: phoneNumber,
          display_name: phoneNumber,
          phone_number: phoneNumber,
          lifecycle_stage: 'lead',
          priority: 'medium',
          last_seen: new Date().toISOString(),
          metadata: {
            sms: {
              phoneNumber: phoneNumber,
              normalizedPhone: normalizedPhone,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Twilio SMS contact:', error);
        throw error;
      }

      return newContact;
    } catch (error) {
      console.error('Error getting or creating Twilio SMS contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, phoneNumber: string): Promise<any> {
    try {
      // Check for existing conversation with same phone number
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'twilio-sms')
        .eq('platform_thread_id', phoneNumber)
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
          platform: 'twilio-sms',
          platform_thread_id: phoneNumber,
          status: 'active',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Twilio SMS conversation:', error);
        throw error;
      }

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating Twilio SMS conversation:', error);
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
          message_type: messageData.mediaUrls && messageData.mediaUrls.length > 0 ? 'media' : 'text',
          is_from_bot: false,
          platform: 'twilio-sms',
          platform_message_id: messageData.platformMessageId,
          status: messageData.status,
          metadata: {
            from: messageData.from,
            to: messageData.to,
            direction: messageData.direction,
            numSegments: messageData.numSegments,
            mediaUrls: messageData.mediaUrls,
            dateSent: messageData.dateSent,
            dateCreated: messageData.dateCreated,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing Twilio SMS message:', error);
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
      console.error('Error storing Twilio SMS message:', error);
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
          platform: 'twilio-sms',
          platform_message_id: messageData.platformMessageId,
          status: messageData.status || 'sent',
          metadata: {
            from: messageData.from,
            to: messageData.to,
            direction: messageData.direction,
            numSegments: messageData.numSegments,
            price: messageData.price,
            priceUnit: messageData.priceUnit,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound Twilio SMS message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound Twilio SMS message:', error);
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
      console.error('Error updating Twilio SMS analytics:', error);
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
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'help', 'problem', 'issue', 'error'];
        const isUrgent = urgentKeywords.some(keyword => 
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
        }
      });
    } catch (error) {
      console.error('Error classifying Twilio SMS message:', error);
    }
  }

  // Validate webhook signature (recommended for production)
  validateWebhookSignature(payload: string, signature: string, authToken: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(payload)
        .digest('base64');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

export const twilioSMSProviderProduction = new TwilioSMSProviderProduction();
export default twilioSMSProviderProduction;