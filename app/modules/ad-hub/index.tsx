"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, TrendingUp, Star, Zap, Eye, Users, MessageSquare, Settings, Loader2, CheckCircle, XCircle, Plus, BarChart3, Globe, Smartphone, Tv, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { OAUTH_PROVIDERS, OAuthService } from "@/lib/integrations/oauth-providers"
import { API_KEY_PROVIDERS, ApiKeyService } from "@/lib/integrations/api-key-providers"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { platformConnectionService } from "@/lib/services/platform-connection-service"

interface AdPlatform {
  id: string
  name: string
  category: 'social' | 'search' | 'video' | 'display' | 'mobile' | 'ctv' | 'audio' | 'commerce' | 'email' | 'native' | 'competitive'
  description: string
  logo: string
  connected: boolean
  authMethod: 'oauth' | 'api_key' | 'manual'
  popularity: number
  metrics: {
    reach?: string
    avgCpm?: string
    avgCtr?: string
    minSpend?: string
  }
  features: string[]
  useCase: string
  status?: 'available' | 'coming_soon' | 'beta'
}

// Additional platforms (34 new platforms)
const additionalAdPlatforms: AdPlatform[] = [
  // Social Media
  { id: 'tiktok_ads', name: 'TikTok Ads', category: 'social', description: 'Short-form video advertising', logo: '/logos/tiktok.svg', connected: false, authMethod: 'oauth', popularity: 95, metrics: { reach: '1.2B', avgCpm: '$2.50', avgCtr: '1.9%', minSpend: '$50' }, features: ['Video Ads', 'Spark Ads', 'Brand Takeover'], useCase: 'Gen Z targeting, viral content', status: 'available' },
  { id: 'snapchat_ads', name: 'Snapchat Ads', category: 'social', description: 'AR-powered social advertising', logo: '/logos/snapchat.svg', connected: false, authMethod: 'oauth', popularity: 80, metrics: { reach: '750M', avgCpm: '$3.20', avgCtr: '1.4%', minSpend: '$100' }, features: ['AR Lenses', 'Story Ads', 'Snap Ads'], useCase: 'AR campaigns, young demographics' },
  { id: 'pinterest_ads', name: 'Pinterest Business', category: 'social', description: 'Visual discovery advertising', logo: '/logos/pinterest.svg', connected: false, authMethod: 'oauth', popularity: 75, metrics: { reach: '450M', avgCpm: '$2.00', avgCtr: '0.9%', minSpend: '$50' }, features: ['Shopping Ads', 'Video Pins', 'Carousel Ads'], useCase: 'E-commerce, lifestyle brands' },
  { id: 'twitter_ads', name: 'X (Twitter) Ads', category: 'social', description: 'Real-time conversation advertising', logo: '/logos/twitter.svg', connected: false, authMethod: 'oauth', popularity: 70, metrics: { reach: '450M', avgCpm: '$3.50', avgCtr: '1.2%', minSpend: '$50' }, features: ['Promoted Tweets', 'Twitter Takeover', 'Video Ads'], useCase: 'Brand awareness, real-time marketing' },
  { id: 'reddit_ads', name: 'Reddit Ads', category: 'social', description: 'Community-driven advertising', logo: '/logos/reddit.svg', connected: false, authMethod: 'oauth', popularity: 65, metrics: { reach: '430M', avgCpm: '$2.80', avgCtr: '0.8%', minSpend: '$100' }, features: ['Promoted Posts', 'Banner Ads', 'Video Ads'], useCase: 'Niche communities, authentic engagement' },

  // Search & Display
  { id: 'microsoft_ads', name: 'Microsoft Ads', category: 'search', description: 'Bing search advertising', logo: '/logos/microsoft-ads.svg', connected: false, authMethod: 'oauth', popularity: 70, metrics: { reach: '500M', avgCpm: '$1.80', avgCtr: '2.5%', minSpend: '$100' }, features: ['Search Ads', 'Shopping Campaigns', 'Audience Ads'], useCase: 'Search marketing, lower competition' },
  { id: 'amazon_ads', name: 'Amazon Advertising', category: 'commerce', description: 'E-commerce advertising platform', logo: '/logos/amazon-ads.svg', connected: false, authMethod: 'oauth', popularity: 90, metrics: { reach: '300M', avgCpm: '$4.50', avgCtr: '3.1%', minSpend: '$100' }, features: ['Sponsored Products', 'Sponsored Brands', 'DSP'], useCase: 'E-commerce, product visibility' },
  { id: 'dv360', name: 'Display & Video 360', category: 'display', description: 'Google programmatic platform', logo: '/logos/dv360.svg', connected: false, authMethod: 'oauth', popularity: 85, metrics: { reach: '2B+', avgCpm: '$3.00', avgCtr: '0.6%', minSpend: '$1000' }, features: ['Programmatic Display', 'Video Campaigns', 'Audio Ads'], useCase: 'Programmatic buying, cross-channel' },

  // Mobile & App
  { id: 'apple_ads', name: 'Apple Search Ads', category: 'mobile', description: 'iOS App Store advertising', logo: '/logos/apple-ads.svg', connected: false, authMethod: 'oauth', popularity: 85, metrics: { reach: '1.5B', avgCpm: '$5.20', avgCtr: '4.2%', minSpend: '$100' }, features: ['Search Ads Basic', 'Search Ads Advanced'], useCase: 'App downloads, iOS targeting' },
  { id: 'unity_ads', name: 'Unity Ads', category: 'mobile', description: 'Mobile game advertising', logo: '/logos/unity-ads.svg', connected: false, authMethod: 'api_key', popularity: 75, metrics: { reach: '3B', avgCpm: '$2.50', avgCtr: '1.8%', minSpend: '$50' }, features: ['Rewarded Video', 'Interstitial', 'Banner Ads'], useCase: 'Mobile gaming, app monetization' },
  { id: 'ironsource', name: 'ironSource', category: 'mobile', description: 'Mobile marketing platform', logo: '/logos/ironsource.svg', connected: false, authMethod: 'api_key', popularity: 70, metrics: { reach: '2B', avgCpm: '$3.00', avgCtr: '2.1%', minSpend: '$100' }, features: ['User Acquisition', 'Mediation', 'Analytics'], useCase: 'Mobile apps, user acquisition' },

  // Connected TV & Streaming
  { id: 'roku_advertising', name: 'Roku Advertising', category: 'ctv', description: 'Connected TV advertising', logo: '/logos/roku.svg', connected: false, authMethod: 'manual', popularity: 80, metrics: { reach: '70M', avgCpm: '$25.00', avgCtr: '0.4%', minSpend: '$5000' }, features: ['Video Ads', 'Banner Ads', 'Sponsored Content'], useCase: 'CTV campaigns, cord-cutters' },
  { id: 'samsung_ads', name: 'Samsung Ads', category: 'ctv', description: 'Smart TV advertising platform', logo: '/logos/samsung-ads.svg', connected: false, authMethod: 'manual', popularity: 75, metrics: { reach: '50M', avgCpm: '$30.00', avgCtr: '0.3%', minSpend: '$10000' }, features: ['TV Plus Ads', 'Smart TV Apps', 'Gaming Ads'], useCase: 'Premium TV inventory' },
  { id: 'hulu_ads', name: 'Hulu Ad Manager', category: 'ctv', description: 'Streaming TV advertising', logo: '/logos/hulu.svg', connected: false, authMethod: 'manual', popularity: 85, metrics: { reach: '45M', avgCpm: '$35.00', avgCtr: '0.5%', minSpend: '$15000' }, features: ['Video Ads', 'Interactive Ads', 'Binge Ads'], useCase: 'Streaming audiences, premium content' },

  // Audio
  { id: 'spotify_ads', name: 'Spotify Ad Studio', category: 'audio', description: 'Audio advertising platform', logo: '/logos/spotify.svg', connected: false, authMethod: 'oauth', popularity: 85, metrics: { reach: '450M', avgCpm: '$15.00', avgCtr: '0.7%', minSpend: '$250' }, features: ['Audio Ads', 'Video Takeover', 'Podcast Ads'], useCase: 'Audio content, music targeting' },
  { id: 'pandora_ads', name: 'Pandora Advertising', category: 'audio', description: 'Music streaming ads', logo: '/logos/pandora.svg', connected: false, authMethod: 'manual', popularity: 60, metrics: { reach: '60M', avgCpm: '$12.00', avgCtr: '0.6%', minSpend: '$500' }, features: ['Audio Ads', 'Display Ads', 'Video Ads'], useCase: 'Music listeners, radio alternative' },

  // E-commerce
  { id: 'shopify_ads', name: 'Shopify Audiences', category: 'commerce', description: 'E-commerce advertising insights', logo: '/logos/shopify.svg', connected: false, authMethod: 'oauth', popularity: 80, metrics: { reach: '1.5M merchants', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$100' }, features: ['Audience Insights', 'Lookalike Audiences', 'Retargeting'], useCase: 'E-commerce optimization' },
  { id: 'etsy_ads', name: 'Etsy Ads', category: 'commerce', description: 'Handmade & vintage marketplace ads', logo: '/logos/etsy.svg', connected: false, authMethod: 'api_key', popularity: 65, metrics: { reach: '90M', avgCpm: '$1.50', avgCtr: '1.1%', minSpend: '$20' }, features: ['Product Ads', 'Shop Ads'], useCase: 'Handmade products, creative goods' },

  // Native & Content
  { id: 'outbrain', name: 'Outbrain', category: 'native', description: 'Native content advertising', logo: '/logos/outbrain.svg', connected: false, authMethod: 'oauth', popularity: 75, metrics: { reach: '1B', avgCpm: '$1.20', avgCtr: '0.5%', minSpend: '$500' }, features: ['Native Ads', 'Video Ads', 'App Install'], useCase: 'Content discovery, native advertising' },
  { id: 'taboola', name: 'Taboola', category: 'native', description: 'Content recommendation platform', logo: '/logos/taboola.svg', connected: false, authMethod: 'oauth', popularity: 75, metrics: { reach: '1.4B', avgCpm: '$1.00', avgCtr: '0.4%', minSpend: '$500' }, features: ['Native Ads', 'Video Ads', 'Smart Bidding'], useCase: 'Content marketing, discovery' },

  // Regional & International
  { id: 'baidu_ads', name: 'Baidu Ads', category: 'search', description: 'Chinese search engine advertising', logo: '/logos/baidu.svg', connected: false, authMethod: 'manual', popularity: 90, metrics: { reach: '700M', avgCpm: '$0.80', avgCtr: '2.8%', minSpend: '$300' }, features: ['Search Ads', 'Display Ads', 'Brand Zone'], useCase: 'China market entry' },
  { id: 'yandex_ads', name: 'Yandex.Direct', category: 'search', description: 'Russian search engine advertising', logo: '/logos/yandex.svg', connected: false, authMethod: 'oauth', popularity: 80, metrics: { reach: '100M', avgCpm: '$0.60', avgCtr: '3.1%', minSpend: '$100' }, features: ['Search Ads', 'Display Ads', 'Mobile Ads'], useCase: 'Russian & CIS markets' },

  // B2B Platforms
  { id: 'quora_ads', name: 'Quora Ads', category: 'social', description: 'Q&A platform advertising', logo: '/logos/quora.svg', connected: false, authMethod: 'oauth', popularity: 60, metrics: { reach: '400M', avgCpm: '$2.50', avgCtr: '0.9%', minSpend: '$100' }, features: ['Text Ads', 'Image Ads', 'Promoted Answers'], useCase: 'Knowledge-based targeting' },

  // Emerging Platforms
  { id: 'twitch_ads', name: 'Twitch Ads', category: 'video', description: 'Gaming livestream advertising', logo: '/logos/twitch.svg', connected: false, authMethod: 'oauth', popularity: 85, metrics: { reach: '140M', avgCpm: '$8.00', avgCtr: '1.6%', minSpend: '$500' }, features: ['Video Ads', 'Display Ads', 'Sponsored Streams'], useCase: 'Gaming audiences, live streaming' },
  { id: 'discord_ads', name: 'Discord Ads', category: 'social', description: 'Gaming community advertising', logo: '/logos/discord.svg', connected: false, authMethod: 'manual', popularity: 70, metrics: { reach: '150M', avgCpm: '$5.00', avgCtr: '1.3%', minSpend: '$1000' }, features: ['Quest Ads', 'Sponsored Servers'], useCase: 'Gaming communities', status: 'beta' },

  // Email & Marketing Automation
  { id: 'mailchimp_ads', name: 'Mailchimp Ads', category: 'email', description: 'Email marketing automation', logo: '/logos/mailchimp.svg', connected: false, authMethod: 'oauth', popularity: 85, metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: '3.2%', minSpend: '$10' }, features: ['Email Campaigns', 'Social Ads', 'Landing Pages'], useCase: 'Email marketing, automation' },
  { id: 'klaviyo', name: 'Klaviyo', category: 'email', description: 'E-commerce email marketing', logo: '/logos/klaviyo.svg', connected: false, authMethod: 'api_key', popularity: 80, metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: '4.1%', minSpend: '$20' }, features: ['Email Flows', 'SMS Marketing', 'Personalization'], useCase: 'E-commerce automation' }
]

