import axios from 'axios';
import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import { broadcastNewMessage } from '@/lib/services/realtime-broadcast';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface TelegramConfig {
  botToken: string;
  botUsername?: string;
  webhookUrl?: string;
  allowedUpdates?: string[];
}

export interface TelegramMessage extends BaseMessage {
  platform: 'telegram';
  chatId?: string;
  messageId?: number;
  replyToMessageId?: number;
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      file_size?: number;
    }>;
    video?: any;
    audio?: any;
    document?: any;
    voice?: any;
    location?: any;
    contact?: any;
    sticker?: any;
    reply_to_message?: any;
  };
  edited_message?: any;
  channel_post?: any;
  edited_channel_post?: any;
  callback_query?: any;
}

class TelegramProviderProduction {
  private static readonly BASE_URL = 'https://api.telegram.org/bot';

  // Send message via Telegram Bot API
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as TelegramConfig;
      const telegramMessage = message as TelegramMessage;
      const botToken = config.botToken;

      if (!botToken) {
        return { success: false, error: 'Bot token not configured' };
      }

      const chatId = telegramMessage.to;
      const apiUrl = `${TelegramProviderProduction.BASE_URL}${botToken}`;

      let payload: any = {
        chat_id: chatId,
        parse_mode: 'HTML',
      };

      // Handle different message types
      let endpoint = 'sendMessage';
      
      switch (message.messageType) {
        case 'text':
          payload.text = message.content;
          break;
        case 'image':
          endpoint = 'sendPhoto';
          payload.photo = message.mediaUrl;
          if (message.content) payload.caption = message.content;
          break;
        case 'video':
          endpoint = 'sendVideo';
          payload.video = message.mediaUrl;
          if (message.content) payload.caption = message.content;
          break;
        case 'audio':
          endpoint = 'sendAudio';
          payload.audio = message.mediaUrl;
          if (message.content) payload.caption = message.content;
          break;
        case 'document':
          endpoint = 'sendDocument';
          payload.document = message.mediaUrl;
          if (message.content) payload.caption = message.content;
          break;
        case 'location':
          endpoint = 'sendLocation';
          const coords = message.content.split(',');
          payload.latitude = parseFloat(coords[0]);
          payload.longitude = parseFloat(coords[1]);
          break;
        case 'contact':
          endpoint = 'sendContact';
          const contactData = JSON.parse(message.content);
          payload.phone_number = contactData.phone_number;
          payload.first_name = contactData.first_name;
          payload.last_name = contactData.last_name;
          break;
        case 'sticker':
          endpoint = 'sendSticker';
          payload.sticker = message.mediaUrl;
          break;
        default:
          payload.text = message.content;
      }

      // Handle reply to message
      if (telegramMessage.replyToMessageId) {
        payload.reply_to_message_id = telegramMessage.replyToMessageId;
      }

      const response = await axios.post(`${apiUrl}/${endpoint}`, payload);

