"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  MessageSquare, 
  Brain, 
  Zap, 
  Database,
  Settings,
  Code,
  Workflow,
  Mic,
  Phone,
  Clock,
  Filter,
  Calculator,
  Mail,
  Calendar,
  Globe,
  FileText,
  Image,
  Video,
  Music,
  BarChart3,
  Target,
  Users,
  Lock,
  Key,
  Cpu,
  Cloud,
  Server,
  Smartphone,
  Monitor,
  Headphones,
  Camera,
  Gamepad2,
  ShoppingCart,
  CreditCard,
  Truck,
  Package,
  Gift,
  Tag,
  DollarSign,
  TrendingUp,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Bell,
  Flag,
  Star,
  Heart,
  Bookmark,
  Share,
  Download,
  Upload,
  Copy,
  Edit,
  Trash,
  Plus,
  Minus,
  X,
  ChevronRight
} from "lucide-react"

export interface NodeType {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  category: 'trigger' | 'action' | 'logic' | 'ai' | 'voice' | 'integration' | 'data'
  subcategory?: string
  tags: string[]
  isPremium?: boolean
  isNew?: boolean
  complexity: 'simple' | 'medium' | 'advanced'
  estimatedTime: string
}

const nodeTypes: NodeType[] = [
  // Trigger Nodes
  {
    id: 'webhook-trigger',
    name: 'Webhook',
    description: 'Trigger workflow from HTTP webhook',
    icon: Globe,
    category: 'trigger',
    tags: ['http', 'api', 'webhook'],
    complexity: 'simple',
    estimatedTime: '1-2s'
  },
  {
    id: 'schedule-trigger',
    name: 'Schedule',
    description: 'Run workflow on schedule (cron)',
    icon: Clock,
    category: 'trigger',
    tags: ['time', 'cron', 'schedule'],
    complexity: 'simple',
    estimatedTime: '0s'
  },
  {
    id: 'voice-call-trigger',
    name: 'Voice Call',
    description: 'Trigger on incoming phone call',
    icon: Phone,
    category: 'trigger',
    subcategory: 'voice',
    tags: ['voice', 'phone', 'call'],
    complexity: 'medium',
    estimatedTime: '0.5s',
    isNew: true
  },
  {
    id: 'message-trigger',
    name: 'Message',
    description: 'Trigger on chat/SMS message',
    icon: MessageSquare,
    category: 'trigger',
    tags: ['chat', 'sms', 'message'],
    complexity: 'simple',
    estimatedTime: '0.2s'
  },

  // AI Nodes
  {
    id: 'llm-chat',
    name: 'LLM Chat',
    description: 'GPT-4/Claude conversation processing',
    icon: Brain,
    category: 'ai',
    tags: ['ai', 'chat', 'llm', 'gpt'],
    complexity: 'medium',
    estimatedTime: '2-5s'
  },
  {
    id: 'knowledge-search',
    name: 'Knowledge Search',
    description: 'Search vector database for relevant info',
    icon: Database,
    category: 'ai',
    tags: ['knowledge', 'vector', 'search', 'rag'],
    complexity: 'medium',
    estimatedTime: '1-3s'
  },
  {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone of text',
    icon: Activity,
    category: 'ai',
    tags: ['sentiment', 'emotion', 'analysis'],
    complexity: 'simple',
    estimatedTime: '0.5s'
  },
  {
    id: 'text-classification',
    name: 'Text Classification',
    description: 'Classify text into categories',
    icon: Tag,
    category: 'ai',
    tags: ['classification', 'categorization'],
    complexity: 'medium',
    estimatedTime: '1s'
  },

  // Voice Nodes
  {
    id: 'speech-to-text',
    name: 'Speech-to-Text',
    description: 'Convert speech to text (Deepgram/Whisper)',
    icon: Mic,
    category: 'voice',
    tags: ['speech', 'transcription', 'deepgram'],
    complexity: 'medium',
    estimatedTime: '0.5-2s',
    isPremium: true
  },
  {
    id: 'text-to-speech',
    name: 'Text-to-Speech',
    description: 'Convert text to natural speech (ElevenLabs)',
    icon: Headphones,
    category: 'voice',
    tags: ['tts', 'voice', 'elevenlabs'],
    complexity: 'medium',
    estimatedTime: '1-3s',
    isPremium: true
  },
  {
    id: 'voice-emotion',
    name: 'Voice Emotion',
    description: 'Detect emotions in voice calls',
    icon: Heart,
    category: 'voice',
    tags: ['emotion', 'voice', 'detection'],
    complexity: 'advanced',
    estimatedTime: '1-2s',
    isPremium: true,
    isNew: true
  },
  {
    id: 'call-transfer',
    name: 'Call Transfer',
    description: 'Transfer call to human or other agent',
    icon: ChevronRight,
    category: 'voice',
    tags: ['transfer', 'call', 'human'],
    complexity: 'medium',
    estimatedTime: '1s'
  },

  // Action Nodes
  {
    id: 'send-message',
    name: 'Send Message',
    description: 'Send message to chat platform',
    icon: MessageSquare,
    category: 'action',
    tags: ['message', 'send', 'chat'],
    complexity: 'simple',
    estimatedTime: '0.5s'
  },
  {
    id: 'send-email',
    name: 'Send Email',
    description: 'Send email via SMTP or service',
    icon: Mail,
    category: 'action',
    tags: ['email', 'send', 'notification'],
    complexity: 'simple',
    estimatedTime: '1-2s'
  },
  {
    id: 'calendar-booking',
    name: 'Calendar Booking',
    description: 'Book appointment in calendar',
    icon: Calendar,
    category: 'action',
    tags: ['calendar', 'booking', 'appointment'],
    complexity: 'medium',
    estimatedTime: '2-3s'
  },
  {
    id: 'webhook-call',
    name: 'Webhook Call',
    description: 'Make HTTP request to external API',
    icon: Globe,
    category: 'action',
    tags: ['http', 'api', 'webhook'],
    complexity: 'medium',
    estimatedTime: '1-5s'
  },

  // Logic Nodes
  {
    id: 'condition',
    name: 'Condition',
    description: 'If/else logic branching',
    icon: Filter,
    category: 'logic',
    tags: ['condition', 'if', 'logic'],
    complexity: 'simple',
    estimatedTime: '0.1s'
  },
  {
    id: 'switch',
    name: 'Switch',
    description: 'Multi-way branching logic',
    icon: Settings,
    category: 'logic',
    tags: ['switch', 'branch', 'logic'],
    complexity: 'medium',
    estimatedTime: '0.1s'
  },
  {
    id: 'loop',
    name: 'Loop',
    description: 'Iterate over data items',
    icon: Workflow,
    category: 'logic',
    tags: ['loop', 'iterate', 'repeat'],
    complexity: 'medium',
    estimatedTime: 'variable'
  },
  {
    id: 'delay',
    name: 'Delay',
    description: 'Wait for specified time',
    icon: Clock,
    category: 'logic',
    tags: ['delay', 'wait', 'pause'],
    complexity: 'simple',
    estimatedTime: 'configurable'
  },

  // Integration Nodes
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Send/receive WhatsApp messages',
    icon: MessageSquare,
    category: 'integration',
    subcategory: 'messaging',
    tags: ['whatsapp', 'messaging'],
    complexity: 'medium',
    estimatedTime: '1-2s'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages to Slack channels',
    icon: MessageSquare,
    category: 'integration',
    subcategory: 'messaging',
    tags: ['slack', 'team', 'messaging'],
    complexity: 'simple',
    estimatedTime: '1s'
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read/write Google Sheets data',
    icon: BarChart3,
    category: 'integration',
    subcategory: 'data',
    tags: ['google', 'sheets', 'data'],
    complexity: 'medium',
    estimatedTime: '2-3s'
  },
  {
    id: 'crm-hubspot',
    name: 'HubSpot CRM',
    description: 'Manage HubSpot contacts and deals',
    icon: Users,
    category: 'integration',
    subcategory: 'crm',
    tags: ['hubspot', 'crm', 'sales'],
    complexity: 'medium',
    estimatedTime: '2-4s'
  },

  // Data Nodes
  {
    id: 'data-transform',
    name: 'Data Transform',
    description: 'Transform and map data fields',
    icon: Code,
    category: 'data',
    tags: ['transform', 'map', 'data'],
    complexity: 'medium',
    estimatedTime: '0.1s'
  },
  {
    id: 'json-parse',
    name: 'JSON Parse',
    description: 'Parse JSON data',
    icon: FileText,
    category: 'data',
    tags: ['json', 'parse', 'data'],
    complexity: 'simple',
    estimatedTime: '0.1s'
  },
  {
    id: 'csv-parse',
    name: 'CSV Parse',
    description: 'Parse CSV data files',
    icon: BarChart3,
    category: 'data',
    tags: ['csv', 'parse', 'data'],
    complexity: 'simple',
    estimatedTime: '0.5s'
  }
]