// Backend API configuration
const BACKEND_URL = 'https://admolabs-backend.onrender.com'

// Combine backend providers with additional platforms
const getAllAdPlatforms = (): AdPlatform[] => {
  // Your existing backend-connected platforms (available via OAuth/API)
  const backendProviders = [
    {
      id: 'google_ads',
      name: 'Google Ads',
      category: 'search' as const,
      description: 'Search and display advertising platform',
      logo: '/logos/google-ads.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 95,
      metrics: { reach: '4B+', avgCpm: '$2.50', avgCtr: '2.1%', minSpend: '$100' },
      features: ['Search Ads', 'Shopping', 'Display', 'YouTube'],
      useCase: 'Search marketing, shopping campaigns',
      status: 'available' as const
    },
    {
      id: 'meta_ads',
      name: 'Meta Business',
      category: 'social' as const,
      description: 'Facebook & Instagram advertising platform',
      logo: '/logos/meta.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 90,
      metrics: { reach: '3B+', avgCpm: '$3.20', avgCtr: '1.8%', minSpend: '$100' },
      features: ['Facebook Ads', 'Instagram Ads', 'Audience Network'],
      useCase: 'Social media advertising, brand awareness',
      status: 'available' as const
    },
    {
      id: 'youtube_analytics',
      name: 'YouTube Analytics',
      category: 'video' as const,
      description: 'Video advertising and analytics platform',
      logo: '/logos/youtube.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 85,
      metrics: { reach: '2.5B', avgCpm: '$4.00', avgCtr: '0.9%', minSpend: '$100' },
      features: ['Video Ads', 'Channel Analytics', 'Audience Insights'],
      useCase: 'Video marketing, audience insights',
      status: 'available' as const
    },
    {
      id: 'youtube_ads',
      name: 'YouTube Ads',
      category: 'video' as const,
      description: 'YouTube advertising campaigns and video ads',
      logo: '/logos/youtube.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 90,
      metrics: { reach: '2.5B', avgCpm: '$5.00', avgCtr: '1.2%', minSpend: '$100' },
      features: ['Video Ads', 'TrueView Ads', 'Bumper Ads', 'YouTube Shorts Ads'],
      useCase: 'Video advertising, brand awareness',
      status: 'available' as const
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      category: 'display' as const,
      description: 'Web analytics and attribution platform',
      logo: '/logos/google-analytics.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 90,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$0' },
      features: ['Web Analytics', 'Attribution', 'Audiences'],
      useCase: 'Website analytics, attribution analysis',
      status: 'available' as const
    },
    {
      id: 'google_shopping',
      name: 'Google Shopping',
      category: 'commerce' as const,
      description: 'Merchant Center performance and product insights',
      logo: '/logos/google-shopping.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 88,
      metrics: { reach: '2B+', avgCpm: '$1.80', avgCtr: '1.5%', minSpend: '$50' },
      features: ['Product Ads', 'Merchant Center', 'Shopping Campaigns'],
      useCase: 'E-commerce, product advertising',
      status: 'available' as const
    },
    {
      id: 'google_search_console',
      name: 'Google Search Console',
      category: 'search' as const,
      description: 'SEO performance and search analytics',
      logo: '/logos/google-search-console.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 85,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: '2.8%', minSpend: '$0' },
      features: ['Search Analytics', 'SEO Insights', 'Search Performance'],
      useCase: 'SEO optimization, search analytics',
      status: 'available' as const
    },
    {
      id: 'google_my_business',
      name: 'Google My Business',
      category: 'display' as const,
      description: 'Local business insights and performance',
      logo: '/logos/google-my-business.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 82,
      metrics: { reach: 'Local', avgCpm: 'N/A', avgCtr: '3.2%', minSpend: '$0' },
      features: ['Local SEO', 'Business Insights', 'Review Management'],
      useCase: 'Local business, local SEO',
      status: 'available' as const
    },
    {
      id: 'linkedin_ads',
      name: 'LinkedIn Ads',
      category: 'social' as const,
      description: 'Professional network advertising platform',
      logo: '/logos/linkedin.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 80,
      metrics: { reach: '900M', avgCpm: '$8.50', avgCtr: '0.6%', minSpend: '$100' },
      features: ['Sponsored Content', 'Message Ads', 'Dynamic Ads'],
      useCase: 'B2B marketing, professional targeting',
      status: 'available' as const
    },
    {
      id: 'segment',
      name: 'Segment',
      category: 'display' as const,
      description: 'Customer data platform and analytics',
      logo: '/logos/segment.svg',
      connected: false,
      authMethod: 'api_key' as const,
      popularity: 75,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$0' },
      features: ['Customer Data', 'Analytics', 'Audience Insights'],
      useCase: 'Customer analytics, data management',
      status: 'available' as const
    },
    {
      id: 'hubspot_crm',
      name: 'HubSpot CRM',
      category: 'email' as const,
      description: 'CRM and marketing automation platform',
      logo: '/logos/hubspot.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 75,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$0' },
      features: ['CRM Integration', 'Email Marketing', 'Lead Scoring'],
      useCase: 'CRM integration, email automation',
      status: 'available' as const
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      category: 'display' as const,
      description: 'Product usage analytics and behavioral insights',
      logo: '/logos/mixpanel.svg',
      connected: false,
      authMethod: 'api_key' as const,
      popularity: 85,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$0' },
      features: ['Event Tracking', 'Funnel Analysis', 'Cohort Analysis'],
      useCase: 'Product analytics, user behavior insights',
      status: 'available' as const
    },
    {
      id: 'branch',
      name: 'Branch',
      category: 'mobile' as const,
      description: 'Mobile attribution and deep linking platform',
      logo: '/logos/branch.svg',
      connected: false,
      authMethod: 'oauth' as const,
      popularity: 70,
      metrics: { reach: 'Custom', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$0' },
      features: ['Attribution', 'Deep Linking', 'Audience Segmentation'],
      useCase: 'Mobile attribution, deep linking',
      status: 'available' as const
    },
    {
      id: 'similarweb',
      name: 'SimilarWeb',
      category: 'competitive' as const,
      description: 'Competitive traffic intelligence and market analysis',
      logo: '/logos/similarweb.svg',
      connected: false,
      authMethod: 'api_key' as const,
      popularity: 85,
      metrics: { reach: 'Global', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$200/mo' },
      features: ['Traffic Analytics', 'Competitor Intelligence', 'Market Share', 'Keyword Analysis'],
      useCase: 'Competitive research, market intelligence',
      status: 'available' as const
    },
    {
      id: 'prisync',
      name: 'Prisync',
      category: 'competitive' as const,
      description: 'Real-time competitor price monitoring and analysis',
      logo: '/logos/prisync.svg',
      connected: false,
      authMethod: 'api_key' as const,
      popularity: 75,
      metrics: { reach: 'Global', avgCpm: 'N/A', avgCtr: 'N/A', minSpend: '$59/mo' },
      features: ['Price Monitoring', 'Competitor Tracking', 'Price Alerts', 'Historical Data'],
      useCase: 'Pricing intelligence, competitive pricing',
      status: 'available' as const
    }
  ]

  const allPlatforms = [...backendProviders, ...additionalAdPlatforms]
  console.log('🐛 getAllAdPlatforms: Total platforms:', allPlatforms.length)
  console.log('🐛 YouTube platforms:', allPlatforms.filter(p => p.id.includes('youtube')))
  console.log('🐛 Video category platforms:', allPlatforms.filter(p => p.category === 'video'))
  
  return allPlatforms
}

