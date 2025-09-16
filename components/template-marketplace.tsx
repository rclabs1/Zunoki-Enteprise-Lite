"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Download, 
  Star, 
  Users, 
  Play,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  DollarSign,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Phone,
  Mic,
  Headphones,
  Globe,
  Mail,
  ShoppingCart,
  CreditCard,
  FileText,
  Settings,
  Code,
  Crown,
  TrendingUp,
  Award,
  CheckCircle,
  Copy,
  Share,
  Bookmark,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Sparkles,
  Cpu,
  Database,
  Cloud,
  Server,
  Smartphone,
  Monitor,
  Activity,
  PieChart,
  BarChart,
  LineChart
} from "lucide-react"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'voice' | 'sales' | 'support' | 'marketing' | 'ecommerce' | 'productivity' | 'ai' | 'analytics'
  subcategory?: string
  author: {
    id: string
    name: string
    avatar?: string
    isVerified: boolean
    company?: string
  }
  rating: number
  downloads: number
  likes: number
  views: number
  price: 'free' | 'premium'
  priceAmount?: number
  tags: string[]
  isOfficial: boolean
  isFeatured?: boolean
  isNew?: boolean
  isTrending?: boolean
  createdAt: string
  updatedAt: string
  version: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupTime: string
  nodes: number
  connectors: string[]
  preview: {
    images: string[]
    video?: string
    description: string
  }
  workflow: {
    nodes: any[]
    edges: any[]
    config: any
  }
  performance: {
    avgResponseTime: number
    successRate: number
    costPerExecution: number
  }
  requirements: {
    connectors: string[]
    subscriptions: string[]
    technicalLevel: 'basic' | 'intermediate' | 'advanced'
  }
}

