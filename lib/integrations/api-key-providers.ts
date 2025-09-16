export interface ApiKeyProvider {
  id: string
  name: string
  description: string
  useCase: string
  authMethod: string
  logo: string
  connected: boolean
  lastSyncedAt?: string
  setupInstructions: string[]
  credentialFields: CredentialField[]
}

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder: string
  required: boolean
  description?: string
}

export interface ApiKeyCredentials {
  id: string
  user_id: string
  provider: string
  credentials: Record<string, string>
  account_id?: string
  account_name?: string
  is_active: boolean
  last_synced_at?: Date
  created_at: Date
  updated_at: Date
}

// API Key Provider Configurations
export const API_KEY_PROVIDERS: Record<string, ApiKeyProvider> = {
  mixpanel: {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product usage analytics and behavioral insights',
    useCase: 'Product usage + behavioral data',
    authMethod: 'Project Token',
    logo: '/logos/mixpanel.svg',
    connected: false,
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
      },
      {
        key: 'service_account_username',
        label: 'Service Account Username (Optional)',
        type: 'text',
        placeholder: 'Service account username',
        required: false,
        description: 'For advanced API access and data export'
      },
      {
        key: 'service_account_secret',
        label: 'Service Account Secret (Optional)',
        type: 'password',
        placeholder: 'Service account secret',
        required: false,
        description: 'Secret key for service account authentication'
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
      },
      {
        key: 'source_id',
        label: 'Source ID',
        type: 'text',
        placeholder: 'Source identifier',
        required: true,
        description: 'Unique identifier for your data source'
      }
    ]
  },
  similarweb: {
    id: 'similarweb',
    name: 'SimilarWeb',
    description: 'Competitive traffic intelligence and market analysis',
    useCase: 'Competitive research, traffic intelligence',
    authMethod: 'API Key',
    logo: '/logos/similarweb.svg',
    connected: false,
    setupInstructions: [
      'Sign up for SimilarWeb Pro or Enterprise',
      'Navigate to API Settings in your account',
      'Generate an API key',
      'Copy your API key for integration'
    ],
    credentialFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your SimilarWeb API key',
        required: true,
        description: 'Found in Account Settings > API'
      }
    ]
  },
  prisync: {
    id: 'prisync',
    name: 'Prisync',
    description: 'Real-time competitor price monitoring and analysis',
    useCase: 'Pricing intelligence, competitive analysis',
    authMethod: 'API Key',
    logo: '/logos/prisync.svg',
    connected: false,
    setupInstructions: [
      'Sign up for Prisync account at prisync.com',
      'Navigate to API Settings in your Prisync dashboard',
      'Generate your API key',
      'Copy your API key for integration'
    ],
    credentialFields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Prisync API key',
        required: true,
        description: 'Found in Prisync Dashboard > Settings > API'
      }
    ]
  }
}

// API Key Service Class
export class ApiKeyService {
  // Validate API key credentials
  async validateCredentials(provider: string, credentials: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('/api/integrations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          credentials
        })
      })

      const result = await response.json()
      return result.valid === true
    } catch (error) {
      console.error('Credential validation failed:', error)
      return false
    }
  }

  // Save API key credentials securely
  async saveCredentials(provider: string, credentials: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('/api/integrations/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          credentials
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to save credentials:', error)
      return false
    }
  }

  // Remove API key credentials
  async removeCredentials(provider: string): Promise<boolean> {
    try {
      const response = await fetch('/api/integrations/credentials', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to remove credentials:', error)
      return false
    }
  }

  // Get provider configuration
  getProvider(providerId: string): ApiKeyProvider | null {
    return API_KEY_PROVIDERS[providerId] || null
  }

  // Get all API key providers
  getAllProviders(): ApiKeyProvider[] {
    return Object.values(API_KEY_PROVIDERS)
  }

  // Check if provider uses API key authentication
  isApiKeyProvider(provider: string): boolean {
    return provider in API_KEY_PROVIDERS
  }
}

// Provider-specific data fetchers
export class MixpanelService {
  private projectToken: string
  private projectId: string
  private serviceAccount?: { username: string; secret: string }

  constructor(credentials: Record<string, string>) {
    this.projectToken = credentials.project_token
    this.projectId = credentials.project_id
    if (credentials.service_account_username && credentials.service_account_secret) {
      this.serviceAccount = {
        username: credentials.service_account_username,
        secret: credentials.service_account_secret
      }
    }
  }

