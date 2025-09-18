'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import {
  MessageCircle,
  Mail,
  Phone,
  BarChart3,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  ExternalLink,
  Play,
  Volume2,
  Settings,
  AlertCircle,
  X,
  Send
} from 'lucide-react'
import { SetupIntegrationBridge, type ConnectionStatus, type WhatsAppProvider } from '@/lib/services/setup-integration-bridge'
import EnhancedIntegrationCard from '@/components/enhanced-integration-card'
import { fetchUserIntegrations, handleConnectAccount, handleSwitchAccount, handleDisconnectAccount, type IntegrationConnection } from '@/lib/integration-helpers'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Import existing voice services
const getTTSService = async () => {
  if (typeof window === 'undefined') return null
  const { ttsService } = await import('@/lib/region-aware-tts-service')
  return ttsService
}

// Save voice preferences to user profile
const saveVoicePreferencesToDB = async (userId: string, preferences: any) => {
  try {
    const response = await fetch('/api/user/voice-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        voicePreferences: preferences
      })
    })
    return response.ok
  } catch (error) {
    console.error('Failed to save voice preferences:', error)
    return false
  }
}

// Load voice preferences from user profile
const loadVoicePreferencesFromDB = async (userId: string) => {
  try {
    const response = await fetch(`/api/user/voice-preferences?userId=${userId}`)
    if (response.ok) {
      const data = await response.json()
      return data.voicePreferences || null
    }
  } catch (error) {
    console.error('Failed to load voice preferences:', error)
  }
  return null
}

// Map setup page provider IDs to match platforms page API format
const mapProviderToApiFormat = (providerId: string): string => {
  const mapping: Record<string, string> = {
    'twilio-sandbox': 'twilio_sandbox',
    'twilio-production': 'twilio', 
    'meta-business': 'meta',
    'meta-sandbox': 'meta_sandbox'
  }
  return mapping[providerId] || providerId
}

interface PlatformIntegration {
  key: string
  name: string
  description: string
  icon: React.ElementType
  status: 'not_connected' | 'connecting' | 'connected' | 'error'
  category: 'communication' | 'analytics' | 'advertising'
  priority: 'high' | 'medium' | 'low'
  setupUrl?: string
  isOptional?: boolean
  features: string[]
  accountInfo?: {
    id?: string
    name?: string
    email?: string
    phoneNumber?: string
  }
  provider?: string
  error?: string
}

const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    key: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect your WhatsApp Business account for customer messaging',
    icon: MessageCircle,
    status: 'not_connected',
    category: 'communication',
    priority: 'high',
    setupUrl: '/integrations/whatsapp/setup',
    features: ['Auto-reply', 'Media support', 'Templates', 'Bulk messaging']
  },
  {
    key: 'gmail',
    name: 'Gmail',
    description: 'Integrate Gmail for email communication and forwarding',
    icon: Mail,
    status: 'not_connected',
    category: 'communication',
    priority: 'high',
    setupUrl: '/integrations/gmail/setup',
    features: ['Email forwarding', 'Smart replies', 'Thread management']
  },
  {
    key: 'telegram',
    name: 'Telegram',
    description: 'Connect your Telegram bot for messaging',
    icon: Phone,
    status: 'not_connected',
    category: 'communication',
    priority: 'medium',
    setupUrl: '/integrations/telegram/setup',
    features: ['Bot integration', 'Group management', 'File sharing']
  },
  {
    key: 'google-ads',
    name: 'Google Ads',
    description: 'Sync your Google Ads campaigns for performance insights',
    icon: BarChart3,
    status: 'not_connected',
    category: 'advertising',
    priority: 'high',
    setupUrl: '/integrations/google-ads/setup',
    features: ['Campaign analytics', 'Performance tracking', 'Optimization tips']
  },
  {
    key: 'google-analytics',
    name: 'Google Analytics',
    description: 'Connect Google Analytics for website insights',
    icon: BarChart3,
    status: 'not_connected',
    category: 'analytics',
    priority: 'medium',
    setupUrl: '/integrations/google-analytics/setup',
    isOptional: true,
    features: ['Website analytics', 'User behavior', 'Conversion tracking']
  },
  {
    key: 'mixpanel',
    name: 'Mixpanel',
    description: 'Advanced product analytics and user insights',
    icon: Zap,
    status: 'not_connected',
    category: 'analytics',
    priority: 'low',
    setupUrl: '/integrations/mixpanel/setup',
    isOptional: true,
    features: ['Event tracking', 'User segmentation', 'Funnel analysis']
  },
  {
    key: 'google-shopping',
    name: 'Google Shopping',
    description: 'Merchant Center performance and product insights',
    icon: BarChart3,
    status: 'not_connected',
    category: 'advertising',
    priority: 'medium',
    setupUrl: '/integrations/google-shopping/setup',
    isOptional: true,
    features: ['E-commerce metrics', 'Product performance', 'Shopping ads']
  },
  {
    key: 'google-search-console',
    name: 'Google Search Console',
    description: 'SEO performance and search analytics',
    icon: BarChart3,
    status: 'not_connected',
    category: 'analytics',
    priority: 'medium',
    setupUrl: '/integrations/google-search-console/setup',
    isOptional: true,
    features: ['SEO metrics', 'Search performance', 'PPC correlation']
  },
  {
    key: 'youtube-ads',
    name: 'YouTube Ads',
    description: 'Video advertising performance and reach',
    icon: BarChart3,
    status: 'not_connected',
    category: 'advertising',
    priority: 'medium',
    setupUrl: '/integrations/youtube-ads/setup',
    isOptional: true,
    features: ['Video ads', 'Brand awareness', 'YouTube channels']
  },
  {
    key: 'google-my-business',
    name: 'Google My Business',
    description: 'Local business insights and performance',
    icon: BarChart3,
    status: 'not_connected',
    category: 'analytics',
    priority: 'medium',
    setupUrl: '/integrations/google-my-business/setup',
    isOptional: true,
    features: ['Local SEO', 'Business metrics', 'Customer reviews']
  }
]