const templates: WorkflowTemplate[] = [
  {
    id: 'voice-restaurant-booking',
    name: 'AI Restaurant Reservation Assistant',
    description: 'Voice-powered restaurant booking system with real-time availability checking and confirmation',
    category: 'voice',
    subcategory: 'hospitality',
    author: {
      id: 'zunoki-team',
      name: 'Zunoki Team',
      avatar: '/avatars/zunoki.png',
      isVerified: true,
      company: 'Zunoki'
    },
    rating: 4.9,
    downloads: 2340,
    likes: 156,
    views: 8920,
    price: 'free',
    tags: ['voice', 'restaurant', 'booking', 'calendar', 'hospitality'],
    isOfficial: true,
    isFeatured: true,
    isTrending: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    version: '2.1.0',
    complexity: 'intermediate',
    estimatedSetupTime: '20 minutes',
    nodes: 12,
    connectors: ['elevenlabs', 'deepgram', 'twilio', 'calendar', 'database'],
    preview: {
      images: ['/previews/restaurant-1.png', '/previews/restaurant-2.png'],
      video: '/previews/restaurant-demo.mp4',
      description: 'Complete voice assistant that handles restaurant reservations from initial call to confirmation email'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 1200,
      successRate: 96.5,
      costPerExecution: 0.08
    },
    requirements: {
      connectors: ['ElevenLabs Premium', 'Deepgram', 'Twilio Voice'],
      subscriptions: ['Calendar API', 'SMS Service'],
      technicalLevel: 'intermediate'
    }
  },
  {
    id: 'sales-lead-qualifier',
    name: 'AI Sales Lead Qualification Bot',
    description: 'Intelligent lead qualification system that scores prospects and books qualified demos',
    category: 'sales',
    subcategory: 'lead-generation',
    author: {
      id: 'sarah-wilson',
      name: 'Sarah Wilson',
      avatar: '/avatars/sarah.png',
      isVerified: true,
      company: 'SalesFlow AI'
    },
    rating: 4.8,
    downloads: 1890,
    likes: 134,
    views: 6750,
    price: 'premium',
    priceAmount: 29,
    tags: ['sales', 'lead-qualification', 'scoring', 'crm', 'automation'],
    isOfficial: false,
    isFeatured: true,
    isNew: false,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    version: '1.8.3',
    complexity: 'advanced',
    estimatedSetupTime: '45 minutes',
    nodes: 18,
    connectors: ['openai', 'hubspot', 'calendly', 'slack'],
    preview: {
      images: ['/previews/sales-1.png', '/previews/sales-2.png'],
      description: 'Advanced lead scoring with BANT qualification and automatic CRM updates'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 2100,
      successRate: 94.2,
      costPerExecution: 0.12
    },
    requirements: {
      connectors: ['OpenAI GPT-4', 'HubSpot CRM', 'Calendly'],
      subscriptions: ['CRM Pro Plan'],
      technicalLevel: 'advanced'
    }
  },
  {
    id: 'voice-customer-support',
    name: 'Multilingual Voice Support Agent',
    description: '24/7 voice support agent with 12 language support and human handoff capabilities',
    category: 'support',
    subcategory: 'customer-service',
    author: {
      id: 'alex-chen',
      name: 'Alex Chen',
      avatar: '/avatars/alex.png',
      isVerified: true,
      company: 'GlobalSupport Inc'
    },
    rating: 4.7,
    downloads: 3420,
    likes: 289,
    views: 12400,
    price: 'free',
    tags: ['voice', 'support', 'multilingual', 'handoff', '24/7'],
    isOfficial: false,
    isTrending: true,
    isNew: true,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-16',
    version: '1.2.0',
    complexity: 'intermediate',
    estimatedSetupTime: '30 minutes',
    nodes: 15,
    connectors: ['elevenlabs', 'whisper', 'translate', 'zendesk'],
    preview: {
      images: ['/previews/support-1.png', '/previews/support-2.png'],
      description: 'Handles common support queries in 12 languages with intelligent escalation'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 1800,
      successRate: 91.3,
      costPerExecution: 0.06
    },
    requirements: {
      connectors: ['ElevenLabs', 'OpenAI Whisper', 'Google Translate'],
      subscriptions: ['Support Desk'],
      technicalLevel: 'intermediate'
    }
  },
  {
    id: 'ecommerce-order-tracker',
    name: 'Smart Order Tracking Assistant',
    description: 'Automated order status updates and delivery notifications via voice and chat',
    category: 'ecommerce',
    subcategory: 'order-management',
    author: {
      id: 'mike-rodriguez',
      name: 'Mike Rodriguez',
      avatar: '/avatars/mike.png',
      isVerified: false,
      company: 'E-Commerce Solutions'
    },
    rating: 4.6,
    downloads: 1560,
    likes: 98,
    views: 4320,
    price: 'free',
    tags: ['ecommerce', 'orders', 'tracking', 'notifications', 'automation'],
    isOfficial: false,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14',
    version: '1.5.2',
    complexity: 'beginner',
    estimatedSetupTime: '15 minutes',
    nodes: 8,
    connectors: ['shopify', 'whatsapp', 'email', 'shipping'],
    preview: {
      images: ['/previews/ecommerce-1.png'],
      description: 'Automatically tracks orders and sends updates to customers'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 800,
      successRate: 98.7,
      costPerExecution: 0.02
    },
    requirements: {
      connectors: ['Shopify', 'WhatsApp Business', 'Email Service'],
      subscriptions: [],
      technicalLevel: 'basic'
    }
  },
  {
    id: 'voice-appointment-scheduler',
    name: 'Professional Appointment Scheduler',
    description: 'Voice-powered appointment booking for healthcare, legal, and professional services',
    category: 'voice',
    subcategory: 'scheduling',
    author: {
      id: 'zunoki-team',
      name: 'Zunoki Team',
      avatar: '/avatars/zunoki.png',
      isVerified: true,
      company: 'Zunoki'
    },
    rating: 4.8,
    downloads: 2890,
    likes: 201,
    views: 9870,
    price: 'premium',
    priceAmount: 49,
    tags: ['voice', 'appointments', 'scheduling', 'healthcare', 'professional'],
    isOfficial: true,
    isFeatured: true,
    createdAt: '2024-01-06',
    updatedAt: '2024-01-13',
    version: '2.3.1',
    complexity: 'advanced',
    estimatedSetupTime: '60 minutes',
    nodes: 22,
    connectors: ['elevenlabs', 'deepgram', 'calendar', 'sms', 'email'],
    preview: {
      images: ['/previews/appointment-1.png', '/previews/appointment-2.png'],
      video: '/previews/appointment-demo.mp4',
      description: 'Complete appointment management with conflict resolution and automated reminders'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 1500,
      successRate: 95.8,
      costPerExecution: 0.15
    },
    requirements: {
      connectors: ['ElevenLabs Premium', 'Deepgram Pro', 'Calendar API'],
      subscriptions: ['Professional Calendar', 'SMS Credits'],
      technicalLevel: 'advanced'
    }
  },
  {
    id: 'marketing-lead-nurture',
    name: 'AI Lead Nurturing Campaign',
    description: 'Personalized email and SMS nurturing sequences with behavioral triggers',
    category: 'marketing',
    subcategory: 'automation',
    author: {
      id: 'emma-davis',
      name: 'Emma Davis',
      avatar: '/avatars/emma.png',
      isVerified: true,
      company: 'MarketingAI Co'
    },
    rating: 4.5,
    downloads: 1240,
    likes: 87,
    views: 3650,
    price: 'premium',
    priceAmount: 39,
    tags: ['marketing', 'lead-nurturing', 'email', 'personalization', 'automation'],
    isOfficial: false,
    createdAt: '2024-01-09',
    updatedAt: '2024-01-11',
    version: '1.4.0',
    complexity: 'intermediate',
    estimatedSetupTime: '35 minutes',
    nodes: 14,
    connectors: ['mailchimp', 'twilio', 'analytics', 'crm'],
    preview: {
      images: ['/previews/marketing-1.png'],
      description: 'Smart nurturing based on lead behavior and engagement patterns'
    },
    workflow: {
      nodes: [],
      edges: [],
      config: {}
    },
    performance: {
      avgResponseTime: 1000,
      successRate: 92.4,
      costPerExecution: 0.05
    },
    requirements: {
      connectors: ['Mailchimp', 'Twilio SMS', 'Google Analytics'],
      subscriptions: ['Email Service'],
      technicalLevel: 'intermediate'
    }
  }
]

