import axios from 'axios';
import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

export interface DiscordConfig {
  guildId: string;
  botToken: string;
  clientId: string;
  publicKey: string;
  applicationId: string;
}

export interface DiscordMessage extends BaseMessage {
  platform: 'discord';
  channelId?: string;
  guildId?: string;
  messageType?: 'text' | 'embed' | 'file' | 'reply' | 'slash_command';
  author?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  mentions?: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
    content_type: string;
  }>;
  embeds?: any[];
  referencedMessage?: string;
}

export interface DiscordInteraction {
  id: string;
  type: number;
  data?: {
    id: string;
    name: string;
    type: number;
    options?: any[];
  };
  guild_id?: string;
  channel_id: string;
  member?: {
    user: {
      id: string;
      username: string;
      discriminator: string;
      avatar?: string;
    };
  };
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  token: string;
  version: number;
}

export interface DiscordWebhookPayload {
  type: number;
  id?: string;
  channel_id?: string;
  guild_id?: string;
  author?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
  };
  content?: string;
  timestamp?: string;
  edited_timestamp?: string;
  tts?: boolean;
  mention_everyone?: boolean;
  mentions?: any[];
  mention_roles?: string[];
  attachments?: any[];
  embeds?: any[];
  reactions?: any[];
  message_reference?: {
    message_id: string;
    channel_id: string;
    guild_id?: string;
  };
}

export class DiscordProvider {
  private config: DiscordConfig;
  private baseUrl: string;

  constructor(config: DiscordConfig) {
    this.config = config;
    this.baseUrl = 'https://discord.com/api/v10';
  }

  verifyWebhookSignature(signature: string, timestamp: string, body: string): boolean {
    try {
      const isValidRequest = this.verifyKey(body, signature, timestamp, this.config.publicKey);
      return isValidRequest;
    } catch (error) {
      console.error('Error verifying Discord webhook signature:', error);
      return false;
    }
  }

  private verifyKey(rawBody: string, signature: string, timestamp: string, publicKey: string): boolean {
    try {
      const key = Buffer.from(publicKey, 'hex');
      const sig = Buffer.from(signature, 'hex');
      const message = Buffer.concat([Buffer.from(timestamp), Buffer.from(rawBody)]);

      const nacl = require('tweetnacl');
      return nacl.sign.detached.verify(message, sig, key);
    } catch (error) {
      console.error('Error in Discord signature verification:', error);
      return false;
    }
  }

  async processWebhook(payload: DiscordWebhookPayload | DiscordInteraction): Promise<any> {
    try {
      if ('type' in payload && payload.type === 1) {
        return { type: 1 };
      }

      if ('type' in payload && payload.type === 2) {
        return await this.handleSlashCommand(payload as DiscordInteraction);
      }

      if ('content' in payload && payload.content) {
        await this.handleMessage(payload as DiscordWebhookPayload);
      }
    } catch (error) {
      console.error('Error processing Discord webhook:', error);
      throw error;
    }
  }

  private async handleMessage(payload: DiscordWebhookPayload): Promise<void> {
    if (!payload.content || payload.author?.bot) {
      console.log('Skipping bot message or message without content');
      return;
    }

    const discordMessage: DiscordMessage = {
      id: payload.id || `discord_${Date.now()}`,
      content: payload.content,
      senderId: payload.author?.id || 'unknown',
      recipientId: this.config.guildId,
      timestamp: new Date(payload.timestamp || Date.now()),
      platform: 'discord',
      channelId: payload.channel_id,
      guildId: payload.guild_id,
      messageType: payload.attachments?.length ? 'file' : 'text',
      author: payload.author ? {
        id: payload.author.id,
        username: payload.author.username,
        discriminator: payload.author.discriminator,
        avatar: payload.author.avatar
      } : undefined,
      mentions: payload.mentions?.map(m => m.id) || [],
      attachments: payload.attachments,
      embeds: payload.embeds,
      referencedMessage: payload.message_reference?.message_id,
      metadata: {
        type: 'message',
        channel_id: payload.channel_id,
        guild_id: payload.guild_id,
        mentions: payload.mentions,
        attachments: payload.attachments,
        embeds: payload.embeds,
        reactions: payload.reactions
      }
    };

    await this.storeMessage(discordMessage);
    await this.classifyAndRoute(discordMessage);
  }

