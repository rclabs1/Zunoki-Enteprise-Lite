// Centralized type definitions for integrations across the app
export interface BaseProvider {
  id: string
  name: string
  description: string
  useCase: string
  logo: string
  connected: boolean
  lastSyncedAt?: string
  setupInstructions: string[]
  category: 'advertising' | 'analytics' | 'crm' | 'attribution' | 'product'
  tier: 'free' | 'paid' | 'enterprise'
}

export interface OAuthProvider extends BaseProvider {
  authUrl: string
  scopes: string[]
  type: 'oauth'
}

export interface ApiKeyProvider extends BaseProvider {
  authMethod: string
  credentialFields: CredentialField[]
  type: 'api_key'
}

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder: string
  required: boolean
  description?: string
}

export interface IntegrationStatus {
  provider: string
  name: string
  type: 'oauth' | 'api_key'
  connected: boolean
  lastSynced?: string
  accountName?: string
  status: 'active' | 'expired' | 'error' | 'disconnected'
  loading?: boolean
  category: string
  tier: string
  syncCount?: number
  lastError?: string
}

export interface IntegrationMetadata {
  totalConnected: number
  byCategory: Record<string, number>
  byTier: Record<string, number>
  healthScore: number
  lastSyncTime?: string
}

export interface SyncResult {
  provider: string
  success: boolean
  recordsProcessed: number
  duration: number
  error?: string
}

// Maya Copilot Integration Types
export interface CopilotPromptMapping {
  intent: string
  keywords: string[]
  requiredProviders: string[]
  responseTemplate: string
  priority: 'high' | 'medium' | 'low'
}

export const COPILOT_MAPPINGS: CopilotPromptMapping[] = [
  {
    intent: 'top_converting_segments',
    keywords: ['top converting', 'best segments', 'highest conversion'],
    requiredProviders: ['google_ads', 'meta_insights', 'linkedin_ads'],
    responseTemplate: 'Based on your {platforms} data, your top converting segments are...',
    priority: 'high'
  },
  {
    intent: 'suggest_icps',
    keywords: ['suggest', 'new ICP', 'target audience', 'untapped'],
    requiredProviders: ['google_analytics', 'mixpanel', 'segment'],
    responseTemplate: 'I found {count} untapped ICP segments with high similarity...',
    priority: 'high'
  },
  {
    intent: 'best_roas_source',
    keywords: ['best ROAS', 'most efficient', 'highest return'],
    requiredProviders: ['google_ads', 'meta_insights', 'linkedin_ads'],
    responseTemplate: '{platform} shows the best ROAS at {value}x with...',
    priority: 'high'
  },
  {
    intent: 'platform_performance',
    keywords: ['platform performance', 'compare channels', 'which platform'],
    requiredProviders: ['google_ads', 'meta_insights', 'youtube_analytics'],
    responseTemplate: 'Comparing your platforms: {comparison_data}',
    priority: 'medium'
  }
]