import axios from 'axios';
import { getSupabaseService } from '@/lib/services/supabase-service';
import { providerFactory } from '@/lib/service-container';
import { AgentAutoReplyService } from '@/lib/services/agent-auto-reply-service';
import '@/lib/service-initializer'; // Ensure services are initialized

// Use singleton Supabase service for optimal performance
const supabase = getSupabaseService();

// Base message interface that all providers implement
export interface BaseMessage {
  id?: string;
  conversationId?: string;
  platformMessageId?: string;
  senderType: 'customer' | 'agent' | 'system' | 'ai_agent';
  senderId?: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'reaction';
  mediaUrl?: string;
  to: string;
  from: string;
  platform: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'outlook' | 'custom-email' | 'twilio-sms' | 'website-chat' | 'live-chat';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Platform-specific integration configurations
export interface MessagingIntegration {
  id: string;
  user_id: string;
  platform: BaseMessage['platform'];
  provider?: string; // e.g., 'twilio', 'meta', 'bot_token'
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: Record<string, any>; // Platform-specific configuration
  webhook_url?: string;
  webhook_secret?: string;
  created_at: Date;
  updated_at: Date;
}

// Platform-specific message types
export interface WhatsAppMessage extends BaseMessage {
  platform: 'whatsapp';
  provider?: 'twilio' | 'meta';
}

export interface TelegramMessage extends BaseMessage {
  platform: 'telegram';
  chatId?: string;
  messageId?: number;
}

export interface FacebookMessage extends BaseMessage {
  platform: 'facebook';
  pageId?: string;
  recipientId?: string;
}

export interface InstagramMessage extends BaseMessage {
  platform: 'instagram';
  igId?: string;
  mediaId?: string;
}

export interface SlackMessage extends BaseMessage {
  platform: 'slack';
  channel?: string;
  threadTs?: string;
}

export interface DiscordMessage extends BaseMessage {
  platform: 'discord';
  channelId?: string;
  guildId?: string;
}

export interface YouTubeMessage extends BaseMessage {
  platform: 'youtube';
  videoId?: string;
  commentId?: string;
}

export interface TikTokMessage extends BaseMessage {
  platform: 'tiktok';
  videoId?: string;
  commentId?: string;
}

export interface GmailMessage extends BaseMessage {
  platform: 'gmail';
  threadId?: string;
  subject?: string;
}

export interface OutlookMessage extends BaseMessage {
  platform: 'outlook';
  threadId?: string;
  subject?: string;
}

export interface CustomEmailMessage extends BaseMessage {
  platform: 'custom-email';
  threadId?: string;
  subject?: string;
}

export interface TwilioSMSMessage extends BaseMessage {
  platform: 'twilio-sms';
  messageSid?: string;
  status?: 'queued' | 'sending' | 'sent' | 'failed' | 'delivered' | 'undelivered';
}

export interface WebsiteChatMessage extends BaseMessage {
  platform: 'website-chat';
  sessionId?: string;
  visitorId?: string;
  visitorEmail?: string;
  visitorName?: string;
  pageUrl?: string;
}

export interface LiveChatMessage extends BaseMessage {
  platform: 'live-chat';
  sessionId?: string;
  agentId?: string;
  visitorId?: string;
  chatRoom?: string;
  isAgentMessage?: boolean;
}

// Provider interfaces for sending messages
interface IMessagingProvider {
  sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  processWebhook(payload: any, integration: MessagingIntegration): Promise<void>;
  testConnection(config: Record<string, any>): Promise<{ success: boolean; error?: string }>;
}

// WhatsApp Provider (reusing existing logic)
class WhatsAppProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    const { whatsappService } = await import('@/lib/whatsapp-service');
    
    // Convert BaseMessage to WhatsAppMessage format
    const whatsappMessage = {
      conversationId: message.conversationId,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl,
      to: message.to,
      from: integration.config.phoneNumber || integration.config.phone_number,
    };
    
