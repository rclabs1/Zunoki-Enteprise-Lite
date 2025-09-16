"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Paperclip, 
  Send, 
  Bot, 
  User, 
  Users, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Filter,
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  MessageCircle,
  Zap,
  UserPlus,
  Settings,
  Sparkles,
  Target,
  ExternalLink,
  Youtube,
  Music,
  Play,
  Pause,
  RotateCcw,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeMessaging, type RealtimeMessage, type RealtimeConversation, type MessagingPlatform } from "@/lib/realtime-messaging";
import { ConversationAgentPanel } from "./conversation-agent-panel";
import { AgentKnowledgeTrainer } from "./agent-knowledge-trainer";
import { ConversationAgentSelector } from "./conversation-agent-selector";

// Platform icon mapping with enhanced visual distinction
const getPlatformIcon = (platform: string, size: 'sm' | 'md' | 'lg' = 'sm') => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-8 w-8'
  }
  const iconSize = sizeClasses[size]
  
  const icons: Record<string, React.ReactNode> = {
    whatsapp: <MessageCircle className={`${iconSize} text-green-600`} />,
    telegram: <ExternalLink className={`${iconSize} text-blue-600`} />,
    facebook: <Users className={`${iconSize} text-blue-700`} />,
    instagram: <MessageCircle className={`${iconSize} text-pink-600`} />,
    slack: <MessageCircle className={`${iconSize} text-purple-600`} />,
    discord: <Music className={`${iconSize} text-indigo-600`} />,
    youtube: <Youtube className={`${iconSize} text-red-600`} />,
    tiktok: <Music className={`${iconSize} text-black`} />,
    gmail: <Mail className={`${iconSize} text-red-700`} />
  }
  return icons[platform] || <MessageCircle className={`${iconSize} text-gray-600`} />
}

const getPlatformName = (platform: string) => {
  const names: Record<string, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    facebook: 'Facebook',
    instagram: 'Instagram',
    slack: 'Slack',
    discord: 'Discord',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    gmail: 'Gmail'
  }
  return names[platform] || platform
}

