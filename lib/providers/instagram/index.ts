import axios from 'axios';
import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

export interface InstagramConfig {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  apiVersion?: string;
  mode?: 'sandbox' | 'production';
  testUsers?: string[]; // For sandbox mode
}

export interface InstagramMessage extends BaseMessage {
  platform: 'instagram';
  instagramId?: string;
  messageId?: string;
  mid?: string;
  replyTo?: string;
  mediaType?: 'image' | 'video' | 'story' | 'reel';
  storyId?: string;
  mediaUrl?: string;
}

export interface InstagramWebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: 'image' | 'video' | 'audio' | 'file';
        payload: {
          url: string;
        };
      }>;
    };
    postback?: {
      payload: string;
      title: string;
    };
  }>;
  changes?: Array<{
    field: string;
    value: {
      from: {
        id: string;
        username: string;
      };
      media: {
        id: string;
        media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
        media_url?: string;
      };
      text: string;
      id: string;
    };
  }>;
}

export interface InstagramWebhookPayload {
  object: 'instagram';
  entry: InstagramWebhookEntry[];
}

export class InstagramProvider {
  private config: InstagramConfig;
  private baseUrl: string;
  private isSandbox: boolean;

  constructor(config: InstagramConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}`;
    this.isSandbox = config.mode === 'sandbox';
  }

  // Check if user is allowed in sandbox mode
  private isUserAllowed(instagramId: string): boolean {
    if (!this.isSandbox) return true; // Production mode - all users allowed
    
    // In sandbox mode, only allow test users
    const testUsers = this.config.testUsers || [];
    return testUsers.includes(instagramId);
  }

  // Get sandbox limitations message
  private getSandboxLimitations(): string[] {
    return [
      "📱 Sandbox Mode Active",
      "✅ Test with your account and up to 5 test users",
      "❌ Cannot message users outside test list",
      "⚠️ Apply for Instagram Basic Display approval for full access"
    ];
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.appSecret)
        .update(payload)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying Instagram webhook signature:', error);
      return false;
    }
  }

  async processWebhook(payload: InstagramWebhookPayload): Promise<void> {
    try {
      for (const entry of payload.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message) {
              await this.handleDirectMessage(messagingEvent);
            } else if (messagingEvent.postback) {
              await this.handlePostback(messagingEvent);
            }
          }
        }

        if (entry.changes) {
          for (const change of entry.changes) {
            switch (change.field) {
              case 'comments':
                await this.handleComment(change.value);
                break;
              case 'mentions':
                await this.handleMention(change.value);
                break;
              case 'story_insights':
                await this.handleStoryReply(change.value);
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
      throw error;
    }
  }

  private async handleDirectMessage(messagingEvent: any): Promise<void> {
    const { sender, recipient, timestamp, message } = messagingEvent;
    
    if (!message || !message.text) {
      console.log('Skipping non-text Instagram DM or message without text');
      return;
    }

    // Check sandbox restrictions
    if (this.isSandbox && !this.isUserAllowed(sender.id)) {
      console.log(`Sandbox mode: Ignoring message from non-test user ${sender.id}`);
      return;
    }

    const instagramMessage: InstagramMessage = {
      id: message.mid,
      content: message.text,
      senderId: sender.id,
      recipientId: recipient.id,
      timestamp: new Date(timestamp),
      platform: 'instagram',
      instagramId: sender.id,
      messageId: message.mid,
      mid: message.mid,
      metadata: {
        type: 'direct_message',
        attachments: message.attachments,
        sandbox_mode: this.isSandbox
      }
    };

    await this.storeMessage(instagramMessage);
    await this.classifyAndRoute(instagramMessage);
  }

  private async handleComment(changeValue: any): Promise<void> {
    const { from, media, text, id } = changeValue;
    
    const instagramMessage: InstagramMessage = {
      id: `comment_${id}`,
      content: text,
      senderId: from.id,
      recipientId: this.config.pageId,
      timestamp: new Date(),
      platform: 'instagram',
      instagramId: from.id,
      messageId: id,
      mediaType: media.media_type.toLowerCase() as any,
      metadata: {
        type: 'comment',
        media_id: media.id,
        media_type: media.media_type,
        media_url: media.media_url,
        username: from.username
      }
    };

    await this.storeMessage(instagramMessage);
    await this.classifyAndRoute(instagramMessage);
  }

  private async handleMention(changeValue: any): Promise<void> {
    const { from, media, text, id } = changeValue;
    
    const instagramMessage: InstagramMessage = {
      id: `mention_${id}`,
      content: text,
      senderId: from.id,
      recipientId: this.config.pageId,
      timestamp: new Date(),
      platform: 'instagram',
      instagramId: from.id,
      messageId: id,
      mediaType: media.media_type.toLowerCase() as any,
      metadata: {
        type: 'mention',
        media_id: media.id,
        media_type: media.media_type,
        media_url: media.media_url,
        username: from.username
      }
    };

    await this.storeMessage(instagramMessage);
    await this.classifyAndRoute(instagramMessage);
  }

  private async handleStoryReply(changeValue: any): Promise<void> {
    const { from, media, text, id } = changeValue;
    
    const instagramMessage: InstagramMessage = {
      id: `story_reply_${id}`,
      content: text,
      senderId: from.id,
      recipientId: this.config.pageId,
      timestamp: new Date(),
      platform: 'instagram',
      instagramId: from.id,
      messageId: id,
      storyId: media.id,
      metadata: {
        type: 'story_reply',
        story_id: media.id,
        username: from.username
      }
    };

    await this.storeMessage(instagramMessage);
    await this.classifyAndRoute(instagramMessage);
  }

  private async handlePostback(messagingEvent: any): Promise<void> {
    const { sender, recipient, timestamp, postback } = messagingEvent;
    
    const instagramMessage: InstagramMessage = {
      id: `postback_${timestamp}`,
      content: postback.title || postback.payload,
      senderId: sender.id,
      recipientId: recipient.id,
      timestamp: new Date(timestamp),
      platform: 'instagram',
      instagramId: sender.id,
      metadata: {
        type: 'postback',
        payload: postback.payload,
        title: postback.title
      }
    };

    await this.storeMessage(instagramMessage);
    await this.classifyAndRoute(instagramMessage);
  }

  async sendDirectMessage(message: InstagramMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check sandbox restrictions for outbound messages
      if (this.isSandbox && !this.isUserAllowed(message.instagramId!)) {
        return { 
          success: false, 
          error: `Sandbox mode: Cannot message user ${message.instagramId}. Add them as a test user first.` 
        };
      }

      const payload = {
        recipient: { id: message.instagramId },
        message: {
          text: message.content
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/me/messages`,
        payload,
        {
          params: { access_token: this.config.pageAccessToken },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.message_id) {
        const sentMessage: InstagramMessage = {
          ...message,
          id: response.data.message_id,
          messageId: response.data.message_id,
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            ...message.metadata,
            sandbox_mode: this.isSandbox
          }
        };
        await this.storeMessage(sentMessage);

