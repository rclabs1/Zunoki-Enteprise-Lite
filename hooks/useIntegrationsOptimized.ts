"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { IntegrationStatus, IntegrationMetadata, SyncResult } from '@/lib/types/integrations'
import { ProviderRegistry } from '@/lib/providers/provider-registry'
import { CredentialManager } from '@/lib/integrations/credential-manager'

export interface UseIntegrationsOptimizedReturn {
  integrations: IntegrationStatus[]
  metadata: IntegrationMetadata
  loading: boolean
  error: string | null
  // Actions
  refreshIntegrations: () => Promise<void>
  connectIntegration: (provider: string, credentials?: any) => Promise<boolean>
  disconnectIntegration: (provider: string) => Promise<boolean>
  syncIntegration: (provider: string) => Promise<SyncResult>
  syncAllIntegrations: () => Promise<SyncResult[]>
  // Filters
  getIntegrationsByCategory: (category: string) => IntegrationStatus[]
  getIntegrationsByStatus: (status: string) => IntegrationStatus[]
  getConnectedIntegrations: () => IntegrationStatus[]
  // Provider info
  getProviderInfo: (provider: string) => any
  getProviderCategories: () => string[]
}

export const useIntegrationsOptimized = (): UseIntegrationsOptimizedReturn => {
  const { data: session } = useSession()
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const credentialManager = useMemo(() => new CredentialManager(), [])

  // Calculate metadata from integrations
  const metadata: IntegrationMetadata = useMemo(() => {
    const totalConnected = integrations.filter(i => i.connected).length
    const byCategory = integrations.reduce((acc, integration) => {
      const category = integration.category || 'other'
      acc[category] = (acc[category] || 0) + (integration.connected ? 1 : 0)
      return acc
    }, {} as Record<string, number>)

    const byTier = integrations.reduce((acc, integration) => {
      const tier = integration.tier || 'free'
      acc[tier] = (acc[tier] || 0) + (integration.connected ? 1 : 0)
      return acc
    }, {} as Record<string, number>)

    // Calculate health score based on:
    // - Number of connected integrations (50%)
    // - Recent sync success rate (30%)
    // - Error rate (20%)
    const connectionScore = Math.min((totalConnected / integrations.length) * 100, 100)
    const errorCount = integrations.filter(i => i.status === 'error').length
    const errorScore = Math.max(100 - (errorCount / integrations.length) * 100, 0)
    const healthScore = Math.round(connectionScore * 0.7 + errorScore * 0.3)

    return {
      totalConnected,
      byCategory,
      byTier,
      healthScore,
      lastSyncTime: lastRefresh?.toISOString()
    }
  }, [integrations, lastRefresh])

  // Build integration status from credentials
  const buildIntegrationStatuses = useCallback((credentials: any[]): IntegrationStatus[] => {
    const allProviders = ProviderRegistry.getAllProviders()
    
    return allProviders.map(provider => {
      const credential = credentials.find(c => c.provider === provider.id)
      
      let status: IntegrationStatus['status'] = 'disconnected'
      if (credential) {
        if (!credential.is_active) {
          status = 'disconnected'
        } else if (credential.expires_at && new Date(credential.expires_at) <= new Date()) {
          status = 'expired'
        } else {
          status = 'active'
        }
      }

      return {
        provider: provider.id,
        name: provider.name,
        type: provider.type,
        connected: credential?.is_active || false,
        lastSynced: credential?.last_synced_at?.toString(),
        accountName: credential?.account_name,
        status,
        category: provider.category,
        tier: provider.tier,
        syncCount: 0, // TODO: Get from sync logs
        lastError: credential?.last_error
      }
    })
  }, [])

  // Load integrations with error handling and retries
  const loadIntegrations = useCallback(async (retryCount = 0) => {
    if (!session?.user?.id) {
      setIntegrations([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      const credentials = await credentialManager.getUserIntegrations(session.user.id)
      const statuses = buildIntegrationStatuses(credentials)
      
      setIntegrations(statuses)
      setLastRefresh(new Date())
    } catch (err: any) {
      console.error('Failed to load integrations:', err)
      
      // Retry logic for transient failures
      if (retryCount < 2) {
        setTimeout(() => loadIntegrations(retryCount + 1), 1000 * (retryCount + 1))
        return
      }
      
      setError(err.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, credentialManager, buildIntegrationStatuses])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Refresh integrations
  const refreshIntegrations = useCallback(async () => {
    setLoading(true)
    await loadIntegrations()
  }, [loadIntegrations])

  // Connect integration with optimistic updates
  const connectIntegration = useCallback(async (
    provider: string, 
    credentials?: any
  ): Promise<boolean> => {
    if (!session?.user?.id) return false

    // Optimistic update
    setIntegrations(prev => 
      prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, loading: true }
          : integration
      )
    )

    try {
      if (ProviderRegistry.isOAuthProvider(provider)) {
        // For OAuth providers, redirect to OAuth flow
        const providerInfo = ProviderRegistry.getProvider(provider)
        if (providerInfo && 'authUrl' in providerInfo) {
          window.location.href = providerInfo.authUrl
          return true
        }
      } else if (credentials) {
        // For API key providers, store credentials
        const success = await credentialManager.storeApiKeyCredentials(
          session.user.id,
          provider,
          credentials
        )
        
        if (success) {
          await loadIntegrations()
          return true
        }
      }
      
      return false
    } catch (err: any) {
      console.error(`Failed to connect ${provider}:`, err)
      setError(err.message || `Failed to connect to ${provider}`)
      return false
    } finally {
      // Remove loading state
      setIntegrations(prev => 
        prev.map(integration => 
          integration.provider === provider 
            ? { ...integration, loading: false }
            : integration
        )
      )
    }
  }, [session?.user?.id, credentialManager, loadIntegrations])

  // Disconnect integration
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

  // Sync individual integration
  const syncIntegration = useCallback(async (provider: string): Promise<SyncResult> => {
    if (!session?.user?.id) {
      return { provider, success: false, recordsProcessed: 0, duration: 0, error: 'Not authenticated' }
    }

    const startTime = Date.now()
    
    // Optimistic update
    setIntegrations(prev => 
      prev.map(integration => 
        integration.provider === provider 
          ? { ...integration, loading: true }
          : integration
      )
    )

    try {
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })

      const result = await response.json()
      const duration = Date.now() - startTime

      if (response.ok) {
        await credentialManager.updateLastSync(session.user.id, provider)
        await loadIntegrations()
        
        return {
          provider,
          success: true,
          recordsProcessed: result.recordsProcessed || 0,
          duration
        }
      } else {
        throw new Error(result.error || 'Sync failed')
      }
    } catch (err: any) {
      console.error(`Failed to sync ${provider}:`, err)
      
      return {
        provider,
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        error: err.message
      }
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

  // Sync all connected integrations
  const syncAllIntegrations = useCallback(async (): Promise<SyncResult[]> => {
    const connectedProviders = integrations
      .filter(i => i.connected && i.status === 'active')
      .map(i => i.provider)

    const syncPromises = connectedProviders.map(provider => syncIntegration(provider))
    return Promise.all(syncPromises)
  }, [integrations, syncIntegration])

  // Filter functions
  const getIntegrationsByCategory = useCallback((category: string) => {
    return integrations.filter(integration => integration.category === category)
  }, [integrations])

  const getIntegrationsByStatus = useCallback((status: string) => {
    return integrations.filter(integration => integration.status === status)
  }, [integrations])

  const getConnectedIntegrations = useCallback(() => {
    return integrations.filter(integration => integration.connected)
  }, [integrations])

  const getProviderInfo = useCallback((provider: string) => {
    return ProviderRegistry.getProvider(provider)
  }, [])

  const getProviderCategories = useCallback(() => {
    const categories = new Set(integrations.map(i => i.category))
    return Array.from(categories)
  }, [integrations])

  return {
    integrations,
    metadata,
    loading,
    error,
    refreshIntegrations,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    syncAllIntegrations,
    getIntegrationsByCategory,
    getIntegrationsByStatus,
    getConnectedIntegrations,
    getProviderInfo,
    getProviderCategories
  }
}