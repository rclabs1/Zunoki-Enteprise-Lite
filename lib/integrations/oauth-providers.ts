export interface OAuthProvider {
  id: string
  name: string
  description: string
  useCase: string
  authUrl: string
  scopes: string[]
  logo: string
  connected: boolean
  lastSyncedAt?: string
  setupInstructions: string[]
}

export interface OAuthToken {
  access_token: string
  refresh_token?: string
  expires_at?: number
  scope?: string
  token_type?: string
}

export interface IntegrationCredentials {
  id: string
  user_id: string
  provider: string
  access_token: string
  refresh_token?: string
  expires_at?: Date
  scope?: string
  account_id?: string
  account_name?: string
  is_active: boolean
  last_synced_at?: Date
  created_at: Date
  updated_at: Date
}

// OAuth Provider Configurations
export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google_ads: {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Campaign performance, ROAS, and reach analytics',
    useCase: 'Campaigns, ROAS, reach',
    authUrl: '/api/auth/google-ads',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    logo: '/logos/google-ads.svg',
    connected: false,
    setupInstructions: [
      'Create a Google Cloud Platform project',
      'Enable Google Ads API',
      'Set up OAuth 2.0 credentials',
      'Add your domain to authorized origins'
    ]
  },
  meta_insights: {
    id: 'meta_insights',
    name: 'Meta Business',
    description: 'Facebook & Instagram audience insights and reach',
    useCase: 'Facebook + Instagram reach',
    authUrl: '/api/auth/meta',
    scopes: ['ads_read', 'pages_read_engagement', 'instagram_basic'],
    logo: '/logos/meta.svg',
    connected: false,
    setupInstructions: [
      'Create a Meta Developer account',
      'Set up a business app',
      'Request advanced access for required permissions',
      'Configure webhook endpoints'
    ]
  },
  youtube_analytics: {
    id: 'youtube_analytics',
    name: 'YouTube Analytics',
    description: 'Viewer demographics and audience insights',
    useCase: 'Viewer interest, audience reach',
    authUrl: '/api/auth/youtube',
    scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
    logo: '/logos/youtube.svg',
    connected: false,
    setupInstructions: [
      'Enable YouTube Data API v3 in Google Cloud',
      'Enable YouTube Analytics API',
      'Set up OAuth consent screen',
      'Add test users for development'
    ]
  },
  google_analytics: {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Attribution analysis and funnel insights',
    useCase: 'Attribution, funnel analysis',
    authUrl: '/api/auth/google-analytics',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    logo: '/logos/google-analytics.svg',
    connected: false,
    setupInstructions: [
      'Enable Google Analytics Reporting API',
      'Set up service account or OAuth',
      'Grant necessary permissions to GA4 property',
      'Configure data retention settings'
    ]
  },
  google_shopping: {
    id: 'google_shopping',
    name: 'Google Shopping',
    description: 'Merchant Center performance and product insights',
    useCase: 'E-commerce, product ads',
    authUrl: '/api/auth/google-shopping',
    scopes: ['https://www.googleapis.com/auth/content'],
    logo: '/logos/google-shopping.svg',
    connected: false,
    setupInstructions: [
      'Set up Google Merchant Center account',
      'Enable Content API for Shopping',
      'Configure product data feeds',
      'Set up OAuth credentials'
    ]
  },
  google_search_console: {
    id: 'google_search_console',
    name: 'Google Search Console',
    description: 'SEO performance and search analytics',
    useCase: 'SEO + PPC correlation',
    authUrl: '/api/auth/google-search-console',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    logo: '/logos/google-search-console.svg',
    connected: false,
    setupInstructions: [
      'Verify website ownership in Search Console',
      'Enable Search Console API',
      'Set up OAuth credentials',
      'Configure data retention settings'
    ]
  },
  youtube_ads: {
    id: 'youtube_ads',
    name: 'YouTube Ads',
    description: 'Video advertising performance and reach',
    useCase: 'Video ads, brand awareness',
    authUrl: '/api/auth/youtube-ads',
    scopes: ['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/youtube.readonly'],
    logo: '/logos/youtube-ads.svg',
    connected: false,
    setupInstructions: [
      'Link YouTube channel to Google Ads',
      'Enable YouTube Data API',
      'Set up video advertising campaigns',
      'Configure OAuth credentials'
    ]
  },
  google_my_business: {
    id: 'google_my_business',
    name: 'Google My Business',
    description: 'Local business insights and performance',
    useCase: 'Local SEO, business metrics',
    authUrl: '/api/auth/google-my-business',
    scopes: ['https://www.googleapis.com/auth/business.manage'],
    logo: '/logos/google-my-business.svg',
    connected: false,
    setupInstructions: [
      'Claim and verify business on Google',
      'Enable My Business API',
      'Set up business profile',
      'Configure OAuth credentials'
    ]
  },
  linkedin_ads: {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    description: 'B2B targeting and ICP insights',
    useCase: 'B2B targeting, ICP insights',
    authUrl: '/api/auth/linkedin',
    scopes: ['r_ads', 'r_ads_reporting', 'r_organization_social'],
    logo: '/logos/linkedin.svg',
    connected: false,
    setupInstructions: [
      'Create LinkedIn Developer account',
      'Set up Marketing Developer Platform access',
      'Request access to Marketing API',
      'Configure OAuth redirect URLs'
    ]
  },
  hubspot_crm: {
    id: 'hubspot_crm',
    name: 'HubSpot CRM',
    description: 'Lifecycle stages and CRM cohort analysis',
    useCase: 'Lifecycle stage, CRM cohorts',
    authUrl: '/api/auth/hubspot',
    scopes: ['contacts', 'content', 'reports', 'analytics.read'],
    logo: '/logos/hubspot.svg',
    connected: false,
    setupInstructions: [
      'Create HubSpot Developer account',
      'Set up private app or public app',
      'Configure required scopes',
      'Set up webhook endpoints for real-time sync'
    ]
  },
  branch: {
    id: 'branch',
    name: 'Branch',
    description: 'Cross-platform attribution and deep linking',
    useCase: 'Cross-platform attribution',
    authUrl: '/api/auth/branch',
    scopes: ['read', 'export'],
    logo: '/logos/branch.svg',
    connected: false,
    setupInstructions: [
      'Create Branch account',
      'Set up Branch dashboard app',
      'Configure OAuth credentials',
      'Set up attribution windows'
    ]
  }
}

