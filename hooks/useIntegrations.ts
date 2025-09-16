"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CredentialManager, EncryptedCredentials } from '@/lib/integrations/credential-manager'
import { OAUTH_PROVIDERS, API_KEY_PROVIDERS } from '@/lib/integrations/oauth-providers'
import { MayaContextTransformer, AudienceContext } from '@/lib/integrations/maya-context-transformer'

export interface IntegrationSummary {
  provider: string
  name: string
  type: 'oauth' | 'api_key'
  connected: boolean
  lastSynced?: string
  accountName?: string
  status: 'active' | 'expired' | 'error' | 'disconnected'
  loading?: boolean
}

export interface UseIntegrationsReturn {
  integrations: IntegrationSummary[]
  connectedCount: number
  loading: boolean
  error: string | null
  refreshIntegrations: () => Promise<void>
  connectIntegration: (provider: string) => Promise<boolean>
  disconnectIntegration: (provider: string) => Promise<boolean>
  syncIntegration: (provider: string) => Promise<boolean>
  getProviderInfo: (provider: string) => any
}

export const useIntegrations = (): UseIntegrationsReturn => {
  const { data: session } = useSession()
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const credentialManager = new CredentialManager()

  const buildIntegrationSummary = useCallback((credentials: EncryptedCredentials[]): IntegrationSummary[] => {
    const allProviders = { ...OAUTH_PROVIDERS, ...API_KEY_PROVIDERS }
    
    return Object.entries(allProviders).map(([providerId, providerConfig]) => {
      const credential = credentials.find(c => c.provider === providerId)
      
      let status: IntegrationSummary['status'] = 'disconnected'
      if (credential) {
        if (!credential.is_active) {
          status = 'disconnected'
        } else if (credentialManager.isCredentialExpired(credential)) {
          status = 'expired'
        } else {
          status = 'active'
        }
      }

      return {
        provider: providerId,
        name: providerConfig.name,
        type: 'authUrl' in providerConfig ? 'oauth' : 'api_key',
        connected: credential?.is_active || false,
        lastSynced: credential?.last_synced_at?.toString(),
        accountName: credential?.account_name,
        status
      }
    })
  }, [credentialManager])

  const loadIntegrations = useCallback(async () => {
    if (!session?.user?.id) {
      setIntegrations([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const credentials = await credentialManager.getUserIntegrations(session.user.id)
      const summaries = buildIntegrationSummary(credentials)
      setIntegrations(summaries)
    } catch (err: any) {
      console.error('Failed to load integrations:', err)
      setError(err.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, credentialManager, buildIntegrationSummary])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  const refreshIntegrations = useCallback(async () => {
    setLoading(true)
    await loadIntegrations()
  }, [loadIntegrations])

  const connectIntegration = useCallback(async (provider: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    try {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.provider === provider 
            ? { ...integration, loading: true }
            : integration
        )
      )

      // For OAuth providers, this would redirect to OAuth flow
      // For API key providers, credentials are saved through the UI dialog
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Refresh integrations to get updated status
      await loadIntegrations()
      
      return true
    } catch (err: any) {
      console.error(`Failed to connect ${provider}:`, err)
      setError(err.message || `Failed to connect to ${provider}`)
      return false
    } finally {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.provider === provider 
            ? { ...integration, loading: false }
            : integration
        )
      )
    }
  }, [session?.user?.id, loadIntegrations])

  const disconnectIntegration = useCallback(async (provider: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    try {
      const success = await credentialManager.removeIntegration(session.user.id, provider)
      if (success) {
        await loadIntegrations()
      }
      return success
    } catch (err: any) {
      console.error(`Failed to disconnect ${provider}:`, err)
      setError(err.message || `Failed to disconnect ${provider}`)
      return false
    }
  }, [session?.user?.id, credentialManager, loadIntegrations])

  const syncIntegration = useCallback(async (provider: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    try {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.provider === provider 
            ? { ...integration, loading: true }
            : integration
        )
      )

      // Trigger data sync for the provider
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider })
      })

      const success = response.ok
      if (success) {
        await credentialManager.updateLastSync(session.user.id, provider)
        await loadIntegrations()
      }

      return success
    } catch (err: any) {
      console.error(`Failed to sync ${provider}:`, err)
      setError(err.message || `Failed to sync ${provider}`)
      return false
    } finally {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.provider === provider 
            ? { ...integration, loading: false }
            : integration
        )
      )
    }
  }, [session?.user?.id, credentialManager, loadIntegrations])

  const getProviderInfo = useCallback((provider: string) => {
    return OAUTH_PROVIDERS[provider] || API_KEY_PROVIDERS[provider] || null
  }, [])

  const connectedCount = integrations.filter(integration => integration.connected).length

  return {
    integrations,
    connectedCount,
    loading,
    error,
    refreshIntegrations,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    getProviderInfo
  }
}

