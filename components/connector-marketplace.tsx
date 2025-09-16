"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search, 
  Download, 
  Star, 
  Users, 
  CheckCircle,
  Globe,
  MessageSquare,
  Database,
  Mail,
  Calendar,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Phone,
  Mic,
  Video,
  Camera,
  Music,
  FileText,
  Image,
  Zap,
  Code,
  Settings,
  Cloud,
  Server,
  Smartphone,
  Monitor,
  Headphones,
  Gamepad2,
  Gift,
  Tag,
  DollarSign,
  TrendingUp,
  PieChart,
  Activity,
  Bell,
  Lock,
  Key,
  Shield,
  Heart,
  Bookmark,
  Share,
  Target,
  Filter,
  Upload,
  Cpu,
  Network,
  HardDrive,
  Wifi,
  Radio,
  Satellite,
  Router,
  Tablet,
  Watch,
  Speaker,
  Tv,
  Projector,
  Printer,
  Scanner,
  Webcam
} from "lucide-react"

export interface Connector {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  category: 'messaging' | 'voice' | 'ai' | 'crm' | 'ecommerce' | 'productivity' | 'analytics' | 'social' | 'payment' | 'storage'
  developer: string
  rating: number
  downloads: number
  price: 'free' | 'premium' | 'enterprise'
  monthlyPrice?: number
  features: string[]
  tags: string[]
  isOfficial: boolean
  isNew?: boolean
  isTrending?: boolean
  lastUpdated: string
  version: string
  supportedRegions: string[]
  documentation: string
  setup: {
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: string
    requiredCredentials: string[]
  }
}