// OAuth Service Class
export class OAuthService {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  // Generate OAuth authorization URL
  generateAuthUrl(provider: string, state?: string): string {
    const config = OAUTH_PROVIDERS[provider]
    if (!config) {
      throw new Error(`OAuth provider ${provider} not found`)
    }

    const params = new URLSearchParams({
      provider,
      redirect_uri: `${this.baseUrl}/api/auth/callback`,
      ...(state && { state })
    })

    return `${config.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(provider: string, code: string, state?: string): Promise<OAuthToken> {
    const response = await fetch('/api/auth/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        code,
        state
      })
    })

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Refresh expired access token
  async refreshToken(provider: string, refreshToken: string): Promise<OAuthToken> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Revoke OAuth token
  async revokeToken(provider: string): Promise<void> {
    const response = await fetch('/api/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider })
    })

    if (!response.ok) {
      throw new Error(`Token revocation failed: ${response.statusText}`)
    }
  }

  // Get provider configuration
  getProvider(providerId: string): OAuthProvider | null {
    return OAUTH_PROVIDERS[providerId] || null
  }

  // Get all providers
  getAllProviders(): OAuthProvider[] {
    return Object.values(OAUTH_PROVIDERS)
  }

  // Check if provider requires OAuth
  isOAuthProvider(provider: string): boolean {
    return provider in OAUTH_PROVIDERS
  }
}

// Provider-specific data fetchers
export class GoogleAdsService {
  constructor(private accessToken: string) {}

  async getCampaigns() {
    // Implementation for Google Ads API
    return []
  }

  async getAudienceInsights() {
    // Implementation for audience insights
    return {}
  }
}

export class MetaInsightsService {
  constructor(private accessToken: string) {}

  async getAdAccounts() {
    // Implementation for Meta Business API
    return []
  }

  async getAudienceInsights() {
    // Implementation for audience insights
    return {}
  }
}

export class YouTubeAnalyticsService {
  constructor(private accessToken: string) {}

  async getChannelAnalytics() {
    // Implementation for YouTube Analytics API
    return {}
  }

  async getAudienceDemographics() {
    // Implementation for audience demographics
    return {}
  }
}

export class LinkedInAdsService {
  constructor(private accessToken: string) {}

  async getCampaigns() {
    // Implementation for LinkedIn Marketing API
    return []
  }

  async getAudienceInsights() {
    // Implementation for LinkedIn audience insights
    return {}
  }
}

export class HubSpotService {
  constructor(private accessToken: string) {}

  async getContacts() {
    // Implementation for HubSpot CRM API
    return []
  }

  async getLifecycleStages() {
    // Implementation for lifecycle stage analysis
    return {}
  }
}

export class BranchService {
  constructor(private accessToken: string) {}

  async getAttributionData() {
    // Implementation for Branch attribution API
    return {}
  }

  async getCrossPlannelInsights() {
    // Implementation for cross-platform insights
    return {}
  }
}