      if (response.data.ok) {
        // Store outbound message using clean service layer
        if (message.conversationId) {
          await messageService.store({
            platform: 'telegram',
            userId: integration.userId,
            conversationId: message.conversationId,
            content: message.content,
            direction: 'outbound',
            messageType: message.messageType || 'text',
            mediaUrl: message.mediaUrl,
            isFromBot: true,
            botName: 'Telegram Bot',
            platformMessageId: response.data.result.message_id.toString(),
            status: 'sent',
          });
        }

        return {
          success: true,
          messageId: response.data.result.message_id.toString(),
        };
      } else {
        return {
          success: false,
          error: response.data.description || 'Unknown Telegram API error',
        };
      }
    } catch (error: any) {
      console.error('Telegram send message error:', error);
      if (typeof payload !== 'undefined') {
        console.error('Telegram send payload was:', payload);
      }
      if (typeof endpoint !== 'undefined' && typeof apiUrl !== 'undefined') {
        console.error('Telegram API URL was:', `${apiUrl}/${endpoint}`);
      }
      console.error('Telegram error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  // Process incoming webhook from Telegram
  async processWebhook(payload: TelegramWebhookUpdate, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing Telegram webhook:', JSON.stringify(payload, null, 2));

      // Handle regular messages
      if (payload.message) {
        await this.processMessage(payload.message, integration);
      }

      // Handle edited messages
      if (payload.edited_message) {
        await this.processEditedMessage(payload.edited_message, integration);
      }

      // Handle callback queries (inline keyboard responses)
      if (payload.callback_query) {
        await this.processCallbackQuery(payload.callback_query, integration);
      }
    } catch (error) {
      console.error('Error processing Telegram webhook:', error);
      throw error;
    }
  }

  // Test connection to Telegram Bot API
  async testConnection(config: TelegramConfig): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    try {
      const response = await axios.get(`${TelegramProviderProduction.BASE_URL}${config.botToken}/getMe`);
      
      if (response.data.ok) {
        return {
          success: true,
          botInfo: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description || 'Invalid bot token',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  // Set webhook for the bot
  async setWebhook(config: TelegramConfig, webhookUrl: string, secretToken?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {
        url: webhookUrl,
        allowed_updates: config.allowedUpdates || ['message', 'edited_message', 'callback_query'],
      };

      if (secretToken) {
        payload.secret_token = secretToken;
      }

      const response = await axios.post(
        `${TelegramProviderProduction.BASE_URL}${config.botToken}/setWebhook`,
        payload
      );

      if (response.data.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.description || 'Failed to set webhook',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  // Get webhook info
  async getWebhookInfo(config: TelegramConfig): Promise<{ success: boolean; webhookInfo?: any; error?: string }> {
    try {
      const response = await axios.get(`${TelegramProviderProduction.BASE_URL}${config.botToken}/getWebhookInfo`);
      
      if (response.data.ok) {
        return {
          success: true,
          webhookInfo: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  // Process regular message using PRODUCTION FUNCTIONS
  private async processMessage(message: TelegramWebhookUpdate['message'], integration: MessagingIntegration): Promise<void> {
    if (!message) return;

    try {
      console.log('Processing Telegram message from user:', message.from.id, message.from.first_name);

      // Get or create contact using clean service layer
      const contactResult = await contactService.getOrCreate(
        integration.userId,
        'telegram',
        message.from.id.toString(),
        {
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
          languageCode: message.from.language_code,
        }
      );

      if (!contactResult.success || !contactResult.contact) {
        throw new Error(`Failed to get/create contact: ${contactResult.error}`);
      }

      const contact = contactResult.contact;
      console.log('Contact found/created:', contact.id);

      // Get or create conversation using clean service layer
      const conversationResult = await conversationService.getOrCreate(
        integration.userId,
        contact.id!,
        'telegram',
        message.chat.id.toString()
      );

      if (!conversationResult.success || !conversationResult.conversation) {
        throw new Error(`Failed to get/create conversation: ${conversationResult.error}`);
      }

      const conversation = conversationResult.conversation;
      console.log('Conversation found/created:', conversation.id);

      // Determine message type and content
      const messageInfo = this.extractMessageInfo(message);

      // Store message using clean service layer
      await messageService.store({
        platform: 'telegram',
        userId: integration.userId,
        conversationId: conversation.id!,
        contactId: contact.id,
        content: messageInfo.content,
        direction: 'inbound',
        messageType: messageInfo.type,
        mediaUrl: messageInfo.mediaUrl,
        platformMessageId: message.message_id.toString(),
        replyToMessageId: message.reply_to_message?.message_id?.toString(),
        isFromBot: false,
        metadata: {
          chatType: message.chat.type,
          date: message.date,
          fromUser: {
            id: message.from.id,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            username: message.from.username,
          },
        },
      });

      console.log('Message stored successfully');

      // Update conversation's last message using clean service layer
      await conversationService.updateLastMessage(
        conversation.id!,
        messageInfo.content,
        new Date().toISOString()
      );

      // Update analytics using direct table operations
      await this.updateAnalytics(integration.userId, conversation.id!);

      // Classify message using direct table operations  
      await this.classifyAndRouteMessage(conversation.id!, messageInfo.content, contact);

      // Broadcast real-time message update via Supabase Realtime
      try {
        await broadcastNewMessage(integration.userId, {
          conversationId: conversation.id!,
          platform: 'telegram',
          content: messageInfo.content,
          messageType: messageInfo.type,
          direction: 'inbound',
          senderType: 'customer',
          contactId: contact.id,
          mediaUrl: messageInfo.mediaUrl,
          platformMessageId: message.message_id.toString(),
          metadata: {
            telegram: {
              message_id: message.message_id,
              chat: { id: message.chat.id, type: message.chat.type },
              from: { 
                id: message.from.id, 
                first_name: message.from.first_name, 
                last_name: message.from.last_name, 
                username: message.from.username 
              }
            },
            classification: {
              urgency: 5,
              sentiment: 'neutral',
              intent: 'general',
              keywords: this.extractKeywords(messageInfo.content)
            }
          }
        });

        console.log('✅ Real-time Telegram message broadcasted successfully');
      } catch (broadcastError) {
        console.error('❌ Error broadcasting real-time Telegram message:', broadcastError);
        // Don't throw, as message processing was successful
      }

    } catch (error) {
      console.error('Error processing Telegram message:', error);
      throw error;
    }
  }

  // Get or create contact using PRODUCTION TABLE: crm_contacts
  private async getOrCreateContact(telegramId: string, userId: string, userInfo: any): Promise<any> {
    try {
      // Check if contact exists
      const { data: existingContact } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'telegram')
        .eq('platform_id', telegramId)
        .single();

      if (existingContact) {
        // Update last interaction time and user info
        const { data: updatedContact } = await supabaseService
          .from('crm_contacts')
          .update({
            last_seen: new Date().toISOString(),
            platform_username: userInfo.username,
            display_name: `${userInfo.firstName} ${userInfo.lastName || ''}`.trim(),
            metadata: {
              ...existingContact.metadata,
              telegram: {
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                languageCode: userInfo.languageCode,
                lastUpdated: new Date().toISOString(),
              },
            },
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
          platform: 'telegram',
          platform_id: telegramId,
          platform_username: userInfo.username,
          display_name: `${userInfo.firstName} ${userInfo.lastName || ''}`.trim(),
          lifecycle_stage: 'lead',
          priority: 'medium',
          last_seen: new Date().toISOString(),
          metadata: {
            telegram: {
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              languageCode: userInfo.languageCode,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Telegram contact:', error);
        throw error;
      }

      console.log('Created new Telegram contact:', newContact.id);
      return newContact;
    } catch (error) {
      console.error('Error getting or creating Telegram contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, chatId: string): Promise<any> {
    try {
      // Check for existing active conversation
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'telegram')
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
          platform: 'telegram',
          platform_thread_id: chatId,
          status: 'active',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Telegram conversation:', error);
        throw error;
      }

      console.log('Created new Telegram conversation:', newConversation.id);
      return newConversation;
    } catch (error) {
      console.error('Error getting or creating Telegram conversation:', error);
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
          message_type: messageData.messageType || 'text',
          media_url: messageData.mediaUrl,
          is_from_bot: false,
          platform: 'telegram',
          platform_message_id: messageData.platformMessageId,
          reply_to_message_id: messageData.replyToMessageId,
          metadata: messageData.metadata || {},
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing Telegram message:', error);
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
      console.error('Error storing Telegram message:', error);
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
          contact_id: messageData.contactId,
          message_text: messageData.content,
          direction: 'outbound',
          message_type: messageData.messageType || 'text',
          media_url: messageData.mediaUrl,
          is_from_bot: true,
          bot_name: 'Telegram Bot',
          platform: 'telegram',
          platform_message_id: messageData.platformMessageId,
          status: 'sent',
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound Telegram message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound Telegram message:', error);
    }
  }

  // Update analytics
  private async updateAnalytics(userId: string, conversationId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update daily analytics
      await supabaseService
        .from('analytics_daily')
        .upsert({
          user_id: userId,
          date: today,
          messages_received: 1,
          conversations_started: 0, // Will be set to 1 for new conversations
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        });

    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Extract message information from Telegram message object
  private extractMessageInfo(message: any): { content: string; type: BaseMessage['messageType']; mediaUrl?: string } {
    if (message.text) {
      return { content: message.text, type: 'text' };
    }
    
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1];
      return {
        content: message.caption || '',
        type: 'image',
        mediaUrl: `telegram://photo/${photo.file_id}`,
      };
    }
    
    if (message.video) {
      return {
        content: message.caption || '',
        type: 'video',
        mediaUrl: `telegram://video/${message.video.file_id}`,
      };
    }
    
    if (message.audio) {
      return {
        content: message.caption || '',
        type: 'audio',
        mediaUrl: `telegram://audio/${message.audio.file_id}`,
      };
    }
    
    if (message.voice) {
      return {
        content: message.caption || '',
        type: 'audio',
        mediaUrl: `telegram://voice/${message.voice.file_id}`,
      };
    }
    
    if (message.document) {
      return {
        content: message.caption || message.document.file_name || '',
        type: 'document',
        mediaUrl: `telegram://document/${message.document.file_id}`,
      };
    }
    
    if (message.location) {
      return {
        content: `${message.location.latitude},${message.location.longitude}`,
        type: 'location',
      };
    }
    
    if (message.contact) {
      return {
        content: JSON.stringify(message.contact),
        type: 'contact',
      };
    }
    
    if (message.sticker) {
      return {
        content: message.sticker.emoji || 'Sticker',
        type: 'sticker',
        mediaUrl: `telegram://sticker/${message.sticker.file_id}`,
      };
    }

    return { content: 'Unsupported message type', type: 'text' };
  }

  // Process edited message
  private async processEditedMessage(editedMessage: any, integration: MessagingIntegration): Promise<void> {
    try {
      const { data: existingMessage } = await supabaseService
        .from('whatsapp_messages')
        .select('id, metadata')
        .eq('platform_message_id', editedMessage.message_id.toString())
        .eq('platform', 'telegram')
        .single();

      if (existingMessage) {
        const messageInfo = this.extractMessageInfo(editedMessage);
        
        await supabaseService
          .from('whatsapp_messages')
          .update({
            message_text: messageInfo.content,
            message_type: messageInfo.type,
            media_url: messageInfo.mediaUrl,
            metadata: {
              ...existingMessage.metadata,
              edited: true,
              editDate: editedMessage.edit_date,
              originalContent: existingMessage.metadata?.originalContent || messageInfo.content,
            },
          })
          .eq('id', existingMessage.id);
      }
    } catch (error) {
      console.error('Error processing edited Telegram message:', error);
    }
  }

  // Process callback query (inline keyboard responses)
  private async processCallbackQuery(callbackQuery: any, integration: MessagingIntegration): Promise<void> {
    try {
      // Answer the callback query to remove loading state
      await axios.post(
        `${TelegramProviderProduction.BASE_URL}${integration.config.botToken}/answerCallbackQuery`,
        {
          callback_query_id: callbackQuery.id,
          text: 'Received!',
        }
      );

      // Process the callback data as a message if needed
      if (callbackQuery.data) {
        console.log('Telegram callback query data:', callbackQuery.data);
        // You can implement custom logic here for handling button clicks
      }
    } catch (error) {
      console.error('Error processing Telegram callback query:', error);
    }
  }

  // Classify and route message for AI/human handoff
  private async classifyAndRouteMessage(conversationId: string, content: string, contact: any): Promise<void> {
    try {
      // Basic classification
      const urgentKeywords = ['urgent', 'emergency', 'help', 'asap', 'problem', 'issue', 'broken'];
      const isUrgent = urgentKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );

      if (isUrgent) {
        await supabaseService
          .from('crm_conversations')
          .update({
            priority: 'high',
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        // Could trigger human handoff here
        console.log('Urgent message detected, escalating conversation:', conversationId);
      }

      // Update contact lead score based on engagement
      const currentScore = contact.lead_score || 0;
      await supabaseService
        .from('crm_contacts')
        .update({
          lead_score: Math.min(currentScore + 1, 100), // Cap at 100
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id);

    } catch (error) {
      console.error('Error classifying Telegram message:', error);
    }
  }
}

export const telegramProviderProduction = new TelegramProviderProduction();
export default telegramProviderProduction;