const getPlatformColor = (platform: string, variant: 'light' | 'border' | 'dark' = 'light') => {
  const colorSchemes: Record<string, Record<string, string>> = {
    whatsapp: {
      light: 'bg-green-100 text-green-800 border-green-200',
      border: 'border-green-500',
      dark: 'bg-green-600 text-white'
    },
    telegram: {
      light: 'bg-blue-100 text-blue-800 border-blue-200',
      border: 'border-blue-500', 
      dark: 'bg-blue-600 text-white'
    },
    facebook: {
      light: 'bg-blue-100 text-blue-800 border-blue-200',
      border: 'border-blue-700',
      dark: 'bg-blue-700 text-white'
    },
    instagram: {
      light: 'bg-pink-100 text-pink-800 border-pink-200',
      border: 'border-pink-500',
      dark: 'bg-pink-600 text-white'
    },
    slack: {
      light: 'bg-purple-100 text-purple-800 border-purple-200',
      border: 'border-purple-500',
      dark: 'bg-purple-600 text-white'
    },
    discord: {
      light: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      border: 'border-indigo-500',
      dark: 'bg-indigo-600 text-white'
    },
    youtube: {
      light: 'bg-red-100 text-red-800 border-red-200',
      border: 'border-red-500',
      dark: 'bg-red-600 text-white'
    },
    tiktok: {
      light: 'bg-gray-100 text-gray-800 border-gray-200',
      border: 'border-gray-500',
      dark: 'bg-gray-800 text-white'
    },
    gmail: {
      light: 'bg-red-100 text-red-800 border-red-200',
      border: 'border-red-700',
      dark: 'bg-red-700 text-white'
    }
  }
  
  return colorSchemes[platform]?.[variant] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Message type identification
const getMessageType = (platform: string, messageContent: string) => {
  const types: Record<string, string[]> = {
    youtube: ['comment', 'like', 'subscribe', 'reply'],
    instagram: ['dm', 'comment', 'story_reply', 'post_mention'],
    facebook: ['message', 'comment', 'post', 'reaction'],
    whatsapp: ['message', 'media', 'document'],
    telegram: ['message', 'forward', 'reply'],
    gmail: ['email', 'reply', 'forward'],
    slack: ['message', 'thread', 'mention'],
    discord: ['message', 'reply', 'reaction'],
    tiktok: ['comment', 'dm', 'duet', 'mention']
  }
  
  // Simple heuristics - in production, this would be more sophisticated
  if (messageContent.toLowerCase().includes('commented')) return 'comment'
  if (messageContent.toLowerCase().includes('liked')) return 'like' 
  if (messageContent.toLowerCase().includes('mentioned')) return 'mention'
  if (messageContent.toLowerCase().includes('replied')) return 'reply'
  
  return types[platform]?.[0] || 'message'
}

// Enhanced conversation data with CRM context
const conversationsData = {
  "1": {
    id: "1",
    customer: {
      id: "cust-1",
      name: "John Doe",
      phone: "+1-555-123-4567",
      email: "john.doe@email.com",
      avatar: "/placeholder-user.jpg",
      location: "New York, USA",
      timezone: "EST",
      language: "en",
      tags: ["VIP", "E-commerce"],
      lifecycleStage: "customer",
      totalOrders: 5,
      totalSpent: 1250.00,
      lastOrderDate: "2024-01-15",
      acquisitionSource: "Google Ads",
      satisfactionScore: 4.2,
      lastInteraction: "2 days ago"
    },
    platform: "whatsapp",
    status: "open",
    priority: "high",
    category: "support",
    assignedAgent: {
      id: "agent-1",
      name: "Sarah Wilson",
      type: "human",
      avatar: "/placeholder-user.jpg"
    },
    assignedTeam: "Support Team",
    tags: ["Order Issue", "Shipping"],
    classification: {
      urgency: 8,
      sentiment: "frustrated",
      intent: "order_support",
      category: "support"
    },
    createdAt: "2024-01-20T15:45:00Z",
    updatedAt: "2024-01-20T16:30:00Z",
    messages: [
      {
        id: "msg1",
        sender: "customer",
        content: "Hi there! I'm having an issue with my recent order #ORD-12345. The tracking number says it was delivered, but I haven't received it. This is really frustrating as I needed these items for tomorrow.",
        timestamp: "Yesterday, 3:45 PM",
        classification: {
          urgency: 8,
          sentiment: "frustrated",
          intent: "order_support",
          keywords: ["order", "tracking", "delivered", "frustrating"]
        },
        read: true
      },
      {
        id: "msg2",
        sender: "agent",
        senderId: "agent-1",
        content: "Hello John, I can certainly help with that. I understand how frustrating this must be. Let me look up your order #ORD-12345 right away and track down what happened with the delivery.",
        timestamp: "Yesterday, 3:46 PM",
        read: true
      },
      {
        id: "msg3",
        sender: "customer",
        content: "Thank you, I really appreciate the quick response. I'm at home all day today if they need to redeliver.",
        timestamp: "Yesterday, 4:15 PM",
        classification: {
          urgency: 6,
          sentiment: "hopeful",
          intent: "information_provided"
        },
        read: true
      }
    ],
  },
  "2": {
    id: "2",
    customer: {
      id: "cust-2",
      name: "Jane Smith",
      phone: "+1-555-987-6543",
      email: "jane.smith@email.com",
      avatar: "/placeholder-user.jpg",
      location: "Los Angeles, USA",
      timezone: "PST",
      language: "en",
      tags: ["Influencer", "Content Creator"],
      lifecycleStage: "lead",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      acquisitionSource: "Instagram",
      satisfactionScore: null,
      lastInteraction: "30 minutes ago"
    },
    platform: "instagram",
    messageType: "comment",
    status: "open",
    priority: "medium",
    category: "engagement",
    assignedAgent: {
      id: "ai-maya",
      name: "Zunoki.",
      type: "ai",
      avatar: "/maya-avatar.jpg"
    },
    assignedTeam: "Social Media Team",
    tags: ["Product Inquiry", "Instagram Comment"],
    sourcePost: {
      id: "post-456",
      caption: "Check out our new summer collection! 🌞",
      url: "https://instagram.com/p/xyz123"
    },
    classification: {
      urgency: 5,
      sentiment: "interested",
      intent: "product_inquiry",
      category: "sales"
    },
    createdAt: "2024-01-21T10:15:00Z",
    updatedAt: "2024-01-21T10:45:00Z",
    messages: [
      {
        id: "msg4",
        sender: "customer",
        content: "Love this dress in the third photo! Is it available in size M? 😍",
        timestamp: "30 minutes ago",
        classification: {
          urgency: 5,
          sentiment: "interested",
          intent: "product_inquiry",
          keywords: ["dress", "size M", "available"]
        },
        read: true,
        postContext: {
          type: "comment",
          postId: "post-456",
          postCaption: "Check out our new summer collection! 🌞"
        }
      },
      {
        id: "msg5",
        sender: "agent",
        senderId: "ai-maya",
        content: "Hi Jane! Yes, that beautiful sundress is available in size M! I can help you with more details. Would you like to see more photos or check sizing information? ✨",
        timestamp: "25 minutes ago",
        read: true
      }
    ],
  },
  "3": {
    id: "3",
    customer: {
      id: "cust-3",
      name: "Mike Johnson",
      phone: null,
      email: "mike.j.creator@gmail.com",
      avatar: "/placeholder-user.jpg",
      location: "Chicago, USA",
      timezone: "CST",
      language: "en",
      tags: ["YouTuber", "Tech Reviewer"],
      lifecycleStage: "prospect",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      acquisitionSource: "YouTube",
      satisfactionScore: null,
      lastInteraction: "2 hours ago"
    },
    platform: "youtube",
    messageType: "comment",
    status: "new",
    priority: "high",
    category: "partnership",
    assignedAgent: null,
    assignedTeam: "Partnership Team",
    tags: ["Collaboration", "YouTube Comment", "Influencer"],
    sourceVideo: {
      id: "video-789",
      title: "Best Tech Products of 2024 - Our Complete Review",
      url: "https://youtube.com/watch?v=abc123"
    },
    classification: {
      urgency: 7,
      sentiment: "interested",
      intent: "partnership_inquiry",
      category: "business"
    },
    createdAt: "2024-01-21T08:30:00Z",
    updatedAt: "2024-01-21T08:30:00Z",
    messages: [
      {
        id: "msg6",
        sender: "customer",
        content: "Great review! I'd love to collaborate with your brand on a tech review. My channel has 500K subscribers focused on consumer electronics. Would you be interested in a partnership?",
        timestamp: "2 hours ago",
        classification: {
          urgency: 7,
          sentiment: "interested",
          intent: "partnership_inquiry",
          keywords: ["collaborate", "partnership", "500K subscribers", "tech review"]
        },
        read: false,
        videoContext: {
          type: "comment",
          videoId: "video-789",
          videoTitle: "Best Tech Products of 2024 - Our Complete Review"
        }
      }
    ],
  },
  "4": {
    id: "4",
    customer: {
      id: "cust-4",
      name: "Emma Wilson",
      phone: null,
      email: "emma.wilson@company.com",
      avatar: "/placeholder-user.jpg",
      location: "London, UK",
      timezone: "GMT",
      language: "en",
      tags: ["B2B", "Enterprise"],
      lifecycleStage: "lead",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      acquisitionSource: "Gmail",
      satisfactionScore: null,
      lastInteraction: "1 hour ago"
    },
    platform: "gmail",
    messageType: "email", 
    status: "open",
    priority: "high",
    category: "sales",
    assignedAgent: {
      id: "agent-3",
      name: "David Chen",
      type: "human",
      avatar: "/placeholder-user.jpg"
    },
    assignedTeam: "Enterprise Sales",
    tags: ["Enterprise Inquiry", "Demo Request"],
    classification: {
      urgency: 8,
      sentiment: "professional",
      intent: "demo_request",
      category: "sales"
    },
    createdAt: "2024-01-21T09:00:00Z",
    updatedAt: "2024-01-21T09:30:00Z",
    messages: [
      {
        id: "msg7",
        sender: "customer",
        content: "Subject: Demo Request for Enterprise CRM Solution\n\nHi there,\n\nI'm reaching out on behalf of TechCorp Ltd. We're evaluating CRM solutions for our 500+ employee organization and would like to schedule a demo of your platform.\n\nWe're particularly interested in:\n- Multi-platform messaging integration\n- Advanced analytics and reporting\n- Enterprise security features\n- API integrations\n\nCould we schedule a call this week?\n\nBest regards,\nEmma Wilson\nHead of Digital Operations\nTechCorp Ltd.",
        timestamp: "1 hour ago",
        classification: {
          urgency: 8,
          sentiment: "professional",
          intent: "demo_request",
          keywords: ["demo", "enterprise", "500+ employees", "CRM solution"]
        },
        read: true,
        emailContext: {
          subject: "Demo Request for Enterprise CRM Solution",
          from: "emma.wilson@company.com",
          to: "sales@admolabs.com"
        }
      },
      {
        id: "msg8",
        sender: "agent",
        senderId: "agent-3",
        content: "Hi Emma,\n\nThank you for your interest in our platform! I'd be delighted to show you how our enterprise CRM solution can benefit TechCorp Ltd.\n\nI have availability for a 45-minute demo session on:\n- Wednesday 2-3 PM GMT\n- Thursday 10-11 AM GMT\n- Friday 3-4 PM GMT\n\nI'll prepare a customized demonstration focusing on the features you mentioned. Please let me know which time works best for you.\n\nLooking forward to speaking with you!\n\nBest regards,\nDavid Chen\nEnterprise Sales Director",
        timestamp: "30 minutes ago",
        read: true
      }
    ],
  },
  "5": {
    id: "5",
    customer: {
      id: "cust-5",
      name: "Alex Rivera",
      phone: "+1-555-444-3333",
      email: "alex.rivera@email.com",
      avatar: "/placeholder-user.jpg",
      location: "Miami, USA",
      timezone: "EST",
      language: "en",
      tags: ["Gen Z", "Social Media"],
      lifecycleStage: "customer",
      totalOrders: 3,
      totalSpent: 450.00,
      lastOrderDate: "2024-01-18",
      acquisitionSource: "TikTok",
      satisfactionScore: 4.8,
      lastInteraction: "5 minutes ago"
    },
    platform: "tiktok",
    messageType: "dm",
    status: "open",
    priority: "medium",
    category: "support",
    assignedAgent: {
      id: "agent-2",
      name: "Lisa Park",
      type: "human",
      avatar: "/placeholder-user.jpg"
    },
    assignedTeam: "Social Media Support",
    tags: ["Return Request", "TikTok DM"],
    classification: {
      urgency: 4,
      sentiment: "neutral",
      intent: "return_request",
      category: "support"
    },
    createdAt: "2024-01-21T11:25:00Z",
    updatedAt: "2024-01-21T11:55:00Z",
    messages: [
      {
        id: "msg9",
        sender: "customer",
        content: "Hey! I saw your TikTok about easy returns. I need to return the blue hoodie from my last order - it's too big. Can you help? 💙",
        timestamp: "5 minutes ago",
        classification: {
          urgency: 4,
          sentiment: "neutral",
          intent: "return_request",
          keywords: ["return", "blue hoodie", "too big"]
        },
        read: false
      }
    ],
  }
};

// Real agents loaded from APIs (no more hardcoded fake data)
interface Agent {
  id: string;
  name: string;
  type: 'human' | 'ai_agent';
  status: 'online' | 'busy' | 'offline' | 'active' | 'inactive';
  specialization: string[];
  averageResponseTime?: number;
  customerSatisfaction?: number;
  conversationsHandled?: number;
  isTeamAgent?: boolean;
  teamName?: string;
  email?: string;
  availability?: string;
  currentConversations?: number;
  maxConversations?: number;
}

const availableTeams = [
  { id: "team-1", name: "Support Team", members: 5, specialization: ["Customer Support", "Order Issues"] },
  { id: "team-2", name: "Sales Team", members: 3, specialization: ["Lead Generation", "Conversion"] },
  { id: "team-3", name: "Technical Team", members: 4, specialization: ["Technical Issues", "Integration"] }
];

interface ConversationViewProps {
  onRealtimeStatusChange?: (connected: boolean) => void;
}

export function ConversationView({ onRealtimeStatusChange }: ConversationViewProps = {}) {
  const [selectedConversation, setSelectedConversation] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [activeTab, setActiveTab] = useState("messages");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversation, setNewConversation] = useState({
    platform: 'whatsapp',
    phoneNumber: '',
    message: ''
  });
  
  // Real agent data loaded from APIs
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  
  // Auto-pilot AI Reply Settings
  const [autoPilotMode, setAutoPilotMode] = useState<'off' | 'one-off' | 'always-on' | 'classification-based'>('off');
  const [showAutoPilotSettings, setShowAutoPilotSettings] = useState(false);
  const [autoPilotSettings, setAutoPilotSettings] = useState({
    enabled: false,
    mode: 'one-off' as 'one-off' | 'always-on' | 'classification-based',
    classificationRules: {
      urgencyThreshold: 7, // Auto-reply for urgency >= 7 (1-10 scale)
      intentTypes: ['support', 'sales'], // Auto-reply for these intents
      sentimentTypes: ['frustrated', 'angry'], // Auto-reply for negative sentiments
      escalateHighUrgency: true, // Escalate urgency 9-10 to humans
      enableHITL: true // Enable Human-in-the-Loop for complex cases
    },
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    },
    responseDelay: 2000 // 2 second delay before auto-reply
  });
  
  // Training modal state
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedAgentForTraining, setSelectedAgentForTraining] = useState<any>(null);
  
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Real-time messaging for all platforms
  const handleNewMessage = useCallback((message: RealtimeMessage) => {
    console.log('🚀 New real-time message received:', message);
    
    setConversations(prev => {
      const updated = { ...prev };
      const conversationId = message.conversation_id;
      
      // Create new message object
      const newMessage = {
        id: message.id,
        sender: message.direction === 'inbound' ? 'customer' : 'agent',
        senderId: message.contact_id || `${message.platform}-user`,
        content: message.content,
        timestamp: new Date(message.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        messageType: message.message_type,
        mediaUrl: message.media_url,
        classification: {
          urgency: Math.floor(Math.random() * 10) + 1, // TODO: Replace with actual classification
          sentiment: ['neutral', 'positive', 'negative', 'frustrated', 'happy'][Math.floor(Math.random() * 5)],
          intent: ['support', 'sales', 'general', 'complaint'][Math.floor(Math.random() * 4)],
          category: message.platform
        },
        read: message.direction === 'outbound', // Mark outbound messages as read
      };
      
      if (updated[conversationId]) {
        // Add the new message to existing conversation
        updated[conversationId] = {
          ...updated[conversationId],
          messages: [...(updated[conversationId].messages || []), newMessage],
          lastMessage: message.content,
          updatedAt: message.created_at,
          unreadCount: message.direction === 'inbound' ? 
            (updated[conversationId].unreadCount || 0) + 1 : 
            updated[conversationId].unreadCount || 0
        };
      } else {
        // Create new conversation if it doesn't exist (for new inbound messages)
        console.log('🆕 Creating new conversation from real-time message:', conversationId);
        updated[conversationId] = {
          id: conversationId,
          platform: message.platform,
          customer: {
            id: message.contact_id || `${message.platform}-${Date.now()}`,
            name: `${message.platform} User`,
            displayName: `${message.platform} User`,
            profilePicture: '/placeholder-avatar.png',
            phoneNumber: '',
            email: '',
            location: '',
            tags: [],
            lifecycleStage: 'lead',
            leadScore: 50,
            satisfaction: 4,
            totalOrders: 0,
            totalRevenue: 0,
            lastSeen: message.created_at,
            joinedDate: message.created_at,
            timezone: 'UTC',
            language: 'en',
            notes: '',
            customFields: {}
          },
          messages: [newMessage],
          status: 'active',
          priority: 'medium',
          assignedAgent: null,
          assignedTeam: null,
          tags: [],
          lastMessage: message.content,
          unreadCount: message.direction === 'inbound' ? 1 : 0,
          createdAt: message.created_at,
          updatedAt: message.created_at
        };
      }
      
      return updated;
    });

    // Auto-pilot: Check if AI should reply automatically
    if (message.direction === 'inbound') {
      const conversation = conversations[message.conversation_id];
      if (conversation && shouldAutoReply(newMessage, conversation)) {
        // Delay auto-reply slightly to feel more natural
        setTimeout(() => {
          triggerAIReply(message.conversation_id, true);
        }, autoPilotSettings.responseDelay);
      }
    }

    // Show toast notification for new messages not in active conversation
    if (message.direction === 'inbound' && message.conversation_id !== selectedConversation) {
      toast({
        title: `New ${message.platform} message`,
        description: message.content.substring(0, 100),
        action: (
          <button 
            onClick={() => setSelectedConversation(message.conversation_id)}
            className="text-primary hover:text-primary/80 text-sm"
          >
            View
          </button>
        )
      });
    }
  }, [selectedConversation, toast]);

  const handleConversationUpdate = useCallback((conversation: RealtimeConversation) => {
    console.log('💬 Conversation updated:', conversation);
    
    setConversations(prev => {
      const updated = { ...prev };
      if (updated[conversation.id]) {
        // Update existing conversation
        updated[conversation.id] = {
          ...updated[conversation.id],
          status: conversation.status,
          priority: conversation.priority,
          lastMessage: conversation.last_message_text || updated[conversation.id].lastMessage,
          updatedAt: conversation.last_message_at,
          unreadCount: conversation.unread_count,
        };
      } else {
        // Handle new conversation creation from database trigger
        console.log('🆕 New conversation detected from database:', conversation.id);
        // Trigger a reload of conversations to get full conversation data
        setTimeout(() => {
          loadConversations();
        }, 1000);
      }
      return updated;
    });
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    onRealtimeStatusChange?.(connected);
    
    if (connected) {
      toast({
        title: "🔗 Real-time Connected",
        description: "Live messaging enabled for all platforms",
      });
    } else {
      toast({
        title: "⚠️ Connection Lost", 
        description: "Real-time updates temporarily unavailable",
        variant: "destructive"
      });
    }
  }, [onRealtimeStatusChange, toast]);

  // Initialize real-time messaging
  const { 
    isConnected, 
    subscribeToConversation, 
    unsubscribeFromConversation,
    sendTypingIndicator 
  } = useRealtimeMessaging({
    userId: user?.uid || '',
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate,
    onConnectionChange: handleConnectionChange,
    onTypingIndicator: (conversationId, isTyping, platform) => {
      console.log(`⌨️ Typing indicator: ${conversationId} - ${isTyping} on ${platform}`);
      // Handle typing indicators in UI if needed
    }
  });

  // Subscribe to active conversation
  useEffect(() => {
    if (selectedConversation && isConnected) {
      subscribeToConversation(selectedConversation);
      
      return () => {
        unsubscribeFromConversation(selectedConversation);
      };
    }
  }, [selectedConversation, isConnected, subscribeToConversation, unsubscribeFromConversation]);

  // Load real conversations from API
  const loadConversations = async () => {
    if (!user) {
      console.log('❌ No user found, cannot load conversations');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading conversations for user:', user.uid);
      
      // Get Firebase ID token
      const token = await user.getIdToken();
      console.log('🔑 Got Firebase token, length:', token.length);
      
      // Load REAL conversations using working endpoint
      let response = await fetch('/api/messaging/conversations/working', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        
        if (data.success && data.conversations && data.conversations.length > 0) {
          console.log(`🎉 Found ${data.conversations.length} REAL conversations`);
          
          // Convert API data to component format  
          const apiConversations = data.conversations.reduce((acc: any, conv: any) => {
            acc[conv.id] = conv;
            return acc;
          }, {});
          
          // Set conversations and select first one
          setConversations(apiConversations);
          const firstConvId = Object.keys(apiConversations)[0];
          if (firstConvId) {
            setSelectedConversation(firstConvId);
            console.log('🎯 Selected first conversation:', firstConvId);
          }
          return; // Success, exit early
        } else {
          console.log('ℹ️ No real conversations found - user may not have received any messages yet');
          setConversations({}); // Set empty conversations
          return;
        }
      } else {
        console.log('❌ Real API Response error:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('❌ Error details:', errorText);
        setConversations({}); // Set empty conversations instead of demo data
        return;
      }
      
    } catch (error) {
      console.warn('❌ Error loading REAL conversations:', error);
      setConversations({}); // Set empty conversations instead of demo data
    } finally {
      setLoading(false);
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [user]);

  // Load real agents from APIs
  const loadAvailableAgents = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingAgents(true);
      
      // Load agents from multiple endpoints in parallel
      const [aiResponse, humanResponse, marketplaceResponse] = await Promise.all([
        fetch('/api/agents/my', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        }),
        fetch('/api/agents/human', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        }),
        fetch('/api/agents/marketplace?type=agents', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        }).catch(() => ({ ok: false })) // Optional marketplace
      ]);

      let allAgents: Agent[] = [];

      // Process AI agents (owned + team agents)
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiAgents = Array.isArray(aiData) ? aiData.map((agent: any) => ({
          id: agent.id,
          name: agent.name || 'Unnamed Agent',
          type: 'ai_agent' as const,
          status: agent.status === 'active' ? 'active' : 'inactive' as const,
          specialization: agent.specialization || [],
          averageResponseTime: agent.averageResponseTime || 0,
          customerSatisfaction: agent.customerSatisfaction || 0,
          conversationsHandled: agent.conversationsHandled || 0,
          isTeamAgent: agent.isTeamAgent,
          teamName: agent.teamName
        })) : [];
        allAgents = [...allAgents, ...aiAgents];
      }

      // Process human agents (team members)
      if (humanResponse.ok) {
        const humanData = await humanResponse.json();
        const humanAgents = Array.isArray(humanData) ? humanData.map((agent: any) => ({
          id: agent.id,
          name: agent.name || 'Team Member',
          type: 'human' as const,
          status: agent.availability === 'available' ? 'online' : 
                 agent.availability === 'busy' ? 'busy' : 'offline' as const,
          specialization: agent.specialization || [],
          averageResponseTime: agent.averageResponseTime || 300,
          customerSatisfaction: agent.customerSatisfaction || 4.5,
          conversationsHandled: agent.currentConversations || 0,
          email: agent.email,
          currentConversations: agent.currentConversations,
          maxConversations: agent.maxConversations
        })) : [];
        allAgents = [...allAgents, ...humanAgents];
      }

      // Process marketplace agents (optional)
      if (marketplaceResponse.ok) {
        const marketplaceData = await marketplaceResponse.json();
        const agents = marketplaceData.agents || [];
        const marketplaceAgents = Array.isArray(agents) ? agents.slice(0, 5).map((agent: any) => ({
          id: `marketplace-${agent.id}`,
          name: agent.name || 'Marketplace Agent',
          type: 'ai_agent' as const,
          status: 'active' as const,
          specialization: agent.specialization || [],
          averageResponseTime: agent.avgResponseTimeSeconds || 1,
          customerSatisfaction: agent.marketplaceRating || 4.5,
          conversationsHandled: agent.conversationsHandled || 0
        })) : [];
        allAgents = [...allAgents, ...marketplaceAgents];
      }

      console.log(`🤖 Loaded ${allAgents.length} real agents for conversation assignment`);
      setAvailableAgents(allAgents);

    } catch (error) {
      console.warn('Error loading available agents:', error);
      setAvailableAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [user]);

  // Load agents when user changes
  useEffect(() => {
    loadAvailableAgents();
  }, [loadAvailableAgents]);

  // Smart refresh: Update conversations but preserve local sent messages
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      // Only refresh if no message was sent in the last 5 seconds
      const now = Date.now();
      const lastSentMessage = Object.values(conversations)
        .flatMap(conv => conv.messages)
        .filter(msg => msg.sender === 'agent')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      const timeSinceLastSent = lastSentMessage ? 
        now - new Date(lastSentMessage.timestamp).getTime() : 
        Infinity;
      
      if (timeSinceLastSent > 5000) { // 5 seconds
        console.log('🔄 Smart refresh: Safe to reload conversations');
        loadConversations();
      } else {
        console.log('🔍 Smart refresh: Skipping reload to preserve recent sent message');
      }
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [user, conversations]);

  const activeConversation = conversations[selectedConversation];

  // Filter conversations based on search and filters
  const filteredConversations = Object.values(conversations).filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer.phone?.includes(searchQuery) ||
      (conv.messages || []).some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesPriority = filterPriority === "all" || conv.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    const matchesPlatform = filterPlatform === "all" || conv.platform === filterPlatform;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesPlatform;
  });

  // Get unique platforms for filter
  const availablePlatforms = [...new Set(Object.values(conversations).map(conv => conv.platform))];

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    // Store the message content before clearing the input
    const messageContent = newMessage.trim();
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    console.log('🔍 Sending message:', messageContent);

    // Clear input field immediately
    setNewMessage("");
    
    // Add message to UI immediately for instant feedback
    const optimisticMessage = {
      id: messageId,
      sender: 'agent',
      senderId: user?.uid || 'current-user',
      content: messageContent,
      timestamp,
      read: true,
      senderType: 'user' as const
    };

    // Update conversation immediately (optimistic update)
    setConversations(prev => ({
      ...prev,
      [selectedConversation]: {
        ...prev[selectedConversation],
        messages: [...(prev[selectedConversation]?.messages || []), optimisticMessage],
        lastMessage: messageContent,
        updatedAt: new Date().toISOString()
      }
    }));
    
    console.log('✅ Message added to UI optimistically, now sending to API...');

    // Send message via API - using test endpoint temporarily
    try {
      console.log('🔍 Making API call to send message:', messageContent);
      
      // Get Firebase token for authentication
      const token = await user.getIdToken();
      
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: activeConversation.platform,
          to: activeConversation.customer?.phone || activeConversation.customer?.platform_id || activeConversation.contact?.phone_number || activeConversation.contact?.platform_id,
          content: messageContent,
          messageType: 'text',
          conversationId: activeConversation.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent successfully:', result);
        
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully."
        });
        
        // Don't reload conversations - let the message stay in UI
        console.log('✅ Message sent, keeping in local UI without reload');
      } else {
        const errorData = await response.text();
        console.warn('❌ Send message failed:', response.status, errorData);
        
        toast({
          title: "Send Failed",
          description: `Failed to send message (${response.status}). Please try again.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('❌ Send message error:', error);
      toast({
        title: "Send Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const handleAIReply = async () => {
    if (!activeConversation || !activeConversation.assignedAgent || activeConversation.assignedAgent.type !== 'ai_agent') {
      toast({
        title: "No AI Agent Assigned",
        description: "Please assign an AI agent to this conversation first.",
        variant: "destructive"
      });
      return;
    }

    // Use the new triggerAIReply function
    await triggerAIReply(selectedConversation, false);
  };

  const handleAIReplyOld = async () => {
    if (!activeConversation || !activeConversation.assignedAgent || activeConversation.assignedAgent.type !== 'ai_agent') {
      toast({
        title: "No AI Agent Assigned",
        description: "Please assign an AI agent to this conversation first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get the last customer message for context
      const lastCustomerMessage = activeConversation.messages
        .filter(msg => msg.sender === 'customer')
        .pop();

      if (!lastCustomerMessage) {
        toast({
          title: "No Customer Message",
          description: "There are no customer messages to respond to.",
          variant: "destructive"
        });
        return;
      }

      // Show loading state
      toast({
        title: "Generating AI Response",
        description: "Please wait while the AI agent generates a response..."
      });

      // Get Firebase ID token for authentication
      const token = await user.getIdToken();

      // Debug the conversation data structure first
      console.log('🔍 DEBUG: Customer object:', activeConversation.customer);
      console.log('🔍 DEBUG: Available customer fields:', activeConversation.customer ? Object.keys(activeConversation.customer) : 'No customer object');
      console.log('🔍 DEBUG: Full activeConversation:', activeConversation);
      
      const recipientId = (() => {
        const platform = activeConversation.platform;
        const contact = activeConversation.customer || activeConversation.contact;
        
        console.log('🔍 DEBUG: Platform:', platform);
        console.log('🔍 DEBUG: Customer object:', contact);
        
        if (!contact) {
          console.log('❌ DEBUG: No contact data found');
          return null;
        }
        
        // Log all available contact fields
        console.log('🔍 DEBUG: Available contact fields:', Object.keys(contact));
        console.log('🔍 DEBUG: contact.phone:', contact?.phone);
        console.log('🔍 DEBUG: contact.phone_number:', contact?.phone_number);
        console.log('🔍 DEBUG: contact.platform_id:', contact?.platform_id);
        console.log('🔍 DEBUG: contact.email:', contact?.email);
        console.log('🔍 DEBUG: contact.id:', contact?.id);
        
        // Platform-specific recipient ID mapping
        let result;
        switch (platform) {
          case 'whatsapp':
            result = contact?.phone || contact?.phone_number;
            break;
          case 'telegram':
            result = contact?.platform_id || contact?.id;
            break;
          case 'gmail':
            result = contact?.email;
            break;
          case 'facebook':
          case 'instagram':
            result = contact?.platform_id || contact?.id;
            break;
          case 'slack':
          case 'discord':
            result = contact?.platform_username || contact?.platform_id || contact?.id;
            break;
          default:
            result = contact?.phone || contact?.phone_number || contact?.platform_id || contact?.email || contact?.id;
        }
        
        console.log('🔍 DEBUG: Final recipientId result:', result);
        return result;
      })();

      // Call the auto-reply service directly
      const response = await fetch('/api/ai-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          agentId: activeConversation.assignedAgent.id,
          customerMessage: lastCustomerMessage.content,
          platform: activeConversation.platform || 'whatsapp',
          recipientId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.response) {
          // Add the AI response to the conversation
          const aiMessage = {
            id: `msg-${Date.now()}`,
            sender: 'agent',
            senderId: activeConversation.assignedAgent.id,
            content: result.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            senderType: 'ai_agent' as const
          };

          // Update the conversation with the new AI message
          setConversations(prev => ({
            ...prev,
            [selectedConversation]: {
              ...prev[selectedConversation],
              messages: [...prev[selectedConversation].messages, aiMessage],
              updatedAt: new Date().toISOString()
            }
          }));

          toast({
            title: "AI Response Generated",
            description: `${activeConversation.assignedAgent.name} has generated and sent a response.`
          });
        } else if (result.error === 'AGENT_NEEDS_TRAINING') {
          // Handle training notification with direct action buttons
          const agentId = activeConversation.assignedAgent.id;
          const agentName = activeConversation.assignedAgent.name;
          
          toast({
            title: "🤖 AI Agent Needs Training",
            description: (
              <div className="space-y-3">
                <p className="text-sm">Your agent needs knowledge sources to respond effectively.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      // Open quick training modal
                      setSelectedAgentForTraining({
                        id: agentId,
                        name: agentName
                      });
                      setShowTrainingModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
                  >
                    Quick Train
                  </button>
                  <button 
                    onClick={() => {
                      // Route to full agent builder
                      window.location.href = `/shell?module=agent-builder&agentId=${agentId}&tab=knowledge&returnTo=conversation`;
                    }}
                    className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent transition-colors"
                  >
                    Advanced
                  </button>
                  <button 
                    onClick={() => {
                      // Dismiss toast
                      toast.dismiss();
                    }}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            ),
            variant: "default",
            duration: 12000 // Show longer for user to read and choose
          });
        } else if (result.error === 'AI recommends human escalation') {
          // Handle other escalation types
          toast({
            title: "AI Recommends Human Escalation",
            description: result.escalationReason || "The AI agent suggests a human should handle this conversation.",
            variant: "default"
          });
        } else {
          throw new Error(result.error || 'Failed to generate AI response');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.warn('Error generating AI reply:', error);
      toast({
        title: "AI Reply Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    const agent = availableAgents.find(a => a.id === agentId);
    if (!agent || !activeConversation) return;

    setConversations(prev => ({
      ...prev,
      [selectedConversation]: {
        ...prev[selectedConversation],
        assignedAgent: agent,
        updatedAt: new Date().toISOString()
      }
    }));

    toast({
      title: "Agent Assigned",
      description: `Conversation assigned to ${agent.name}`
    });
  };

  // Handle sending message to new number
  const handleSendToNewNumber = async () => {
    if (!newConversation.phoneNumber.trim() || !newConversation.message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format phone number (ensure it starts with +)
      let formattedPhone = newConversation.phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Send message via API
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          platform: newConversation.platform,
          to: formattedPhone,
          content: newConversation.message,
          messageType: 'text'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Message Sent Successfully!",
          description: `Message sent to ${formattedPhone} via ${(newConversation.platform || '').toUpperCase()}`
        });

        // Reset form
        setNewConversation({
          platform: 'whatsapp',
          phoneNumber: '',
          message: ''
        });
        setShowNewConversationModal(false);

        // Refresh conversations to show the new one
        setTimeout(() => {
          loadConversations();
        }, 2000);
      } else {
        toast({
          title: "Send Failed",
          description: data.error || "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.warn('Send to new number error:', error);
      toast({
        title: "Send Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    const team = availableTeams.find(t => t.id === teamId);
    if (!team || !activeConversation) return;

    setConversations(prev => ({
      ...prev,
      [selectedConversation]: {
        ...prev[selectedConversation],
        assignedTeam: team.name,
        updatedAt: new Date().toISOString()
      }
    }));

    toast({
      title: "Team Assigned",
      description: `Conversation assigned to ${team.name}`
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'frustrated': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Column: Conversations List */}
      <div className="w-1/3 border-r border-border flex flex-col bg-card">
        {/* Header with Search and Filters */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Conversations</h2>
                <p className="text-muted-foreground text-sm">Manage customer conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {filteredConversations.length}
              </Badge>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-muted border-border text-foreground" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="flex-1 bg-muted border-border text-foreground">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all" className="text-foreground">All Priority</SelectItem>
                <SelectItem value="urgent" className="text-foreground">Urgent</SelectItem>
                <SelectItem value="high" className="text-foreground">High</SelectItem>
                <SelectItem value="medium" className="text-foreground">Medium</SelectItem>
                <SelectItem value="low" className="text-foreground">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1 bg-muted border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all" className="text-foreground">All Status</SelectItem>
                <SelectItem value="open" className="text-foreground">Open</SelectItem>
                <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                <SelectItem value="closed" className="text-foreground">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="flex-1 bg-muted border-border text-foreground">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all" className="text-foreground">All Platforms</SelectItem>
                {availablePlatforms.map(platform => (
                  <SelectItem key={platform} value={platform} className="text-foreground">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform)}
                      {getPlatformName(platform)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Conversation Button */}
          <div className="mt-4">
            <Button 
              onClick={() => setShowNewConversationModal(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredConversations.map((convo, index) => (
              <motion.div
                key={convo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.02 }}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  selectedConversation === convo.id 
                    ? "bg-primary/5 border-l-4 border-l-primary" 
                    : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedConversation(convo.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={convo.customer?.avatar} alt={convo.customer?.name || 'Customer'} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {convo.customer?.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Platform indicator badge */}
                    <div className={`absolute -top-1 -left-1 p-1 rounded-full border-2 border-background ${getPlatformColor(convo.platform, 'dark')}`}>
                      {getPlatformIcon(convo.platform, 'sm')}
                    </div>
                    {/* Priority indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(convo.priority)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{convo.customer?.name || 'Unknown Customer'}</p>
                        <Badge 
                          className={`text-xs px-2 py-0.5 ${getPlatformColor(convo.platform, 'light')} border-0`}
                        >
                          {getPlatformName(convo.platform)}
                        </Badge>
                        {convo.messageType && convo.messageType !== 'message' && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                            {convo.messageType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(convo.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(convo.updatedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Context information for social media posts/videos */}
                    {(convo.sourcePost || convo.sourceVideo) && (
                      <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/50 rounded">
                        {convo.sourcePost && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span className="truncate">{convo.sourcePost.caption}</span>
                          </div>
                        )}
                        {convo.sourceVideo && (
                          <div className="flex items-center gap-1">
                            <Youtube className="h-3 w-3" />
                            <span className="truncate">{convo.sourceVideo.title}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {(convo.messages || [])[(convo.messages || []).length - 1]?.content}
                    </p>
                    
                    {/* Tags and metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(convo.tags || []).slice(0, 2).map(tag => (
                          <Badge 
                            key={tag}
                            variant="outline" 
                            className="text-xs border-border text-muted-foreground"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {convo.assignedAgent ? (
                          <div className="flex items-center gap-1">
                            <div className={`p-1 rounded ${
                              convo.assignedAgent.type === 'ai_agent' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {convo.assignedAgent.type === 'ai_agent' ? (
                                <Bot className="h-3 w-3 text-blue-600" />
                              ) : (
                                <User className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <span className="truncate max-w-[50px] text-xs font-medium">
                              {convo.assignedAgent.name.split(' ')[0]}
                            </span>
                            {convo.assignedAgent.autoResponse && (
                              <Zap className="h-2 w-2 text-yellow-500" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">No Agent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Middle Column: Message Thread */}
      <div className="flex-1 flex flex-col bg-background">
        {activeConversation ? (
          <>
            {/* Agent Status Bar - Top Priority */}
            {activeConversation.assignedAgent ? (
              <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeConversation.assignedAgent.type === 'ai_agent' ? (
                      <div className="p-2 bg-blue-100 rounded-md">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-green-100 rounded-md">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{activeConversation.assignedAgent.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {activeConversation.assignedAgent.type === 'ai_agent' ? 'AI Agent' : 'Human Agent'}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      {activeConversation.assignedAgent.autoResponse && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto-Response
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("ai-agents")}
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Change Agent
                  </Button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">No agent assigned to this conversation</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("assignment")}
                    className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Assign Agent
                  </Button>
                </div>
              </div>
            )}

            {/* Conversation Header - Clean Customer Focus */}
            <div className="p-6 border-b border-border bg-card">
              {/* Main Customer Info Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={activeConversation.customer?.avatar} alt={activeConversation.customer?.name || 'Customer'} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {activeConversation.customer?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-green-600">{activeConversation.customer?.name || 'Unknown Customer'}</h3>
                      <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getPlatformColor(activeConversation.platform, 'dark')}`}>
                        {getPlatformIcon(activeConversation.platform, 'sm')}
                        <span className="text-sm font-medium">{getPlatformName(activeConversation.platform)}</span>
                        {activeConversation.messageType && activeConversation.messageType !== 'message' && (
                          <span className="text-xs opacity-80">• {activeConversation.messageType}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(activeConversation.priority)} text-white text-xs`}>
                        {(activeConversation.priority || '').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-muted border-border">
                        {activeConversation.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {activeConversation.assignedAgent && (
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg mt-2">
                    {activeConversation.assignedAgent.type === 'ai_agent' ? (
                      <Bot className="h-3 w-3 text-green-600" />
                    ) : (
                      <User className="h-3 w-3 text-blue-600" />
                    )}
                    <span className="text-xs font-medium text-foreground">{activeConversation.assignedAgent.name}</span>
                  </div>
                )}
              </div>

              {/* Platform Context Information */}
              {(activeConversation.sourcePost || activeConversation.sourceVideo) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    {activeConversation.sourcePost && (
                      <>
                        <MessageCircle className="h-4 w-4 text-pink-600" />
                        Instagram Post Context
                      </>
                    )}
                    {activeConversation.sourceVideo && (
                      <>
                        <Youtube className="h-4 w-4 text-red-600" />
                        YouTube Video Context
                      </>
                    )}
                  </h4>
                  {activeConversation.sourcePost && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Post Caption:</p>
                      <p className="text-sm font-medium bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                        {activeConversation.sourcePost.caption}
                      </p>
                      <a href={activeConversation.sourcePost.url} target="_blank" rel="noopener noreferrer" 
                         className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View Original Post
                      </a>
                    </div>
                  )}
                  {activeConversation.sourceVideo && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Video Title:</p>
                      <p className="text-sm font-medium bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                        {activeConversation.sourceVideo.title}
                      </p>
                      <a href={activeConversation.sourceVideo.url} target="_blank" rel="noopener noreferrer" 
                         className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Contact & Status Info Row */}
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-3 gap-6">
                  {/* Platform Info */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Platform Details</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getPlatformIcon(activeConversation.platform, 'sm')}
                        <span>{getPlatformName(activeConversation.platform)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>{activeConversation.messageType || 'message'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{activeConversation.customer?.lastInteraction}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Contact Information</h4>
                    <div className="space-y-1.5">
                      {activeConversation.customer?.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{activeConversation.customer?.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{activeConversation.customer?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{activeConversation.customer?.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Classification Info */}
                  {activeConversation.classification && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Conversation Analysis</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span>Urgency: {activeConversation.classification.urgency}/10</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={getSentimentColor(activeConversation.classification.sentiment)}>
                            Sentiment: {activeConversation.classification.sentiment}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          <span>Intent: {activeConversation.classification.intent}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-background">
              <AnimatePresence>
                {(activeConversation.messages || []).map((message, index) => (
                  <motion.div 
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                    className={`flex items-start gap-6 ${
                      message.sender === 'customer' 
                        ? 'justify-start' // Customer messages: left-aligned
                        : 'justify-end' // Agent/User messages: right-aligned
                    }`}
                  >
                    {/* Customer messages: Avatar on left */}
                    {message.sender === 'customer' ? (
                      <Avatar className="h-10 w-10 ring-2 ring-background/50 shadow-lg flex-shrink-0">
                        <AvatarImage src={activeConversation.customer?.avatar} alt={activeConversation.customer?.name || 'Customer'} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white font-semibold">
                          {activeConversation.customer?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      /* Agent/User messages: Avatar on right (rendered after content due to flex order) */
                      <Avatar className="h-10 w-10 ring-2 ring-background/50 shadow-lg flex-shrink-0 order-2">
                        <AvatarFallback className={`${
                          message.senderType === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' // User: blue avatar
                            : message.senderType === 'ai_agent'
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' // AI Agent: green avatar
                            : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' // Default agent
                        } font-semibold`}>
                          {message.senderType === 'user' 
                            ? (userProfile?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U')
                            : message.senderType === 'ai_agent'
                            ? <Bot className="h-5 w-5" />
                            : 'A'
                          }
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[75%] relative ${
                      message.sender === 'customer'
                        ? 'bg-gradient-to-br from-card to-card/90 text-foreground shadow-lg border border-border/20' // Customer: light background
                        : message.senderType === 'user'
                        ? 'bg-gradient-to-br from-blue-500 via-blue-500/95 to-blue-500/90 text-white shadow-lg shadow-blue-500/25 order-1' // User: blue background, order-1
                        : 'bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 order-1' // AI Agent: primary background, order-1
                    } rounded-2xl p-5 backdrop-blur-sm`}>
                      {/* Message bubble arrow */}
                      <div className={`absolute top-4 ${
                        message.sender === 'customer'
                          ? 'left-[-6px] border-r-[6px] border-r-card border-y-[6px] border-y-transparent' // Customer: left arrow
                          : message.senderType === 'user'
                          ? 'right-[-6px] border-l-[6px] border-l-blue-500 border-y-[6px] border-y-transparent' // User: right arrow, blue
                          : 'right-[-6px] border-l-[6px] border-l-primary border-y-[6px] border-y-transparent' // AI Agent: right arrow, primary
                      }`} />
                      
                      {/* Platform context for message */}
                      {message.sender === 'customer' && (message.postContext || message.videoContext || message.emailContext) && (
                        <div className={`mb-3 p-2 rounded-lg ${
                          message.sender === 'agent' 
                            ? 'bg-white/10 border border-white/20' 
                            : 'bg-muted/50 border border-border/50'
                        }`}>
                          {message.postContext && (
                            <div className="flex items-center gap-2 text-xs">
                              <MessageCircle className="h-3 w-3" />
                              <span className="opacity-70">Comment on:</span>
                              <span className="font-medium truncate">{message.postContext.postCaption}</span>
                            </div>
                          )}
                          {message.videoContext && (
                            <div className="flex items-center gap-2 text-xs">
                              <Youtube className="h-3 w-3" />
                              <span className="opacity-70">Comment on:</span>
                              <span className="font-medium truncate">{message.videoContext.videoTitle}</span>
                            </div>
                          )}
                          {message.emailContext && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="h-3 w-3" />
                                <span className="opacity-70">Subject:</span>
                                <span className="font-medium">{message.emailContext.subject}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="opacity-70">From:</span>
                                <span>{message.emailContext.from}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-base leading-relaxed font-medium">{message.content}</p>
                      
                      {/* Message metadata */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                        <span className={`text-xs font-medium ${
                          message.sender === 'customer'
                            ? 'text-muted-foreground' // Customer: muted
                            : 'text-white/70' // User/Agent: white/70
                        }`}>
                          {message.timestamp}
                        </span>
                        
                        {message.classification && (
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                message.sender === 'customer'
                                  ? 'border-border/40 text-muted-foreground bg-background/50' // Customer: muted colors
                                  : 'border-white/30 text-white/80 bg-white/10' // User/Agent: white colors
                              } backdrop-blur-sm rounded-lg`}
                            >
                              {message.classification.sentiment}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                message.sender === 'customer'
                                  ? 'border-border/40 text-muted-foreground bg-background/50' // Customer: muted colors
                                  : 'border-white/30 text-white/80 bg-white/10' // User/Agent: white colors
                              } backdrop-blur-sm rounded-lg`}
                            >
                              Urgency: {message.classification.urgency}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Keywords */}
                      {message.classification?.keywords && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(message.classification.keywords || []).slice(0, 3).map(keyword => (
                            <Badge 
                              key={keyword}
                              variant="outline" 
                              className={`text-xs ${
                                message.sender === 'agent' 
                                  ? 'border-primary-foreground/30 text-primary-foreground/80 bg-white/10' 
                                  : 'border-border/40 text-muted-foreground bg-background/50'
                              } backdrop-blur-sm rounded-lg px-2 py-1`}
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {message.sender === 'agent' && (
                      <Avatar className="h-10 w-10 ring-2 ring-primary/30 shadow-lg flex-shrink-0">
                        <AvatarImage src="/placeholder-logo.svg" alt="Agent" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                          {activeConversation.assignedAgent?.type === 'ai_agent' ? 'AI' : 'A'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="relative">
                <Input 
                  placeholder="Type a message..." 
                  className="pr-24 bg-muted border-border text-foreground" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleAIReply}
                      disabled={!activeConversation.assignedAgent || activeConversation.assignedAgent.type !== 'ai_agent'}
                      className={`text-primary hover:bg-primary/10 border-primary ${
                        autoPilotSettings.enabled && autoPilotSettings.mode === 'always-on' 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : ''
                      }`}
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      AI Reply
                      {autoPilotSettings.enabled && (
                        <div className="ml-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAutoPilotSettings(true)}
                      className="text-gray-600 hover:bg-gray-100 px-2"
                      title="Auto-Pilot Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Select a conversation to view messages</p>
              <p className="text-muted-foreground text-sm">Choose from {filteredConversations.length} available conversations</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Customer Profile & Assignment */}
      <div className="w-96 border-l border-border flex flex-col bg-card">
        {activeConversation ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <TabsList className="grid w-full grid-cols-4 bg-muted border-border">
                <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="assignment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                  Assign
                </TabsTrigger>
                <TabsTrigger value="ai-agents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                  Agents
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                  History
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Customer Profile Tab */}
              <TabsContent value="messages" className="p-4 space-y-4 mt-0">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={activeConversation.customer?.avatar} alt={activeConversation.customer?.name || 'Customer'} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {activeConversation.customer?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-foreground text-lg">{activeConversation.customer?.name || 'Unknown Customer'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{activeConversation.customer?.lifecycleStage}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="text-foreground">{activeConversation.customer?.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="text-foreground">{activeConversation.customer?.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="text-foreground">{activeConversation.customer?.location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Language:</span>
                        <p className="text-foreground">{(activeConversation.customer?.language || '').toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <Separator className="bg-border" />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Customer Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {(activeConversation.customer?.tags || []).map(tag => (
                          <Badge key={tag} variant="outline" className="border-border text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Customer Metrics */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground text-sm">Customer Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Orders:</span>
                        <p className="text-foreground font-semibold">{activeConversation.customer?.totalOrders}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Spent:</span>
                        <p className="text-green-400 font-semibold">${activeConversation.customer?.totalSpent}</p>
                      </div>
                      {activeConversation.customer?.satisfactionScore && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Satisfaction:</span>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < Math.floor(activeConversation.customer?.satisfactionScore || 0) 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-muted-foreground'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-foreground">{activeConversation.customer?.satisfactionScore?.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Assignment Tab */}
              <TabsContent value="assignment" className="p-4 space-y-4 mt-0">
                {/* Quick Assignment Buttons */}
                {!loadingAgents && availableAgents.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {availableAgents.find(a => a.type === 'ai_agent') && (
                      <Button 
                        onClick={() => {
                          const aiAgent = availableAgents.find(a => a.type === 'ai_agent');
                          if (aiAgent) handleAssignAgent(aiAgent.id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Assign AI Agent
                      </Button>
                    )}
                    {availableAgents.find(a => a.type === 'human') && (
                      <Button 
                        onClick={() => {
                          const humanAgent = availableAgents.find(a => a.type === 'human');
                          if (humanAgent) handleAssignAgent(humanAgent.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Assign Human
                      </Button>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Available Agents
                    {!loadingAgents && availableAgents.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {availableAgents.length}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {loadingAgents ? (
                      <div className="flex items-center justify-center py-8">
                        <Clock className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading your agents...</span>
                      </div>
                    ) : availableAgents.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">No agents available</p>
                        <p className="text-xs text-muted-foreground mb-4">Add agents from the marketplace to assign them to conversations</p>
                        <Button 
                          onClick={() => setShowAgentSelector(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Add Agents
                        </Button>
                      </div>
                    ) : availableAgents.map(agent => (
                      <div 
                        key={agent.id}
                        className="p-3 rounded-lg bg-muted border border-border hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={`${
                                  agent.type === 'ai_agent' ? 'bg-green-600' : 'bg-blue-600'
                                } text-white font-semibold`}>
                                  {agent.type === 'ai_agent' ? 'AI' : agent.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                                agent.status === 'online' ? 'bg-green-500' :
                                agent.status === 'busy' ? 'bg-yellow-500' :
                                agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                              }`} />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-semibold">{agent.name}</span>
                                {agent.type === 'ai_agent' && <Bot className="h-4 w-4 text-green-400" />}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs bg-background border-border">
                                  {agent.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {agent.type === 'ai_agent' ? 'Response: <1s' : 'Avg: 2.3min'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant={activeConversation.assignedAgent?.id === agent.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAssignAgent(agent.id)}
                            className={activeConversation.assignedAgent?.id === agent.id ? 
                              "bg-primary" : 
                              "border-border hover:bg-background"
                            }
                          >
                            {activeConversation.assignedAgent?.id === agent.id ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-1" />
                            )}
                            {activeConversation.assignedAgent?.id === agent.id ? 'Assigned' : 'Assign'}
                          </Button>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-background rounded-md">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Rating</div>
                            <div className="text-sm font-semibold text-yellow-600 flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {agent.type === 'ai_agent' ? '4.8' : '4.5'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Tasks</div>
                            <div className="text-sm font-semibold text-blue-600">
                              {agent.type === 'ai_agent' ? '245' : '89'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Success</div>
                            <div className="text-sm font-semibold text-green-600">
                              {agent.type === 'ai_agent' ? '98%' : '94%'}
                            </div>
                          </div>
                        </div>

                        {/* Expertise Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(agent.specialization || []).map(spec => (
                            <Badge 
                              key={spec}
                              variant="outline" 
                              className="text-xs border-border text-muted-foreground bg-background"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Agents Button */}
                    <div className="mt-4 text-center">
                      <Button 
                        onClick={() => setShowAgentSelector(true)}
                        size="sm"
                        variant="outline"
                        className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Add More Agents from Marketplace or Create Human Agents
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI Suggest Tab */}
              <TabsContent value="smart-assign" className="p-4 space-y-4 mt-0">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-700">Maya AI Recommendations</h3>
                  </div>
                  <p className="text-sm text-green-600 mb-3">
                    Based on conversation analysis and agent performance, here are the top recommendations:
                  </p>
                  
                  {/* Top Recommendation */}
                  <div className="bg-white p-4 rounded-lg border-2 border-green-300 mb-3">
                    {!loadingAgents && availableAgents.length > 0 ? (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-green-600 text-white font-bold">
                                {availableAgents[0].type === 'ai_agent' ? 'AI' : 'H'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              1
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-700">{availableAgents[0].name}</span>
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                {availableAgents[0].type === 'ai_agent' ? 'AI Agent' : 'Human'}
                              </Badge>
                            </div>
                            <div className="text-sm text-green-600">
                              Best for: {availableAgents[0].specialization.slice(0, 2).join(', ') || 'General support'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAssignAgent(availableAgents[0].id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Auto-Assign
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No agents available for smart recommendation</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-2 mt-3 p-2 bg-green-50 rounded">
                      <div className="text-center">
                        <div className="text-xs text-green-600">Speed</div>
                        <div className="text-sm font-bold text-green-700">&lt;1s</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-green-600">Success</div>
                        <div className="text-sm font-bold text-green-700">98%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-green-600">Rating</div>
                        <div className="text-sm font-bold text-green-700">4.8★</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-green-600">Load</div>
                        <div className="text-sm font-bold text-green-700">12%</div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-green-600 mb-1">Why this recommendation:</div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                          Order Support Expert
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                          High Urgency Handler
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                          Available Now
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Alternative Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Alternative Options:</h4>
                    
                    {availableAgents.slice(1, 3).map((agent, index) => (
                      <div key={agent.id} className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`${agent.type === 'ai_agent' ? 'bg-green-600' : 'bg-blue-600'} text-white font-semibold`}>
                                {agent.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{agent.name}</span>
                                <Badge className={`${agent.type === 'ai_agent' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} text-xs`}>
                                  {agent.type === 'ai_agent' ? 'AI' : 'Human'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {agent.specialization[0] || 'General'} • {agent.averageResponseTime}
                                {agent.type === 'ai_agent' ? 's' : 'min'} avg
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignAgent(agent.id)}
                            className={`${agent.type === 'ai_agent' ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}

                    {availableAgents.length === 0 && !loadingAgents && (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No alternative agents available</p>
                        <p className="text-xs text-muted-foreground">Add more agents from the marketplace</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contextual Analysis */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Contextual Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Message Intent:</div>
                      <div className="font-medium text-foreground">Order Support</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Urgency Level:</div>
                      <div className="font-medium text-orange-600">High (8/10)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Customer Tier:</div>
                      <div className="font-medium text-purple-600">VIP</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Complexity:</div>
                      <div className="font-medium text-green-600">Medium</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* History Tab */}
              {/* AI Agents Tab - Enhanced Agent Management */}
              <TabsContent value="ai-agents" className="p-0 space-y-0 mt-0">
                <ConversationAgentPanel 
                  conversationId={activeConversation.id}
                  className="h-full border-none"
                  onAgentResponse={(response) => {
                    // Handle AI agent responses in the conversation
                    const newMessage = {
                      id: `msg-${Date.now()}`,
                      sender: "agent",
                      senderId: "ai-agent",
                      content: response,
                      timestamp: "just now",
                      read: false
                    };
                    // This would integrate with your existing message system
                    toast({
                      title: "AI Agent Response",
                      description: "Agent has generated a response for this conversation."
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="history" className="p-4 space-y-4 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Conversation History</h3>
                  <div className="space-y-3">
                    {/* Recent interactions */}
                    <Card className="bg-card border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Last Order Support</span>
                          <span className="text-xs text-muted-foreground">3 days ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Helped resolve shipping issue for order #ORD-12344
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Resolved
                          </Badge>
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Support
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Product Inquiry</span>
                          <span className="text-xs text-muted-foreground">1 week ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Asked about product specifications and availability
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Converted
                          </Badge>
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            Sales
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator className="bg-border" />
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-border hover:bg-accent"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Add to VIP
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-border hover:bg-accent"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-border hover:bg-accent"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a conversation to view details</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="h-5 w-5" />
              Start New Conversation
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message to a new contact. A conversation will be created automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-foreground">Platform</Label>
              <Select 
                value={newConversation.platform} 
                onValueChange={(value) => setNewConversation(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="whatsapp" className="text-foreground">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="telegram" className="text-foreground">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      Telegram
                    </div>
                  </SelectItem>
                  <SelectItem value="gmail" className="text-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-red-600" />
                      Gmail
                    </div>
                  </SelectItem>
                  <SelectItem value="sms" className="text-foreground">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                      SMS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Info - Phone or Email based on platform */}
            {newConversation.platform === 'gmail' ? (
              <div className="space-y-2">
                <Label htmlFor="emailAddress" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="e.g., contact@example.com"
                  value={newConversation.phoneNumber} // Reusing phoneNumber field for email
                  onChange={(e) => setNewConversation(prev => ({ 
                    ...prev, 
                    phoneNumber: e.target.value 
                  }))}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-foreground">
                  Phone Number
                  <span className="text-muted-foreground ml-1">(with country code)</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="e.g., +1234567890"
                  value={newConversation.phoneNumber}
                  onChange={(e) => setNewConversation(prev => ({ 
                    ...prev, 
                    phoneNumber: e.target.value 
                  }))}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            {/* Message/Email Content */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground">
                {newConversation.platform === 'gmail' ? 'Email Subject & Message' : 'Message'}
              </Label>
              <textarea
                id="message"
                placeholder={newConversation.platform === 'gmail' 
                  ? "Subject: Your subject here\n\nEmail message body..." 
                  : "Type your message here..."
                }
                rows={newConversation.platform === 'gmail' ? 6 : 4}
                value={newConversation.message}
                onChange={(e) => setNewConversation(prev => ({ 
                  ...prev, 
                  message: e.target.value 
                }))}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="text-xs text-muted-foreground">
                Character count: {newConversation.message.length}
                {newConversation.platform === 'gmail' && (
                  <span className="ml-2">• Format: "Subject: Your subject\n\nMessage body"</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewConversationModal(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendToNewNumber}
              disabled={!newConversation.phoneNumber.trim() || !newConversation.message.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Selector Modal */}
      {showAgentSelector && activeConversation && (
        <ConversationAgentSelector
          conversationId={activeConversation.id}
          currentAssignment={null}
          onAgentAssigned={(assignment) => {
            // Handle agent assignment
            toast({
              title: "Agent Assigned",
              description: `${assignment.agentName} has been assigned to this conversation.`
            });
            setShowAgentSelector(false);
          }}
          onClose={() => setShowAgentSelector(false)}
        />
      )}

      {/* Quick Training Modal */}
      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Train Agent: {selectedAgentForTraining?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAgentForTraining && (
            <AgentKnowledgeTrainer
              agentId={selectedAgentForTraining.id}
              agentName={selectedAgentForTraining.name}
              onKnowledgeUpdate={() => {
                // Show success message
                toast({
                  title: "Training Updated",
                  description: `${selectedAgentForTraining.name} has been trained successfully.`,
                });
                setShowTrainingModal(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Auto-Pilot Settings Modal */}
      <Dialog open={showAutoPilotSettings} onOpenChange={setShowAutoPilotSettings}>
        <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] bg-background border-border overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5 text-primary" />
              Auto-Pilot AI Reply Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure when AI agents should automatically reply to customer messages.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0 px-1">
            {/* Enable Auto-Pilot Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1">
                <Label className="text-foreground font-medium">Enable Auto-Pilot</Label>
                <p className="text-sm text-muted-foreground">Allow AI agents to automatically reply to messages</p>
              </div>
              <Button
                variant={autoPilotSettings.enabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newSettings = { ...autoPilotSettings, enabled: !autoPilotSettings.enabled };
                  setAutoPilotSettings(newSettings);
                  setAutoPilotMode(newSettings.enabled ? newSettings.mode : 'off');
                }}
                className={autoPilotSettings.enabled ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {autoPilotSettings.enabled ? (
                  <><Play className="h-4 w-4 mr-1" /> Enabled</>
                ) : (
                  <><Pause className="h-4 w-4 mr-1" /> Disabled</>
                )}
              </Button>
            </div>

            {autoPilotSettings.enabled && (
              <>
                {/* Auto-Pilot Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">Auto-Reply Mode</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        id: 'one-off',
                        title: 'One-Off (Manual)',
                        description: 'AI replies only when you click the AI Reply button',
                        icon: <RotateCcw className="h-4 w-4" />,
                        color: 'blue'
                      },
                      {
                        id: 'always-on',
                        title: 'Always-On Auto-Pilot',
                        description: 'AI automatically replies to every customer message',
                        icon: <Zap className="h-4 w-4" />,
                        color: 'green'
                      },
                      {
                        id: 'classification-based',
                        title: 'Smart Classification',
                        description: 'AI replies based on urgency, intent, and sentiment analysis',
                        icon: <Brain className="h-4 w-4" />,
                        color: 'purple'
                      }
                    ].map((mode) => (
                      <div
                        key={mode.id}
                        className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          autoPilotSettings.mode === mode.id
                            ? `border-${mode.color}-500 bg-${mode.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const newSettings = { ...autoPilotSettings, mode: mode.id as any };
                          setAutoPilotSettings(newSettings);
                          setAutoPilotMode(mode.id as any);
                        }}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`p-1.5 sm:p-2 rounded-lg ${
                            autoPilotSettings.mode === mode.id
                              ? `bg-${mode.color}-100 text-${mode.color}-700`
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {mode.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground text-sm sm:text-base">{mode.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{mode.description}</p>
                          </div>
                          {autoPilotSettings.mode === mode.id && (
                            <CheckCircle className={`h-5 w-5 text-${mode.color}-600`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classification-Based Settings */}
                {autoPilotSettings.mode === 'classification-based' && (
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Label className="text-foreground font-medium">Smart Classification Rules</Label>
                    
                    {/* Urgency Threshold */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Urgency Threshold</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={autoPilotSettings.classificationRules.urgencyThreshold}
                          onChange={(e) => {
                            const newSettings = {
                              ...autoPilotSettings,
                              classificationRules: {
                                ...autoPilotSettings.classificationRules,
                                urgencyThreshold: parseInt(e.target.value)
                              }
                            };
                            setAutoPilotSettings(newSettings);
                          }}
                          className="flex-1"
                        />
                        <span className="w-8 text-sm font-medium">
                          {autoPilotSettings.classificationRules.urgencyThreshold}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-reply to messages with urgency score ≥ {autoPilotSettings.classificationRules.urgencyThreshold}
                      </p>
                    </div>
                    
                    {/* Response Delay */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Response Delay</Label>
                      <Select
                        value={autoPilotSettings.responseDelay.toString()}
                        onValueChange={(value) => {
                          const newSettings = {
                            ...autoPilotSettings,
                            responseDelay: parseInt(value)
                          };
                          setAutoPilotSettings(newSettings);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">1 second</SelectItem>
                          <SelectItem value="2000">2 seconds</SelectItem>
                          <SelectItem value="3000">3 seconds</SelectItem>
                          <SelectItem value="5000">5 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Human-in-the-Loop (HITL) Settings */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Human-in-the-Loop (HITL)
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Escalate very high urgency (9-10) to humans</span>
                          <input
                            type="checkbox"
                            checked={autoPilotSettings.classificationRules.escalateHighUrgency}
                            onChange={(e) => {
                              const newSettings = {
                                ...autoPilotSettings,
                                classificationRules: {
                                  ...autoPilotSettings.classificationRules,
                                  escalateHighUrgency: e.target.checked
                                }
                              };
                              setAutoPilotSettings(newSettings);
                            }}
                            className="rounded"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ⚠️ Critical issues (urgency 9-10) will be flagged for human review even if AI responds
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                    <Label className="text-blue-800 font-medium">Current Status</Label>
                  </div>
                  <div className="text-sm text-blue-700 space-y-2">
                    {autoPilotSettings.mode === 'always-on' && (
                      <>
                        <p>✨ AI will automatically reply to every customer message</p>
                        <p className="text-xs">Human agents can still take over conversations at any time</p>
                      </>
                    )}
                    {autoPilotSettings.mode === 'one-off' && (
                      <>
                        <p>🎯 AI will only reply when you manually click the AI Reply button</p>
                        <p className="text-xs">Full manual control - perfect for sensitive conversations</p>
                      </>
                    )}
                    {autoPilotSettings.mode === 'classification-based' && (
                      <>
                        <p>🧠 Smart AI replies based on message analysis:</p>
                        <div className="ml-4 text-xs space-y-1">
                          <p>• <strong>Urgency ≥ {autoPilotSettings.classificationRules.urgencyThreshold}</strong> (Scale 1-10: 1=Low, 5=Medium, 10=Critical)</p>
                          <p>• <strong>Intents:</strong> Support requests, Sales inquiries</p>
                          <p>• <strong>Sentiments:</strong> Frustrated or angry customers (priority response)</p>
                          <p>• <strong>HITL:</strong> Human agents override AI for complex cases</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAutoPilotSettings(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Auto-Pilot Settings Saved",
                  description: `Auto-pilot is now ${autoPilotSettings.enabled ? 'enabled' : 'disabled'} with ${autoPilotSettings.mode} mode.`,
                });
                setShowAutoPilotSettings(false);
              }}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConversationView;
