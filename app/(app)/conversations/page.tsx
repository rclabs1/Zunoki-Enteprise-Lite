"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  UserPlus,
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  MoreVertical,
  Archive,
  Star,
  Flag,
  Users,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  Smartphone,
  Brain,
  TrendingUp,
  Target,
  ThumbsUp,
  ThumbsDown,
  Headphones,
  Settings,
  ArrowRight,
  ChevronDown,
  Loader,
  Sparkles,
  Shield,
  Activity
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  content: string
  timestamp: Date
  isIncoming: boolean
  isFromAgent?: boolean
  agentName?: string
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'document' | 'audio' | 'ai_response' | 'system' | 'handoff'
  aiAgent?: {
    name: string
    confidence: number
    intent: string
    suggestions?: string[]
  }
  channel: 'website' | 'whatsapp' | 'email' | 'sms' | 'telegram'
  metadata?: {
    pageUrl?: string
    userAgent?: string
    location?: string
    sessionId?: string
  }
}

interface Conversation {
  id: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  contactAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  status: 'active' | 'waiting' | 'resolved' | 'archived' | 'ai_handling'
  assignedAgent?: string
  assignedAiAgent?: {
    id: string
    name: string
    type: 'sales' | 'support' | 'technical' | 'general'
    confidence: number
    isActive: boolean
  }
  primaryChannel: 'website' | 'whatsapp' | 'email' | 'sms' | 'telegram'
  availableChannels: string[]
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  leadScore?: number
  intent?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  messages: Message[]
  aiSummary?: string
  isAiActive: boolean
  needsHumanReview: boolean
}

interface Agent {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  activeConversations: number
  type: 'human' | 'ai'
  capabilities?: string[]
  specialization?: 'sales' | 'support' | 'technical' | 'general'
  aiModel?: string
  confidence?: number
}