// Hook for Maya Copilot context
export interface UseMayaContextReturn {
  context: AudienceContext | null
  summary: string | null
  loading: boolean
  error: string | null
  refreshContext: () => Promise<void>
  isStale: boolean
}

export const useMayaContext = (): UseMayaContextReturn => {
  const { data: session } = useSession()
  const [context, setContext] = useState<AudienceContext | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const transformer = new MayaContextTransformer()

  const loadContext = useCallback(async () => {
    if (!session?.user?.id) {
      setContext(null)
      setSummary(null)
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)

      // Check for cached context first
      const response = await fetch('/api/maya/context')
      let audienceContext: AudienceContext

      if (response.ok) {
        const cached = await response.json()
        if (cached && cached.context_data) {
          audienceContext = cached.context_data
          setSummary(cached.summary_text)
        } else {
          throw new Error('No cached context found')
        }
      } else {
        // Generate new context
        audienceContext = await transformer.transformAudienceData(session.user.id)
        const naturalSummary = await transformer.generateNaturalLanguageSummary(audienceContext)
        
        // Cache the context
        await fetch('/api/maya/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: audienceContext,
            summary: naturalSummary
          })
        })

        setSummary(naturalSummary)
      }

      setContext(audienceContext)
    } catch (err: any) {
      console.error('Failed to load Maya context:', err)
      setError(err.message || 'Failed to load audience context')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, transformer])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const refreshContext = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      // Force regenerate context
      const audienceContext = await transformer.transformAudienceData(session.user.id)
      const naturalSummary = await transformer.generateNaturalLanguageSummary(audienceContext)
      
      // Update cache
      await fetch('/api/maya/context', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: audienceContext,
          summary: naturalSummary
        })
      })

      setContext(audienceContext)
      setSummary(naturalSummary)
      setError(null)
    } catch (err: any) {
      console.error('Failed to refresh Maya context:', err)
      setError(err.message || 'Failed to refresh context')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, transformer])

  // Check if context is stale (older than 1 hour)
  const isStale = context 
    ? new Date().getTime() - new Date(context.timestamp).getTime() > 60 * 60 * 1000
    : false

  return {
    context,
    summary,
    loading,
    error,
    refreshContext,
    isStale
  }
}

// Hook for cross-platform performance metrics
export interface UsePerformanceMetricsReturn {
  metrics: any[]
  loading: boolean
  error: string | null
  refreshMetrics: () => Promise<void>
  getMetricsByPlatform: (platform: string) => any[]
  getTopPerformers: (metric: string) => any[]
}

export const usePerformanceMetrics = (): UsePerformanceMetricsReturn => {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = useCallback(async () => {
    if (!session?.user?.id) {
      setMetrics([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/integrations/metrics')
      
      if (!response.ok) {
        throw new Error(`Failed to load metrics: ${response.statusText}`)
      }

      const data = await response.json()
      setMetrics(data.metrics || [])
    } catch (err: any) {
      console.error('Failed to load performance metrics:', err)
      setError(err.message || 'Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  const refreshMetrics = useCallback(async () => {
    setLoading(true)
    await loadMetrics()
  }, [loadMetrics])

  const getMetricsByPlatform = useCallback((platform: string) => {
    return metrics.filter(metric => metric.platform === platform)
  }, [metrics])

  const getTopPerformers = useCallback((metricName: string) => {
    return metrics
      .filter(metric => metric.metric_name === metricName)
      .sort((a, b) => b.metric_value - a.metric_value)
      .slice(0, 5)
  }, [metrics])

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
    getMetricsByPlatform,
    getTopPerformers
  }
}