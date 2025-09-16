import { google } from 'googleapis';
import { getSupabaseService } from '@/lib/services/supabase-service';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';
import { messageService, contactService, conversationService } from '@/lib/services';
import crypto from 'crypto';

// Use singleton Supabase service for optimal performance
const supabaseService = getSupabaseService();

export interface YouTubeConfig {
  channelId: string;
  accessToken: string;
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
  channelName?: string;
  monitoredVideos?: string[]; // Array of video IDs to monitor
}

export interface YouTubeMessage extends BaseMessage {
  platform: 'youtube';
  videoId?: string;
  commentId?: string;
  parentCommentId?: string; // For replies
  isReply?: boolean;
  likeCount?: number;
  videoTitle?: string;
  videoUrl?: string;
}

export interface ParsedYouTubeComment {
  commentId: string;
  authorDisplayName: string;
  authorChannelId: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  videoId: string;
  parentId?: string; // For replies
  isReply: boolean;
  canReply: boolean;
  moderationStatus: string;
}

class YouTubeProviderProduction {
  private youtube: any;

  constructor() {
    // Initialize YouTube API client
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY // For public operations
    });
  }

  // Create authenticated YouTube client for user operations
  private getAuthenticatedClient(config: YouTubeConfig) {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId || process.env.YOUTUBE_CLIENT_ID,
      config.clientSecret || process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken
    });

    return google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
  }

  // Send message = Reply to YouTube comment
  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = integration.config as YouTubeConfig;
      const youtubeMessage = message as YouTubeMessage;

      if (!config.accessToken || !config.refreshToken) {
        return { success: false, error: 'YouTube authentication not configured' };
      }

      if (!youtubeMessage.commentId && !youtubeMessage.parentCommentId) {
        return { success: false, error: 'Comment ID required for replying' };
      }

      const youtube = this.getAuthenticatedClient(config);

      // Post reply to comment
      const response = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId: youtubeMessage.parentCommentId || youtubeMessage.commentId,
            textOriginal: message.content
          }
        }
      });

      const replyId = response.data.id;

      // Store outbound message
      if (replyId && message.conversationId) {
        await this.storeOutboundMessage({
          userId: integration.user_id,
          conversationId: message.conversationId,
          platformMessageId: replyId,
          content: message.content,
          videoId: youtubeMessage.videoId,
          parentCommentId: youtubeMessage.parentCommentId || youtubeMessage.commentId
        });
      }

      return {
        success: true,
        messageId: replyId
      };
    } catch (error: any) {
      console.error('YouTube reply error:', error);
      return {
        success: false,
        error: error.message || 'Failed to post reply'
      };
    }
  }

  // Process YouTube comment webhook/polling data
  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      console.log('Processing YouTube comment:', JSON.stringify(payload, null, 2));

      // Parse the YouTube comment
      const parsedComment = await this.parseYouTubeComment(payload);
      
      if (!parsedComment) {
        console.error('Failed to parse YouTube comment');
        return;
      }

      // Skip our own comments
      if (parsedComment.authorChannelId === (integration.config as YouTubeConfig).channelId) {
        console.log('Skipping own comment');
        return;
      }

      // Get or create contact
      const contact = await this.getOrCreateContact(
        parsedComment.authorChannelId,
        integration.user_id,
        {
          name: parsedComment.authorDisplayName,
          profileImage: parsedComment.authorProfileImageUrl,
          channelId: parsedComment.authorChannelId
        }
      );

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        contact.id,
        integration.user_id,
        parsedComment.videoId
      );

      // Store message
      await this.storeMessage({
        userId: integration.user_id,
        conversationId: conversation.id,
        contactId: contact.id,
        platformMessageId: parsedComment.commentId,
        content: parsedComment.textDisplay,
        videoId: parsedComment.videoId,
        parentCommentId: parsedComment.parentId,
        isReply: parsedComment.isReply,
        likeCount: parsedComment.likeCount,
        publishedAt: parsedComment.publishedAt
      });

      // Update analytics
      await this.updateAnalytics(integration.user_id, conversation.id);

      // Classify and route
      await this.classifyAndRouteMessage(conversation.id, parsedComment.textDisplay, contact);

    } catch (error) {
      console.error('Error processing YouTube comment:', error);
      throw error;
    }
  }

  // Test YouTube connection
  async testConnection(config: YouTubeConfig): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (!config.accessToken || !config.channelId) {
        return { success: false, error: 'Access token and channel ID are required' };
      }

      const youtube = this.getAuthenticatedClient(config);

      // Test by getting channel info
      const response = await youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [config.channelId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        return { success: false, error: 'Channel not found or access denied' };
      }

      const channel = response.data.items[0];

      return {
        success: true,
        info: {
          channelId: config.channelId,
          channelName: channel.snippet?.title,
          subscriberCount: channel.statistics?.subscriberCount,
          videoCount: channel.statistics?.videoCount
        }
      };
    } catch (error: any) {
      console.error('YouTube connection test failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to YouTube'
      };
    }
  }

  // Fetch comments from a specific video
  async fetchVideoComments(config: YouTubeConfig, videoId: string, maxResults: number = 100): Promise<ParsedYouTubeComment[]> {
    try {
      const youtube = this.getAuthenticatedClient(config);

      const response = await youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId: videoId,
        maxResults: maxResults,
        order: 'time' // Get newest comments first
      });

      const comments: ParsedYouTubeComment[] = [];

      if (response.data.items) {
        for (const thread of response.data.items) {
          const comment = thread.snippet?.topLevelComment?.snippet;
          if (comment) {
            comments.push({
              commentId: thread.snippet?.topLevelComment?.id || '',
              authorDisplayName: comment.authorDisplayName || '',
              authorChannelId: comment.authorChannelId || '',
              authorProfileImageUrl: comment.authorProfileImageUrl || '',
              textDisplay: comment.textDisplay || '',
              textOriginal: comment.textOriginal || '',
              likeCount: comment.likeCount || 0,
              publishedAt: comment.publishedAt || '',
              updatedAt: comment.updatedAt || '',
              videoId: videoId,
              isReply: false,
              canReply: thread.snippet?.canReply || false,
              moderationStatus: comment.moderationStatus || 'published'
            });

            // Add replies if they exist
            if (thread.replies?.comments) {
              for (const reply of thread.replies.comments) {
                const replySnippet = reply.snippet;
                if (replySnippet) {
                  comments.push({
                    commentId: reply.id || '',
                    authorDisplayName: replySnippet.authorDisplayName || '',
                    authorChannelId: replySnippet.authorChannelId || '',
                    authorProfileImageUrl: replySnippet.authorProfileImageUrl || '',
                    textDisplay: replySnippet.textDisplay || '',
                    textOriginal: replySnippet.textOriginal || '',
                    likeCount: replySnippet.likeCount || 0,
                    publishedAt: replySnippet.publishedAt || '',
                    updatedAt: replySnippet.updatedAt || '',
                    videoId: videoId,
                    parentId: thread.snippet?.topLevelComment?.id,
                    isReply: true,
                    canReply: false,
                    moderationStatus: replySnippet.moderationStatus || 'published'
                  });
                }
              }
            }
          }
        }
      }

      return comments;
    } catch (error: any) {
      console.error('Error fetching YouTube comments:', error);
      throw error;
    }
  }

  // Get video information
  async getVideoInfo(videoId: string): Promise<any> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId],
        key: process.env.YOUTUBE_API_KEY
      });

      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        return {
          id: videoId,
          title: video.snippet?.title,
          description: video.snippet?.description,
          channelId: video.snippet?.channelId,
          channelTitle: video.snippet?.channelTitle,
          publishedAt: video.snippet?.publishedAt,
          viewCount: video.statistics?.viewCount,
          likeCount: video.statistics?.likeCount,
          commentCount: video.statistics?.commentCount
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error getting video info:', error);
      throw error;
    }
  }

  // Monitor videos for new comments (polling-based)
  async monitorVideosForComments(integration: MessagingIntegration): Promise<void> {
    try {
      const config = integration.config as YouTubeConfig;
      
      if (!config.monitoredVideos || config.monitoredVideos.length === 0) {
        console.log('No videos to monitor for channel:', config.channelId);
        return;
      }

      for (const videoId of config.monitoredVideos) {
        try {
          // Get latest comments
          const comments = await this.fetchVideoComments(config, videoId, 50);

          // Process each new comment
          for (const comment of comments) {
            // Check if we've already processed this comment
            const existingMessage = await supabaseService
              .from('whatsapp_messages')
              .select('id')
              .eq('platform_message_id', comment.commentId)
              .eq('platform', 'youtube')
              .single();

            if (!existingMessage.data) {
              // New comment - process it
              await this.processWebhook(comment, integration);
            }
          }
        } catch (videoError) {
          console.error(`Error monitoring video ${videoId}:`, videoError);
        }
      }
    } catch (error) {
      console.error('Error monitoring YouTube videos:', error);
    }
  }

  // Parse YouTube comment data
  private async parseYouTubeComment(payload: any): Promise<ParsedYouTubeComment | null> {
    try {
      // If it's already in our format
      if (payload.commentId && payload.textDisplay) {
        return payload as ParsedYouTubeComment;
      }

      // If it's raw YouTube API format
      if (payload.snippet) {
        const snippet = payload.snippet;
        return {
          commentId: payload.id || crypto.randomUUID(),
          authorDisplayName: snippet.authorDisplayName || 'Unknown',
          authorChannelId: snippet.authorChannelId || '',
          authorProfileImageUrl: snippet.authorProfileImageUrl || '',
          textDisplay: snippet.textDisplay || '',
          textOriginal: snippet.textOriginal || '',
          likeCount: snippet.likeCount || 0,
          publishedAt: snippet.publishedAt || new Date().toISOString(),
          updatedAt: snippet.updatedAt || new Date().toISOString(),
          videoId: snippet.videoId || '',
          parentId: snippet.parentId,
          isReply: !!snippet.parentId,
          canReply: true,
          moderationStatus: snippet.moderationStatus || 'published'
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing YouTube comment:', error);
      return null;
    }
  }

  // Get or create contact using PRODUCTION TABLE: crm_contacts
  private async getOrCreateContact(channelId: string, userId: string, userInfo: any): Promise<any> {
    try {
      // Check if contact exists
      const { data: existingContact } = await supabaseService
        .from('crm_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'youtube')
        .eq('platform_id', channelId)
        .single();

      if (existingContact) {
        // Update last interaction
        const { data: updatedContact } = await supabaseService
          .from('crm_contacts')
          .update({
            last_seen: new Date().toISOString(),
            display_name: userInfo.name || existingContact.display_name,
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
          platform: 'youtube',
          platform_id: channelId,
          platform_username: userInfo.name,
          display_name: userInfo.name,
          phone_number: channelId, // Store channel ID in phone_number for compatibility
          lifecycle_stage: 'lead',
          priority: 'medium',
          last_seen: new Date().toISOString(),
          metadata: {
            youtube: {
              channelId: channelId,
              profileImage: userInfo.profileImage,
              createdAt: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating YouTube contact:', error);
        throw error;
      }

      return newContact;
    } catch (error) {
      console.error('Error getting or creating YouTube contact:', error);
      throw error;
    }
  }

  // Get or create conversation using PRODUCTION TABLE: crm_conversations
  private async getOrCreateConversation(contactId: string, userId: string, videoId: string): Promise<any> {
    try {
      // Check for existing conversation with same video
      const { data: existingConversation } = await supabaseService
        .from('crm_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('platform', 'youtube')
        .eq('platform_thread_id', videoId)
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
          platform: 'youtube',
          platform_thread_id: videoId,
          status: 'active',
          priority: 'medium',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating YouTube conversation:', error);
        throw error;
      }

      return newConversation;
    } catch (error) {
      console.error('Error getting or creating YouTube conversation:', error);
      throw error;
    }
  }

  // Store message using clean service layer
  private async storeMessage(messageData: any): Promise<void> {
    try {
      await messageService.store({
        platform: 'youtube',
        userId: messageData.userId,
        conversationId: messageData.conversationId,
        contactId: messageData.contactId,
        content: messageData.content,
        direction: 'inbound',
        messageType: 'text',
        isFromBot: false,
        platformMessageId: messageData.platformMessageId,
        metadata: {
          videoId: messageData.videoId,
          parentCommentId: messageData.parentCommentId,
          isReply: messageData.isReply,
          likeCount: messageData.likeCount,
          publishedAt: messageData.publishedAt,
        },
      });

      // Update conversation with last message using clean service layer
      await conversationService.updateLastMessage(
        messageData.conversationId,
        messageData.content.substring(0, 100),
        new Date().toISOString()
      );

    } catch (error) {
      console.error('Error storing YouTube message:', error);
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
          platform: 'youtube',
          platform_message_id: messageData.platformMessageId,
          status: 'sent',
          metadata: {
            videoId: messageData.videoId,
            parentCommentId: messageData.parentCommentId,
            replyType: 'comment_reply',
          },
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing outbound YouTube message:', error);
      }
    } catch (error) {
      console.error('Error storing outbound YouTube message:', error);
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
      console.error('Error updating YouTube analytics:', error);
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
        const urgentKeywords = ['collaboration', 'partnership', 'sponsor', 'business', 'urgent', 'important'];
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
      console.error('Error classifying YouTube message:', error);
    }
  }
}

export const youtubeProviderProduction = new YouTubeProviderProduction();
export default youtubeProviderProduction;