    if (integration.provider === 'twilio' || integration.provider === 'twilio_sandbox') {
      return whatsappService.sendMessageViaTwilio(
        integration.config.accountSid || integration.config.account_sid,
        integration.config.authToken || integration.config.auth_token_encrypted,
        whatsappMessage
      );
    } else if (integration.provider === 'meta' || integration.provider === 'whatsapp_business' || 
               integration.provider === 'meta_sandbox' || integration.provider === 'whatsapp_business_sandbox') {
      return whatsappService.sendMessageViaWhatsAppBusiness(
        integration.config.businessAccountId || integration.config.business_account_id,
        integration.config.accessToken || integration.config.auth_token_encrypted,
        whatsappMessage
      );
    }
    
    return { success: false, error: 'Unsupported WhatsApp provider' };
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    const { whatsappService } = await import('@/lib/whatsapp-service');
    
    if (integration.provider === 'twilio' || integration.provider === 'twilio_sandbox') {
      await whatsappService.processTwilioWebhook(payload);
    } else if (integration.provider === 'meta' || integration.provider === 'whatsapp_business' || 
               integration.provider === 'meta_sandbox' || integration.provider === 'whatsapp_business_sandbox') {
      await whatsappService.processWhatsAppBusinessWebhook(payload);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      if (config.provider === 'twilio' || config.provider === 'twilio_sandbox') {
        const response = await axios.get(
          `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`,
          {
            auth: {
              username: config.accountSid,
              password: config.authToken,
            },
          }
        );
        return { success: response.status === 200 };
      } else if (config.provider === 'meta' || config.provider === 'meta_sandbox') {
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${config.businessAccountId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
            },
          }
        );
        return { success: response.status === 200 };
      }
      return { success: false, error: 'Unsupported provider' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Telegram Provider - Use the full implementation
class TelegramProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    const { telegramProvider } = await import('@/lib/providers/telegram');
    return await telegramProvider.sendMessage(integration, message);
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    const { telegramProvider } = await import('@/lib/providers/telegram');
    return await telegramProvider.processWebhook(payload, integration);
  }

  async testConnection(config: Record<string, any>) {
    const { telegramProvider } = await import('@/lib/providers/telegram');
    return await telegramProvider.testConnection(config);
  }
}

