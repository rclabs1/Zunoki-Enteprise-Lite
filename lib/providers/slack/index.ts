import axios from 'axios';
import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

export interface SlackConfig {
  teamId: string;
  botToken: string;
  signingSecret: string;
  clientId?: string;
  clientSecret?: string;
  apiVersion?: string;
}

export interface SlackMessage extends BaseMessage {
  platform: 'slack';
  channel?: string;
  channelId?: string;
  threadTs?: string;
  user?: string;
  team?: string;
  eventType?: 'message' | 'app_mention' | 'reaction_added' | 'file_shared';
}

export interface SlackEvent {
  type: string;
  channel: string;
  user: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  files?: Array<{
    id: string;
    name: string;
    mimetype: string;
    url_private: string;
    size: number;
  }>;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
}

export interface SlackWebhookPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: 'event_callback' | 'url_verification';
  challenge?: string;
  event_id: string;
  event_time: number;
}

export class SlackProvider {
  private config: SlackConfig;
  private baseUrl: string;

  constructor(config: SlackConfig) {
    this.config = config;
    this.baseUrl = 'https://slack.com/api';
  }

  verifyWebhookSignature(payload: string, timestamp: string, signature: string): boolean {
    try {
      const sigBasestring = `v0:${timestamp}:${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.signingSecret)
        .update(sigBasestring, 'utf8')
        .digest('hex');
      
      const computedSignature = `v0=${expectedSignature}`;
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(computedSignature, 'utf8')
      );
    } catch (error) {
      console.error('Error verifying Slack webhook signature:', error);
      return false;
    }
  }

  async processWebhook(payload: SlackWebhookPayload): Promise<string | void> {
    try {
      if (payload.type === 'url_verification') {
        return payload.challenge;
      }

      if (payload.type === 'event_callback' && payload.event) {
        await this.handleEvent(payload.event);
      }
    } catch (error) {
      console.error('Error processing Slack webhook:', error);
      throw error;
    }
  }

  private async handleEvent(event: SlackEvent): Promise<void> {
    switch (event.type) {
      case 'message':
        await this.handleMessage(event);
        break;
      case 'app_mention':
        await this.handleAppMention(event);
        break;
      case 'reaction_added':
        await this.handleReaction(event);
        break;
      case 'file_shared':
        await this.handleFileShare(event);
        break;
      default:
        console.log(`Unhandled Slack event type: ${event.type}`);
    }
  }

  private async handleMessage(event: SlackEvent): Promise<void> {
    if (!event.text || event.user?.startsWith('B')) {
      console.log('Skipping bot message or message without text');
      return;
    }

    const slackMessage: SlackMessage = {
      id: `slack_${event.ts}`,
      content: event.text,
      senderId: event.user,
      recipientId: this.config.teamId,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      platform: 'slack',
      channel: event.channel,
      channelId: event.channel,
      threadTs: event.thread_ts,
      user: event.user,
      team: this.config.teamId,
      eventType: 'message',
      metadata: {
        type: 'message',
        channel_id: event.channel,
        thread_ts: event.thread_ts,
        files: event.files
      }
    };

    await this.storeMessage(slackMessage);
    await this.classifyAndRoute(slackMessage);
  }

  private async handleAppMention(event: SlackEvent): Promise<void> {
    const slackMessage: SlackMessage = {
      id: `slack_mention_${event.ts}`,
      content: event.text || '',
      senderId: event.user,
      recipientId: this.config.teamId,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      platform: 'slack',
      channel: event.channel,
      channelId: event.channel,
      threadTs: event.thread_ts,
      user: event.user,
      team: this.config.teamId,
      eventType: 'app_mention',
      metadata: {
        type: 'app_mention',
        channel_id: event.channel,
        thread_ts: event.thread_ts
      }
    };

    await this.storeMessage(slackMessage);
    await this.classifyAndRoute(slackMessage);
  }

  private async handleReaction(event: SlackEvent): Promise<void> {
    const slackMessage: SlackMessage = {
      id: `slack_reaction_${event.ts}`,
      content: `Reaction added: ${event.reactions?.[0]?.name || 'unknown'}`,
      senderId: event.user,
      recipientId: this.config.teamId,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      platform: 'slack',
      channel: event.channel,
      channelId: event.channel,
      user: event.user,
      team: this.config.teamId,
      eventType: 'reaction_added',
      metadata: {
        type: 'reaction_added',
        channel_id: event.channel,
        reactions: event.reactions
      }
    };

    await this.storeMessage(slackMessage);
    await this.classifyAndRoute(slackMessage);
  }

  private async handleFileShare(event: SlackEvent): Promise<void> {
    const slackMessage: SlackMessage = {
      id: `slack_file_${event.ts}`,
      content: `File shared: ${event.files?.[0]?.name || 'unknown file'}`,
      senderId: event.user,
      recipientId: this.config.teamId,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      platform: 'slack',
      channel: event.channel,
      channelId: event.channel,
      user: event.user,
      team: this.config.teamId,
      eventType: 'file_shared',
      metadata: {
        type: 'file_shared',
        channel_id: event.channel,
        files: event.files
      }
    };

    await this.storeMessage(slackMessage);
    await this.classifyAndRoute(slackMessage);
  }

  async sendMessage(message: SlackMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: any = {
        channel: message.channelId,
        text: message.content
      };

      if (message.threadTs) {
        payload.thread_ts = message.threadTs;
      }

      const response = await axios.post(
        `${this.baseUrl}/chat.postMessage`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ok) {
        const sentMessage: SlackMessage = {
          ...message,
          id: `slack_sent_${response.data.ts}`,
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            ...message.metadata,
            slack_ts: response.data.ts
          }
        };
        await this.storeMessage(sentMessage);

        return { 
          success: true, 
          messageId: response.data.ts 
        };
      }

      return { 
        success: false, 
        error: response.data.error || 'Unknown Slack API error' 
      };
    } catch (error: any) {
      console.error('Error sending Slack message:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async sendDirectMessage(userId: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const dmResponse = await axios.post(
        `${this.baseUrl}/conversations.open`,
        { users: userId },
        {
          headers: {
            Authorization: `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!dmResponse.data.ok) {
        return { 
          success: false, 
          error: dmResponse.data.error || 'Failed to open DM channel' 
        };
      }

      const channelId = dmResponse.data.channel.id;
      
      const message: SlackMessage = {
        id: '',
        content: text,
        senderId: 'bot',
        recipientId: userId,
        timestamp: new Date(),
        platform: 'slack',
        channelId: channelId,
        user: 'bot',
        team: this.config.teamId
      };

      return await this.sendMessage(message);
    } catch (error: any) {
      console.error('Error sending Slack DM:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async getUserInfo(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users.info`,
        {
          params: { user: userId },
          headers: {
            Authorization: `Bearer ${this.config.botToken}`
          }
        }
      );

      if (response.data.ok) {
        return response.data.user;
      }

      throw new Error(response.data.error || 'Failed to get user info');
    } catch (error: any) {
      console.error('Error fetching Slack user info:', error);
      throw error;
    }
  }

  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/conversations.info`,
        {
          params: { channel: channelId },
          headers: {
            Authorization: `Bearer ${this.config.botToken}`
          }
        }
      );

      if (response.data.ok) {
        return response.data.channel;
      }

      throw new Error(response.data.error || 'Failed to get channel info');
    } catch (error: any) {
      console.error('Error fetching Slack channel info:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; teamInfo?: any }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth.test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.ok) {
        return { 
          success: true, 
          teamInfo: {
            team: response.data.team,
            user: response.data.user,
            bot_id: response.data.bot_id
          }
        };
      }

      return { 
        success: false, 
        error: response.data.error || 'Authentication failed' 
      };
    } catch (error: any) {
      console.error('Error testing Slack connection:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  private async storeMessage(message: SlackMessage): Promise<void> {
    try {
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: `slack_${message.channelId}`,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          platform: 'slack',
          platform_message_id: message.threadTs || message.id,
          metadata: message.metadata,
          status: message.status || 'received',
          timestamp: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error storing Slack message:', error);
    }
  }

  private async classifyAndRoute(message: SlackMessage): Promise<void> {
    console.log('Processing Slack message for classification:', {
      id: message.id,
      content: message.content,
      sender: message.senderId,
      channel: message.channelId,
      type: message.eventType
    });
  }
}

export default SlackProvider;