interface AIAgent {
  id: string
  name: string
  type: 'sales' | 'support' | 'technical' | 'general'
  status: 'active' | 'training' | 'offline'
  model: string
  activeConversations: number
  totalConversations: number
  successRate: number
  averageResponseTime: number
  capabilities: string[]
  intents: string[]
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    contactName: 'Sarah Johnson',
    contactPhone: '+1 (555) 123-4567',
    contactEmail: 'sarah@example.com',
    lastMessage: 'AI is helping me check your order status...',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 1000),
    unreadCount: 0,
    status: 'ai_handling',
    assignedAiAgent: {
      id: 'ai-support-1',
      name: 'Support Pro',
      type: 'support',
      confidence: 94,
      isActive: true
    },
    primaryChannel: 'website',
    availableChannels: ['website', 'whatsapp', 'email'],
    tags: ['support', 'order', 'high-value'],
    priority: 'high',
    leadScore: 85,
    intent: 'order_inquiry',
    sentiment: 'neutral',
    isAiActive: true,
    needsHumanReview: false,
    aiSummary: 'Customer inquiring about order #12345 status. Order found, shipping today.',
    messages: [
      {
        id: '1',
        content: 'Hi, I need help with my order #12345 status',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isIncoming: true,
        status: 'read',
        type: 'text',
        channel: 'website',
        metadata: {
          pageUrl: 'https://example.com/account/orders',
          sessionId: 'sess_abc123'
        }
      },
      {
        id: '2',
        content: 'Hi Sarah! I\'d be happy to help you check on order #12345. Let me look that up for you right away.',
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        isIncoming: false,
        isFromAgent: true,
        agentName: 'Support Pro (AI)',
        status: 'read',
        type: 'ai_response',
        channel: 'website',
        aiAgent: {
          name: 'Support Pro',
          confidence: 96,
          intent: 'order_inquiry',
          suggestions: ['Check order status', 'Provide tracking info', 'Offer alternatives']
        }
      },
      {
        id: '3',
        content: 'Great news! I found your order #12345. It was processed yesterday and is being shipped today via FedEx. You should receive tracking information within 2 hours.',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isIncoming: false,
        isFromAgent: true,
        agentName: 'Support Pro (AI)',
        status: 'read',
        type: 'ai_response',
        channel: 'website',
        aiAgent: {
          name: 'Support Pro',
          confidence: 98,
          intent: 'order_status_update',
          suggestions: ['Provide tracking link', 'Offer delivery options', 'Ask for feedback']
        }
      }
    ]
  },
  {
    id: '2',
    contactName: 'Mike Chen',
    contactPhone: '+1 (555) 987-6543',
    contactEmail: 'mike@techcorp.com',
    lastMessage: 'Would you like me to connect you with our technical team?',
    lastMessageTime: new Date(Date.now() - 8 * 60 * 1000),
    unreadCount: 1,
    status: 'waiting',
    assignedAiAgent: {
      id: 'ai-tech-1',
      name: 'Tech Helper',
      type: 'technical',
      confidence: 72,
      isActive: true
    },
    primaryChannel: 'whatsapp',
    availableChannels: ['whatsapp', 'email'],
    tags: ['technical', 'api'],
    priority: 'medium',
    leadScore: 92,
    intent: 'technical_support',
    sentiment: 'slightly_frustrated',
    isAiActive: true,
    needsHumanReview: true,
    aiSummary: 'Technical issue with API integration. Complex query, may need human expert.',
    messages: [
      {
        id: '1',
        content: 'I\'m having trouble with the API integration. The webhook isn\'t firing properly.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isIncoming: true,
        status: 'read',
        type: 'text',
        channel: 'whatsapp'
      },
      {
        id: '2',
        content: 'I understand you\'re experiencing issues with webhook integration. This sounds like a technical setup issue. Would you like me to connect you with our technical team who can provide detailed API support?',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        isIncoming: false,
        isFromAgent: true,
        agentName: 'Tech Helper (AI)',
        status: 'delivered',
        type: 'ai_response',
        channel: 'whatsapp',
        aiAgent: {
          name: 'Tech Helper',
          confidence: 72,
          intent: 'technical_escalation',
          suggestions: ['Escalate to human', 'Provide documentation', 'Schedule tech call']
        }
      }
    ]
  },
  {
    id: '3',
    contactName: 'Emma Wilson',
    contactPhone: '+1 (555) 456-7890',
    contactEmail: 'emma@startup.io',
    lastMessage: 'Perfect! I\'ve scheduled a demo for Friday at 3 PM.',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 0,
    status: 'resolved',
    assignedAgent: 'Jane Smith',
    assignedAiAgent: {
      id: 'ai-sales-1',
      name: 'Sales Pro',
      type: 'sales',
      confidence: 89,
      isActive: false
    },
    primaryChannel: 'website',
    availableChannels: ['website', 'email', 'whatsapp'],
    tags: ['sales', 'demo', 'qualified'],
    priority: 'high',
    leadScore: 95,
    intent: 'demo_request',
    sentiment: 'positive',
    isAiActive: false,
    needsHumanReview: false,
    aiSummary: 'Qualified lead, demo scheduled, high conversion probability.',
    messages: []
  }
]

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'John Doe',
    status: 'online',
    activeConversations: 3,
    type: 'human',
    specialization: 'support'
  },
  {
    id: '2',
    name: 'Jane Smith',
    status: 'online',
    activeConversations: 2,
    type: 'human',
    specialization: 'sales'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    status: 'away',
    activeConversations: 1,
    type: 'human',
    specialization: 'technical'
  },
  {
    id: 'ai-sales-1',
    name: 'Sales Pro',
    status: 'online',
    activeConversations: 12,
    type: 'ai',
    specialization: 'sales',
    aiModel: 'GPT-4',
    confidence: 94,
    capabilities: ['lead_qualification', 'pricing_queries', 'demo_scheduling']
  },
  {
    id: 'ai-support-1',
    name: 'Support Pro',
    status: 'online',
    activeConversations: 18,
    type: 'ai',
    specialization: 'support',
    aiModel: 'GPT-4',
    confidence: 96,
    capabilities: ['order_tracking', 'basic_troubleshooting', 'account_help']
  },
  {
    id: 'ai-tech-1',
    name: 'Tech Helper',
    status: 'online',
    activeConversations: 6,
    type: 'ai',
    specialization: 'technical',
    aiModel: 'Claude-3',
    confidence: 87,
    capabilities: ['api_support', 'integration_help', 'documentation']
  }
]

const mockAiAgents: AIAgent[] = [
  {
    id: 'ai-sales-1',
    name: 'Sales Pro',
    type: 'sales',
    status: 'active',
    model: 'GPT-4-Turbo',
    activeConversations: 12,
    totalConversations: 1247,
    successRate: 94.2,
    averageResponseTime: 1.8,
    capabilities: ['lead_qualification', 'pricing_queries', 'demo_scheduling', 'objection_handling'],
    intents: ['pricing_inquiry', 'demo_request', 'feature_question', 'comparison_request']
  },
  {
    id: 'ai-support-1',
    name: 'Support Pro',
    type: 'support',
    status: 'active',
    model: 'GPT-4',
    activeConversations: 18,
    totalConversations: 2891,
    successRate: 96.8,
    averageResponseTime: 1.2,
    capabilities: ['order_tracking', 'account_help', 'basic_troubleshooting', 'billing_support'],
    intents: ['order_inquiry', 'account_issue', 'billing_question', 'general_support']
  },
  {
    id: 'ai-tech-1',
    name: 'Tech Helper',
    type: 'technical',
    status: 'active',
    model: 'Claude-3-Sonnet',
    activeConversations: 6,
    totalConversations: 543,
    successRate: 87.3,
    averageResponseTime: 2.4,
    capabilities: ['api_support', 'integration_help', 'documentation', 'troubleshooting'],
    intents: ['technical_issue', 'api_question', 'integration_help', 'documentation_request']
  }
]