  // Get user cohorts and behavioral data
  async getCohorts() {
    try {
      // Mock implementation - replace with actual Mixpanel API calls
      return {
        cohorts: [
          {
            id: 'active_users',
            name: 'Active Users (7 days)',
            size: 15420,
            description: 'Users active in the last 7 days'
          },
          {
            id: 'power_users',
            name: 'Power Users',
            size: 2840,
            description: 'Users with high engagement scores'
          }
        ],
        behavioral_segments: [
          {
            name: 'Feature Adopters',
            size: 8920,
            characteristics: ['Used new features', 'High retention']
          },
          {
            name: 'At-Risk Users',
            size: 1240,
            characteristics: ['Declining activity', 'Low engagement']
          }
        ]
      }
    } catch (error) {
      console.error('Mixpanel API error:', error)
      throw new Error('Failed to fetch Mixpanel cohorts')
    }
  }

  // Get funnel analysis data
  async getFunnelAnalysis() {
    try {
      return {
        funnels: [
          {
            name: 'Sign-up to Activation',
            steps: ['Sign up', 'Email verified', 'First action', 'Activated'],
            conversion_rates: [100, 85, 67, 45],
            total_users: 10000
          }
        ]
      }
    } catch (error) {
      console.error('Mixpanel funnel API error:', error)
      throw new Error('Failed to fetch funnel analysis')
    }
  }

  // Get user properties and traits
  async getUserProperties() {
    try {
      return {
        properties: [
          { name: 'plan_type', values: ['free', 'pro', 'enterprise'] },
          { name: 'user_segment', values: ['new', 'active', 'power'] },
          { name: 'acquisition_channel', values: ['organic', 'paid', 'referral'] }
        ],
        demographics: {
          locations: { 'US': 45, 'UK': 20, 'CA': 15, 'Other': 20 },
          devices: { 'desktop': 60, 'mobile': 35, 'tablet': 5 }
        }
      }
    } catch (error) {
      console.error('Mixpanel properties API error:', error)
      throw new Error('Failed to fetch user properties')
    }
  }
}

export class SegmentService {
  private writeKey: string
  private workspaceSlug: string
  private sourceId: string

  constructor(credentials: Record<string, string>) {
    this.writeKey = credentials.write_key
    this.workspaceSlug = credentials.workspace_slug
    this.sourceId = credentials.source_id
  }

  // Get unified user profiles
  async getUserProfiles() {
    try {
      // Mock implementation - replace with actual Segment API calls
      return {
        profiles: [
          {
            id: 'user_123',
            traits: {
              email: 'user@example.com',
              plan: 'pro',
              industry: 'technology',
              company_size: '51-200'
            },
            computed_traits: {
              lifecycle_stage: 'active',
              ltv: 1250,
              churn_risk: 'low'
            }
          }
        ],
        audience_segments: [
          {
            name: 'High-Value Customers',
            size: 3420,
            criteria: 'LTV > $1000 AND plan = pro'
          },
          {
            name: 'Enterprise Prospects',
            size: 890,
            criteria: 'company_size >= 500 AND trial_started'
          }
        ]
      }
    } catch (error) {
      console.error('Segment API error:', error)
      throw new Error('Failed to fetch user profiles')
    }
  }

  // Get identity graph data
  async getIdentityGraph() {
    try {
      return {
        identity_resolution: {
          total_identities: 45000,
          merged_profiles: 38000,
          identity_sources: ['email', 'user_id', 'anonymous_id', 'phone']
        },
        cross_device_insights: {
          multi_device_users: 15600,
          avg_devices_per_user: 2.3,
          device_attribution: {
            'mobile_to_desktop': 35,
            'desktop_to_mobile': 45,
            'single_device': 20
          }
        }
      }
    } catch (error) {
      console.error('Segment identity API error:', error)
      throw new Error('Failed to fetch identity graph')
    }
  }

  // Get source performance metrics
  async getSourceMetrics() {
    try {
      return {
        sources: [
          {
            name: 'Website',
            events_per_month: 250000,
            unique_users: 15000,
            top_events: ['page_viewed', 'button_clicked', 'form_submitted']
          },
          {
            name: 'Mobile App',
            events_per_month: 180000,
            unique_users: 8500,
            top_events: ['app_opened', 'feature_used', 'purchase_completed']
          }
        ]
      }
    } catch (error) {
      console.error('Segment metrics API error:', error)
      throw new Error('Failed to fetch source metrics')
    }
  }
}