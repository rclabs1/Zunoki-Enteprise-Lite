import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service'
import { createClient } from '@supabase/supabase-js'

export interface ConnectedPlatform {
  id: string
  name: string
  platform: string
  type: 'messaging' | 'advertising'
  connected: boolean
  last_sync?: string
  account_info?: any
}

export class PlatformConnectionService {
  private static instance: PlatformConnectionService | null = null
  private connectionCache: Map<string, ConnectedPlatform[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): PlatformConnectionService {
    if (!this.instance) {
      this.instance = new PlatformConnectionService()
    }
    return this.instance
  }

  private constructor() {}

  // Get all connected platforms for a user
  async getConnectedPlatforms(userId: string): Promise<ConnectedPlatform[]> {
    const cacheKey = `platforms_${userId}`
    const cached = this.connectionCache.get(cacheKey)
    const cacheTime = this.cacheExpiry.get(cacheKey)

    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached
    }

    try {
      const platforms: ConnectedPlatform[] = []

      // Get messaging platforms from user_integrations table
      const messagingPlatforms = await this.getMessagingPlatforms(userId)
      platforms.push(...messagingPlatforms)

      // Get advertising platforms from oauth_tokens table
      const adPlatforms = await this.getAdPlatforms(userId)
      platforms.push(...adPlatforms)

      // Cache the results
      this.connectionCache.set(cacheKey, platforms)
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)