const connectors: Connector[] = [
  // Messaging Connectors
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'Send and receive WhatsApp messages with rich media support',
    icon: MessageSquare,
    category: 'messaging',
    developer: 'Zunoki Official',
    rating: 4.9,
    downloads: 15420,
    price: 'free',
    features: ['Rich Media', 'Message Templates', 'Group Messaging', 'Webhook Support'],
    tags: ['whatsapp', 'messaging', 'business'],
    isOfficial: true,
    isTrending: true,
    lastUpdated: '2024-01-15',
    version: '2.1.0',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/whatsapp',
    setup: {
      difficulty: 'easy',
      estimatedTime: '5 minutes',
      requiredCredentials: ['WhatsApp Business API Token', 'Phone Number ID']
    }
  },
  {
    id: 'slack-advanced',
    name: 'Slack Advanced',
    description: 'Full Slack integration with channels, DMs, and app interactions',
    icon: MessageSquare,
    category: 'messaging',
    developer: 'Zunoki Official',
    rating: 4.8,
    downloads: 8930,
    price: 'free',
    features: ['Channel Management', 'Direct Messages', 'File Sharing', 'Slash Commands'],
    tags: ['slack', 'team', 'collaboration'],
    isOfficial: true,
    lastUpdated: '2024-01-12',
    version: '1.8.2',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/slack',
    setup: {
      difficulty: 'medium',
      estimatedTime: '10 minutes',
      requiredCredentials: ['Slack Bot Token', 'App ID']
    }
  },
  {
    id: 'telegram-bot',
    name: 'Telegram Bot API',
    description: 'Create powerful Telegram bots with inline keyboards and webhooks',
    icon: MessageSquare,
    category: 'messaging',
    developer: 'Community',
    rating: 4.7,
    downloads: 6540,
    price: 'free',
    features: ['Inline Keyboards', 'Group Support', 'File Transfer', 'Webhook Events'],
    tags: ['telegram', 'bot', 'messaging'],
    isOfficial: false,
    lastUpdated: '2024-01-10',
    version: '1.5.1',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/telegram',
    setup: {
      difficulty: 'easy',
      estimatedTime: '3 minutes',
      requiredCredentials: ['Bot Token']
    }
  },

  // Voice Connectors
  {
    id: 'elevenlabs-premium',
    name: 'ElevenLabs Premium',
    description: 'Ultra-realistic voice synthesis with emotion and custom voices',
    icon: Mic,
    category: 'voice',
    developer: 'ElevenLabs',
    rating: 4.9,
    downloads: 12340,
    price: 'premium',
    monthlyPrice: 22,
    features: ['Custom Voices', 'Emotion Control', 'Voice Cloning', '29 Languages'],
    tags: ['tts', 'voice', 'ai', 'premium'],
    isOfficial: true,
    isNew: true,
    lastUpdated: '2024-01-16',
    version: '3.2.0',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/elevenlabs',
    setup: {
      difficulty: 'easy',
      estimatedTime: '2 minutes',
      requiredCredentials: ['ElevenLabs API Key']
    }
  },
  {
    id: 'deepgram-realtime',
    name: 'Deepgram Real-time',
    description: 'Real-time speech recognition with ultra-low latency',
    icon: Headphones,
    category: 'voice',
    developer: 'Deepgram',
    rating: 4.8,
    downloads: 9870,
    price: 'premium',
    monthlyPrice: 15,
    features: ['Real-time STT', 'Multiple Languages', 'Punctuation', 'Speaker Diarization'],
    tags: ['stt', 'realtime', 'speech'],
    isOfficial: true,
    isTrending: true,
    lastUpdated: '2024-01-14',
    version: '2.5.0',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/deepgram',
    setup: {
      difficulty: 'medium',
      estimatedTime: '8 minutes',
      requiredCredentials: ['Deepgram API Key', 'Project ID']
    }
  },
  {
    id: 'twilio-voice',
    name: 'Twilio Voice',
    description: 'Make and receive phone calls with programmable voice',
    icon: Phone,
    category: 'voice',
    developer: 'Twilio',
    rating: 4.6,
    downloads: 7650,
    price: 'premium',
    monthlyPrice: 0, // Pay per use
    features: ['Inbound/Outbound Calls', 'Call Recording', 'Conference Calls', 'SIP Support'],
    tags: ['phone', 'calls', 'telephony'],
    isOfficial: true,
    lastUpdated: '2024-01-11',
    version: '1.9.3',
    supportedRegions: ['US', 'EU', 'APAC'],
    documentation: 'https://docs.zunoki.com/twilio',
    setup: {
      difficulty: 'hard',
      estimatedTime: '20 minutes',
      requiredCredentials: ['Account SID', 'Auth Token', 'Phone Number']
    }
  },

  // AI Connectors
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    description: 'Advanced language model for conversation and text generation',
    icon: Cpu,
    category: 'ai',
    developer: 'OpenAI',
    rating: 4.9,
    downloads: 25600,
    price: 'premium',
    monthlyPrice: 0, // Pay per token
    features: ['GPT-4 Turbo', 'Function Calling', 'JSON Mode', 'Vision Support'],
    tags: ['ai', 'llm', 'chat', 'gpt'],
    isOfficial: true,
    isTrending: true,
    lastUpdated: '2024-01-16',
    version: '4.0.1',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/openai',
    setup: {
      difficulty: 'easy',
      estimatedTime: '3 minutes',
      requiredCredentials: ['OpenAI API Key']
    }
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    description: 'Helpful, harmless, and honest AI assistant',
    icon: Cpu,
    category: 'ai',
    developer: 'Anthropic',
    rating: 4.8,
    downloads: 18750,
    price: 'premium',
    monthlyPrice: 0, // Pay per token
    features: ['Claude 3', 'Long Context', 'Tool Use', 'Constitutional AI'],
    tags: ['ai', 'claude', 'anthropic'],
    isOfficial: true,
    isNew: true,
    lastUpdated: '2024-01-15',
    version: '3.0.2',
    supportedRegions: ['US', 'EU'],
    documentation: 'https://docs.zunoki.com/claude',
    setup: {
      difficulty: 'easy',
      estimatedTime: '2 minutes',
      requiredCredentials: ['Anthropic API Key']
    }
  },

  // CRM Connectors
  {
    id: 'hubspot-crm',
    name: 'HubSpot CRM',
    description: 'Manage contacts, deals, and sales pipeline',
    icon: Users,
    category: 'crm',
    developer: 'HubSpot',
    rating: 4.7,
    downloads: 11230,
    price: 'free',
    features: ['Contact Management', 'Deal Tracking', 'Email Integration', 'Reporting'],
    tags: ['crm', 'sales', 'marketing'],
    isOfficial: true,
    lastUpdated: '2024-01-13',
    version: '2.3.1',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/hubspot',
    setup: {
      difficulty: 'medium',
      estimatedTime: '15 minutes',
      requiredCredentials: ['Private App Token', 'Portal ID']
    }
  },
  {
    id: 'salesforce-api',
    name: 'Salesforce API',
    description: 'Enterprise CRM integration with advanced features',
    icon: Database,
    category: 'crm',
    developer: 'Salesforce',
    rating: 4.5,
    downloads: 8940,
    price: 'enterprise',
    monthlyPrice: 99,
    features: ['Advanced Objects', 'Custom Fields', 'Apex Integration', 'Lightning Platform'],
    tags: ['salesforce', 'enterprise', 'crm'],
    isOfficial: true,
    lastUpdated: '2024-01-09',
    version: '1.7.4',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/salesforce',
    setup: {
      difficulty: 'hard',
      estimatedTime: '45 minutes',
      requiredCredentials: ['Connected App', 'OAuth Tokens', 'Instance URL']
    }
  },

  // Analytics Connectors
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Track website and app analytics data',
    icon: BarChart3,
    category: 'analytics',
    developer: 'Google',
    rating: 4.6,
    downloads: 14320,
    price: 'free',
    features: ['Event Tracking', 'Custom Dimensions', 'Real-time Data', 'Audience Insights'],
    tags: ['analytics', 'google', 'tracking'],
    isOfficial: true,
    lastUpdated: '2024-01-12',
    version: '4.1.2',
    supportedRegions: ['Global'],
    documentation: 'https://docs.zunoki.com/ga4',
    setup: {
      difficulty: 'medium',
      estimatedTime: '12 minutes',
      requiredCredentials: ['Service Account JSON', 'Property ID']
    }
  }
]

