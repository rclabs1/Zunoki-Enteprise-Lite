import { supabase } from '@/lib/supabase-campaign-service'

export interface GoogleAccount {
  email: string
  name: string
  picture: string | null
  verified_email: boolean
}

export interface ConnectionMetadata {
  data_count: number
  status: 'active' | 'error' | 'no_access' | 'expired'
  last_verified_at: string
  connected_via: string
}

export interface IntegrationConnection {
  platform: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  googleAccount?: GoogleAccount
  connectionMetadata?: ConnectionMetadata
  connectedAt?: string
  features: string[]
}

// Helper to extract connection info from token data (handles both old and new formats)
export const getConnectionInfo = (tokenData: any) => {
  // New format with enhanced data
  if (tokenData.google_account && tokenData.connection_metadata) {
    return {
      googleAccount: tokenData.google_account,
      connectionMetadata: tokenData.connection_metadata
    }
  }

  // Legacy format - create basic info from available data
  return {
    googleAccount: {
      email: tokenData.account_info?.email || 'Unknown Account',
      name: tokenData.account_info?.name || 'Connected Account', 
      picture: tokenData.account_info?.picture || null,
      verified_email: false
    },
    connectionMetadata: {
      data_count: tokenData.account_info?.totalAccounts || 0,
      status: 'active' as const,
      last_verified_at: tokenData.connected_at || new Date().toISOString(),
      connected_via: 'oauth_flow'
    }
  }
}

// Fetch user's Google integrations with enhanced connection info
export async function fetchUserIntegrations(userId: string): Promise<IntegrationConnection[]> {
  try {
    console.log('🚨 DEBUG fetchUserIntegrations - userId:', userId)
    
    // Try more explicit query with additional debugging
    const query = supabase
      .from('user_tokens')
      .select('platform, token_data, created_at, is_active, user_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      
    console.log('🚨 DEBUG fetchUserIntegrations - query:', query)
    
    const { data: tokens, error } = await query
      
    console.log('🚨 DEBUG fetchUserIntegrations - raw tokens from DB:', tokens)
    console.log('🚨 DEBUG fetchUserIntegrations - DB error:', error)
    
    // Additional debugging - try without is_active filter
    const { data: allTokens } = await supabase
      .from('user_tokens') 
      .select('platform, is_active, user_id')
      .eq('user_id', userId)
      
    console.log('🚨 DEBUG fetchUserIntegrations - ALL tokens (including inactive):', allTokens)

    if (error) {
      console.error('Error fetching integrations:', error)
      return []
    }

    // Define available integrations
    const availableIntegrations = [
      {
        platform: 'google_analytics',
        name: 'Google Analytics',
        description: 'Website analytics and insights',
        icon: '📊',
        features: ['Website analytics', 'User behavior', 'Conversion tracking']
      },
      {
        platform: 'google_ads', 
        name: 'Google Ads',
        description: 'Campaign performance data',
        icon: '🎯',
        features: ['Campaign analytics', 'Performance tracking', 'Optimization tips']
      },
      {
        platform: 'google_shopping',
        name: 'Google Shopping',
        description: 'Merchant Center performance and product insights',
        icon: '🛒',
        features: ['E-commerce metrics', 'Product performance', 'Shopping ads']
      },
      {
        platform: 'google_search_console',
        name: 'Google Search Console',
        description: 'SEO performance and search analytics',
        icon: '🔍',
        features: ['SEO metrics', 'Search performance', 'PPC correlation']
      },
      {
        platform: 'youtube_ads',
        name: 'YouTube Ads',
        description: 'Video advertising performance and reach',
        icon: '🎥',
        features: ['Video ads', 'Brand awareness', 'YouTube channels']
      },
      {
        platform: 'google_my_business',
        name: 'Google My Business',
        description: 'Local business insights and performance',
        icon: '🏢',
        features: ['Local SEO', 'Business metrics', 'Customer reviews']
      },
      {
        platform: 'youtube',
        name: 'YouTube',
        description: 'Video analytics and management', 
        icon: '📺',
        features: ['Video analytics', 'Channel insights', 'Performance metrics']
      },
      {
        platform: 'mixpanel',
        name: 'Mixpanel', 
        description: 'Product analytics and user insights',
        icon: '📈',
        features: ['Event tracking', 'User segmentation', 'Funnel analysis']
      }
    ]

    const results = availableIntegrations.map(integration => {
      const userToken = tokens?.find(t => t.platform === integration.platform)
      console.log(`🚨 DEBUG ${integration.platform} - userToken found:`, !!userToken, userToken?.platform)
      
      if (userToken) {
        const { googleAccount, connectionMetadata } = getConnectionInfo(userToken.token_data)
        
        const result = {
          ...integration,
          isConnected: true,
          googleAccount,
          connectionMetadata,
          connectedAt: userToken.created_at
        }
        console.log(`🚨 DEBUG ${integration.platform} - returning CONNECTED:`, result.isConnected)
        return result
      }

      const result = {
        ...integration,
        isConnected: false
      }
      console.log(`🚨 DEBUG ${integration.platform} - returning NOT CONNECTED:`, result.isConnected)
      return result
    })
    
    console.log('🚨 DEBUG fetchUserIntegrations - FINAL RESULTS:')
    results.forEach(r => console.log(`  ${r.platform}: isConnected=${r.isConnected}`))
    
    return results
  } catch (error) {
    console.error('Error in fetchUserIntegrations:', error)
    return []
  }
}

// Handle switch account action
export const handleSwitchAccount = async (userId: string, platform: string) => {
  try {
    // Mark current connection as switching (but keep it for history)
    await supabase
      .from('user_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform)
    
    // Use the EXACT same OAuth flow as Ad Hub
    // Ad Hub uses: window.location.href = `${oauthProvider.authUrl}?userId=${user.uid}`
    const authPlatform = platform.replace('_', '-') // google_analytics -> google-analytics
    const authUrl = `/api/auth/${authPlatform}?userId=${userId}&source=setup`
    
    window.location.href = authUrl
  } catch (error) {
    console.error('Switch account error:', error)
    throw new Error('Failed to switch account')
  }
}

// Handle disconnect account action
export const handleDisconnectAccount = async (platform: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('user_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform)
      
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Disconnect account error:', error)
    throw new Error('Failed to disconnect account')
  }
}

// Handle connect/reconnect account action  
export const handleConnectAccount = async (platform: string, userId: string) => {
  try {
    const oauthUrl = `/api/auth/${platform.replace('_', '-')}?userId=${userId}&source=connect`
    window.location.href = oauthUrl
  } catch (error) {
    console.error('Connect account error:', error)
    throw new Error('Failed to connect account')
  }
}