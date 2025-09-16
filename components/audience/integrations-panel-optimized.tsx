"use client"

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plug, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import IntegrationCard from './integration-card'
import IntegrationHealthBadge from '@/components/shared/integration-health-badge'
import IntegrationCategoryFilter from '@/components/shared/integration-category-filter'
import { useIntegrationsOptimized } from '@/hooks/useIntegrationsOptimized'
import { IntegrationStatus } from '@/lib/types/integrations'

interface IntegrationsPanelOptimizedProps {
  className?: string
  showInHub?: boolean // For integration hub usage
}

const IntegrationMetricsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  color = "text-gray-400" 
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  color?: string
}) => (
  <Card className="bg-[#141414] border-[#333] p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {change && (
          <p className="text-xs text-emerald-500 mt-1">{change}</p>
        )}
      </div>
      <Icon className={`h-8 w-8 ${color.replace('text-', 'text-').replace('400', '600')}`} />
    </div>
  </Card>
)

const LoadingSkeleton = () => (
  <Card className="bg-[#1f1f1f] border-[#333] text-white">
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-neutral-700 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-neutral-700 rounded" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-700 rounded" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function IntegrationsPanelOptimized({ 
  className,
  showInHub = false 
}: IntegrationsPanelOptimizedProps) {
  const {
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
    getProviderCategories
  } = useIntegrationsOptimized()

  const [filteredIntegrations, setFilteredIntegrations] = useState<IntegrationStatus[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

  // Use filtered integrations or all integrations
  const displayIntegrations = filteredIntegrations.length > 0 ? filteredIntegrations : integrations

  const handleConnect = async (provider: string, credentials?: any) => {
    const success = await connectIntegration(provider, credentials)
    if (!success && error) {
      console.error(`Connection failed: ${error}`)
    }
  }

  const handleSync = async (provider: string) => {
    setSyncing(provider)
    try {
      const result = await syncIntegration(provider)
      if (!result.success) {
        console.error(`Sync failed: ${result.error}`)
      }
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    try {
      const results = await syncAllIntegrations()
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        console.error(`${failed.length} syncs failed`)
      }
    } finally {
      setSyncingAll(false)
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  const categories = getProviderCategories()
  const oauthIntegrations = displayIntegrations.filter(i => i.type === 'oauth')
  const apiKeyIntegrations = displayIntegrations.filter(i => i.type === 'api_key')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: showInHub ? 0 : 0.6 }}
      className={className}
    >
      <Card className="bg-[#1f1f1f] border-[#333] text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-[hsl(var(--primary))]" />
                {showInHub ? 'All Integrations' : 'Platform Integrations'}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {showInHub 
                  ? 'Manage all your marketing platform connections'
                  : 'Connect your marketing platforms for unified audience insights'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <IntegrationHealthBadge metadata={metadata} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Integration Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <IntegrationMetricsCard
              title="Connected"
              value={metadata.totalConnected}
              change={`+${Math.floor(metadata.totalConnected * 0.1)} this week`}
              icon={Plug}
              color="text-emerald-400"
            />
            <IntegrationMetricsCard
              title="Health Score"
              value={`${metadata.healthScore}%`}
              change={metadata.healthScore >= 80 ? "+5% improved" : "needs attention"}
              icon={TrendingUp}
              color={metadata.healthScore >= 80 ? "text-emerald-400" : "text-yellow-400"}
            />
            <IntegrationMetricsCard
              title="Categories"
              value={Object.keys(metadata.byCategory).length}
              icon={Zap}
              color="text-blue-400"
            />
            <IntegrationMetricsCard
              title="Sync Status"
              value={integrations.filter(i => i.status === 'active').length}
              change="All active"
              icon={RefreshCw}
              color="text-purple-400"
            />
          </div>

          {/* Category Filter */}
          <Suspense fallback={<div className="h-20 bg-neutral-800 rounded animate-pulse" />}>
            <IntegrationCategoryFilter
              integrations={integrations}
              onFilterChange={setFilteredIntegrations}
            />
          </Suspense>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshIntegrations}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Integration Tabs */}
          <Tabs defaultValue="oauth" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-[#141414]">
                <TabsTrigger value="oauth" className="flex items-center gap-2">
                  OAuth Providers
                  <Badge variant="secondary" className="bg-[#333]">
                    {oauthIntegrations.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="apikey" className="flex items-center gap-2">
                  API Key Providers
                  <Badge variant="secondary" className="bg-[#333]">
                    {apiKeyIntegrations.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncAll}
                  disabled={syncingAll || metadata.totalConnected === 0}
                  className="border-[#333] text-gray-300 hover:bg-[#333]"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncingAll ? 'animate-spin' : ''}`} />
                  Sync All
                </Button>
              </div>
            </div>

            <TabsContent value="oauth" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {oauthIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.provider}
                    provider={{
                      id: integration.provider,
                      name: integration.name,
                      type: integration.type,
                      category: integration.category,
                      tier: integration.tier
                    } as any}
                    isConnected={integration.connected}
                    lastSyncedAt={integration.lastSynced}
                    onConnect={() => handleConnect(integration.provider)}
                    onDisconnect={() => disconnectIntegration(integration.provider)}
                    onSync={() => handleSync(integration.provider)}
                    loading={integration.loading || syncing === integration.provider}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="apikey" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {apiKeyIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.provider}
                    provider={{
                      id: integration.provider,
                      name: integration.name,
                      type: integration.type,
                      category: integration.category,
                      tier: integration.tier
                    } as any}
                    isConnected={integration.connected}
                    lastSyncedAt={integration.lastSynced}
                    onConnect={(credentials) => handleConnect(integration.provider, credentials)}
                    onDisconnect={() => disconnectIntegration(integration.provider)}
                    onSync={() => handleSync(integration.provider)}
                    loading={integration.loading || syncing === integration.provider}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Integration Summary */}
          <div className="p-4 bg-[#141414] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Integration Summary</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshIntegrations}
                disabled={loading}
                className="border-[#333] text-gray-300 hover:bg-[#333]"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="text-xs text-gray-400">
              {metadata.totalConnected > 0 ? (
                <>
                  {metadata.totalConnected} platform{metadata.totalConnected !== 1 ? 's' : ''} connected across {Object.keys(metadata.byCategory).length} categories. 
                  {showInHub ? (
                    <>Your marketing stack is {metadata.healthScore >= 80 ? 'healthy' : 'needs attention'}.</>
                  ) : (
                    <>Maya Copilot can now access unified audience insights across your marketing stack.</>
                  )}
                </>
              ) : (
                'Connect your first platform to start building comprehensive audience profiles and unlock Maya Copilot insights.'
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}