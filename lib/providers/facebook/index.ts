import axios from 'axios';
import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  apiVersion?: string;
}

export interface FacebookMessage extends BaseMessage {
  platform: 'facebook';
  psid?: string; // Page-scoped ID
  messageId?: string;
  mid?: string; // Message ID from Facebook
  replyTo?: string;
  quick_replies?: Array<{
    content_type: 'text' | 'user_phone_number' | 'user_email';
    title?: string;
    payload?: string;
  }>;
}

export interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      quick_reply?: {
        payload: string;
      };
      attachments?: Array<{
        type: 'image' | 'video' | 'audio' | 'file';
        payload: {
          url: string;
          sticker_id?: number;
        };
      }>;
    };
    postback?: {
      payload: string;
      title: string;
    };
    delivery?: {
      mids: string[];
      watermark: number;
    };
    read?: {
      watermark: number;
    };
  }>;
}

export interface FacebookWebhookPayload {
  object: 'page';
  entry: FacebookWebhookEntry[];
}

export class FacebookMessengerProvider {
  private config: FacebookConfig;
  private baseUrl: string;

  constructor(config: FacebookConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion || 'v18.0'}`;
  }

  /**
   * Verify webhook signature
   */
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
      console.error('Error verifying Facebook webhook signature:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(payload: FacebookWebhookPayload): Promise<void> {
    try {
      for (const entry of payload.entry) {
        for (const messagingEvent of entry.messaging) {
          if (messagingEvent.message) {
            await this.handleMessage(messagingEvent);
          } else if (messagingEvent.postback) {
            await this.handlePostback(messagingEvent);
          } else if (messagingEvent.delivery) {
            await this.handleDelivery(messagingEvent);
          } else if (messagingEvent.read) {
            await this.handleRead(messagingEvent);
          }
        }
      }
    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(messagingEvent: any): Promise<void> {
    const { sender, recipient, timestamp, message } = messagingEvent;
    
    if (!message || !message.text) {
      console.log('Skipping non-text message or message without text');
      return;
    }

    const facebookMessage: FacebookMessage = {
      id: message.mid,
      content: message.text,
      senderId: sender.id,
      recipientId: recipient.id,
      timestamp: new Date(timestamp),
      platform: 'facebook',
      psid: sender.id,
      messageId: message.mid,
      mid: message.mid,
      metadata: {
        quick_reply: message.quick_reply,
        attachments: message.attachments
      }
    };

    // Store message in database
    await this.storeMessage(facebookMessage);

    // Process message with AI classification if needed
    await this.classifyAndRoute(facebookMessage);
  }

  /**
   * Handle postback events
   */
  private async handlePostback(messagingEvent: any): Promise<void> {
    const { sender, recipient, timestamp, postback } = messagingEvent;
    
    const facebookMessage: FacebookMessage = {
      id: `postback_${timestamp}`,
      content: postback.title || postback.payload,
      senderId: sender.id,
      recipientId: recipient.id,
      timestamp: new Date(timestamp),
      platform: 'facebook',
      psid: sender.id,
      metadata: {
        type: 'postback',
        payload: postback.payload,
        title: postback.title
      }
    };

    await this.storeMessage(facebookMessage);
    await this.classifyAndRoute(facebookMessage);
  }

  /**
   * Handle delivery confirmation
   */
  private async handleDelivery(messagingEvent: any): Promise<void> {
    const { sender, delivery } = messagingEvent;
    
    // Update message delivery status in database
    if (delivery.mids) {
      for (const mid of delivery.mids) {
        await supabase
          .from('messages')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('platform_message_id', mid)
          .eq('platform', 'facebook');
      }
    }
  }

  /**
   * Handle read confirmation
   */
  private async handleRead(messagingEvent: any): Promise<void> {
    const { sender, read } = messagingEvent;
    
    // Update message read status in database
    await supabase
      .from('messages')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('sender_id', sender.id)
      .eq('platform', 'facebook')
      .lte('created_at', new Date(read.watermark).toISOString());
  }

  /**
   * Send message
   */
  async sendMessage(message: FacebookMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload = {
        recipient: { id: message.psid },
        message: {
          text: message.content,
          ...(message.quick_replies && { quick_replies: message.quick_replies })
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
        // Store sent message in database
        const sentMessage: FacebookMessage = {
          ...message,
          id: response.data.message_id,
          messageId: response.data.message_id,
          timestamp: new Date(),
          status: 'sent'
        };
        await this.storeMessage(sentMessage);

        return { 
          success: true, 
          messageId: response.data.message_id 
        };
      }

      return { success: false, error: 'No message ID returned' };
    } catch (error: any) {
      console.error('Error sending Facebook message:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Send template message
   */
  async sendTemplate(psid: string, templateName: string, elements: any[]): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload = {
        recipient: { id: psid },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: templateName,
              elements: elements
            }
          }
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

      return { 
        success: true, 
        messageId: response.data.message_id 
      };
    } catch (error: any) {
      console.error('Error sending Facebook template:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(psid: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${psid}`,
        {
          params: {
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
            access_token: this.config.pageAccessToken
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Facebook user profile:', error);
      throw error;
    }
  }

  /**
   * Set persistent menu
   */
  async setPersistentMenu(menu: any): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(
        `${this.baseUrl}/me/messenger_profile`,
        { persistent_menu: [menu] },
        {
          params: { access_token: this.config.pageAccessToken },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error setting Facebook persistent menu:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Set greeting text
   */
  async setGreeting(text: string): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(
        `${this.baseUrl}/me/messenger_profile`,
        { 
          greeting: [{ 
            locale: 'default', 
            text: text 
          }] 
        },
        {
          params: { access_token: this.config.pageAccessToken },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error setting Facebook greeting:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me`,
        {
          params: { 
            fields: 'name,id',
            access_token: this.config.pageAccessToken 
          }
        }
      );

      if (response.data.id) {
        return { success: true };
      }

      return { success: false, error: 'Invalid response from Facebook API' };
    } catch (error: any) {
      console.error('Error testing Facebook connection:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Store message in database
   */
  private async storeMessage(message: FacebookMessage): Promise<void> {
    try {
      await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: `facebook_${message.psid}`,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          platform: 'facebook',
          platform_message_id: message.messageId || message.mid,
          metadata: message.metadata,
          status: message.status || 'received',
          timestamp: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error storing Facebook message:', error);
    }
  }

  /**
   * Classify and route message
   */
  private async classifyAndRoute(message: FacebookMessage): Promise<void> {
    // This would integrate with your existing message classification system
    // For now, just log the message
    console.log('Processing Facebook message for classification:', {
      id: message.id,
      content: message.content,
      sender: message.senderId
    });
  }
}

export default FacebookMessengerProvider;