interface TemplateMarketplaceProps {
  onUse: (template: WorkflowTemplate) => void
  onPreview: (template: WorkflowTemplate) => void
}

export function TemplateMarketplace({ onUse, onPreview }: TemplateMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid3X3 },
    { id: 'voice', name: 'Voice Agents', icon: Mic },
    { id: 'sales', name: 'Sales', icon: Target },
    { id: 'support', name: 'Support', icon: Headphones },
    { id: 'marketing', name: 'Marketing', icon: BarChart3 },
    { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
    { id: 'productivity', name: 'Productivity', icon: Settings },
    { id: 'ai', name: 'AI & ML', icon: Cpu }
  ]

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'voice': return Mic
      case 'sales': return Target
      case 'support': return Headphones
      case 'marketing': return BarChart3
      case 'ecommerce': return ShoppingCart
      case 'productivity': return Settings
      case 'ai': return Cpu
      default: return FileText
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Marketplace</h2>
          <p className="text-gray-600">Ready-to-use workflow templates from the community</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{templates.length} templates</Badge>
          <Badge variant="secondary">{templates.filter(t => t.isFeatured).length} featured</Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
          </select>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <category.icon className="h-3 w-3 mr-1" />
              {category.name.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Featured Templates */}
      {selectedCategory === 'all' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Featured Templates
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.filter(t => t.isFeatured).slice(0, 2).map((template) => {
              const CategoryIcon = getCategoryIcon(template.category)
              return (
                <Card key={template.id} className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={template.author.avatar} />
                              <AvatarFallback>{template.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{template.author.name}</span>
                            {template.author.isVerified && (
                              <CheckCircle className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <Crown className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{template.downloads}</span>
                        </div>
                        <Badge className={getComplexityColor(template.complexity)}>
                          {template.complexity}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPreview(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => onUse(template)}>
                          <Download className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Template Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredTemplates.map((template) => {
          const CategoryIcon = getCategoryIcon(template.category)
          
          if (viewMode === 'list') {
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      template.category === 'voice' ? 'bg-green-100 text-green-600' :
                      template.category === 'sales' ? 'bg-blue-100 text-blue-600' :
                      template.category === 'support' ? 'bg-purple-100 text-purple-600' :
                      template.category === 'marketing' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={template.author.avatar} />
                              <AvatarFallback>{template.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{template.author.name}</span>
                            {template.author.isVerified && (
                              <CheckCircle className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {template.isOfficial && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Official
                            </Badge>
                          )}
                          {template.isTrending && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              Trending
                            </Badge>
                          )}
                          {template.isNew && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{template.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{template.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{template.downloads}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.estimatedSetupTime}</span>
                          </div>
                          <Badge className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                          {template.price === 'premium' && (
                            <Badge variant="outline" className="text-green-600">
                              ${template.priceAmount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => onPreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm" onClick={() => onUse(template)}>
                            <Download className="h-4 w-4 mr-2" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      template.category === 'voice' ? 'bg-green-100 text-green-600' :
                      template.category === 'sales' ? 'bg-blue-100 text-blue-600' :
                      template.category === 'support' ? 'bg-purple-100 text-purple-600' :
                      template.category === 'marketing' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Avatar className="h-3 w-3">
                          <AvatarImage src={template.author.avatar} />
                          <AvatarFallback>{template.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{template.author.name}</span>
                        {template.author.isVerified && (
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {template.isOfficial && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Official
                      </Badge>
                    )}
                    {template.isTrending && (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                        Trending
                      </Badge>
                    )}
                    {template.isNew && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{template.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{template.estimatedSetupTime}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getComplexityColor(template.complexity)}>
                    {template.complexity}
                  </Badge>
                  {template.price === 'premium' ? (
                    <Badge variant="outline" className="text-green-600">
                      ${template.priceAmount}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">
                      Free
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onPreview(template)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => onUse(template)}>
                    <Download className="h-4 w-4 mr-2" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  )
}

export default TemplateMarketplace