        return { 
          success: true, 
          messageId: response.data.message_id 
        };
      }

      return { success: false, error: 'No message ID returned' };
    } catch (error: any) {
      console.error('Error sending Instagram DM:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  async replyToComment(commentId: string, text: string): Promise<{ success: boolean; commentId?: string; error?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${commentId}/replies`,
        { message: text },
        {
          params: { access_token: this.config.pageAccessToken },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return { 
        success: true, 
        commentId: response.data.id 
      };
    } catch (error: any) {
      console.error('Error replying to Instagram comment:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  async getUserProfile(instagramId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${instagramId}`,
        {
          params: {
            fields: 'id,username,account_type,media_count,follower_count',
            access_token: this.config.pageAccessToken
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Instagram user profile:', error);
      throw error;
    }
  }

  async getMediaInfo(mediaId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${mediaId}`,
        {
          params: {
            fields: 'id,media_type,media_url,permalink,timestamp,caption',
            access_token: this.config.pageAccessToken
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Instagram media info:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me`,
        {
          params: { 
            fields: 'id,username,account_type',
            access_token: this.config.pageAccessToken 
          }
        }
      );

      if (response.data.id) {
        const info: any = {
          account_id: response.data.id,
          username: response.data.username,
          account_type: response.data.account_type,
          mode: this.isSandbox ? 'sandbox' : 'production'
        };

        if (this.isSandbox) {
          info.limitations = this.getSandboxLimitations();
          info.test_users = this.config.testUsers || [];
        }

        return { success: true, info };
      }

      return { success: false, error: 'Invalid response from Instagram API' };
    } catch (error: any) {
      console.error('Error testing Instagram connection:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  // Add test user to sandbox mode
  async addTestUser(instagramId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSandbox) {
      return { success: false, error: 'Test users can only be added in sandbox mode' };
    }

    try {
      // Update config with new test user
      const testUsers = this.config.testUsers || [];
      if (!testUsers.includes(instagramId)) {
        testUsers.push(instagramId);
        this.config.testUsers = testUsers;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Remove test user from sandbox mode
  async removeTestUser(instagramId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSandbox) {
      return { success: false, error: 'Test users can only be removed in sandbox mode' };
    }

    try {
      const testUsers = this.config.testUsers || [];
      const index = testUsers.indexOf(instagramId);
      if (index > -1) {
        testUsers.splice(index, 1);
        this.config.testUsers = testUsers;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async storeMessage(message: InstagramMessage): Promise<void> {
    try {
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: `instagram_${message.instagramId}`,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          platform: 'instagram',
          platform_message_id: message.messageId || message.mid,
          metadata: message.metadata,
          status: message.status || 'received',
          timestamp: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error storing Instagram message:', error);
    }
  }

  private async classifyAndRoute(message: InstagramMessage): Promise<void> {
    console.log('Processing Instagram message for classification:', {
      id: message.id,
      content: message.content,
      sender: message.senderId,
      type: message.metadata?.type
    });
  }
}

export default InstagramProvider;