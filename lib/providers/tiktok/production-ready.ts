import axios from 'axios';
import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import crypto from 'crypto';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface TikTokConfig {
  accessToken: string;
  refreshToken: string;
  userOpenId: string; // TikTok user ID
  username?: string;
  displayName?: string;
  clientKey?: string;
  clientSecret?: string;
  businessAccountId?: string;
  webhookSecret?: string;
}

export interface TikTokMessage extends BaseMessage {
  platform: 'tiktok';
  conversationId?: string;
  videoId?: string;
  commentId?: string;
  parentCommentId?: string;
  messageType: 'dm' | 'comment' | 'video_comment' | 'live_comment' | 'mention' | 'duet' | 'stitch';
  isReply?: boolean;
  engagementType?: 'like' | 'share' | 'follow' | 'comment';
  videoUrl?: string;
  videoTitle?: string;
}

export interface ParsedTikTokEvent {
  eventType: 'message' | 'comment' | 'mention' | 'engagement';
  messageId: string;
  fromUserOpenId: string;
  fromUsername: string;
  fromDisplayName: string;
  content: string;
  timestamp: string;
  videoId?: string;
  commentId?: string;
  parentCommentId?: string;
  engagementType?: string;
  mediaUrl?: string;
  mediaType?: string;
}

class TikTokProviderProduction {
  private baseUrl = 'https://open.tiktokapis.com';
  
  // Create authenticated request headers
  private getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Send message = Reply to DM or comment
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as TikTokConfig;
      const tiktokMessage = message as TikTokMessage;

      if (!config.accessToken || !config.userOpenId) {
        return { success: false, error: 'TikTok authentication not configured' };
      }

      if (!message.content) {
        return { success: false, error: 'Message content is required' };
      }

      let result;

      // Handle different message types
      if (tiktokMessage.messageType === 'dm') {
        // Send direct message
        result = await this.sendDirectMessage(config, message.to, message.content);
      } else if (tiktokMessage.messageType === 'comment' || tiktokMessage.messageType === 'video_comment') {
        // Reply to comment
        result = await this.replyToComment(config, tiktokMessage.videoId!, tiktokMessage.commentId, message.content);
      } else {
        return { success: false, error: 'Unsupported message type for sending' };
      }

      if (result.success && result.messageId && message.conversationId) {
        await this.storeOutboundMessage({
          userId: integration.user_id,
          conversationId: message.conversationId,
          platformMessageId: result.messageId,
          content: message.content,
          messageType: tiktokMessage.messageType,
          videoId: tiktokMessage.videoId,
          commentId: tiktokMessage.commentId
        });
      }

