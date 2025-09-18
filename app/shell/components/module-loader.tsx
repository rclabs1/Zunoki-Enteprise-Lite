"use client"

import React, { Suspense, lazy, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Users,
  BarChart3,
  Settings,
  Bot
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiGet } from '@/lib/api-client'

// Lazy load all modules
const InsightsModule = lazy(() => import('../../modules/insights/index'))
const CampaignsModule = lazy(() => import('../../modules/campaigns/index'))
const AutomationModule = lazy(() => import('../../modules/automation/index'))
const PlatformsModule = lazy(() => import('../../modules/platforms/index'))
const SettingsModule = lazy(() => import('../../modules/settings/index'))
const AdHubModule = lazy(() => import('../../modules/ad-hub/index'))
const UnifiedOverview = lazy(() => import('../../overview/page'))
const ConversationView = lazy(() => import('../../../components/conversation-view'))
const MarketplacePage = lazy(() => import('../../marketplace/page'))
const AgentBuilderPage = lazy(() => import('../../agent-builder/page'))
const MayaIntelligenceModule = lazy(() => import('../../modules/maya-intelligence/index'))
const MessagingModule = lazy(() => import('../../modules/messaging/index'))

interface ModuleLoaderProps {
  currentModule: string | null
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading module...</p>
    </div>
  </div>
)

const WelcomeView = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [whatsappIntegration, setWhatsappIntegration] = useState<any>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)

  useEffect(() => {
    if (user) {
      checkWhatsAppIntegration()
    }
  }, [user])

  const checkWhatsAppIntegration = async () => {
    try {
      const data = await apiGet('/api/messaging/integrations')
      if (data.success && data.integrations && data.integrations.length > 0) {
        // Find WhatsApp integration or use first available
        const whatsappInteg = data.integrations.find((i: any) => i.platform === 'whatsapp')
        setWhatsappIntegration(whatsappInteg || data.integrations[0])
      }
    } catch (error) {
      console.error('Error checking messaging integrations:', error)
    } finally {
      setCheckingIntegration(false)
    }
  }

  const handleConnectMessaging = () => {
    router.push('/connect-messaging')
  }

  const handleViewConversations = () => {
    router.push('/conversation')
  }

  const handleGoToSettings = () => {
    router.push('/settings')
  }

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Welcome to Admolabs Agentic Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Your AI-powered multi-platform CRM and marketing intelligence platform. 
          Connect WhatsApp, Telegram, and more to manage customer conversations with AI agents.
        </p>
      </div>

      {/* Messaging Quick Setup Card */}
      {!checkingIntegration && (
        <Card className={`max-w-4xl mx-auto ${whatsappIntegration ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MessageCircle className={`h-8 w-8 ${whatsappIntegration ? 'text-green-600' : 'text-blue-600'}`} />
              {whatsappIntegration ? 'Messaging Connected!' : 'Get Started with Messaging'}
            </CardTitle>
            <CardDescription>
              {whatsappIntegration 
                ? `Connected: ${whatsappIntegration.platform?.toUpperCase() || 'Platform'} ${whatsappIntegration.provider ? `via ${whatsappIntegration.provider}` : ''} ${whatsappIntegration.config?.phoneNumber ? `• ${whatsappIntegration.config.phoneNumber}` : ''}`
                : 'Connect your messaging platforms to start receiving and managing customer conversations with AI-powered agents.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {whatsappIntegration ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Messages Ready</p>
                      <p className="text-sm text-green-700">Receiving customer messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">AI Agents Active</p>
                      <p className="text-sm text-blue-700">Auto-routing conversations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Analytics Ready</p>
                      <p className="text-sm text-purple-700">Tracking performance</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleViewConversations} className="bg-green-600 hover:bg-green-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Conversations
                  </Button>
                  <Button variant="outline" onClick={handleGoToSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">WhatsApp</h3>
                          <Badge variant="default" className="text-xs bg-green-600">Available</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Business messaging with Twilio & Meta APIs</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Easy 5-minute setup</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Reliable message delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Rich media support</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bot className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Telegram</h3>
                          <Badge variant="default" className="text-xs bg-blue-600">Available</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Bot messaging and channel management</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Bot automation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Group & channel support</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Inline keyboards</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">More Platforms</h3>
                          <Badge variant="default" className="text-xs bg-purple-600">Available</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Facebook, Instagram, Slack, Discord + YouTube, Gmail</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Multi-platform support</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Unified inbox</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Cross-platform analytics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleConnectMessaging} size="lg" className="bg-green-600 hover:bg-green-700">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Connect Messaging Platform
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Platform Features */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
          Complete Multi-Platform CRM
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* WhatsApp - Available */}
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">WhatsApp</h3>
                  <Badge variant="default" className="text-xs bg-green-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Business messaging with Twilio & Meta APIs
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Direct messaging</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Media support</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Business profiles</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telegram - Available */}
          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Telegram</h3>
                  <Badge variant="default" className="text-xs bg-blue-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Bot messaging and channel management
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Bot automation</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Group chats</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Inline keyboards</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facebook - Available */}
          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Facebook</h3>
                  <Badge variant="default" className="text-xs bg-blue-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Messenger and page messaging
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Page messaging</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Rich media</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Quick replies</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instagram - Available */}
          <Card className="hover:shadow-lg transition-shadow border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Settings className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Instagram</h3>
                  <Badge variant="default" className="text-xs bg-pink-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                DMs and comment notifications
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Direct messages</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Comment monitoring</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Story mentions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slack - Available */}
          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Slack</h3>
                  <Badge variant="default" className="text-xs bg-purple-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Team and customer support
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Channel messaging</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Slash commands</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Workflows</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord - Available */}
          <Card className="hover:shadow-lg transition-shadow border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Discord</h3>
                  <Badge variant="default" className="text-xs bg-indigo-600">Available</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Community engagement
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Server messaging</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Voice channels</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Rich embeds</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* YouTube - Coming Soon */}
          <Card className="hover:shadow-lg transition-shadow border-gray-200 opacity-75">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700">YouTube</h3>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Comment monitoring
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Comment alerts</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Like notifications</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gmail - Coming Soon */}
          <Card className="hover:shadow-lg transition-shadow border-gray-200 opacity-75">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-700">Gmail</h3>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Email customer support
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Email threads</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Auto-replies</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Labels & filters</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ModuleLoader({ currentModule }: ModuleLoaderProps) {
  console.log("🔍 ModuleLoader - Current module:", currentModule)
  const router = useRouter()
  
  const renderModule = () => {
    console.log("🔍 Rendering module:", currentModule)
    switch (currentModule) {
      case 'insights':
        return <InsightsModule />
      case 'campaigns':
        return <CampaignsModule />
      case 'automation':
        return <AutomationModule />
      case 'platforms':
      case 'messaging':
        return <MessagingModule />
      case 'ad-hub':
        return <AdHubModule />
      case 'settings':
        return <SettingsModule />
      case 'overview':
      case 'executive':
      case 'operational':
        return <UnifiedOverview />
      case 'conversations':
        return <ConversationView />
      case 'marketplace':
        return <MarketplacePage />
      case 'agent-builder':
        return <AgentBuilderPage />
      case 'maya-intelligence':
        return <MayaIntelligenceModule />
      default:
        return <WelcomeView />
    }
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        {renderModule()}
      </Suspense>
    </div>
  )
}