"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plug, Key, Shield, Zap } from 'lucide-react'
import IntegrationCard from './integration-card'
import { OAUTH_PROVIDERS, API_KEY_PROVIDERS } from '@/lib/providers/provider-registry'
import { CredentialManager } from '@/lib/integrations/credential-manager'
import { useSession } from 'next-auth/react'

interface IntegrationStatus {
  provider: string
  connected: boolean
  lastSyncedAt?: string
  accountName?: string
  loading?: boolean
}

export default function IntegrationsPanel() {
  const { data: session } = useSession()
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const credentialManager = new CredentialManager()

  // Load integration statuses
  useEffect(() => {
    if (!session?.user?.id) return

    const loadIntegrations = async () => {
      try {
        const integrations = await credentialManager.getUserIntegrations(session.user.id)
        const statuses: Record<string, IntegrationStatus> = {}

        // Initialize all providers as disconnected
        const oauthKeys = Object.keys(OAUTH_PROVIDERS)
        const apiKeyKeys = Object.keys(API_KEY_PROVIDERS)
        const allProviderKeys = [...oauthKeys, ...apiKeyKeys]
        
        allProviderKeys.forEach(provider => {
          statuses[provider] = { provider, connected: false }
        })

        // Update with actual connection status
        integrations.forEach(integration => {
          statuses[integration.provider] = {
            provider: integration.provider,
            connected: integration.is_active,
            lastSyncedAt: integration.last_synced_at?.toString(),
            accountName: integration.account_name || undefined
          }
        })

        setIntegrationStatuses(statuses)
      } catch (error) {
        console.error('Failed to load integrations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [session?.user?.id])

  const handleConnect = async (provider: string) => {
    if (!session?.user?.id) return

    setIntegrationStatuses(prev => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true }
    }))

    try {
      // For OAuth providers, this would redirect to OAuth flow
      // For API key providers, the dialog handles the connection
      console.log(`Connecting to ${provider}...`)
      
      // Simulate connection success
      setTimeout(() => {
        setIntegrationStatuses(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            connected: true,
            loading: false,
            lastSyncedAt: new Date().toISOString()
          }
        }))
      }, 2000)
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error)
      setIntegrationStatuses(prev => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false }
      }))
    }
  }

  const handleDisconnect = async (provider: string) => {
    if (!session?.user?.id) return

    try {
      await credentialManager.removeIntegration(session.user.id, provider)
      setIntegrationStatuses(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          connected: false,
          lastSyncedAt: undefined,
          accountName: undefined
        }
      }))
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error)
    }
  }

  const handleSync = async (provider: string) => {
    if (!session?.user?.id) return

    setSyncing(provider)
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await credentialManager.updateLastSync(session.user.id, provider)
      setIntegrationStatuses(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          lastSyncedAt: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error(`Failed to sync ${provider}:`, error)
    } finally {
      setSyncing(null)
    }
  }

  const connectedCount = Object.values(integrationStatuses).filter(status => status.connected).length
  const totalCount = Object.keys(integrationStatuses).length

  if (loading) {
    return (
      <Card className="bg-[#1f1f1f] border-[#333] text-white">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-700 rounded w-1/3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-700 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-[#1f1f1f] border-[#333] text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-[hsl(var(--primary))]" />
                Platform Integrations
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Connect your marketing platforms for unified audience insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#555] text-gray-300">
                {connectedCount}/{totalCount} Connected
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="oauth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#141414]">
              <TabsTrigger value="oauth" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                OAuth Providers
              </TabsTrigger>
              <TabsTrigger value="apikey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key Providers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {Object.values(OAUTH_PROVIDERS).map((provider) => {
                  const status = integrationStatuses[provider.id]
                  return (
                    <IntegrationCard
                      key={provider.id}
                      provider={provider}
                      isConnected={status?.connected || false}
                      lastSyncedAt={status?.lastSyncedAt}
                      onConnect={() => handleConnect(provider.id)}
                      onDisconnect={() => handleDisconnect(provider.id)}
                      onSync={() => handleSync(provider.id)}
                      loading={status?.loading || syncing === provider.id}
                    />
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="apikey" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {Object.values(API_KEY_PROVIDERS).map((provider) => {
                  const status = integrationStatuses[provider.id]
                  return (
                    <IntegrationCard
                      key={provider.id}
                      provider={provider}
                      isConnected={status?.connected || false}
                      lastSyncedAt={status?.lastSyncedAt}
                      onConnect={() => handleConnect(provider.id)}
                      onDisconnect={() => handleDisconnect(provider.id)}
                      onSync={() => handleSync(provider.id)}
                      loading={status?.loading || syncing === provider.id}
                    />
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Integration Summary */}
          <div className="mt-6 p-4 bg-[#141414] rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Integration Health</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Refresh all connections
                  window.location.reload()
                }}
                className="border-[#333] text-gray-300 hover:bg-[#333]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh All
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {connectedCount > 0 ? (
                <>
                  {connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected. 
                  Maya Copilot can now access unified audience insights across your marketing stack.
                </>
              ) : (
                'Connect your first platform to start building comprehensive audience profiles.'
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}