"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/auth-context';

// Supported messaging platforms
export type MessagingPlatform = 
  | 'whatsapp' 
  | 'telegram' 
  | 'instagram' 
  | 'facebook' 
  | 'gmail' 
  | 'slack' 
  | 'discord'
  | 'youtube'
  | 'tiktok'
  | 'website-chat';

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  platform: MessagingPlatform;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';
  direction: 'inbound' | 'outbound';
  sender_type: 'customer' | 'agent' | 'bot';
  contact_id?: string;
  media_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface RealtimeConversation {
  id: string;
  platform: MessagingPlatform;
  status: 'active' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  last_message_at: string;
  last_message_text?: string;
  unread_count: number;
  contact?: {
    id: string;
    name: string;
    avatar?: string;
    platform_id: string;
  };
}

interface UseRealtimeMessagingOptions {
  userId: string;
  onNewMessage?: (message: RealtimeMessage) => void;
  onMessageUpdate?: (message: RealtimeMessage) => void;
  onConversationUpdate?: (conversation: RealtimeConversation) => void;
  onTypingIndicator?: (conversationId: string, isTyping: boolean, platform: MessagingPlatform) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealtimeMessaging({
  userId,
  onNewMessage,
  onMessageUpdate,
  onConversationUpdate,
  onTypingIndicator,
  onConnectionChange
}: UseRealtimeMessagingOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedConversations, setSubscribedConversations] = useState<Set<string>>(new Set());
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    if (!userId) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [userId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabaseRef.current || !userId) return;

    const setupRealtimeSubscriptions = async () => {
      try {
        // Create a channel for this user's messaging
        const channel = supabaseRef.current!.channel(`user-messaging-${userId}`, {
          config: {
            presence: {
              key: userId,
            },
          },
        });

        // Subscribe to messages from all platform-specific tables
        const platformTables = [
          'whatsapp_messages', 
          'telegram_messages', 
          'discord_messages', 
          'instagram_messages', 
          'facebook_messages', 
          'slack_messages', 
          'gmail_messages', 
          'youtube_messages', 
          'tiktok_messages',
          'twilio_sms_messages',
          'website_chat_messages'
        ];
        
        platformTables.forEach(table => {
          // Subscribe to new messages for each platform
          channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: table,
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log(`📨 New ${table} message received via Supabase Realtime:`, payload);
              
              const message = payload.new as RealtimeMessage;
              
              // Notify about new message
              onNewMessage?.(message);
              
              // Show browser notification for inbound messages
              if (message.direction === 'inbound' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`New ${message.platform} message`, {
                  body: message.content.substring(0, 100),
                  icon: `/icons/${message.platform}.png`,
                  tag: `message-${message.id}`,
                });
              }
            }
          );

          // Subscribe to message updates for each platform (status changes, edits)
          channel.on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: table,
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log(`📝 ${table} message updated via Supabase Realtime:`, payload);
              const message = payload.new as RealtimeMessage;
              onMessageUpdate?.(message);
            }
          );
        });

        // Subscribe to conversation updates
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'crm_conversations',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('💬 Conversation updated via Supabase Realtime:', payload);
            const conversation = payload.new as RealtimeConversation;
            onConversationUpdate?.(conversation);
          }
        );

        // Subscribe to new conversations
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'crm_conversations',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('🆕 New conversation via Supabase Realtime:', payload);
            const conversation = payload.new as RealtimeConversation;
            onConversationUpdate?.(conversation);
          }
        );

        // Handle presence (typing indicators, online status)
        channel.on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          console.log('👥 Presence sync:', presenceState);
        });

        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 User joined:', key, newPresences);
        });

        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 User left:', key, leftPresences);
        });

        // Subscribe to the channel
        channel.subscribe(async (status) => {
          console.log('🔗 Supabase Realtime connection status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            onConnectionChange?.(true);
            
            // Track presence
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
            
            console.log('✅ Real-time messaging connected for all platforms');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false);
            onConnectionChange?.(false);
            console.log('❌ Real-time messaging disconnected');
          }
        });

        channelRef.current = channel;

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }

      } catch (error) {
        console.error('❌ Error setting up Supabase Realtime:', error);
        setIsConnected(false);
        onConnectionChange?.(false);
      }
    };

    setupRealtimeSubscriptions();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userId, onNewMessage, onMessageUpdate, onConversationUpdate, onConnectionChange]);

  // Subscribe to specific conversations for typing indicators
  const subscribeToConversation = useCallback(async (conversationId: string) => {
    if (!channelRef.current || subscribedConversations.has(conversationId)) return;

    console.log(`🎯 Subscribing to conversation: ${conversationId}`);
    
    setSubscribedConversations(prev => new Set(prev).add(conversationId));
    
    // You can implement typing indicators here if needed
    // For now, we'll just track the subscription
  }, [subscribedConversations]);

  // Unsubscribe from conversation
  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    if (!subscribedConversations.has(conversationId)) return;

    console.log(`🎯 Unsubscribing from conversation: ${conversationId}`);
    
    setSubscribedConversations(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
  }, [subscribedConversations]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!channelRef.current || !isConnected) return;

    try {
      await channelRef.current.track({
        user_id: userId,
        conversation_id: conversationId,
        typing: isTyping,
        typing_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [userId, isConnected]);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    return {
      isConnected,
      subscribedConversations: Array.from(subscribedConversations),
      channelState: channelRef.current?.state,
    };
  }, [isConnected, subscribedConversations]);

  return {
    isConnected,
    subscribeToConversation,
    unsubscribeFromConversation, 
    sendTypingIndicator,
    getConnectionStats,
    subscribedConversations: Array.from(subscribedConversations),
  };
}

// Hook for managing platform-specific features
export function usePlatformFeatures(platform: MessagingPlatform) {
  const getPlatformConfig = useCallback(() => {
    const configs = {
      whatsapp: {
        supportsTyping: true,
        supportsReadReceipts: true,
        supportsMedia: true,
        supportsReactions: false,
        maxMessageLength: 4096,
      },
      telegram: {
        supportsTyping: true,
        supportsReadReceipts: false,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 4096,
      },
      instagram: {
        supportsTyping: true,
        supportsReadReceipts: true,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 1000,
      },
      facebook: {
        supportsTyping: true,
        supportsReadReceipts: true,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 8000,
      },
      gmail: {
        supportsTyping: false,
        supportsReadReceipts: true,
        supportsMedia: true,
        supportsReactions: false,
        maxMessageLength: 50000,
      },
      slack: {
        supportsTyping: true,
        supportsReadReceipts: false,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 4000,
      },
      discord: {
        supportsTyping: true,
        supportsReadReceipts: false,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 2000,
      },
      youtube: {
        supportsTyping: false,
        supportsReadReceipts: false,
        supportsMedia: false,
        supportsReactions: true,
        maxMessageLength: 10000,
      },
      tiktok: {
        supportsTyping: false,
        supportsReadReceipts: false,
        supportsMedia: true,
        supportsReactions: true,
        maxMessageLength: 300,
      },
      'website-chat': {
        supportsTyping: true,
        supportsReadReceipts: true,
        supportsMedia: true,
        supportsReactions: false,
        maxMessageLength: 5000,
      },
    };

    return configs[platform] || configs['website-chat'];
  }, [platform]);

  return {
    config: getPlatformConfig(),
  };
}