  private async handleSlashCommand(interaction: DiscordInteraction): Promise<any> {
    const user = interaction.member?.user || interaction.user;
    
    if (!user) {
      return { type: 4, data: { content: 'User not found' } };
    }

    const discordMessage: DiscordMessage = {
      id: `discord_slash_${interaction.id}`,
      content: `/${interaction.data?.name} ${interaction.data?.options?.map(o => o.value).join(' ') || ''}`,
      senderId: user.id,
      recipientId: this.config.guildId,
      timestamp: new Date(),
      platform: 'discord',
      channelId: interaction.channel_id,
      guildId: interaction.guild_id,
      messageType: 'slash_command',
      author: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar
      },
      metadata: {
        type: 'slash_command',
        interaction_id: interaction.id,
        command_name: interaction.data?.name,
        options: interaction.data?.options
      }
    };

    await this.storeMessage(discordMessage);
    await this.classifyAndRoute(discordMessage);

    return {
      type: 4,
      data: {
        content: 'Command received and processed!'
      }
    };
  }

  async sendMessage(message: DiscordMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: any = {
        content: message.content
      };

      if (message.embeds) {
        payload.embeds = message.embeds;
      }

      if (message.referencedMessage) {
        payload.message_reference = {
          message_id: message.referencedMessage
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/channels/${message.channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.id) {
        const sentMessage: DiscordMessage = {
          ...message,
          id: response.data.id,
          timestamp: new Date(),
          status: 'sent'
        };
        await this.storeMessage(sentMessage);

        return { 
          success: true, 
          messageId: response.data.id 
        };
      }

      return { success: false, error: 'No message ID returned' };
    } catch (error: any) {
      console.error('Error sending Discord message:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async sendDirectMessage(userId: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const dmResponse = await axios.post(
        `${this.baseUrl}/users/@me/channels`,
        { recipient_id: userId },
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!dmResponse.data.id) {
        return { 
          success: false, 
          error: 'Failed to create DM channel' 
        };
      }

      const message: DiscordMessage = {
        id: '',
        content: content,
        senderId: this.config.clientId,
        recipientId: userId,
        timestamp: new Date(),
        platform: 'discord',
        channelId: dmResponse.data.id,
        messageType: 'text'
      };

      return await this.sendMessage(message);
    } catch (error: any) {
      console.error('Error sending Discord DM:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async sendEmbed(channelId: string, embed: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/channels/${channelId}/messages`,
        { embeds: [embed] },
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { 
        success: true, 
        messageId: response.data.id 
      };
    } catch (error: any) {
      console.error('Error sending Discord embed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async getUserInfo(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/${userId}`,
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Discord user info:', error);
      throw error;
    }
  }

  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/channels/${channelId}`,
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Discord channel info:', error);
      throw error;
    }
  }

  async getGuildInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/guilds/${this.config.guildId}`,
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Discord guild info:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/@me`,
        {
          headers: {
            Authorization: `Bot ${this.config.botToken}`
          }
        }
      );
      
      if (response.data.id) {
        return { 
          success: true, 
          botInfo: {
            id: response.data.id,
            username: response.data.username,
            discriminator: response.data.discriminator,
            verified: response.data.verified,
            bot: response.data.bot
          }
        };
      }

      return { success: false, error: 'Invalid response from Discord API' };
    } catch (error: any) {
      console.error('Error testing Discord connection:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  private async storeMessage(message: DiscordMessage): Promise<void> {
    try {
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: `discord_${message.channelId}`,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          platform: 'discord',
          platform_message_id: message.id,
          metadata: message.metadata,
          status: message.status || 'received',
          timestamp: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error storing Discord message:', error);
    }
  }

  private async classifyAndRoute(message: DiscordMessage): Promise<void> {
    console.log('Processing Discord message for classification:', {
      id: message.id,
      content: message.content,
      sender: message.senderId,
      channel: message.channelId,
      guild: message.guildId,
      type: message.messageType
    });
  }
}

export default DiscordProvider;