export default function PlatformSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState(PLATFORM_INTEGRATIONS)
  const [enhancedIntegrations, setEnhancedIntegrations] = useState<IntegrationConnection[]>([])
  const [currentSetup, setCurrentSetup] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [whatsappModal, setWhatsappModal] = useState(false)
  const [selectedWhatsappProvider, setSelectedWhatsappProvider] = useState<WhatsAppProvider | null>(null)
  const [connectionConfig, setConnectionConfig] = useState<Record<string, any>>({})
  const [configModal, setConfigModal] = useState<string | null>(null)
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'female-professional',
    accent: 'us-english', 
    personality: 'professional'
  })
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [voicePreferencesSaved, setVoicePreferencesSaved] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/signup')
      return
    }

    // Check for OAuth success/error parameters
    const urlParams = new URLSearchParams(window.location.search)
    const successParam = urlParams.get('success')
    const successPlatforms = [
      'google_ads_connected',
      'google_shopping_connected',
      'google_search_console_connected',
      'youtube_ads_connected',
      'google_my_business_connected'
    ]
    
    if (successParam && successPlatforms.includes(successParam)) {
      console.log(`✅ ${successParam.replace('_connected', '').replace('_', ' ')} connected successfully from OAuth callback`)
      // Show success message or update UI
    }

    // Check if setup has already been completed/skipped
    const setupStatus = localStorage.getItem('setupStatus')
    console.log('🔧 Setup page - Current setup status:', setupStatus)
    
    // Filter platforms based on user's plan and load connection statuses
    filterPlatformsByPlan()
    loadConnectionStatuses()
    loadVoicePreferences()
  }, [user, router])

  // Load voice preferences when component mounts
  const loadVoicePreferences = async () => {
    if (!user?.uid) return
    
    const savedPreferences = await loadVoicePreferencesFromDB(user.uid)
    if (savedPreferences) {
      setVoiceSettings(savedPreferences)
    }
  }

  // Save voice preferences when they change
  const handleVoiceSettingsChange = async (newSettings: typeof voiceSettings) => {
    setVoiceSettings(newSettings)
    
    if (user?.uid) {
      const success = await saveVoicePreferencesToDB(user.uid, newSettings)
      if (success) {
        setVoicePreferencesSaved(true)
        setTimeout(() => setVoicePreferencesSaved(false), 2000)
      }
    }
  }

  const filterPlatformsByPlan = async () => {
    if (!user) return

    try {
      // Get user's subscription plan
      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const { subscription } = await response.json()
        const planKey = subscription?.plan_key || 'starter' // Default to starter
        
        // Filter platforms based on plan
        const filteredPlatforms = PLATFORM_INTEGRATIONS.filter(platform => {
          switch (planKey) {
            case 'starter':
              // Starter: Only messaging platforms
              return ['whatsapp', 'telegram', 'gmail'].includes(platform.key)
              
            case 'business':
              // Business: Messaging + Advertising + Analytics
              return ['whatsapp', 'telegram', 'gmail', 'google-ads', 'google-analytics', 'google-shopping', 'google-search-console', 'youtube-ads', 'google-my-business', 'mixpanel'].includes(platform.key)
              
            case 'enterprise':
              // Enterprise: All platforms
              return true
              
            default:
              return ['whatsapp', 'telegram', 'gmail'].includes(platform.key) // Fallback to starter
          }
        })

        console.log(`✅ Showing ${filteredPlatforms.length} platforms for ${planKey} plan`)
        setIntegrations(filteredPlatforms)
      } else {
        console.warn('Could not fetch subscription, showing starter platforms')
        // Fallback to starter plan platforms
        const starterPlatforms = PLATFORM_INTEGRATIONS.filter(platform => 
          ['whatsapp', 'telegram', 'gmail'].includes(platform.key)
        )
        setIntegrations(starterPlatforms)
      }
    } catch (error) {
      console.error('Error filtering platforms by plan:', error)
      // Fallback to starter platforms
      const starterPlatforms = PLATFORM_INTEGRATIONS.filter(platform => 
        ['whatsapp', 'telegram', 'gmail'].includes(platform.key)
      )
      setIntegrations(starterPlatforms)
    }
  }

  const loadUserPlatforms = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Get platforms user paid for based on their subscription plan
      const availablePlatforms = await SetupIntegrationBridge.getAvailablePlatforms(user.uid)
      
      if (availablePlatforms.length === 0) {
        console.warn('No platforms found for user - check subscription')
        setIsLoading(false)
        return
      }

      // Set platforms user paid for
      setIntegrations(availablePlatforms)
      
      // Now load their connection statuses
      await loadConnectionStatuses()
      
    } catch (error) {
      console.error('Error loading user platforms:', error)
      setIsLoading(false)
    }
  }

  const loadConnectionStatuses = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Load enhanced Google integration data
      const enhancedData = await fetchUserIntegrations(user.uid)
      setEnhancedIntegrations(enhancedData)
      
      const response = await fetch('/api/onboarding/integrations/status', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const { statuses }: { statuses: ConnectionStatus[] } = await response.json()
        
        // Update integrations with real status
        setIntegrations(prev => prev.map(integration => {
          const status = statuses.find(s => s.platform === integration.key)
          
          // Also check if this platform has an enhanced connection
          const enhancedConn = enhancedData.find(conn => 
            (integration.key === 'google-analytics' && conn.platform === 'google_analytics') ||
            (integration.key === 'google-ads' && conn.platform === 'google_ads')
          )
          
          console.log(`🚨 SETUP DEBUG ${integration.key} - enhancedConn:`, enhancedConn ? {platform: enhancedConn.platform, isConnected: enhancedConn.isConnected} : 'undefined')
          
          if (status) {
            return {
              ...integration,
              status: status.status,
              provider: status.provider,
              accountInfo: status.accountInfo,
              error: status.error
            }
          } else if (enhancedConn && enhancedConn.isConnected) {
            // Mark as connected if enhanced connection exists
            return {
              ...integration,
              status: 'connected'
            }
          }
          return integration
        }))
      } else {
        console.error('Failed to load connection statuses')
      }
    } catch (error) {
      console.error('Error loading connection statuses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalCount = integrations.length
  const progress = Math.round((connectedCount / totalCount) * 100)
  const essentialConnected = integrations.filter(i => i.priority === 'high' && i.status === 'connected').length
  const essentialTotal = integrations.filter(i => i.priority === 'high').length

  const handleConnect = async (integration: PlatformIntegration) => {
    if (!user) return

    console.log('🔗 Connecting platform:', integration.key, 'using existing APIs')

    // Ad Hub platforms (Google Ads, Mixpanel)
    if (integration.key === 'google-ads') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/google-ads?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to Google Ads OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'google-analytics') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/google-analytics?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to Google Analytics OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'google-shopping') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/google-shopping?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to Google Shopping OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'google-search-console') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/google-search-console?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to Google Search Console OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'youtube-ads') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/youtube-ads?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to YouTube Ads OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'google-my-business') {
      // Use Ad Hub's OAuth flow with setup source
      const oauthUrl = `/api/auth/google-my-business?userId=${user.uid}&source=setup`
      console.log('🚀 Redirecting to Google My Business OAuth (Ad Hub method):', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    if (integration.key === 'mixpanel') {
      // Use Ad Hub's API key method
      setConfigModal(integration.key)
      return
    }

    // Platform/Messaging platforms (WhatsApp, Telegram, Gmail)
    if (integration.key === 'whatsapp') {
      // Use Platform's messaging integration method
      setWhatsappModal(true)
      return
    }

    if (integration.key === 'telegram') {
      // Use Platform's messaging integration method
      setConfigModal(integration.key)
      return
    }

    if (integration.key === 'gmail') {
      // Use Platform's messaging integration method
      setConfigModal(integration.key)
      return
    }

    console.warn('No connection method defined for platform:', integration.key)
  }

  const handleWhatsappConnect = async (provider: WhatsAppProvider, config: Record<string, any>) => {
    if (!user) return

    setCurrentSetup('whatsapp')
    setWhatsappModal(false)
    
    setIntegrations(prev => 
      prev.map(i => 
        i.key === 'whatsapp' 
          ? { ...i, status: 'connecting' }
          : i
      )
    )

    try {
      // Use the same API endpoint as the platforms page
      const response = await fetch('/api/messaging/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          platform: 'whatsapp',
          provider: mapProviderToApiFormat(provider.id),
          name: `WhatsApp (${provider.name})`,
          config: config
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setIntegrations(prev => 
          prev.map(i => 
            i.key === 'whatsapp' 
              ? { ...i, status: 'connected', provider: provider.name }
              : i
          )
        )
      } else {
        setIntegrations(prev => 
          prev.map(i => 
            i.key === 'whatsapp' 
              ? { ...i, status: 'error', error: result.error }
              : i
          )
        )
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error)
      setIntegrations(prev => 
        prev.map(i => 
          i.key === 'whatsapp' 
            ? { ...i, status: 'error', error: 'Connection failed' }
            : i
        )
      )
    } finally {
      setCurrentSetup(null)
      setConnectionConfig({})
    }
  }

  const handleOAuthConnection = async (integration: PlatformIntegration) => {
    if (!user) return

    setCurrentSetup(integration.key)
    setIntegrations(prev => 
      prev.map(i => 
        i.key === integration.key 
          ? { ...i, status: 'connecting' }
          : i
      )
    )

    try {
      const response = await fetch('/api/onboarding/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          platform: integration.key
        })
      })

      const result = await response.json()
      
      if (result.success && result.authUrl) {
        // Open OAuth window - use absolute URL and direct redirect for popup blocker bypass
        const absoluteAuthUrl = result.authUrl.startsWith('http') 
          ? result.authUrl 
          : `${window.location.origin}${result.authUrl}`;
          
        console.log('🚀 Opening OAuth popup:', absoluteAuthUrl);
        
        // Direct redirect method (more reliable than popup)
        window.location.href = absoluteAuthUrl;
        return; // Exit early, callback will handle redirect back
        
        // Listen for OAuth completion
        const checkAuth = setInterval(async () => {
          try {
            const statusResponse = await fetch('/api/onboarding/integrations/status', {
              headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`
              }
            })
            
            if (statusResponse.ok) {
              const { statuses } = await statusResponse.json()
              const platformStatus = statuses.find((s: ConnectionStatus) => s.platform === integration.key)
              
              if (platformStatus?.status === 'connected') {
                clearInterval(checkAuth)
                await loadConnectionStatuses()
              }
            }
          } catch (error) {
            console.error('Error checking auth status:', error)
          }
        }, 2000)
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkAuth)
          setCurrentSetup(null)
          setIntegrations(prev => 
            prev.map(i => 
              i.key === integration.key 
                ? { ...i, status: 'error', error: 'Authentication timeout' }
                : i
            )
          )
        }, 300000)
      } else {
        setIntegrations(prev => 
          prev.map(i => 
            i.key === integration.key 
              ? { ...i, status: 'error', error: result.error }
              : i
          )
        )
        setCurrentSetup(null)
      }
    } catch (error) {
      console.error('Error starting OAuth:', error)
      setIntegrations(prev => 
        prev.map(i => 
          i.key === integration.key 
            ? { ...i, status: 'error', error: 'OAuth initialization failed' }
            : i
        )
      )
      setCurrentSetup(null)
    }
  }

  const handleDirectConnection = async (integration: PlatformIntegration) => {
    if (!user) return

    setCurrentSetup(integration.key)
    setIntegrations(prev => 
      prev.map(i => 
        i.key === integration.key 
          ? { ...i, status: 'connecting' }
          : i
      )
    )

    try {
      let response: Response
      
      // Use the same API endpoints as Ad Hub
      if (integration.key === 'mixpanel') {
        // Use Ad Hub's Mixpanel validation endpoint
        const idToken = await user.getIdToken()
        response = await fetch('/api/mixpanel-proxy/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_token: connectionConfig.projectToken || connectionConfig.apiKey,
            project_id: connectionConfig.projectId,
            platform: 'mixpanel'
          }),
        })
      } else {
        // Fallback for other platforms (should not be reached for current platforms)
        response = await fetch('/api/onboarding/integrations/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            platform: integration.key,
            config: connectionConfig
          })
        })
      }

      const result = await response.json()
      
      if (result.success) {
        setIntegrations(prev => 
          prev.map(i => 
            i.key === integration.key 
              ? { ...i, status: 'connected' }
              : i
          )
        )
      } else {
        setIntegrations(prev => 
          prev.map(i => 
            i.key === integration.key 
              ? { ...i, status: 'error', error: result.error }
              : i
          )
        )
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      setIntegrations(prev => 
        prev.map(i => 
          i.key === integration.key 
            ? { ...i, status: 'error', error: 'Connection failed' }
            : i
        )
      )
    } finally {
      setCurrentSetup(null)
      setConnectionConfig({})
      setConfigModal(null)
    }
  }

  const handleSkipForNow = () => {
    // Mark setup as skipped and redirect to AgenticFlow app shell
    localStorage.setItem('setupStatus', 'skipped')
    console.log('⏭️ Setup skipped by user, redirecting to app shell')
    router.push('/shell')
  }

  const handleFinishSetup = () => {
    // Mark setup as completed and redirect to AgenticFlow app shell
    localStorage.setItem('setupStatus', 'completed')
    console.log('✅ Setup completed by user, redirecting to app shell')
    router.push('/shell')
  }

  const categoryGroups = {
    communication: integrations.filter(i => i.category === 'communication'),
    advertising: integrations.filter(i => i.category === 'advertising'),
    analytics: integrations.filter(i => i.category === 'analytics')
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading setup...</p>
        </div>
      </div>
    )
  }

  const handlePlayVoiceSample = async () => {
    if (isPlayingVoice) return
    
    setIsPlayingVoice(true)
    
    try {
      // Get sample text based on selected personality
      const sampleTexts = {
        professional: "Hello, I'm Zunoki, your AI business intelligence assistant. I'll help you analyze your advertising campaigns with precise, data-driven insights to optimize your marketing performance.",
        friendly: "Hi there! I'm Zunoki, and I'm excited to be your AI assistant! I'll help you understand your business data in a fun and easy way, making complex analytics simple to understand.",
        analytical: "Greetings. I am Zunoki, your analytical AI companion. I will process your campaign metrics, identify performance patterns, and provide detailed statistical insights to enhance your marketing ROI."
      }
      
      const sampleText = sampleTexts[voiceSettings.personality as keyof typeof sampleTexts]
      
      // Use existing TTS service for premium options only
      if (voiceSettings.accent !== 'standard-web') {
        const ttsService = await getTTSService()
        if (ttsService) {
          // Try high-quality TTS for premium accent options
          if (voiceSettings.accent === 'indian-english') {
            ttsService.setProvider('sarvam') // Sarvam AI for Indian accent
          } else {
            ttsService.setProvider('elevenlabs') // ElevenLabs for US/UK English
          }
        
        try {
          console.log(`Attempting ${voiceSettings.accent === 'indian-english' ? 'Sarvam' : 'ElevenLabs'} TTS...`)
          const result = await ttsService.speak(sampleText, voiceSettings)
          console.log('TTS result:', result)
          
          if (result.success && result.audioUrl && result.audioUrl !== 'browser://speech-synthesis') {
            // Play the generated audio
            const audio = new Audio(result.audioUrl)
            
            audio.onplay = () => {
              console.log('High-quality TTS audio playing successfully')
            }
            
            audio.onerror = (e) => {
              console.error('Audio playback error:', e)
              setIsPlayingVoice(false)
            }
            
            audio.onended = () => {
              setIsPlayingVoice(false)
            }
            
            await audio.play()
            return // Successfully used high-quality TTS
          } else {
            console.log('TTS service returned invalid result:', result)
          }
          } catch (error) {
            console.error('High-quality TTS failed:', error)
          }
        }
      }
      
      // Browser TTS (for Standard Speech or as fallback for premium options)
      const utterance = new SpeechSynthesisUtterance(sampleText)
      
      // Wait for voices to load if not ready
      let voices = speechSynthesis.getVoices()
      if (voices.length === 0) {
        await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices()
            resolve(undefined)
          }
        })
      }
      
      console.log('Available voices:', voices.map(v => ({name: v.name, lang: v.lang})))
      
      let selectedVoice = null
      
      // Set language and find appropriate voice based on accent selection
      if (voiceSettings.accent === 'standard-web') {
        // Standard Speech - use system default with basic language setting
        utterance.lang = 'en-US' // Default to US English for standard web
        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0]
        console.log('Using Standard Speech with voice:', selectedVoice?.name || 'system default')
        
      } else if (voiceSettings.accent === 'uk-english') {
        utterance.lang = 'en-GB'
        // Try specific UK voices first
        selectedVoice = voices.find(voice => 
          (voice.lang.includes('en-GB') || voice.name.toLowerCase().includes('british')) &&
          (voiceSettings.voice.includes('female') ? 
            voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') : 
            voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man'))
        )
        // Fallback to any UK voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-GB') || voice.name.toLowerCase().includes('british')
          )
        }
        
      } else if (voiceSettings.accent === 'indian-english') {
        utterance.lang = 'en-IN'
        // Try Indian-specific voices
        selectedVoice = voices.find(voice => 
          (voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('indian')) &&
          (voiceSettings.voice.includes('female') ? 
            voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') : 
            voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man'))
        )
        // Fallback to any Indian voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('indian')
          )
        }
        
      } else {
        // US English (default)
        utterance.lang = 'en-US'
        // Try US-specific voices
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') &&
          (voiceSettings.voice.includes('female') ? 
            voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') : 
            voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man'))
        )
        // Fallback to any US voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en-US'))
        }
      }
      
      // Ultimate fallback - any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'))
      }
      
      // Set the selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang)
      } else {
        console.log('No suitable voice found, using default')
      }
      
      // Set voice characteristics
      utterance.rate = 0.9
      utterance.pitch = voiceSettings.voice === 'female-warm' ? 1.1 : 1.0
      utterance.volume = 0.8
      
      utterance.onend = () => {
        setIsPlayingVoice(false)
      }
      
      utterance.onerror = (error) => {
        console.error('Browser TTS error:', error)
        setIsPlayingVoice(false)
      }
      
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Voice sample error:', error)
      setIsPlayingVoice(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Let's Connect Your Platforms 🔗
          </h1>
          <p className="text-gray-600 mb-4">
            Connect your tools to unlock Zunoki's full potential
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Setup Progress</span>
              <span>{connectedCount}/{totalCount} connected</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {essentialConnected}/{essentialTotal} essential platforms connected
            </p>
          </div>
        </div>

        {/* Communication Platforms */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Communication Platforms
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Essential</Badge>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {categoryGroups.communication.map((integration) => (
              <PlatformCard
                key={integration.key}
                integration={integration}
                onConnect={handleConnect}
                isConnecting={currentSetup === integration.key}
              />
            ))}
          </div>
        </div>

        {/* Advertising Platforms */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Advertising Platforms
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">High Impact</Badge>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categoryGroups.advertising.map((integration) => {
              // Map setup page keys to enhanced integration platform names
              const platformMapping: Record<string, string> = {
                'google-ads': 'google_ads',
                'google-shopping': 'google_shopping',
                'youtube-ads': 'youtube_ads'
              }
              
              const enhancedPlatform = platformMapping[integration.key]
              const enhancedConnection = enhancedPlatform ? enhancedIntegrations.find(conn => 
                conn.platform === enhancedPlatform
              ) : null
              
              if (enhancedConnection) {
                return (
                  <EnhancedIntegrationCard
                    key={integration.key}
                    integration={{
                      platform: enhancedConnection.platform,
                      name: integration.name,
                      description: integration.description,
                      icon: typeof integration.icon === 'string' ? integration.icon : integration.icon?.name || '🎯',
                      isConnected: enhancedConnection.isConnected,
                      googleAccount: enhancedConnection.googleAccount,
                      connectionMetadata: {
                        data_count: enhancedConnection.dataCount || 0,
                        status: enhancedConnection.isConnected ? 'active' : 'not_connected' as any,
                        last_verified_at: enhancedConnection.connectedAt || new Date().toISOString(),
                        connected_via: 'oauth_flow'
                      },
                      connectedAt: enhancedConnection.connectedAt,
                      features: integration.features || []
                    }}
                    onConnect={() => handleConnect(integration)}
                    onSwitch={(platform) => handleSwitchAccount(user.uid, platform)}
                    onDisconnect={(platform) => handleDisconnectAccount(user.uid, platform, () => {
                      loadConnectionStatuses()
                    })}
                  />
                )
              }
              
              // Use standard card for other integrations
              return (
                <PlatformCard
                  key={integration.key}
                  integration={integration}
                  onConnect={handleConnect}
                  isConnecting={currentSetup === integration.key}
                />
              )
            })}
          </div>
        </div>

        {/* Analytics Platforms */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Analytics Platforms
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">Optional</Badge>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categoryGroups.analytics.map((integration) => {
              // Map setup page keys to enhanced integration platform names
              const platformMapping: Record<string, string> = {
                'google-analytics': 'google_analytics',
                'google-search-console': 'google_search_console',
                'google-my-business': 'google_my_business',
                'mixpanel': 'mixpanel'
              }
              
              const enhancedPlatform = platformMapping[integration.key]
              const enhancedConnection = enhancedPlatform ? enhancedIntegrations.find(conn => 
                conn.platform === enhancedPlatform
              ) : null
              
              if (enhancedConnection) {
                return (
                  <EnhancedIntegrationCard
                    key={integration.key}
                    integration={{
                      platform: enhancedConnection.platform,
                      name: integration.name,
                      description: integration.description,
                      icon: typeof integration.icon === 'string' ? integration.icon : integration.icon?.name || '📊',
                      isConnected: enhancedConnection.isConnected,
                      googleAccount: enhancedConnection.googleAccount,
                      connectionMetadata: {
                        data_count: enhancedConnection.dataCount || 0,
                        status: enhancedConnection.isConnected ? 'active' : 'not_connected' as any,
                        last_verified_at: enhancedConnection.connectedAt || new Date().toISOString(),
                        connected_via: 'oauth_flow'
                      },
                      connectedAt: enhancedConnection.connectedAt,
                      features: integration.features || []
                    }}
                    onConnect={() => handleConnect(integration)}
                    onSwitch={(platform) => handleSwitchAccount(user.uid, platform)}
                    onDisconnect={(platform) => handleDisconnectAccount(user.uid, platform, () => {
                      loadConnectionStatuses()
                    })}
                  />
                )
              }
              
              // Use standard card for other integrations
              return (
                <PlatformCard
                  key={integration.key}
                  integration={integration}
                  onConnect={handleConnect}
                  isConnecting={currentSetup === integration.key}
                />
              )
            })}
          </div>
        </div>

        {/* Voice & AI Configuration */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              Configure Your AI Voice Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Voice Selection */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Voice Selection</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="voice" 
                      value="female-professional" 
                      className="text-purple-600" 
                      checked={voiceSettings.voice === 'female-professional'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, voice: e.target.value})}
                    />
                    <span className="text-sm">Female - Professional</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="voice" 
                      value="male-friendly" 
                      className="text-purple-600" 
                      checked={voiceSettings.voice === 'male-friendly'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, voice: e.target.value})}
                    />
                    <span className="text-sm">Male - Friendly</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="voice" 
                      value="male-professional" 
                      className="text-purple-600" 
                      checked={voiceSettings.voice === 'male-professional'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, voice: e.target.value})}
                    />
                    <span className="text-sm">Male - Professional</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="voice" 
                      value="female-warm" 
                      className="text-purple-600" 
                      checked={voiceSettings.voice === 'female-warm'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, voice: e.target.value})}
                    />
                    <span className="text-sm">Female - Warm</span>
                  </label>
                </div>
              </div>

              {/* Language & Accent */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Language & Accent</h4>
                <p className="text-xs text-gray-600 mb-2">Premium voices use advanced AI for natural speech quality</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="accent" 
                      value="us-english" 
                      className="text-purple-600" 
                      checked={voiceSettings.accent === 'us-english'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, accent: e.target.value})}
                    />
                    <span className="text-sm flex items-center gap-2">
                      US English 
                      <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium">Premium</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="accent" 
                      value="uk-english" 
                      className="text-purple-600" 
                      checked={voiceSettings.accent === 'uk-english'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, accent: e.target.value})}
                    />
                    <span className="text-sm flex items-center gap-2">
                      UK English
                      <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium">Premium</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="accent" 
                      value="indian-english" 
                      className="text-purple-600" 
                      checked={voiceSettings.accent === 'indian-english'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, accent: e.target.value})}
                    />
                    <span className="text-sm flex items-center gap-2">
                      Indian English
                      <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium">Premium</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="accent" 
                      value="standard-web" 
                      className="text-purple-600" 
                      checked={voiceSettings.accent === 'standard-web'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, accent: e.target.value})}
                    />
                    <span className="text-sm">Standard Speech</span>
                  </label>
                </div>
              </div>

              {/* AI Personality */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">AI Personality</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="personality" 
                      value="professional" 
                      className="text-purple-600" 
                      checked={voiceSettings.personality === 'professional'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, personality: e.target.value})}
                    />
                    <span className="text-sm">Professional & Direct</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="personality" 
                      value="friendly" 
                      className="text-purple-600" 
                      checked={voiceSettings.personality === 'friendly'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, personality: e.target.value})}
                    />
                    <span className="text-sm">Friendly & Conversational</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="personality" 
                      value="analytical" 
                      className="text-purple-600" 
                      checked={voiceSettings.personality === 'analytical'}
                      onChange={(e) => handleVoiceSettingsChange({...voiceSettings, personality: e.target.value})}
                    />
                    <span className="text-sm">Analytical & Detailed</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">Preview Your AI Assistant</h4>
                  <p className="text-sm text-purple-700">
                    Hear how Zunoki will narrate your business insights
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700" 
                  onClick={handlePlayVoiceSample}
                  disabled={isPlayingVoice}
                >
                  {isPlayingVoice ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Sample
                    </>
                  )}
                </Button>
                {voicePreferencesSaved && (
                  <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3" />
                    Voice preferences saved!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Chat Widget Configuration */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Website Chat Widget Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Widget Configuration */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Widget Appearance</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="widgetTitle">Welcome Message</Label>
                      <Input
                        id="widgetTitle"
                        placeholder="Hi! How can we help you today?"
                        defaultValue="Hi! How can we help you today?"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="widgetSubtitle">Subtitle</Label>
                      <Input
                        id="widgetSubtitle"
                        placeholder="We typically reply in a few minutes"
                        defaultValue="We typically reply in a few minutes"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="widgetColor">Primary Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="widgetColor"
                            type="color"
                            defaultValue="#22c55e"
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            placeholder="#22c55e"
                            defaultValue="#22c55e"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="widgetPosition">Position</Label>
                        <Select defaultValue="bottom-right">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Installation Code</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Copy this code and paste it before the closing &lt;/body&gt; tag on your website:
                  </p>

                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <code>{`<!-- Zunoki Chat Widget -->
<script>
  window.ZunokiConfig = {
    apiKey: '${user?.uid || 'YOUR_API_KEY'}',
    primaryColor: '#22c55e',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help you today?',
    subtitle: 'We typically reply in a few minutes'
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/widget/chat.js"></script>`}</code>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const code = `<!-- Zunoki Chat Widget -->
<script>
  window.ZunokiConfig = {
    apiKey: '${user?.uid || 'YOUR_API_KEY'}',
    primaryColor: '#22c55e',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help you today?',
    subtitle: 'We typically reply in a few minutes'
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/widget/chat.js"></script>`
                        navigator.clipboard.writeText(code)
                      }}
                    >
                      📋 Copy Code
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('/shell?module=conversations', '_blank')}
                    >
                      👀 Preview Conversations
                    </Button>
                  </div>
                </div>

                {/* Widget Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Widget Preview</h5>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        Z
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Hi! How can we help you today?
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          We typically reply in a few minutes
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input placeholder="Type your message..." className="flex-1 text-sm" disabled />
                      <Button size="sm" disabled>
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">✨ Website Chat Features</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time visitor messaging
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Automatic lead capture
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Mobile-responsive design
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Customizable appearance
                  </li>
                </ul>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    AI-powered auto-responses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Team member assignment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Conversation history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    GDPR compliant
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zunoki AI Features */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Zunoki AI Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Natural language business intelligence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Voice-narrated chart insights (industry first!)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cross-platform data correlation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>24/7 availability with your preferred voice</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  Z
                </div>
                <p className="text-xs text-gray-600">
                  Your AI assistant is ready to help!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              onClick={handleFinishSetup}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              disabled={essentialConnected < essentialTotal}
            >
              🚀 Complete Setup & Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              onClick={handleSkipForNow}
              variant="outline"
              size="lg"
              className="px-8"
            >
              ⏭️ Skip for Now
            </Button>
          </div>

          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You can always add more integrations later from your dashboard. 
            Essential platforms are needed for core functionality.
          </p>
        </div>

        {/* WhatsApp Provider Selection Modal */}
        <Dialog open={whatsappModal} onOpenChange={setWhatsappModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Connect WhatsApp
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <WhatsAppProviderModal 
                onSelect={handleWhatsappConnect}
                onCancel={() => setWhatsappModal(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Platform Configuration Modal */}
        <Dialog open={!!configModal} onOpenChange={(open) => !open && setConfigModal(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
              <DialogTitle>Configure {configModal}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <PlatformConfigModal 
                platform={configModal}
                config={connectionConfig}
                setConfig={setConnectionConfig}
                onConnect={() => {
                  const integration = integrations.find(i => i.key === configModal)
                  if (integration) handleDirectConnection(integration)
                }}
                onCancel={() => {
                  setConfigModal(null)
                  setConnectionConfig({})
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// WhatsApp Provider Selection Modal
function WhatsAppProviderModal({ 
  onSelect, 
  onCancel 
}: { 
  onSelect: (provider: WhatsAppProvider, config: Record<string, any>) => void
  onCancel: () => void 
}) {
  const providers = SetupIntegrationBridge.getWhatsAppProviders()
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider | null>(null)
  const [config, setConfig] = useState<Record<string, any>>({})

  if (selectedProvider) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <button 
            onClick={() => setSelectedProvider(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ←
          </button>
          <h3 className="font-medium">Configure {selectedProvider.name}</h3>
        </div>
        
        <WhatsAppProviderConfig 
          provider={selectedProvider}
          config={config}
          setConfig={setConfig}
          onConnect={() => onSelect(selectedProvider, config)}
          onCancel={onCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Choose your preferred WhatsApp provider:</p>
      
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
          onClick={() => setSelectedProvider(provider)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900">{provider.name}</h3>
            <Badge variant="outline" className={
              provider.cost === 'free' ? 'text-green-600 border-green-200' :
              provider.cost === 'paid' ? 'text-orange-600 border-orange-200' :
              'text-blue-600 border-blue-200'
            }>
              {provider.cost === 'free' ? 'Free' : 
               provider.cost === 'paid' ? 'Paid' : 'Usage-based'}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
          
          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-medium text-green-700 mb-1">✅ Features:</h4>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {provider.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {provider.limitations && (
              <div>
                <h4 className="text-xs font-medium text-orange-700 mb-1">⚠️ Limitations:</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {provider.limitations.map((limitation, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <Button className="w-full mt-4" size="sm">
            Connect with {provider.name}
          </Button>
        </div>
      ))}
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Platform Configuration Modal
function PlatformConfigModal({
  platform,
  config,
  setConfig,
  onConnect,
  onCancel
}: {
  platform: string | null
  config: Record<string, any>
  setConfig: (config: Record<string, any>) => void
  onConnect: () => void
  onCancel: () => void
}) {
  if (!platform) return null

  const renderConfigFields = () => {
    switch (platform) {
      case 'mixpanel':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-xl">📊</div>
                <div>
                  <h3 className="font-medium text-blue-900">Mixpanel API Connection</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Connect your Mixpanel project to sync user analytics and behavioral data.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="projectToken">Project Token</Label>
              <Input
                id="projectToken"
                type="password"
                placeholder="Enter your Mixpanel project token"
                value={config.projectToken || ''}
                onChange={(e) => setConfig({...config, projectToken: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Found in Project Settings → Project Token
              </p>
            </div>
            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                placeholder="Enter your Mixpanel project ID"
                value={config.projectId || ''}
                onChange={(e) => setConfig({...config, projectId: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Found in Project Settings → Project ID
              </p>
            </div>
          </div>
        )

      case 'telegram':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-xl">🤖</div>
                <div>
                  <h3 className="font-medium text-blue-900">Telegram Bot Integration</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Connect your Telegram bot for messaging and customer support.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <strong>🔧 Setup Required:</strong>
              <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                <li>Message <a href="https://t.me/BotFather" target="_blank" className="text-blue-600 underline">@BotFather</a> on Telegram</li>
                <li>Send <code>/newbot</code> and follow instructions</li>
                <li>Choose a name and username for your bot</li>
                <li>Copy the bot token (long string with numbers and letters)</li>
              </ol>
            </div>
            
            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="Enter your Telegram Bot Token"
                value={config.botToken || ''}
                onChange={(e) => setConfig({...config, botToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="botUsername">Bot Username (Optional)</Label>
              <Input
                id="botUsername"
                placeholder="@your_bot_username"
                value={config.botUsername || ''}
                onChange={(e) => setConfig({...config, botUsername: e.target.value})}
              />
            </div>
          </div>
        )

      case 'gmail':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-xl">📧</div>
                <div>
                  <h3 className="font-medium text-blue-900">Gmail SMTP Integration</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Send and receive emails through your Gmail account using App Passwords.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <strong>🔧 Setup Required:</strong>
              <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                <li>Go to <a href="https://myaccount.google.com/security" target="_blank" className="text-blue-600 underline">Google Account Security</a></li>
                <li>Enable <strong>2-Step Verification</strong> if not already enabled</li>
                <li>Go to <strong>App passwords</strong> section</li>
                <li>Generate a new app password for "Mail"</li>
                <li>Copy the 16-character password (no spaces)</li>
              </ol>
            </div>
            
            <div>
              <Label htmlFor="email">Gmail Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={config.email || ''}
                onChange={(e) => setConfig({...config, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="appPassword">Gmail App Password</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="16-character app password (no spaces)"
                value={config.appPassword || ''}
                onChange={(e) => setConfig({...config, appPassword: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Generated from Google Account → Security → App passwords → Mail
              </p>
            </div>
            <div>
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="Your Business Name"
                value={config.displayName || ''}
                onChange={(e) => setConfig({...config, displayName: e.target.value})}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Configuration not available for {platform}</p>
          </div>
        )
    }
  }

  const isValid = () => {
    switch (platform) {
      case 'mixpanel':
        return config.projectToken && config.projectId
      case 'telegram':
        return config.botToken
      case 'gmail':
        return config.email && config.appPassword
      default:
        return false
    }
  }

  return (
    <div className="space-y-4">
      {renderConfigFields()}
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={onConnect}
          disabled={!isValid()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Connect {platform}
        </Button>
      </div>
    </div>
  )
}

// WhatsApp Provider Configuration Component
function WhatsAppProviderConfig({
  provider,
  config,
  setConfig,
  onConnect,
  onCancel
}: {
  provider: WhatsAppProvider
  config: Record<string, any>
  setConfig: (config: Record<string, any>) => void
  onConnect: () => void
  onCancel: () => void
}) {
  const isValid = () => {
    switch (provider.id) {
      case 'twilio-sandbox':
        return config.accountSid && config.authToken && config.sandboxKeyword
      case 'twilio-production':
        return config.accountSid && config.authToken && config.phoneNumber
      case 'meta-business':
        return config.businessAccountId && config.accessToken && config.phoneNumber && config.verifyToken
      case 'meta-sandbox':
        return config.businessAccountId && config.accessToken
      default:
        return false
    }
  }

  const renderConfigFields = () => {
    switch (provider.id) {
      case 'twilio-sandbox':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-3">
                <div className="text-amber-600 text-xl">⚠️</div>
                <div>
                  <h3 className="font-medium text-amber-900">Twilio Sandbox Mode - Development Only</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    This is for testing only. Every customer must send "join [keyword]" before receiving messages.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="Enter your Twilio Account SID"
                value={config.accountSid || ''}
                onChange={(e) => setConfig({...config, accountSid: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Enter your Twilio Auth Token"
                value={config.authToken || ''}
                onChange={(e) => setConfig({...config, authToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="sandboxKeyword">Sandbox Keyword</Label>
              <Input
                id="sandboxKeyword"
                placeholder="Your sandbox join keyword (e.g., 'having-hide')"
                value={config.sandboxKeyword || ''}
                onChange={(e) => setConfig({...config, sandboxKeyword: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find your keyword at console.twilio.com → Messaging → Try it out → WhatsApp
              </p>
            </div>
          </div>
        )

      case 'twilio-production':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-xl">🚀</div>
                <div>
                  <h3 className="font-medium text-blue-900">Twilio Production Mode</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Send WhatsApp messages to any number worldwide. Perfect for real business use.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="Enter your Twilio Account SID"
                value={config.accountSid || ''}
                onChange={(e) => setConfig({...config, accountSid: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Enter your Twilio Auth Token"
                value={config.authToken || ''}
                onChange={(e) => setConfig({...config, authToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your WhatsApp phone number"
                value={config.phoneNumber || ''}
                onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
              />
            </div>
          </div>
        )

      case 'meta-business':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="text-green-600 text-xl">📱</div>
                <div>
                  <h3 className="font-medium text-green-900">Meta Business API</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Direct Facebook/Meta WhatsApp integration with advanced business features.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="businessAccountId">Business Account ID</Label>
              <Input
                id="businessAccountId"
                placeholder="Enter your WhatsApp Business Account ID"
                value={config.businessAccountId || ''}
                onChange={(e) => setConfig({...config, businessAccountId: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Access Token"
                value={config.accessToken || ''}
                onChange={(e) => setConfig({...config, accessToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your WhatsApp phone number"
                value={config.phoneNumber || ''}
                onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="verifyToken">Verify Token</Label>
              <Input
                id="verifyToken"
                placeholder="Enter your webhook verify token"
                value={config.verifyToken || ''}
                onChange={(e) => setConfig({...config, verifyToken: e.target.value})}
              />
            </div>
          </div>
        )

      case 'meta-sandbox':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="text-purple-600 text-xl">🧪</div>
                <div>
                  <h3 className="font-medium text-purple-900">Meta Business Sandbox</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Meta WhatsApp testing environment. Add test phone numbers in Meta Business Manager.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="businessAccountId">Business Account ID</Label>
              <Input
                id="businessAccountId"
                placeholder="Enter your WhatsApp Business Account ID"
                value={config.businessAccountId || ''}
                onChange={(e) => setConfig({...config, businessAccountId: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Access Token"
                value={config.accessToken || ''}
                onChange={(e) => setConfig({...config, accessToken: e.target.value})}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {renderConfigFields()}
      
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={onConnect} 
          disabled={!isValid()}
          className="flex-1"
        >
          Connect {provider.name}
        </Button>
      </div>
    </div>
  )
}

interface PlatformCardProps {
  integration: PlatformIntegration
  onConnect: (integration: PlatformIntegration) => void
  isConnecting: boolean
}

function PlatformCard({ integration, onConnect, isConnecting }: PlatformCardProps) {
  const Icon = integration.icon
  
  const getStatusColor = () => {
    switch (integration.status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'connecting': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />
      case 'connecting': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      case 'error': return <ExternalLink className="w-4 h-4" />
      default: return <Icon className="w-4 h-4" />
    }
  }

  const getButtonText = () => {
    switch (integration.status) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Retry Connection'
      default: return 'Connect'
    }
  }

  return (
    <Card className={`h-full transition-all duration-300 hover:shadow-md ${
      integration.status === 'connected' ? 'ring-2 ring-green-200 bg-green-50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              {integration.priority === 'high' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Essential
                </Badge>
              )}
              {integration.isOptional && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                  Optional
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
        
        {/* Show account info if connected */}
        {integration.status === 'connected' && integration.accountInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-xs font-medium text-green-800 mb-2">Connected Account:</h4>
            <div className="text-xs text-green-700 space-y-1">
              {integration.accountInfo.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{integration.accountInfo.email}</span>
                </div>
              )}
              {integration.accountInfo.phoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{integration.accountInfo.phoneNumber}</span>
                </div>
              )}
              {integration.accountInfo.name && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{integration.accountInfo.name}</span>
                </div>
              )}
              {integration.provider && (
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Provider: {integration.provider}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show error if failed */}
        {integration.status === 'error' && integration.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-xs font-medium text-red-800 mb-1">Connection Error:</h4>
            <p className="text-xs text-red-700">{integration.error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Key Features:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {integration.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={() => onConnect(integration)}
          disabled={isConnecting || integration.status === 'connected'}
          className={`w-full ${
            integration.status === 'connected' 
              ? 'bg-green-500 hover:bg-green-600' 
              : integration.status === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300'
          }`}
          size="sm"
        >
          {getStatusIcon()}
          <span className="ml-2">{getButtonText()}</span>
        </Button>
      </CardContent>
    </Card>
  )
}