interface ConnectorMarketplaceProps {
  onInstall: (connector: Connector) => void
  installedConnectors?: string[]
}

export function ConnectorMarketplace({ onInstall, installedConnectors = [] }: ConnectorMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)

  const categories = [
    { id: 'all', name: 'All', icon: Globe },
    { id: 'messaging', name: 'Messaging', icon: MessageSquare },
    { id: 'voice', name: 'Voice', icon: Mic },
    { id: 'ai', name: 'AI & ML', icon: Cpu },
    { id: 'crm', name: 'CRM', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'productivity', name: 'Productivity', icon: Settings }
  ]

  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const isInstalled = (connectorId: string) => installedConnectors.includes(connectorId)

  const getPriceDisplay = (connector: Connector) => {
    if (connector.price === 'free') return 'Free'
    if (connector.price === 'premium' && connector.monthlyPrice === 0) return 'Pay per use'
    if (connector.price === 'premium') return `$${connector.monthlyPrice}/mo`
    if (connector.price === 'enterprise') return `$${connector.monthlyPrice}/mo`
    return 'Contact Sales'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Connector Marketplace</h2>
          <p className="text-gray-600">Extend your workflows with powerful integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{connectors.length} connectors</Badge>
          <Badge variant="secondary">{installedConnectors.length} installed</Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search connectors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                <category.icon className="h-3 w-3 mr-1" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConnectors.map((connector) => {
          const IconComponent = connector.icon
          const installed = isInstalled(connector.id)
          
          return (
            <Card key={connector.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      connector.category === 'messaging' ? 'bg-blue-100 text-blue-600' :
                      connector.category === 'voice' ? 'bg-green-100 text-green-600' :
                      connector.category === 'ai' ? 'bg-purple-100 text-purple-600' :
                      connector.category === 'crm' ? 'bg-orange-100 text-orange-600' :
                      connector.category === 'analytics' ? 'bg-pink-100 text-pink-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{connector.name}</h3>
                      <p className="text-xs text-gray-600">{connector.developer}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {connector.isOfficial && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Official
                      </Badge>
                    )}
                    {connector.isNew && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        New
                      </Badge>
                    )}
                    {connector.isTrending && (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                        Trending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {connector.description}
                </p>
                
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{connector.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{connector.downloads.toLocaleString()}</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    {getPriceDisplay(connector)}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {connector.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {connector.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{connector.features.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedConnector(connector)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6" />
                          {connector.name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      {selectedConnector && (
                        <div className="space-y-6">
                          <p className="text-gray-700">{selectedConnector.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Features</h4>
                              <ul className="space-y-1">
                                {selectedConnector.features.map((feature) => (
                                  <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Setup Requirements</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Difficulty:</span>
                                  <Badge variant={
                                    selectedConnector.setup.difficulty === 'easy' ? 'secondary' :
                                    selectedConnector.setup.difficulty === 'medium' ? 'outline' : 'destructive'
                                  }>
                                    {selectedConnector.setup.difficulty}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Setup Time:</span>
                                  <span className="text-gray-600">{selectedConnector.setup.estimatedTime}</span>
                                </div>
                                <div>
                                  <span>Required:</span>
                                  <ul className="mt-1 space-y-1">
                                    {selectedConnector.setup.requiredCredentials.map((cred) => (
                                      <li key={cred} className="text-xs text-gray-600 ml-4">• {cred}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => onInstall(selectedConnector)}
                              disabled={isInstalled(selectedConnector.id)}
                              className="flex-1"
                            >
                              {isInstalled(selectedConnector.id) ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Installed
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Install
                                </>
                              )}
                            </Button>
                            <Button variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Docs
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    onClick={() => onInstall(connector)}
                    disabled={installed}
                    size="sm"
                    className={installed ? "bg-green-600" : ""}
                  >
                    {installed ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Install
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredConnectors.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connectors found</h3>
          <p className="text-gray-600">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  )
}

export default ConnectorMarketplace