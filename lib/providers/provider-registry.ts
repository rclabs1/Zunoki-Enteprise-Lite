// Centralized provider registry for scalable integration management
import { OAuthProvider, ApiKeyProvider } from '@/lib/types/integrations'

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
    type: 'oauth',
    category: 'advertising',
    tier: 'free',
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
    type: 'oauth',
    category: 'advertising',
    tier: 'free',
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
    type: 'oauth',
    category: 'analytics',
    tier: 'free',
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
    type: 'oauth',
    category: 'analytics',
    tier: 'free',
    setupInstructions: [
      'Enable Google Analytics Reporting API',
      'Set up service account or OAuth',
      'Grant necessary permissions to GA4 property',
      'Configure data retention settings'
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
    type: 'oauth',
    category: 'advertising',
    tier: 'paid',
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
    type: 'oauth',
    category: 'crm',
    tier: 'free',
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
    type: 'oauth',
    category: 'attribution',
    tier: 'paid',
    setupInstructions: [
      'Create Branch account',
      'Set up Branch dashboard app',
      'Configure OAuth credentials',
      'Set up attribution windows'
    ]
  }
}

export const API_KEY_PROVIDERS: Record<string, ApiKeyProvider> = {
  mixpanel: {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product usage analytics and behavioral insights',
    useCase: 'Product usage + behavioral data',
    authMethod: 'Project Token',
    logo: '/logos/mixpanel.svg',
    connected: false,
    type: 'api_key',
    category: 'product',
    tier: 'free',
    setupInstructions: [
      'Log in to your Mixpanel project',
      'Navigate to Project Settings',
      'Copy your Project Token',
      'Optionally get Service Account credentials for advanced features'
    ],
    credentialFields: [
      {
        key: 'project_token',
        label: 'Project Token',
        type: 'password',
        placeholder: 'Enter your Mixpanel project token',
        required: true,
        description: 'Found in Project Settings > Project Token'
      },
      {
        key: 'project_id',
        label: 'Project ID',
        type: 'text',
        placeholder: 'Enter your project ID',
        required: true,
        description: 'Numeric ID found in your project URL'
      }
    ]
  },
  segment: {
    id: 'segment',
    name: 'Segment',
    description: 'Unified customer data and identity resolution',
    useCase: 'Unified identity, source traits',
    authMethod: 'Write Key',
    logo: '/logos/segment.svg',
    connected: false,
    type: 'api_key',
    category: 'product',
    tier: 'free',
    setupInstructions: [
      'Access your Segment workspace',
      'Go to Connections > Sources',
      'Select your source or create a new one',
      'Copy the Write Key from source settings'
    ],
    credentialFields: [
      {
        key: 'write_key',
        label: 'Write Key',
        type: 'password',
        placeholder: 'Enter your Segment write key',
        required: true,
        description: 'Found in Source Settings > API Keys'
      },
      {
        key: 'workspace_slug',
        label: 'Workspace Slug',
        type: 'text',
        placeholder: 'your-workspace-name',
        required: true,
        description: 'Workspace identifier from your Segment URL'
      }
    ]
  }
}

export class ProviderRegistry {
  static getAllProviders(): (OAuthProvider | ApiKeyProvider)[] {
    return [
      ...Object.values(OAUTH_PROVIDERS),
      ...Object.values(API_KEY_PROVIDERS)
    ]
  }

  static getProvider(id: string): OAuthProvider | ApiKeyProvider | null {
    return OAUTH_PROVIDERS[id] || API_KEY_PROVIDERS[id] || null
  }

  static getProvidersByCategory(category: string): (OAuthProvider | ApiKeyProvider)[] {
    return this.getAllProviders().filter(provider => provider.category === category)
  }

  static getProvidersByTier(tier: string): (OAuthProvider | ApiKeyProvider)[] {
    return this.getAllProviders().filter(provider => provider.tier === tier)
  }

  static isOAuthProvider(id: string): boolean {
    return id in OAUTH_PROVIDERS
  }

  static isApiKeyProvider(id: string): boolean {
    return id in API_KEY_PROVIDERS
  }

  static getProviderKeys(): string[] {
    return [...Object.keys(OAUTH_PROVIDERS), ...Object.keys(API_KEY_PROVIDERS)]
  }
}