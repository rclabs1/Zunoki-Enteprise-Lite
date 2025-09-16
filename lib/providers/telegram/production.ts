import { getSupabaseService } from '@/lib/services/supabase-service';
import axios from 'axios';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

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
        // Store outbound message using database function
        if (message.conversationId) {
          try {
            await supabaseService.rpc('store_telegram_outbound_message', {
              p_user_id: integration.user_id,
              p_conversation_id: message.conversationId,
              p_contact_id: null, // Will be filled by function
              p_platform_message_id: response.data.result.message_id.toString(),
              p_content: message.content,
              p_message_type: message.messageType || 'text',
              p_media_url: message.mediaUrl,
              p_agent_id: null,
              p_is_from_bot: true
            });
          } catch (dbError) {
            console.error('Failed to store outbound message:', dbError);
            // Don't fail the send operation due to storage issues
          }
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

  // Process regular message using production database functions
  private async processMessage(message: TelegramWebhookUpdate['message'], integration: MessagingIntegration): Promise<void> {
    if (!message) return;

    try {
      console.log('Processing Telegram message from user:', message.from.id, message.from.first_name);

      // Use database function to get or create contact
      const { data: contactId, error: contactError } = await supabaseService.rpc('get_or_create_telegram_contact', {
        p_user_id: integration.user_id,
        p_telegram_id: message.from.id.toString(),
        p_first_name: message.from.first_name,
        p_last_name: message.from.last_name,
        p_username: message.from.username
      });

      if (contactError) {
        console.error('Error creating/getting contact:', contactError);
        throw contactError;
      }

      console.log('Contact found/created:', contactId);

      // Use database function to get or create conversation
      const { data: conversationId, error: conversationError } = await supabaseService.rpc('get_or_create_telegram_conversation', {
        p_user_id: integration.user_id,
        p_contact_id: contactId,
        p_chat_id: message.chat.id.toString()
      });

      if (conversationError) {
        console.error('Error creating/getting conversation:', conversationError);
        throw conversationError;
      }

      console.log('Conversation found/created:', conversationId);

      // Determine message type and content
      const messageInfo = this.extractMessageInfo(message);

      // Use enhanced database function to store message with classification
      const { error: messageError } = await supabaseService.rpc('store_telegram_message_enhanced', {
        p_user_id: integration.user_id,
        p_conversation_id: conversationId,
        p_contact_id: contactId,
        p_platform_message_id: message.message_id.toString(),
        p_content: messageInfo.content,
        p_message_type: messageInfo.type,
        p_media_url: messageInfo.mediaUrl,
        p_reply_to_message_id: message.reply_to_message?.message_id?.toString(),
        p_metadata: {
          chatType: message.chat.type,
          date: message.date,
          fromUser: {
            id: message.from.id,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            username: message.from.username,
          },
        }
      });

      if (messageError) {
        console.error('Error storing message:', messageError);
        throw messageError;
      }

      console.log('Message stored successfully');

      // Update analytics using database function
      try {
        await supabaseService.rpc('update_telegram_analytics', {
          p_user_id: integration.user_id,
          p_conversation_id: conversationId
        });
      } catch (analyticsError) {
        console.warn('Analytics update failed (non-critical):', analyticsError);
      }

      // Classification is now handled in the enhanced storage function above

    } catch (error) {
      console.error('Error processing Telegram message:', error);
      throw error;
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
}

export const telegramProviderProduction = new TelegramProviderProduction();
export default telegramProviderProduction;