// Facebook Provider
class FacebookProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { FacebookMessengerProvider } = await import('@/lib/providers/facebook');
      const provider = new FacebookMessengerProvider(integration.config);
      return await provider.sendMessage(message as any);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { FacebookMessengerProvider } = await import('@/lib/providers/facebook');
      const provider = new FacebookMessengerProvider(integration.config);
      await provider.processWebhook(payload);
    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { FacebookMessengerProvider } = await import('@/lib/providers/facebook');
      const provider = new FacebookMessengerProvider(config);
      return await provider.testConnection();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class InstagramProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { InstagramProvider: InstagramProviderImpl } = await import('@/lib/providers/instagram');
      const provider = new InstagramProviderImpl(integration.config);
      return await provider.sendDirectMessage(message as any);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { InstagramProvider: InstagramProviderImpl } = await import('@/lib/providers/instagram');
      const provider = new InstagramProviderImpl(integration.config);
      await provider.processWebhook(payload);
    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { InstagramProvider: InstagramProviderImpl } = await import('@/lib/providers/instagram');
      const provider = new InstagramProviderImpl(config);
      return await provider.testConnection();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class SlackProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { SlackProvider: SlackProviderImpl } = await import('@/lib/providers/slack');
      const provider = new SlackProviderImpl(integration.config);
      return await provider.sendMessage(message as any);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { SlackProvider: SlackProviderImpl } = await import('@/lib/providers/slack');
      const provider = new SlackProviderImpl(integration.config);
      const result = await provider.processWebhook(payload);
      return result;
    } catch (error) {
      console.error('Error processing Slack webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { SlackProvider: SlackProviderImpl } = await import('@/lib/providers/slack');
      const provider = new SlackProviderImpl(config);
      return await provider.testConnection();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class DiscordProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { DiscordProvider: DiscordProviderImpl } = await import('@/lib/providers/discord');
      const provider = new DiscordProviderImpl(integration.config);
      return await provider.sendMessage(message as any);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { DiscordProvider: DiscordProviderImpl } = await import('@/lib/providers/discord');
      const provider = new DiscordProviderImpl(integration.config);
      const result = await provider.processWebhook(payload);
      return result;
    } catch (error) {
      console.error('Error processing Discord webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { DiscordProvider: DiscordProviderImpl } = await import('@/lib/providers/discord');
      const provider = new DiscordProviderImpl(integration.config);
      return await provider.testConnection();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class YouTubeProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { youtubeProviderProduction } = await import('@/lib/providers/youtube/production-ready');
      return await youtubeProviderProduction.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { youtubeProviderProduction } = await import('@/lib/providers/youtube/production-ready');
      await youtubeProviderProduction.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing YouTube webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { youtubeProviderProduction } = await import('@/lib/providers/youtube/production-ready');
      return await youtubeProviderProduction.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class TikTokProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    return { success: false, error: 'TikTok coming soon' };
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    console.log('TikTok webhook - coming soon');
  }

  async testConnection(config: Record<string, any>) {
    return { success: false, error: 'TikTok coming soon' };
  }
}

class GmailProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const gmailProvider = await providerFactory.getGmailProvider();
      return await gmailProvider.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const gmailProvider = await providerFactory.getGmailProvider();
      await gmailProvider.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Gmail webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const gmailProvider = await providerFactory.getGmailProvider();
      return await gmailProvider.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class OutlookProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { OutlookProviderProduction } = await import('@/lib/providers/outlook/production-ready');
      const provider = new OutlookProviderProduction();
      return await provider.sendMessage(integration.config, {
        to: message.to,
        content: message.content,
        subject: (message as OutlookMessage).subject || 'Message from your business',
        html: message.metadata?.html
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { OutlookProviderProduction } = await import('@/lib/providers/outlook/production-ready');
      const provider = new OutlookProviderProduction();
      await provider.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Outlook webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { OutlookProviderProduction } = await import('@/lib/providers/outlook/production-ready');
      const provider = new OutlookProviderProduction();
      return await provider.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class CustomEmailProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { CustomEmailProviderProduction } = await import('@/lib/providers/custom-email/production-ready');
      const provider = new CustomEmailProviderProduction();
      return await provider.sendMessage(integration.config, {
        to: message.to,
        content: message.content,
        subject: (message as CustomEmailMessage).subject || 'Message from your business',
        html: message.metadata?.html
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { CustomEmailProviderProduction } = await import('@/lib/providers/custom-email/production-ready');
      const provider = new CustomEmailProviderProduction();
      await provider.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Custom Email webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { CustomEmailProviderProduction } = await import('@/lib/providers/custom-email/production-ready');
      const provider = new CustomEmailProviderProduction();
      return await provider.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class TwilioSMSProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { twilioSMSProviderProduction } = await import('@/lib/providers/twilio-sms');
      return await twilioSMSProviderProduction.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { twilioSMSProviderProduction } = await import('@/lib/providers/twilio-sms');
      await twilioSMSProviderProduction.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Twilio SMS webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { twilioSMSProviderProduction } = await import('@/lib/providers/twilio-sms');
      return await twilioSMSProviderProduction.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class WebsiteChatProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { websiteChatProviderProduction } = await import('@/lib/providers/website-chat/production-ready');
      return await websiteChatProviderProduction.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { websiteChatProviderProduction } = await import('@/lib/providers/website-chat/production-ready');
      await websiteChatProviderProduction.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Website Chat webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { websiteChatProviderProduction } = await import('@/lib/providers/website-chat/production-ready');
      return await websiteChatProviderProduction.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class LiveChatProvider implements IMessagingProvider {
  async sendMessage(integration: MessagingIntegration, message: BaseMessage) {
    try {
      const { liveChatProviderProduction } = await import('@/lib/providers/live-chat/production-ready');
      return await liveChatProviderProduction.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration) {
    try {
      const { liveChatProviderProduction } = await import('@/lib/providers/live-chat/production-ready');
      await liveChatProviderProduction.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Live Chat webhook:', error);
    }
  }

  async testConnection(config: Record<string, any>) {
    try {
      const { liveChatProviderProduction } = await import('@/lib/providers/live-chat/production-ready');
      return await liveChatProviderProduction.testConnection(config);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Main Messaging Service
class MessagingService {
  private static instance: MessagingService;
  private providers: Map<string, IMessagingProvider> = new Map();

  constructor() {
    // Initialize providers
    this.providers.set('whatsapp', new WhatsAppProvider());
    this.providers.set('telegram', new TelegramProvider());
    this.providers.set('facebook', new FacebookProvider());
    this.providers.set('instagram', new InstagramProvider());
    this.providers.set('slack', new SlackProvider());
    this.providers.set('discord', new DiscordProvider());
    this.providers.set('youtube', new YouTubeProvider());
    this.providers.set('tiktok', new TikTokProvider());
    this.providers.set('gmail', new GmailProvider());
    this.providers.set('outlook', new OutlookProvider());
    this.providers.set('custom-email', new CustomEmailProvider());
    this.providers.set('twilio-sms', new TwilioSMSProvider());
    this.providers.set('website-chat', new WebsiteChatProvider());
    this.providers.set('live-chat', new LiveChatProvider());
  }

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Send message via any platform
  async sendMessage(userId: string, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const integration = await this.getActiveIntegration(userId, message.platform);
      if (!integration) {
        return { success: false, error: `No active ${message.platform} integration found` };
      }

      const provider = this.providers.get(message.platform);
      if (!provider) {
        return { success: false, error: `Unsupported platform: ${message.platform}` };
      }

      const result = await provider.sendMessage(integration, message);

      // Store sent message if successful
      if (result.success && message.conversationId) {
        await this.storeMessage({
          ...message,
          conversationId: message.conversationId, // Ensure conversationId is explicitly passed
          platformMessageId: result.messageId,
          senderType: message.senderType || 'agent',
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle incoming webhook for any platform
  async handleInboundMessage(platform: string, payload: any): Promise<void> {
    try {
      const provider = this.providers.get(platform);
      if (!provider) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Get integration based on webhook payload
      const integration = await this.getIntegrationFromWebhook(platform, payload);
      if (!integration) {
        throw new Error(`No integration found for ${platform} webhook`);
      }

      // Process webhook with provider
      const result = await provider.processWebhook(payload, integration);

      // ✨ NEW: Trigger agent assignment and auto-reply after message processing
      try {
        // Extract message info from payload based on platform
        const messageInfo = this.extractMessageInfo(platform, payload);
        
        if (messageInfo) {
          // 🎯 Phase 1.2: Auto-assign agent to new conversation
          try {
            const { DefaultAgentAssignmentService } = await import('@/lib/services/default-agent-assignment-service');
            await DefaultAgentAssignmentService.handleNewConversation(
              messageInfo.conversationId,
              integration.user_id,
              platform,
              messageInfo.content,
              messageInfo.customerInfo,
              'general' // default category
            );
          } catch (assignmentError) {
            console.error('❌ Error in agent assignment:', assignmentError);
            // Continue with auto-reply even if assignment fails
          }

          // 📊 Phase 3.1: Track conversation state
          try {
            const { conversationStateService } = await import('@/lib/services/conversation-state-service');
            await conversationStateService.updateConversationState(
              messageInfo.conversationId,
              integration.user_id,
              messageInfo.content,
              'inbound',
              platform
            );
          } catch (stateError) {
            console.error('❌ Error updating conversation state:', stateError);
          }

          // 🤖 Trigger auto-reply after assignment
          await AgentAutoReplyService.handleWebhookMessage(
            platform,
            messageInfo.conversationId,
            integration.user_id,
            messageInfo.content,
            messageInfo.senderId,
            {
              platform,
              customerInfo: messageInfo.customerInfo
            }
          );
        }
      } catch (autoReplyError) {
        console.error('❌ Error in auto-reply processing:', autoReplyError);
        // Don't let auto-reply errors break the webhook processing
      }
    } catch (error) {
      console.error('Error handling inbound message:', error);
      throw error;
    }
  }

  // Extract message information from platform payload for auto-reply
  private extractMessageInfo(platform: string, payload: any): { conversationId: string; content: string; senderId: string; customerInfo?: any } | null {
    try {
      switch (platform) {
        case 'whatsapp':
          // Twilio format
          if (payload.From && payload.Body) {
            return {
              conversationId: payload.MessageSid || `whatsapp_${payload.From}_${Date.now()}`,
              content: payload.Body,
              senderId: payload.From.replace('whatsapp:', ''),
              customerInfo: {
                phone: payload.From.replace('whatsapp:', ''),
                platform: 'whatsapp'
              }
            };
          }
          break;
          
        case 'telegram':
          if (payload.message && payload.message.text) {
            return {
              conversationId: `telegram_${payload.message.chat.id}`,
              content: payload.message.text,
              senderId: payload.message.from.id.toString(),
              customerInfo: {
                telegramId: payload.message.from.id,
                username: payload.message.from.username,
                firstName: payload.message.from.first_name,
                platform: 'telegram'
              }
            };
          }
          break;
          
        case 'facebook':
        case 'instagram':
          if (payload.entry && payload.entry[0]?.messaging && payload.entry[0].messaging[0]?.message) {
            const messaging = payload.entry[0].messaging[0];
            return {
              conversationId: `${platform}_${messaging.sender.id}`,
              content: messaging.message.text || '',
              senderId: messaging.sender.id,
              customerInfo: {
                recipientId: messaging.sender.id,
                platform
              }
            };
          }
          break;
          
        default:
          console.log(`Auto-reply message extraction not implemented for platform: ${platform}`);
          return null;
      }
    } catch (error) {
      console.error(`Error extracting message info for ${platform}:`, error);
    }
    
    return null;
  }

  // Test connection for any platform
  async testConnection(platform: string, config: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(platform);
    if (!provider) {
      return { success: false, error: `Unsupported platform: ${platform}` };
    }

    return provider.testConnection(config);
  }

  // Get active integration for user and platform
  async getActiveIntegration(userId: string, platform: string): Promise<MessagingIntegration | null> {
    try {
      // Set user context for RLS
      try {
        await supabase.rpc('set_current_user_id', { user_id: userId });
        console.log('User context set for getActiveIntegration:', userId);
      } catch (contextError) {
        console.error('Failed to set user context for getActiveIntegration:', contextError);
      }

      // All platforms including WhatsApp use the messaging_integrations table

      // For other platforms, use the messaging_integrations table
      const { data, error } = await supabase
        .from('messaging_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('status', 'active')
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error('Error getting integration:', error);
      return null;
    }
  }

  // Get all integrations for user
  async getUserIntegrations(userId: string): Promise<MessagingIntegration[]> {
    try {
      console.log('Getting user integrations for userId:', userId);
      
      // Set user context for RLS to prevent connection blocking
      try {
        await supabase.rpc('set_current_user_id', { user_id: userId });
        console.log('User context set for getUserIntegrations:', userId);
      } catch (contextError) {
        console.error('Failed to set user context for getUserIntegrations:', contextError);
        // Continue without failing - direct user_id query should still work
      }

      // Get all messaging integrations from the unified table
      const { data: integrations, error } = await supabase
        .from('messaging_integrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user integrations:', error);
        return [];
      }

      console.log('Found integrations:', integrations?.length || 0);
      return integrations || [];
    } catch (error) {
      console.error('Error getting user integrations:', error);
      return [];
    }
  }

  // Create or update integration
  async upsertIntegration(integration: Partial<MessagingIntegration>): Promise<MessagingIntegration | null> {
    try {
      console.log('Attempting to upsert integration:', integration);
      
      // Set user context for RLS if user_id is provided
      if (integration.user_id) {
        try {
          await supabase.rpc('set_current_user_id', { user_id: integration.user_id });
          console.log('User context set for:', integration.user_id);
        } catch (contextError) {
          console.error('Failed to set user context:', contextError);
          // Continue without failing - RLS may still work with direct user_id
        }
      }
      
      // Ensure user_id is properly formatted for UUID type
      const integrationData = {
        ...integration,
        updated_at: new Date().toISOString(),
      };

      // Log the data being inserted for debugging
      console.log('Integration data to upsert:', integrationData);
      
      // Use upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('messaging_integrations')
        .upsert(integrationData, { 
          onConflict: 'user_id,platform,name' 
        })
        .select()
        .single();

      console.log('Supabase upsert result:', { data, error });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error upserting integration:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return null;
    }
  }

  // Delete integration
  async deleteIntegration(integrationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messaging_integrations')
        .delete()
        .eq('id', integrationId);

      return !error;
    } catch (error) {
      console.error('Error deleting integration:', error);
      return false;
    }
  }

  // Store message in database
  private async storeMessage(message: Partial<BaseMessage> & { conversationId: string }): Promise<void> {
    try {
      // Use platform-specific table (e.g., whatsapp_messages, telegram_messages)
      const tableName = `${message.platform}_messages`;
      
      console.log(`💾 Storing sent message in ${tableName}:`, message.content);
      
      // Get contact_id from conversation
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('contact_id')
        .eq('id', message.conversationId)
        .single();

      const { error } = await supabase
        .from(tableName)
        .insert({
          user_id: message.from,           // ✅ Correct field
          conversation_id: message.conversationId,
          contact_id: conversation?.contact_id, // ✅ Required field
          platform_message_id: message.platformMessageId,
          message_text: message.content,   // ✅ Correct field name
          direction: 'outbound',           // ✅ New required field
          message_type: message.messageType || 'text',
          media_url: message.mediaUrl,
          platform: message.platform,
          metadata: message.metadata,
          timestamp: new Date().toISOString(),  // ✅ Correct field name
          created_at: new Date().toISOString(),
          status: 'sent'                   // ✅ New field
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  // Get integration from webhook payload
  private async getIntegrationFromWebhook(platform: string, payload: any): Promise<MessagingIntegration | null> {
    try {
      // Platform-specific integration identification
      if (platform === 'telegram') {
        // For Telegram, use messaging_integrations table
        const { data } = await supabase
          .from('messaging_integrations')
          .select('*')
          .eq('platform', platform)
          .eq('status', 'active')
          .limit(1)
          .single();
        return data || null;
      } else if (platform === 'whatsapp') {
        // WhatsApp uses messaging_integrations table (same as other platforms)
        console.log('Looking for WhatsApp integration in messaging_integrations table');
        
        const { data, error } = await supabase
          .from('messaging_integrations')
          .select('*')
          .eq('platform', 'whatsapp')
          .eq('status', 'active')
          .limit(1)
          .single();
          
        if (error) {
          console.error('Error finding WhatsApp integration:', error);
          return null;
        }
        
        if (!data) {
          console.log('No active WhatsApp integration found in messaging_integrations');
          return null;
        }
        
        console.log('✅ Found WhatsApp integration:', data.id, 'for user:', data.user_id);
        return data;
      } else {
        // Default: get first active integration for platform from messaging_integrations
        const { data } = await supabase
          .from('messaging_integrations')
          .select('*')
          .eq('platform', platform)
          .eq('status', 'active')
          .limit(1)
          .single();
        return data || null;
      }
    } catch (error) {
      console.error('Error getting integration from webhook:', error);
      return null;
    }
  }
}

export const messagingService = MessagingService.getInstance();
export default messagingService;