      return result;
    } catch (error: any) {
      console.error('TikTok send message error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send TikTok message'
      };
    }
  }

  // Send direct message
  private async sendDirectMessage(config: TikTokConfig, toUserOpenId: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/message/send/`, {
        to_user_open_id: toUserOpenId,
        message_type: 'text',
        content: {
          text: content
        }
      }, {
        headers: this.getAuthHeaders(config.accessToken)
      });

      if (response.data.error) {
        return { success: false, error: response.data.error.message };
      }

      return {
        success: true,
        messageId: response.data.data?.message_id || crypto.randomUUID()
      };
    } catch (error: any) {
      console.error('TikTok DM send error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to send direct message'
      };
    }
  }

  // Reply to comment
  private async replyToComment(config: TikTokConfig, videoId: string, commentId: string | undefined, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/video/comment/reply/`, {
        video_id: videoId,
        comment_id: commentId,
        content: content
      }, {
        headers: this.getAuthHeaders(config.accessToken)
      });

      if (response.data.error) {
        return { success: false, error: response.data.error.message };
      }

      return {
        success: true,
        messageId: response.data.data?.comment_id || crypto.randomUUID()
      };
    } catch (error: any) {
      console.error('TikTok comment reply error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to reply to comment'
      };
    }
  }

  // Process TikTok webhook
  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing TikTok webhook:', JSON.stringify(payload, null, 2));

      // Parse the TikTok webhook payload
      const parsedEvent = await this.parseTikTokEvent(payload);
      
      if (!parsedEvent) {
        console.error('Failed to parse TikTok webhook');
        return;
      }

      const config = integration.config as TikTokConfig;

      // Skip events from our own account
      if (parsedEvent.fromUserOpenId === config.userOpenId) {
        console.log('Skipping own event');
        return;
      }

      // Get or create contact
      const contact = await this.getOrCreateContact(
        parsedEvent.fromUserOpenId,
        integration.user_id,
        {
          username: parsedEvent.fromUsername,
          displayName: parsedEvent.fromDisplayName
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        contact.id,
        integration.user_id,
        parsedEvent.fromUserOpenId,
        parsedEvent.videoId
      );

      // Store message
      await this.storeMessage({
        userId: integration.user_id,
        conversationId: conversation.id,
        contactId: contact.id,
        platformMessageId: parsedEvent.messageId,
        content: parsedEvent.content,
        messageType: parsedEvent.eventType === 'message' ? 'dm' : 'comment',
        videoId: parsedEvent.videoId,
        commentId: parsedEvent.commentId,
        parentCommentId: parsedEvent.parentCommentId,
        engagementType: parsedEvent.engagementType,
        mediaUrl: parsedEvent.mediaUrl,
        timestamp: parsedEvent.timestamp
      });

      // Update analytics
      await this.updateAnalytics(integration.user_id, conversation.id);

      // Classify and route
      await this.classifyAndRouteMessage(conversation.id, parsedEvent.content, contact);

    } catch (error) {
      console.error('Error processing TikTok webhook:', error);
      throw error;
    }
  }

  // Test TikTok connection
  async testConnection(config: TikTokConfig): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (!config.accessToken || !config.userOpenId) {
        return { success: false, error: 'Access token and user ID are required' };
      }

      // Test by getting user info
      const response = await axios.get(`${this.baseUrl}/v2/user/info/`, {
        headers: this.getAuthHeaders(config.accessToken),
        params: {
          fields: 'open_id,username,display_name,avatar_url,follower_count,following_count,likes_count,video_count'
        }
      });

      if (response.data.error) {
        return { success: false, error: response.data.error.message };
      }

      const userInfo = response.data.data.user;

      return {
        success: true,
        info: {
          userOpenId: config.userOpenId,
          username: userInfo.username,
          displayName: userInfo.display_name,
          avatarUrl: userInfo.avatar_url,
          followerCount: userInfo.follower_count,
          followingCount: userInfo.following_count,
          likesCount: userInfo.likes_count,
          videoCount: userInfo.video_count
        }
      };
    } catch (error: any) {
      console.error('TikTok connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to connect to TikTok'
      };
    }
  }

  // Get user's videos
  async getUserVideos(config: TikTokConfig, cursor?: string, maxCount: number = 20): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/video/list/`, {
        max_count: maxCount,
        cursor: cursor || 0
      }, {
        headers: this.getAuthHeaders(config.accessToken)
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return {
        videos: response.data.data.videos || [],
        hasMore: response.data.data.has_more || false,
        cursor: response.data.data.cursor || null
      };
    } catch (error: any) {
      console.error('Error fetching TikTok videos:', error);
      throw error;
    }
  }

  // Get video comments
  async getVideoComments(config: TikTokConfig, videoId: string, cursor?: string, count: number = 50): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/video/comment/list/`, {
        video_id: videoId,
        count: count,
        cursor: cursor || 0
      }, {
        headers: this.getAuthHeaders(config.accessToken)
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return {
        comments: response.data.data.comments || [],
        hasMore: response.data.data.has_more || false,
        cursor: response.data.data.cursor || null
      };
    } catch (error: any) {
      console.error('Error fetching video comments:', error);
      throw error;
    }
  }

  // Get direct messages
  async getDirectMessages(config: TikTokConfig, conversationId?: string, cursor?: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/message/list/`, {
        headers: this.getAuthHeaders(config.accessToken),
        params: {
          conversation_id: conversationId,
          cursor: cursor || 0,
          count: 50
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return {
        messages: response.data.data.messages || [],
        hasMore: response.data.data.has_more || false,
        cursor: response.data.data.cursor || null
      };
    } catch (error: any) {
      console.error('Error fetching TikTok messages:', error);
      throw error;
    }
  }

  // Parse TikTok webhook event
  private async parseTikTokEvent(payload: any): Promise<ParsedTikTokEvent | null> {
    try {
      // Handle different webhook event types
      if (payload.type === 'message') {
        return {
          eventType: 'message',
          messageId: payload.message_id || crypto.randomUUID(),
          fromUserOpenId: payload.from_user_open_id,
          fromUsername: payload.from_user?.username || '',
          fromDisplayName: payload.from_user?.display_name || '',
          content: payload.content?.text || '',
          timestamp: payload.timestamp || new Date().toISOString(),
          mediaUrl: payload.content?.media_url,
          mediaType: payload.content?.media_type
        };
      } else if (payload.type === 'video_comment') {
        return {
          eventType: 'comment',
          messageId: payload.comment_id || crypto.randomUUID(),
          fromUserOpenId: payload.from_user_open_id,
          fromUsername: payload.from_user?.username || '',
          fromDisplayName: payload.from_user?.display_name || '',
          content: payload.content || '',
          timestamp: payload.timestamp || new Date().toISOString(),
          videoId: payload.video_id,
          commentId: payload.comment_id,
          parentCommentId: payload.parent_comment_id
        };
      } else if (payload.type === 'video_mention') {
        return {
          eventType: 'mention',
          messageId: payload.mention_id || crypto.randomUUID(),
          fromUserOpenId: payload.from_user_open_id,
          fromUsername: payload.from_user?.username || '',
          fromDisplayName: payload.from_user?.display_name || '',
          content: payload.content || `Mentioned you in a video`,
          timestamp: payload.timestamp || new Date().toISOString(),
          videoId: payload.video_id
        };
      } else if (payload.type === 'engagement') {
        return {
          eventType: 'engagement',
          messageId: payload.engagement_id || crypto.randomUUID(),
          fromUserOpenId: payload.from_user_open_id,
          fromUsername: payload.from_user?.username || '',
          fromDisplayName: payload.from_user?.display_name || '',
          content: `${payload.engagement_type} your content`,
          timestamp: payload.timestamp || new Date().toISOString(),
          videoId: payload.video_id,
          engagementType: payload.engagement_type
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing TikTok event:', error);
      return null;
    }
  }

  // Get or create contact using PRODUCTION TABLE: crm_contacts
  private async getOrCreateContact(userOpenId: string, userId: string, userInfo: any): Promise<any> {
    try {
      // Check if contact exists
      const { data: existingContact } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .eq('platform_id', userOpenId)
        .single();

      if (existingContact) {
        // Update last interaction
        const { data: updatedContact } = await supabaseService
          .from('crm_contacts')
          .update({
            last_seen: new Date().toISOString(),
            display_name: userInfo.displayName || existingContact.display_name,
            platform_username: userInfo.username || existingContact.platform_username,
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
          platform: 'tiktok',
          platform_id: userOpenId,
          platform_username: userInfo.username,
          display_name: userInfo.displayName || userInfo.username,
          phone_number: userOpenId, // Store user ID in phone_number for compatibility
          lifecycle_stage: 'lead',
          priority: 'medium',
          last_seen: new Date().toISOString(),
          metadata: {
            tiktok: {
              userOpenId: userOpenId,
              username: userInfo.username,
              displayName: userInfo.displayName,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating TikTok contact:', error);
        throw error;
      }

      return newContact;
    } catch (error) {
      console.error('Error getting or creating TikTok contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, userOpenId: string, videoId?: string): Promise<any> {
    try {
      // Use video ID if available, otherwise use user ID for DMs
      const threadId = videoId || `dm_${userOpenId}`;
      
      // Check for existing conversation
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'tiktok')
        .eq('platform_thread_id', threadId)
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
          platform: 'tiktok',
          platform_thread_id: threadId,
          status: 'active',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating TikTok conversation:', error);
        throw error;
      }

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating TikTok conversation:', error);
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
          message_type: messageData.mediaUrl ? 'media' : 'text',
          is_from_bot: false,
          platform: 'tiktok',
          platform_message_id: messageData.platformMessageId,
          metadata: {
            messageType: messageData.messageType,
            videoId: messageData.videoId,
            commentId: messageData.commentId,
            parentCommentId: messageData.parentCommentId,
            engagementType: messageData.engagementType,
            mediaUrl: messageData.mediaUrl,
            timestamp: messageData.timestamp,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing TikTok message:', error);
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
      console.error('Error storing TikTok message:', error);
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
          platform: 'tiktok',
          platform_message_id: messageData.platformMessageId,
          status: 'sent',
          metadata: {
            messageType: messageData.messageType,
            videoId: messageData.videoId,
            commentId: messageData.commentId,
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound TikTok message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound TikTok message:', error);
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
      console.error('Error updating TikTok analytics:', error);
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
        const urgentKeywords = ['collaboration', 'brand', 'sponsor', 'partnership', 'business', 'urgent', 'important'];
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
      console.error('Error classifying TikTok message:', error);
    }
  }

  // Refresh access token
  async refreshAccessToken(config: TikTokConfig): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    try {
      const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: config.clientKey,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken
      });

      if (response.data.error) {
        return { success: false, error: response.data.error_description };
      }

      return {
        success: true,
        accessToken: response.data.access_token
      };
    } catch (error: any) {
      console.error('Error refreshing TikTok token:', error);
      return {
        success: false,
        error: error.response?.data?.error_description || 'Failed to refresh token'
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      console.error('Error validating TikTok webhook signature:', error);
      return false;
    }
  }
}

export const tiktokProviderProduction = new TikTokProviderProduction();
export default tiktokProviderProduction;