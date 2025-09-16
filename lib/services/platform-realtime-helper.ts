import { broadcastNewMessage } from '@/lib/services/realtime-broadcast';
import type { MessagingPlatform } from '@/lib/realtime-messaging';

/**
 * Helper service to standardize real-time message broadcasting across all messaging platforms
 */
class PlatformRealtimeHelper {
  
  /**
   * Broadcast inbound message from any platform
   */
  async broadcastInboundMessage(params: {
    userId: string;
    conversationId: string;
    platform: MessagingPlatform;
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
    contactId?: string;
    mediaUrl?: string;
    platformMessageId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await broadcastNewMessage(params.userId, {
        conversationId: params.conversationId,
        platform: params.platform,
        content: params.content,
        messageType: params.messageType || 'text',
        direction: 'inbound',
        senderType: 'customer',
        contactId: params.contactId,
        mediaUrl: params.mediaUrl,
        platformMessageId: params.platformMessageId,
        metadata: params.metadata,
      });

      console.log(`✅ Real-time ${params.platform} inbound message broadcasted successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error broadcasting real-time ${params.platform} inbound message:`, error);
      return { success: false, error };
    }
  }

  /**
   * Broadcast outbound message to any platform
   */
  async broadcastOutboundMessage(params: {
    userId: string;
    conversationId: string;
    platform: MessagingPlatform;
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
    mediaUrl?: string;
    platformMessageId?: string;
    agentId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await broadcastNewMessage(params.userId, {
        conversationId: params.conversationId,
        platform: params.platform,
        content: params.content,
        messageType: params.messageType || 'text',
        direction: 'outbound',
        senderType: 'agent',
        mediaUrl: params.mediaUrl,
        platformMessageId: params.platformMessageId,
        metadata: {
          ...params.metadata,
          agentId: params.agentId,
          sentAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Real-time ${params.platform} outbound message broadcasted successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error broadcasting real-time ${params.platform} outbound message:`, error);
      return { success: false, error };
    }
  }

  /**
   * Generate platform-specific metadata for common messaging platforms
   */
  generatePlatformMetadata(platform: MessagingPlatform, data: any) {
    switch (platform) {
      case 'whatsapp':
        return {
          whatsapp: {
            messageId: data.messageId,
            from: data.from,
            to: data.to,
            timestamp: data.timestamp,
            ...(data.twilio && { twilio: data.twilio }),
            ...(data.facebook && { facebook: data.facebook }),
          }
        };

      case 'telegram':
        return {
          telegram: {
            message_id: data.message_id,
            chat: data.chat,
            from: data.from,
            date: data.date,
          }
        };

      case 'instagram':
        return {
          instagram: {
            messageId: data.messageId,
            senderId: data.senderId,
            timestamp: data.timestamp,
            thread: data.thread,
          }
        };

      case 'facebook':
        return {
          facebook: {
            messageId: data.messageId,
            senderId: data.senderId,
            timestamp: data.timestamp,
            thread: data.thread,
          }
        };

      case 'gmail':
        return {
          gmail: {
            messageId: data.messageId,
            threadId: data.threadId,
            from: data.from,
            to: data.to,
            subject: data.subject,
            date: data.date,
          }
        };

      case 'slack':
        return {
          slack: {
            messageId: data.messageId,
            channel: data.channel,
            user: data.user,
            timestamp: data.timestamp,
            team: data.team,
          }
        };

      case 'discord':
        return {
          discord: {
            messageId: data.messageId,
            channelId: data.channelId,
            guildId: data.guildId,
            author: data.author,
            timestamp: data.timestamp,
          }
        };

      case 'youtube':
        return {
          youtube: {
            commentId: data.commentId,
            videoId: data.videoId,
            authorChannelId: data.authorChannelId,
            publishedAt: data.publishedAt,
          }
        };

      case 'tiktok':
        return {
          tiktok: {
            commentId: data.commentId,
            videoId: data.videoId,
            userId: data.userId,
            timestamp: data.timestamp,
          }
        };

      case 'website-chat':
        return {
          websiteChat: {
            sessionId: data.sessionId,
            visitorId: data.visitorId,
            page: data.page,
            timestamp: data.timestamp,
            userAgent: data.userAgent,
          }
        };

      default:
        return { [platform]: data };
    }
  }

  /**
   * Extract message content based on platform-specific message format
   */
  extractMessageContent(platform: MessagingPlatform, rawMessage: any): {
    content: string;
    messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
    mediaUrl?: string;
  } {
    switch (platform) {
      case 'whatsapp':
        if (rawMessage.type === 'text') {
          return { content: rawMessage.text?.body || '', messageType: 'text' };
        } else if (rawMessage.type === 'image') {
          return { 
            content: rawMessage.image?.caption || '', 
            messageType: 'image',
            mediaUrl: rawMessage.image?.link 
          };
        }
        // Add more WhatsApp message types...
        break;

      case 'telegram':
        if (rawMessage.text) {
          return { content: rawMessage.text, messageType: 'text' };
        } else if (rawMessage.photo) {
          return {
            content: rawMessage.caption || '',
            messageType: 'image',
            mediaUrl: `telegram://photo/${rawMessage.photo[rawMessage.photo.length - 1].file_id}`
          };
        }
        // Add more Telegram message types...
        break;

      case 'gmail':
        return {
          content: rawMessage.body || rawMessage.snippet || '',
          messageType: 'text'
        };

      // Add other platforms...
      
      default:
        return {
          content: rawMessage.content || rawMessage.text || rawMessage.body || '',
          messageType: 'text'
        };
    }

    return { content: '', messageType: 'text' };
  }

  /**
   * Get platform-specific configuration for real-time features
   */
  getPlatformConfig(platform: MessagingPlatform) {
    const configs = {
      whatsapp: {
        maxRetries: 3,
        broadcastDelay: 0,
        supportsTyping: true,
        supportsReadReceipts: true,
      },
      telegram: {
        maxRetries: 3,
        broadcastDelay: 0,
        supportsTyping: true,
        supportsReadReceipts: false,
      },
      instagram: {
        maxRetries: 5,
        broadcastDelay: 100,
        supportsTyping: true,
        supportsReadReceipts: true,
      },
      facebook: {
        maxRetries: 5,
        broadcastDelay: 100,
        supportsTyping: true,
        supportsReadReceipts: true,
      },
      gmail: {
        maxRetries: 2,
        broadcastDelay: 0,
        supportsTyping: false,
        supportsReadReceipts: true,
      },
      slack: {
        maxRetries: 3,
        broadcastDelay: 0,
        supportsTyping: true,
        supportsReadReceipts: false,
      },
      discord: {
        maxRetries: 3,
        broadcastDelay: 0,
        supportsTyping: true,
        supportsReadReceipts: false,
      },
      youtube: {
        maxRetries: 2,
        broadcastDelay: 200,
        supportsTyping: false,
        supportsReadReceipts: false,
      },
      tiktok: {
        maxRetries: 2,
        broadcastDelay: 200,
        supportsTyping: false,
        supportsReadReceipts: false,
      },
      'website-chat': {
        maxRetries: 5,
        broadcastDelay: 0,
        supportsTyping: true,
        supportsReadReceipts: true,
      },
    };

    return configs[platform] || configs['website-chat'];
  }
}

// Export singleton instance
export const platformRealtimeHelper = new PlatformRealtimeHelper();

// Export convenience functions
export const broadcastInboundMessage = (params: Parameters<typeof platformRealtimeHelper.broadcastInboundMessage>[0]) =>
  platformRealtimeHelper.broadcastInboundMessage(params);

export const broadcastOutboundMessage = (params: Parameters<typeof platformRealtimeHelper.broadcastOutboundMessage>[0]) =>
  platformRealtimeHelper.broadcastOutboundMessage(params);

export const generatePlatformMetadata = (platform: MessagingPlatform, data: any) =>
  platformRealtimeHelper.generatePlatformMetadata(platform, data);

export const extractMessageContent = (platform: MessagingPlatform, rawMessage: any) =>
  platformRealtimeHelper.extractMessageContent(platform, rawMessage);

export default platformRealtimeHelper;