import axios from 'axios';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

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
    video?: {
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      duration: number;
      file_size?: number;
    };
    audio?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      file_size?: number;
    };
    document?: {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      file_size?: number;
    };
    location?: {
      longitude: number;
      latitude: number;
    };
    contact?: {
      phone_number: string;
      first_name: string;
      last_name?: string;
    };
    sticker?: {
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      is_animated: boolean;
      is_video: boolean;
    };
    reply_to_message?: any;
  };
  edited_message?: any;
  channel_post?: any;
  edited_channel_post?: any;
  callback_query?: any;
}

class TelegramProvider {
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
      const apiUrl = `${TelegramProvider.BASE_URL}${botToken}`;

      let payload: any = {
        chat_id: chatId,
        parse_mode: 'HTML', // Support basic HTML formatting
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
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  // Process incoming webhook from Telegram
  async processWebhook(payload: TelegramWebhookUpdate, integration: MessagingIntegration): Promise<void> {
    try {
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
      const response = await axios.get(`${TelegramProvider.BASE_URL}${config.botToken}/getMe`);
      
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
        `${TelegramProvider.BASE_URL}${config.botToken}/setWebhook`,
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
      const response = await axios.get(`${TelegramProvider.BASE_URL}${config.botToken}/getWebhookInfo`);
      
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

  // Process regular message
  private async processMessage(message: TelegramWebhookUpdate['message'], integration: MessagingIntegration): Promise<void> {
    if (!message) return;

    try {
      // Get or create customer
      const customer = await this.getOrCreateCustomer(
        message.from.id.toString(),
        integration.user_id,
        {
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
          languageCode: message.from.language_code,
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        customer.id!,
        integration.user_id,
        message.chat.id.toString()
      );

      // Determine message type and content
      const messageInfo = this.extractMessageInfo(message);

      // Store message in database
      const messageId = await this.storeMessage({
        userId: integration.user_id,
        conversationId: conversation.id!,
        contactId: customer.id,
        platformMessageId: message.message_id.toString(),
        content: messageInfo.content,
        messageType: messageInfo.type,
        mediaUrl: messageInfo.mediaUrl,
        replyToMessageId: message.reply_to_message?.message_id?.toString(),
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
            sentiment: "neutral",
            intent: "general",
            keywords: this.extractKeywords(messageInfo.content)
          }
        },
      });

      // Classify and route message (reuse from WhatsApp service)
      await this.classifyAndRouteMessage(conversation.id!, messageInfo.content, customer);

    } catch (error) {
      console.error('Error processing Telegram message:', error);
    }
  }

  // Process edited message
  private async processEditedMessage(editedMessage: any, integration: MessagingIntegration): Promise<void> {
    // Handle message edits - update existing message in database
    try {
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('platform_message_id', editedMessage.message_id.toString())
        .eq('platform', 'telegram')
        .single();

      if (existingMessage) {
        const messageInfo = this.extractMessageInfo(editedMessage);
        
        await supabase
          .from('messages')
          .update({
            content: messageInfo.content,
            message_type: messageInfo.type,
            media_url: messageInfo.mediaUrl,
            metadata: {
              ...(existingMessage.metadata || {}),
              edited: true,
              editDate: editedMessage.edit_date,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMessage.id);
      }
    } catch (error) {
      console.error('Error processing edited Telegram message:', error);
    }
  }

  // Process callback query (inline keyboard responses)
  private async processCallbackQuery(callbackQuery: any, integration: MessagingIntegration): Promise<void> {
    // Handle inline keyboard responses
    try {
      // Answer the callback query to remove loading state
      await axios.post(
        `${TelegramProvider.BASE_URL}${integration.config.botToken}/answerCallbackQuery`,
        {
          callback_query_id: callbackQuery.id,
          text: 'Received!',
        }
      );

      // Process the callback data as a message
      if (callbackQuery.data) {
        // You can implement custom logic here for handling button clicks
        console.log('Callback query data:', callbackQuery.data);
      }
    } catch (error) {
      console.error('Error processing Telegram callback query:', error);
    }
  }

  // Extract message information from Telegram message object
  private extractMessageInfo(message: any): { content: string; type: BaseMessage['messageType']; mediaUrl?: string } {
    if (message.text) {
      return { content: message.text, type: 'text' };
    }
    
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1]; // Get highest resolution
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

  // Get or create customer for Telegram using production schema
  private async getOrCreateCustomer(telegramId: string, userId: string, userInfo: any): Promise<any> {
    try {
      // Use the production database function
      const { data, error } = await supabase.rpc('get_or_create_telegram_contact', {
        p_user_id: userId,
        p_telegram_id: telegramId,
        p_first_name: userInfo.firstName,
        p_last_name: userInfo.lastName || null,
        p_username: userInfo.username || null
      });

      if (error) throw error;

      // Get the full contact record
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', data)
        .single();

      return contact;
    } catch (error) {
      console.error('Error getting or creating Telegram customer:', error);
      throw error;
    }
  }

  // Get or create conversation for Telegram using production schema
  private async getOrCreateConversation(customerId: string, userId: string, chatId: string): Promise<any> {
    try {
      // Use the production database function
      const { data, error } = await supabase.rpc('get_or_create_telegram_conversation', {
        p_user_id: userId,
        p_contact_id: customerId,
        p_chat_id: chatId
      });

      if (error) throw error;

      // Get the full conversation record
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('id', data)
        .single();

      return conversation;
    } catch (error) {
      console.error('Error getting or creating Telegram conversation:', error);
      throw error;
    }
  }

  // Store message in database using production schema
  private async storeMessage(messageData: any): Promise<string> {
    try {
      // Use the production database function for inbound messages
      const { data, error } = await supabase.rpc('store_telegram_message', {
        p_user_id: messageData.userId,
        p_conversation_id: messageData.conversationId,
        p_contact_id: messageData.contactId,
        p_platform_message_id: messageData.platformMessageId,
        p_content: messageData.content,
        p_message_type: messageData.messageType || 'text',
        p_media_url: messageData.mediaUrl || null,
        p_reply_to_message_id: messageData.replyToMessageId || null,
        p_metadata: messageData.metadata || {}
      });

      if (error) throw error;
      return data; // Returns the message ID
    } catch (error) {
      console.error('Error storing Telegram message:', error);
      throw error;
    }
  }

  // Extract keywords from message content
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word)
    );
    return keywords.slice(0, 5); // Return top 5 keywords
  }

  // Classify and route message using production classification function
  private async classifyAndRouteMessage(conversationId: string, content: string, customer: any): Promise<void> {
    try {
      // Use the production classification function
      await supabase.rpc('classify_telegram_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_contact_id: customer.id
      });

      // Update analytics
      await supabase.rpc('update_telegram_analytics', {
        p_user_id: customer.user_id,
        p_conversation_id: conversationId
      });
    } catch (error) {
      console.error('Error classifying Telegram message:', error);
    }
  }
}

export const telegramProvider = new TelegramProvider();
export default telegramProvider;