export default function AdHubModule() {
  useTrackPageView("Ad Hub");
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'connected'>('popularity')
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform | null>(null)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, boolean>>({})
  const [backendProviders, setBackendProviders] = useState<any>(null)
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [connectedPlatformsCount, setConnectedPlatformsCount] = useState({ advertising: 0, total: 0 })
  const [apiKeyForm, setApiKeyForm] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch all providers from backend
  const fetchBackendProviders = async () => {
    try {
      console.log('Fetching providers from backend...')
      const response = await fetch(`${BACKEND_URL}/api/providers`)
      const data = await response.json()
      
      if (data.success) {
        console.log('Backend providers loaded:', data)
        setBackendProviders(data)
        return data
      } else {
        console.error('Backend providers fetch failed:', data)
        toast({
          title: "Connection Warning",
          description: "Could not load provider status from backend",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Failed to fetch backend providers:', error)
      toast({
        title: "Backend Connection Error",
        description: "Could not connect to backend. Showing available platforms only.",
        variant: "default",
      })
    } finally {
      setLoadingProviders(false)
    }
    return null
  }

  // Check connection status from backend
  const checkConnectionStatus = async (platform: AdPlatform) => {
    if (!user) {
      console.log('No user available for connection status check')
      return false
    }

    try {
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Try to get Firebase JWT token
      try {
        const token = await user.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
        console.log('Using Firebase JWT for backend auth')
      } catch (authError) {
        console.log('Firebase JWT not available, using basic auth')
        // Could add alternative auth method here
      }

      console.log(`Checking connection status for ${platform.id}...`)
      const response = await fetch(`${BACKEND_URL}/api/providers/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.uid || user.email || 'anonymous',
          platform: platform.id
        })
      })

      const data = await response.json()
      console.log(`Connection status response for ${platform.id}:`, data)

      if (data.success && data.data) {
        const isConnected = data.data.connected || false
        setConnectionStatuses(prev => ({
          ...prev,
          [platform.id]: isConnected
        }))
        return isConnected
      } else {
        console.log(`No connection data for ${platform.id}`)
      }
    } catch (error) {
      console.error(`Failed to check status for ${platform.id}:`, error)
    }
    return false
  }

  // Check for OAuth success/error messages in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'google_ads_connected') {
      toast({
        title: "Google Ads Connected!",
        description: "Successfully connected your Google Ads account. Data will sync shortly.",
        variant: "default",
      })
      // Remove URL params
      window.history.replaceState({}, '', window.location.pathname)
      
      // Refresh connection status
      if (user?.uid) {
        platformConnectionService.clearUserCache(user.uid)
        setTimeout(() => {
          loadPlatformConnections()
        }, 1000)
      }
    } else if (success === 'google_analytics_connected') {
      toast({
        title: "Google Analytics Connected!",
        description: "Successfully connected your Google Analytics account. Data will sync shortly.",
        variant: "default",
      })
      // Remove URL params
      window.history.replaceState({}, '', window.location.pathname)
      
      // Refresh connection status
      if (user?.uid) {
        platformConnectionService.clearUserCache(user.uid)
        setTimeout(() => {
          loadPlatformConnections()
        }, 1000)
      }
    } else if (error) {
      toast({
        title: "Connection Error",
        description: `OAuth error: ${error.replace(/_/g, ' ')}`,
        variant: "destructive",
      })
      // Remove URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load platform connection statuses from server-side API
  const loadPlatformConnections = async () => {
    console.log('🐛 loadPlatformConnections called, user:', { uid: user?.uid, hasUser: !!user })
    if (!user?.uid) {
      console.log('🐛 loadPlatformConnections: No user UID, exiting')
      return
    }

    try {
      console.log('🐛 Loading platform connections from server-side API...')
      
      // Call server-side API that can access both oauth_tokens AND user_tokens
      const response = await fetch(`/api/platforms/connections?userId=${user.uid}&type=advertising`)
      const data = await response.json()
      
      if (data.success) {
        const { connectedPlatforms, connectionCounts } = data
        
        // Update connection statuses
        const statuses: Record<string, boolean> = {}
        connectedPlatforms.forEach((platform: any) => {
          statuses[platform.platform] = platform.connected
        })
        
        setConnectionStatuses(statuses)
        setConnectedPlatformsCount({
          advertising: connectionCounts.advertising,
          total: connectionCounts.total
        })
        
        console.log('🎉 Platform connections loaded successfully:', {
          connectedPlatforms: connectedPlatforms.length,
          statuses,
          counts: connectionCounts
        })
      } else {
        console.error('Failed to load platform connections:', data.error)
      }
    } catch (error) {
      console.error('Error loading platform connections:', error)
    }
  }

  // Load backend providers and connection statuses on component mount
  useEffect(() => {
    const initializeAdHub = async () => {
      console.log('🐛 Initializing Ad Hub...', { userUid: user?.uid, hasUser: !!user })
      
      // First, fetch available providers from backend
      await fetchBackendProviders()
      
      // Load platform connections from Supabase
      if (user) {
        console.log('🐛 User found, calling loadPlatformConnections...')
        await loadPlatformConnections()
      } else {
        console.log('🐛 No user found, skipping loadPlatformConnections')
      }
    }

    console.log('🐛 useEffect triggered for Ad Hub initialization')
    initializeAdHub()
  }, [user])

  const allPlatforms = getAllAdPlatforms()
  const categories = [
    { id: 'all', label: 'All Platforms', icon: '🌐', count: allPlatforms.length },
    { id: 'social', label: 'Social Media', icon: '📱', count: allPlatforms.filter(p => p.category === 'social').length },
    { id: 'search', label: 'Search & SEM', icon: '🔍', count: allPlatforms.filter(p => p.category === 'search').length },
    { id: 'video', label: 'Video & Streaming', icon: '📺', count: allPlatforms.filter(p => p.category === 'video').length },
    { id: 'display', label: 'Display & Programmatic', icon: '🖥️', count: allPlatforms.filter(p => p.category === 'display').length },
    { id: 'mobile', label: 'Mobile & App', icon: '📱', count: allPlatforms.filter(p => p.category === 'mobile').length },
    { id: 'ctv', label: 'Connected TV', icon: '📺', count: allPlatforms.filter(p => p.category === 'ctv').length },
    { id: 'audio', label: 'Audio & Podcast', icon: '🎵', count: allPlatforms.filter(p => p.category === 'audio').length },
    { id: 'commerce', label: 'E-commerce', icon: '🛒', count: allPlatforms.filter(p => p.category === 'commerce').length },
    { id: 'email', label: 'Email & Automation', icon: '📧', count: allPlatforms.filter(p => p.category === 'email').length },
    { id: 'native', label: 'Native & Content', icon: '📄', count: allPlatforms.filter(p => p.category === 'native').length },
    { id: 'competitive', label: 'Competitive Intelligence', icon: '🕵️', count: allPlatforms.filter(p => p.category === 'competitive').length }
  ]

  const filteredPlatforms = allPlatforms
    .filter(platform => {
      const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory
      const matchesSearch = !searchQuery || 
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesConnected = !showConnectedOnly || platform.connected || connectionStatuses[platform.id]
      return matchesCategory && matchesSearch && matchesConnected
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'connected':
          const aConnected = connectionStatuses[a.id] || a.connected
          const bConnected = connectionStatuses[b.id] || b.connected
          return Number(bConnected) - Number(aConnected)
        case 'popularity':
        default:
          return b.popularity - a.popularity
      }
    })

  const handleConnectPlatform = async (platform: AdPlatform) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect advertising platforms.",
        variant: "destructive",
      })
      return
    }

    setConnecting(platform.id)

    try {
      // Backend-connected platforms (your Render deployment)
      const backendPlatforms = ['google_ads', 'meta_ads', 'youtube_analytics', 'youtube_ads', 'google_analytics', 'google_shopping', 'google_search_console', 'google_my_business', 'mixpanel', 'linkedin_ads', 'segment', 'hubspot_crm', 'branch', 'similarweb', 'prisync']
      
      if (backendPlatforms.includes(platform.id)) {
        if (platform.authMethod === 'oauth') {
          // Check if we have a frontend OAuth URL configured
          const oauthProvider = OAUTH_PROVIDERS[platform.id]
          if (oauthProvider) {
            console.log(`Redirecting to OAuth: ${oauthProvider.authUrl}`)
            // Use frontend OAuth flow with Firebase user ID
            window.location.href = `${oauthProvider.authUrl}?userId=${user.uid}`
          } else {
            // Fallback for platforms not in OAUTH_PROVIDERS
            toast({
              title: "OAuth Setup Required",
              description: `${platform.name} OAuth is not yet configured. Please contact support.`,
              variant: "default",
            })
          }
        } else if (platform.authMethod === 'api_key') {
          setSelectedPlatform(platform)
          setShowConnectDialog(true)
        }
      } else {
        // Additional platforms not yet in backend
        toast({
          title: "Coming Soon",
          description: `${platform.name} integration is coming soon! Currently available platforms connect through our secure backend.`,
          variant: "default",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${platform.name}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  const getPlatformStatusColor = (platform: AdPlatform) => {
    const isConnected = connectionStatuses[platform.id] || platform.connected
    const backendPlatforms = ['google_ads', 'meta_ads', 'youtube_analytics', 'youtube_ads', 'google_analytics', 'google_shopping', 'google_search_console', 'google_my_business', 'mixpanel', 'linkedin_ads', 'segment', 'hubspot_crm', 'branch']
    
    if (isConnected) return 'bg-green-100 text-green-800'
    if (!backendPlatforms.includes(platform.id)) return 'bg-yellow-100 text-yellow-800' // Coming soon
    if (platform.status === 'beta') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800' // Available
  }

  const getPlatformStatusText = (platform: AdPlatform) => {
    const isConnected = connectionStatuses[platform.id] || platform.connected
    const backendPlatforms = ['google_ads', 'meta_ads', 'youtube_analytics', 'youtube_ads', 'google_analytics', 'google_shopping', 'google_search_console', 'google_my_business', 'mixpanel', 'linkedin_ads', 'segment', 'hubspot_crm', 'branch']
    
    if (isConnected) return 'Connected'
    if (!backendPlatforms.includes(platform.id)) return 'Coming Soon'
    if (platform.status === 'beta') return 'Beta'
    return 'Available'
  }

  const handleApiKeyConnection = async () => {
    if (!user || !selectedPlatform) return

    // Get provider config
    const providerConfig = API_KEY_PROVIDERS[selectedPlatform.id]
    if (!providerConfig) return

    // Validate required fields
    const missingFields = providerConfig.credentialFields
      .filter(field => field.required && !apiKeyForm[field.key])
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Fields",
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Use generic API key validation endpoint
      const idToken = await user.getIdToken()
      const response = await fetch('/api/integrations/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedPlatform.id,
          credentials: apiKeyForm
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Connection failed')
      }

      const result = await response.json()

      // Update connection status
      setConnectionStatuses(prev => ({
        ...prev,
        [selectedPlatform.id]: true
      }))

      // Clear form and close dialog
      setApiKeyForm({})
      setShowConnectDialog(false)

      // Show success toast
      toast({
        title: `${selectedPlatform.name} Connected!`,
        description: `Successfully connected to your ${selectedPlatform.name} account.`,
        variant: "default",
      })

      // Refresh connection status
      if (user?.uid) {
        platformConnectionService.clearUserCache(user.uid)
        setTimeout(() => {
          loadPlatformConnections()
        }, 1000)
      }

    } catch (error) {
      console.error('API Key connection error:', error)
      toast({
        title: "Connection Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl"
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-foreground">Ad Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Connect and analyze 40+ advertising platforms with unified OAuth & analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {loadingProviders ? (
            <Badge className="bg-card text-foreground border-border px-3 py-1.5">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading backend data...
            </Badge>
          ) : (
            <>
              <Badge className="bg-card text-foreground border-border px-3 py-1.5">
                <Globe className="h-3 w-3 mr-1" />
                {connectedPlatformsCount.advertising} Ad Platforms Connected
              </Badge>
              {backendProviders && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Backend: {backendProviders.meta?.totalProviders || 0} Available
                </Badge>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Debug Info - Backend Connection Status */}
      {backendProviders && process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h3 className="text-sm font-medium text-blue-900 mb-2">🔧 Backend Connection Status (Debug)</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>Backend URL:</strong> {BACKEND_URL}
            </div>
            <div>
              <strong>Total Providers:</strong> {backendProviders.meta?.totalProviders || 0}
            </div>
            <div>
              <strong>OAuth Providers:</strong> {backendProviders.meta?.oauthProviders || 0}
            </div>
            <div>
              <strong>Connection Statuses:</strong> {Object.keys(connectionStatuses).length} checked
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search platforms, features, or use cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-36 bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="name">A-Z</SelectItem>
                    <SelectItem value="connected">Connected First</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="connected-only"
                    checked={showConnectedOnly}
                    onCheckedChange={setShowConnectedOnly}
                  />
                  <Label htmlFor="connected-only" className="text-sm whitespace-nowrap">
                    Connected Only
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex gap-2 p-2 bg-card min-h-fit w-max">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 transition-all duration-200 shrink-0"
                >
                  <span className="text-base">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                  <Badge variant="secondary" className="text-xs bg-muted-foreground/10 text-muted-foreground border-0">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlatforms.map((platform, index) => (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Card className={`rounded-lg group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    (connectionStatuses[platform.id] || platform.connected) 
                      ? 'bg-green-50 border-green-200 shadow-green-100' 
                      : 'bg-card border-border'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{platform.category === 'social' ? '📱' : platform.category === 'search' ? '🔍' : platform.category === 'video' ? '📺' : platform.category === 'display' ? '🖥️' : platform.category === 'mobile' ? '📱' : platform.category === 'ctv' ? '📺' : platform.category === 'audio' ? '🎵' : platform.category === 'commerce' ? '🛒' : platform.category === 'email' ? '📧' : '📄'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold text-foreground truncate">
                              {platform.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {platform.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {(connectionStatuses[platform.id] || platform.connected) && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                          <Badge 
                            className={`text-xs ${getPlatformStatusColor(platform)}`}
                          >
                            {getPlatformStatusText(platform)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-xs text-muted-foreground">Reach</div>
                          <div className="text-sm font-semibold text-foreground">
                            {platform.metrics.reach || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-xs text-muted-foreground">Avg CPM</div>
                          <div className="text-sm font-semibold text-green-600">
                            {platform.metrics.avgCpm || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Key Features</div>
                        <div className="flex flex-wrap gap-1">
                          {platform.features.slice(0, 2).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {platform.features.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{platform.features.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Use Case */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Best For</div>
                        <div className="text-xs text-foreground">{platform.useCase}</div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full text-xs h-8"
                        variant={(connectionStatuses[platform.id] || platform.connected) ? "secondary" : "default"}
                        disabled={connecting === platform.id}
                        onClick={() => handleConnectPlatform(platform)}
                      >
                        {connecting === platform.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Connecting...
                          </>
                        ) : (connectionStatuses[platform.id] || platform.connected) ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredPlatforms.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No platforms found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedPlatform?.id === 'mixpanel' && '📊'}
              Connect {selectedPlatform?.name}
            </DialogTitle>
          </DialogHeader>
          
          {(selectedPlatform?.authMethod === 'api_key' && API_KEY_PROVIDERS[selectedPlatform.id]) ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">{selectedPlatform.name} Setup</h4>
                    <p className="text-sm text-blue-800">
                      {API_KEY_PROVIDERS[selectedPlatform.id].description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {API_KEY_PROVIDERS[selectedPlatform.id]?.credentialFields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key} className="text-sm font-medium">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={apiKeyForm[field.key] || ''}
                      onChange={(e) => setApiKeyForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-1"
                    />
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}

                {API_KEY_PROVIDERS[selectedPlatform.id]?.setupInstructions && (
                  <div className="bg-gray-50 p-3 rounded border">
                    <h5 className="font-medium text-sm mb-2">📍 Setup Instructions:</h5>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                      {API_KEY_PROVIDERS[selectedPlatform.id].setupInstructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This platform requires API key authentication. Please contact support or check the platform's documentation for setup instructions.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConnectDialog(false)
                setApiKeyForm({})
              }}
            >
              Cancel
            </Button>
            {(selectedPlatform?.authMethod === 'api_key' && API_KEY_PROVIDERS[selectedPlatform.id]) ? (
              <Button 
                onClick={handleApiKeyConnection}
                disabled={isValidating || API_KEY_PROVIDERS[selectedPlatform.id]?.credentialFields.some(field => 
                  field.required && !apiKeyForm[field.key]
                )}
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  `Connect ${selectedPlatform.name}`
                )}
              </Button>
            ) : (
              <Button onClick={() => {
                toast({
                  title: "Setup Instructions",
                  description: "Please check your email for detailed setup instructions.",
                })
                setShowConnectDialog(false)
              }}>
                Get Setup Instructions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}