      return platforms
    } catch (error) {
      console.error('Error fetching connected platforms:', error)
      return []
    }
  }

  // Get messaging platforms from user_integrations
  private async getMessagingPlatforms(userId: string): Promise<ConnectedPlatform[]> {
    try {
      const integrations = await supabaseMultiUserService.getUserIntegrations(userId)
      
      return integrations
        .filter(integration => integration.connected)
        .map(integration => ({
          id: `msg_${integration.provider}`,
          name: this.getDisplayName(integration.provider),
          platform: integration.provider,
          type: 'messaging' as const,
          connected: integration.connected,
          last_sync: integration.last_sync,
          account_info: integration.account_info
        }))
    } catch (error) {
      console.error('Error fetching messaging platforms:', error)
      return []
    }
  }

  // Get advertising platforms from oauth_tokens AND user_tokens
  private async getAdPlatforms(userId: string): Promise<ConnectedPlatform[]> {
    try {
      console.log('🔍 getAdPlatforms: Fetching tokens for user:', userId)
      
      // STEP 1: Get existing oauth_tokens (Google Ads - keep unchanged)
      const oauthTokens = await supabaseMultiUserService.getTokens(undefined, userId)
      console.log('🔍 getAdPlatforms: Found oauth_tokens:', oauthTokens.length, oauthTokens.map(t => ({ platform: t.platform, hasToken: !!t.access_token, expiresAt: t.expires_at })))
      
      // STEP 2: Also get user_tokens (Google Analytics - new encrypted tokens)
      let userTokens: any[] = []
      
      // Only fetch user_tokens on server side where service key is available
      if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          // Create service client only when needed server-side
          const supabaseServiceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          const { data: encryptedTokens } = await supabaseServiceClient
            .from('user_tokens')
            .select('platform, token_data, updated_at, is_active, expires_at')
            .eq('user_id', userId)
            .eq('is_active', true)
          
          userTokens = encryptedTokens || []
          console.log('🔍 getAdPlatforms: Found user_tokens:', userTokens.length, userTokens.map(t => ({ platform: t.platform, hasTokenData: !!t.token_data, expiresAt: t.expires_at })))
        } catch (userTokenError) {
          console.warn('⚠️ Could not fetch user_tokens (non-critical):', userTokenError.message)
        }
      } else {
        console.log('🔍 getAdPlatforms: Skipping user_tokens fetch (client-side or missing service key)')
      }

      // STEP 3: Create deduplication map (oauth_tokens takes precedence for conflicts)
      const platformMap = new Map<string, ConnectedPlatform>()
      
      // Add oauth_tokens first (existing Google Ads logic - RESTORED TO WORKING STATE)
      oauthTokens.forEach(token => {
        platformMap.set(token.platform, {
          id: `ad_${token.platform}`,
          name: this.getDisplayName(token.platform),
          platform: token.platform,
          type: 'advertising' as const,
          connected: !!token.access_token,
          last_sync: token.updated_at,
          account_info: token.account_info
        })
      })
      
      // Add user_tokens only if platform not already present (new Google Analytics logic - SIMPLIFIED)
      userTokens.forEach(token => {
        if (!platformMap.has(token.platform)) {  // Only add if not duplicate
          platformMap.set(token.platform, {
            id: `ad_${token.platform}`,
            name: this.getDisplayName(token.platform),
            platform: token.platform,
            type: 'advertising' as const,
            connected: !!token.token_data,  // Just check if encrypted data exists
            last_sync: token.updated_at,
            account_info: null  // Encrypted, so we don't expose it here
          })
        }
      })
      
      const finalPlatforms = Array.from(platformMap.values())
      console.log('🔍 getAdPlatforms: Final merged platforms:', finalPlatforms.map(p => ({ 
        platform: p.platform, 
        connected: p.connected, 
        source: oauthTokens.some(ot => ot.platform === p.platform) ? 'oauth_tokens' : 'user_tokens',
        lastSync: p.last_sync
      })))
      
      return finalPlatforms
    } catch (error) {
      console.error('❌ Error fetching ad platforms:', error)
      return []
    }
  }

  // Get connected platforms by type
  async getConnectedPlatformsByType(userId: string, type: 'messaging' | 'advertising'): Promise<ConnectedPlatform[]> {
    const allPlatforms = await this.getConnectedPlatforms(userId)
    return allPlatforms.filter(platform => platform.type === type)
  }

  // Get connection counts
  async getConnectionCounts(userId: string): Promise<{ messaging: number; advertising: number; total: number }> {
    const platforms = await this.getConnectedPlatforms(userId)
    const messaging = platforms.filter(p => p.type === 'messaging' && p.connected).length
    const advertising = platforms.filter(p => p.type === 'advertising' && p.connected).length
    
    return {
      messaging,
      advertising,
      total: messaging + advertising
    }
  }

  // Check if a specific platform is connected
  async isPlatformConnected(userId: string, platformId: string): Promise<boolean> {
    const platforms = await this.getConnectedPlatforms(userId)
    return platforms.some(p => p.platform === platformId && p.connected)
  }

  // Clear cache for user (useful after connecting new platforms)
  clearUserCache(userId: string): void {
    const cacheKey = `platforms_${userId}`
    this.connectionCache.delete(cacheKey)
    this.cacheExpiry.delete(cacheKey)
  }

  // Clear all cache
  clearAllCache(): void {
    this.connectionCache.clear()
    this.cacheExpiry.clear()
  }

  // Helper to get display names
  private getDisplayName(platform: string): string {
    const displayNames: Record<string, string> = {
      // Messaging platforms
      whatsapp: 'WhatsApp Business',
      instagram: 'Instagram',
      facebook: 'Facebook Messenger',
      telegram: 'Telegram',
      email: 'Email',
      sms: 'SMS',
      webchat: 'Web Chat',
      
      // Advertising platforms
      google_ads: 'Google Ads',
      meta_ads: 'Meta Business',
      youtube: 'YouTube Analytics',
      google_analytics: 'Google Analytics',
      linkedin_ads: 'LinkedIn Ads',
      segment: 'Segment',
      hubspot_crm: 'HubSpot CRM',
      branch: 'Branch',
      tiktok_ads: 'TikTok Ads',
      twitter_ads: 'X (Twitter) Ads',
      snapchat_ads: 'Snapchat Ads',
      pinterest_ads: 'Pinterest Business',
      microsoft_ads: 'Microsoft Ads',
      amazon_ads: 'Amazon Advertising'
    }

    return displayNames[platform] || platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get platform icons
  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      // Messaging platforms
      whatsapp: '📱',
      instagram: '📸',
      facebook: '💬',
      telegram: '✈️',
      email: '📧',
      sms: '💬',
      webchat: '💬',
      
      // Advertising platforms
      google_ads: '🔍',
      meta_ads: '📘',
      youtube: '📺',
      google_analytics: '📊',
      linkedin_ads: '💼',
      segment: '📈',
      hubspot_crm: '🔧',
      branch: '🌿',
      tiktok_ads: '🎵',
      twitter_ads: '🐦',
      snapchat_ads: '👻',
      pinterest_ads: '📌',
      microsoft_ads: '🔍',
      amazon_ads: '📦'
    }

    return icons[platform] || '🔌'
  }
}

export const platformConnectionService = PlatformConnectionService.getInstance()