interface NodePaletteProps {
  onNodeDrag: (nodeType: NodeType) => void
  selectedCategory?: string
}

export function NodePalette({ onNodeDrag, selectedCategory }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || 'all')

  const categories = [
    { id: 'all', name: 'All Nodes', icon: Workflow },
    { id: 'trigger', name: 'Triggers', icon: Zap },
    { id: 'ai', name: 'AI & ML', icon: Brain },
    { id: 'voice', name: 'Voice', icon: Mic },
    { id: 'action', name: 'Actions', icon: Target },
    { id: 'logic', name: 'Logic', icon: Filter },
    { id: 'integration', name: 'Integrations', icon: Globe },
    { id: 'data', name: 'Data', icon: Database }
  ]

  const filteredNodes = nodeTypes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = activeCategory === 'all' || node.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/json', JSON.stringify(nodeType))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Node Palette
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full">
          <TabsList className="grid grid-cols-4 w-full mb-4 mx-4">
            {categories.slice(0, 4).map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                <category.icon className="h-3 w-3 mr-1" />
                {category.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[calc(100%-120px)] px-4">
            <div className="space-y-1">
              {filteredNodes.map((node) => {
                const IconComponent = node.icon
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onClick={() => onNodeDrag(node)}
                    className="group p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        node.category === 'trigger' ? 'bg-blue-100 text-blue-600' :
                        node.category === 'ai' ? 'bg-purple-100 text-purple-600' :
                        node.category === 'voice' ? 'bg-green-100 text-green-600' :
                        node.category === 'action' ? 'bg-orange-100 text-orange-600' :
                        node.category === 'logic' ? 'bg-yellow-100 text-yellow-600' :
                        node.category === 'integration' ? 'bg-pink-100 text-pink-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {node.name}
                          </h4>
                          <div className="flex gap-1">
                            {node.isPremium && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                Pro
                              </Badge>
                            )}
                            {node.isNew && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {node.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              node.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                              node.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {node.complexity}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">
                            {node.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredNodes.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No nodes found matching "{searchTerm}"</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or category filter</p>
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default NodePalette