export default function ConversationsModule() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [showAiOnly, setShowAiOnly] = useState(false)
  const [aiAgents] = useState<AIAgent[]>(mockAiAgents)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.contactPhone.includes(searchQuery) ||
                         conv.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.intent?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter
    const matchesChannel = channelFilter === 'all' || conv.primaryChannel === channelFilter
    const matchesAiFilter = !showAiOnly || conv.isAiActive

    return matchesSearch && matchesStatus && matchesPriority && matchesChannel && matchesAiFilter
  })

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      timestamp: new Date(),
      isIncoming: false,
      status: 'sent',
      type: 'text',
      channel: selectedConversation.primaryChannel
    }

    // Update conversation with human message
    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: messageInput,
          lastMessageTime: new Date(),
          isAiActive: false // Human took over
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: messageInput,
      lastMessageTime: new Date(),
      isAiActive: false
    })
    setMessageInput('')

    // Simulate AI suggestion for human agent
    if (selectedConversation.assignedAiAgent) {
      const suggestions = await generateAiSuggestions(messageInput, selectedConversation)
      setAiSuggestions(suggestions)
    }
  }

  // Simulate AI response generation
  const generateAiSuggestions = async (message: string, conversation: Conversation): Promise<string[]> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock AI suggestions based on message content
    const suggestions = []
    if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
      suggestions.push('Would you like me to send you our pricing guide?')
      suggestions.push('I can schedule a call with our sales team to discuss pricing.')
      suggestions.push('Our pricing starts at $49/month for teams up to 10 users.')
    } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('support')) {
      suggestions.push('I\'d be happy to help! Can you tell me more about the issue?')
      suggestions.push('Let me check our knowledge base for solutions.')
      suggestions.push('Would you like me to escalate this to our technical team?')
    } else {
      suggestions.push('Thank you for that information. How else can I help?')
      suggestions.push('Is there anything specific you\'d like to know about our platform?')
    }

    return suggestions.slice(0, 3)
  }

  // Simulate AI auto-response for AI-handled conversations
  const triggerAiResponse = async (conversation: Conversation, userMessage: string) => {
    if (!conversation.isAiActive || !conversation.assignedAiAgent) return

    setIsAiTyping(true)

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 2000))

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: generateMockAiResponse(userMessage, conversation.assignedAiAgent.type),
      timestamp: new Date(),
      isIncoming: false,
      isFromAgent: true,
      agentName: `${conversation.assignedAiAgent.name} (AI)`,
      status: 'sent',
      type: 'ai_response',
      channel: conversation.primaryChannel,
      aiAgent: {
        name: conversation.assignedAiAgent.name,
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
        intent: detectIntent(userMessage),
        suggestions: []
      }
    }

    // Update conversation with AI response
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, aiResponse],
          lastMessage: aiResponse.content,
          lastMessageTime: new Date()
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, aiResponse],
        lastMessage: aiResponse.content,
        lastMessageTime: new Date()
      })
    }

    setIsAiTyping(false)
  }

  // Mock AI response generation
  const generateMockAiResponse = (userMessage: string, agentType: string): string => {
    const responses = {
      sales: [
        "I'd be happy to help you with pricing information! What's the size of your team?",
        "Great question! Our platform offers several plans to fit different needs. Would you like a personalized demo?",
        "I can see you're interested in our features. Let me connect you with our sales specialist who can provide detailed information."
      ],
      support: [
        "I understand your concern. Let me look into that right away for you.",
        "Thank you for reaching out! I'll help you resolve this issue quickly.",
        "I've found some information that might help. Let me walk you through the solution."
      ],
      technical: [
        "I see you're having a technical issue. Let me check our documentation for the best solution.",
        "This looks like an integration question. I can provide step-by-step guidance.",
        "For this technical issue, I recommend checking our API documentation. Would you like me to send you the relevant links?"
      ]
    }

    const typeResponses = responses[agentType as keyof typeof responses] || responses.support
    return typeResponses[Math.floor(Math.random() * typeResponses.length)]
  }

  // Mock intent detection
  const detectIntent = (message: string): string => {
    const intents = {
      pricing: ['price', 'cost', 'plan', 'pricing', 'expensive', 'cheap'],
      support: ['help', 'issue', 'problem', 'broken', 'error', 'bug'],
      technical: ['api', 'integration', 'code', 'webhook', 'technical'],
      demo: ['demo', 'trial', 'test', 'show', 'example'],
      billing: ['bill', 'payment', 'invoice', 'charge', 'subscription']
    }

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return intent
      }
    }

    return 'general_inquiry'
  }

  const handleAssignAgent = (conversationId: string, agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId)
    if (!agent) return

    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          assignedAgent: agent.name,
          status: 'active' as const
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({
        ...selectedConversation,
        assignedAgent: agent.name,
        status: 'active'
      })
    }
  }

  const handleStatusChange = (conversationId: string, newStatus: Conversation['status']) => {
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, status: newStatus }
      }
      return conv
    })

    setConversations(updatedConversations)
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, status: newStatus })
    }
  }

  const getStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'ai_handling': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Conversation['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'website': return <Globe className="w-4 h-4" />
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'sms': return <Smartphone className="w-4 h-4" />
      case 'telegram': return <Send className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'website': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'whatsapp': return 'bg-green-50 text-green-700 border-green-200'
      case 'email': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'sms': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'telegram': return 'bg-sky-50 text-sky-700 border-sky-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-3 h-3 text-green-600" />
      case 'negative': return <ThumbsDown className="w-3 h-3 text-red-600" />
      case 'neutral': return <Activity className="w-3 h-3 text-gray-600" />
      default: return null
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50'
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="h-full bg-background">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-96 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Conversations
              </h2>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="ai_handling">AI Handling</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="website">🌐 Website</SelectItem>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="sms">📱 SMS</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showAiOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAiOnly(!showAiOnly)}
                  className="text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  AI Only
                </Button>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.contactAvatar} />
                        <AvatarFallback>
                          {conversation.contactName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Channel indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${getChannelColor(conversation.primaryChannel)}`}>
                        {getChannelIcon(conversation.primaryChannel)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-sm truncate">
                            {conversation.contactName}
                          </h3>
                          {conversation.isAiActive && (
                            <div className="flex items-center">
                              <Bot className="w-3 h-3 text-purple-600" />
                              {conversation.assignedAiAgent && (
                                <span className={`text-xs px-1 py-0.5 rounded ${getConfidenceColor(conversation.assignedAiAgent.confidence)}`}>
                                  {conversation.assignedAiAgent.confidence}%
                                </span>
                              )}
                            </div>
                          )}
                          {conversation.sentiment && getSentimentIcon(conversation.sentiment)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessageTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 mt-1">
                        {conversation.leadScore && (
                          <Badge variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {conversation.leadScore}%
                          </Badge>
                        )}
                        {conversation.intent && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            {conversation.intent.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.isAiActive && <Bot className="w-3 h-3 mr-1 inline text-purple-600" />}
                        {conversation.lastMessage}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`text-xs border ${getStatusColor(conversation.status)}`}
                          >
                            {conversation.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs border ${getPriorityColor(conversation.priority)}`}
                          >
                            {conversation.priority}
                          </Badge>
                          {conversation.needsHumanReview && (
                            <Badge variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Review
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          {conversation.availableChannels.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              +{conversation.availableChannels.length - 1}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        {conversation.assignedAgent && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {conversation.assignedAgent}
                            </span>
                          </div>
                        )}
                        {conversation.assignedAiAgent && (
                          <div className="flex items-center">
                            <Brain className="h-3 w-3 mr-1 text-purple-600" />
                            <span className="text-xs text-purple-600">
                              {conversation.assignedAiAgent.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.contactAvatar} />
                      <AvatarFallback>
                        {selectedConversation.contactName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{selectedConversation.contactName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.contactPhone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Assign Agent */}
                    <Select onValueChange={(agentId) => handleAssignAgent(selectedConversation.id, agentId)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                agent.status === 'online' ? 'bg-green-500' :
                                agent.status === 'away' ? 'bg-yellow-500' :
                                agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                              }`} />
                              <span>{agent.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Status Change */}
                    <Select 
                      value={selectedConversation.status} 
                      onValueChange={(status) => handleStatusChange(selectedConversation.id, status as Conversation['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Star Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isIncoming
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {!message.isIncoming && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sent' && <Clock className="h-3 w-3" />}
                              {message.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
                              {message.status === 'read' && <CheckCircle className="h-3 w-3 text-blue-400" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift + Enter for new line</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Bot className="h-4 w-4 mr-1" />
                      AI Suggest
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a Conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Agent Status Sidebar */}
        <div className="w-64 border-l border-border p-4">
          <h3 className="font-medium mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Status
          </h3>
          
          <div className="space-y-3">
            {mockAgents.map((agent) => (
              <div key={agent.id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback className="text-xs">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    agent.status === 'online' ? 'bg-green-500' :
                    agent.status === 'away' ? 'bg-yellow-500' :
                    agent.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.activeConversations} active
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Auto-assign
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Bot className="h-4 w-4 mr-2" />
              AI Responses
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}