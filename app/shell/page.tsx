"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMaya } from '@/contexts/maya-context'
import { NavigationBar } from './components/navigation-bar'
import { MayaAnalyticsChatPanel } from './components/maya-analytics-chat-panel'
import { ModuleLoader } from './components/module-loader'
import { useDashboard } from '@/contexts/dashboard-context'
import { useIntegrationStatus } from '@/hooks/use-integration-status'
import { platformConnectionService } from '@/lib/services/platform-connection-service'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronDown } from 'lucide-react'

export default function ShellPage() {
  console.log("🔍 ShellPage component loading...")
  const { user, loading: authLoading } = useAuth()
  const { currentModule, navigateToModule } = useMaya()
  const { data: dashboardData } = useDashboard()
  const { getStatusSummary, getConnectedPlatforms } = useIntegrationStatus()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [adPlatformCounts, setAdPlatformCounts] = useState({ messaging: 0, advertising: 0, total: 0 })
  const [connectedAdPlatforms, setConnectedAdPlatforms] = useState<any[]>([])
  const [connectedMessagingPlatforms, setConnectedMessagingPlatforms] = useState<any[]>([])
  const searchParams = useSearchParams()

  // Handle URL module parameter
  useEffect(() => {
    const moduleParam = searchParams.get('module')
    if (moduleParam && moduleParam !== selectedModule) {
      setSelectedModule(moduleParam)
      navigateToModule(moduleParam)
    }
  }, [searchParams, selectedModule, navigateToModule])

  // Sync Maya context with local state and set default module
  useEffect(() => {
    if (currentModule && currentModule !== selectedModule) {
      setSelectedModule(currentModule)
    } else if (!selectedModule && !currentModule) {
      // Set default module to maya-intelligence if none is selected
      setSelectedModule('maya-intelligence')
      navigateToModule('maya-intelligence')
    }
  }, [currentModule, selectedModule, navigateToModule])

  // Load platform connections
  useEffect(() => {
    const loadPlatforms = async () => {
      if (!user?.uid) return

      try {
        const [adPlatforms, messagingPlatforms, counts] = await Promise.all([
          platformConnectionService.getConnectedPlatformsByType(user.uid, 'advertising'),
          platformConnectionService.getConnectedPlatformsByType(user.uid, 'messaging'),
          platformConnectionService.getConnectionCounts(user.uid)
        ])

        setConnectedAdPlatforms(adPlatforms.filter(p => p.connected))
        setConnectedMessagingPlatforms(messagingPlatforms.filter(p => p.connected))
        setAdPlatformCounts(counts)
      } catch (error) {
        console.error('Error loading platforms:', error)
      }
    }

    loadPlatforms()

    // Refresh every 30 seconds
    const interval = setInterval(loadPlatforms, 30000)
    return () => clearInterval(interval)
  }, [user])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Admolabs Agentic Platform...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the platform.</p>
          <a 
            href="/login" 
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  const handleModuleSelect = (module: string) => {
    setSelectedModule(module)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <NavigationBar 
        currentModule={selectedModule} 
        onModuleSelect={handleModuleSelect}
      />

      {/* Live KPI Bar */}
      <div className="bg-secondary border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-8">
              {/* Messaging Platforms */}
              {(getStatusSummary().active > 0 || adPlatformCounts.messaging > 0) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer hover:bg-secondary/50 rounded-lg px-2 py-1 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-muted-foreground">💬 Messaging:</span>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getStatusSummary().active || adPlatformCounts.messaging}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-blue-700">
                      💬 Messaging Platforms ({getStatusSummary().active || adPlatformCounts.messaging})
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Show platforms from integration status hook first, then from our state */}
                    {getConnectedPlatforms().length > 0 ? 
                      getConnectedPlatforms().map((platformName, index) => (
                        <DropdownMenuItem key={`integration-${index}`} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>📧</span>
                          <span className="flex-1">{platformName}</span>
                        </DropdownMenuItem>
                      )) :
                      connectedMessagingPlatforms.map((platform) => (
                        <DropdownMenuItem key={platform.id} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>{platformConnectionService.getPlatformIcon(platform.platform)}</span>
                          <span className="flex-1">{platform.name}</span>
                          {platform.last_sync && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(platform.last_sync).toLocaleDateString()}
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Advertising Platforms */}
              {adPlatformCounts.advertising > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer hover:bg-secondary/50 rounded-lg px-2 py-1 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-muted-foreground">📺 Advertising:</span>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {adPlatformCounts.advertising}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-green-700">
                      📺 Ad Platforms ({adPlatformCounts.advertising})
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {connectedAdPlatforms.map((platform) => (
                      <DropdownMenuItem key={platform.id} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>{platformConnectionService.getPlatformIcon(platform.platform)}</span>
                        <span className="flex-1">{platform.name}</span>
                        {platform.last_sync && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(platform.last_sync).toLocaleDateString()}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Total Count */}
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">
                  {getStatusSummary().active + adPlatformCounts.advertising}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {dashboardData && (
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                🔄 Live
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <ModuleLoader currentModule={selectedModule} />
      </main>

      {/* Maya Analytics Chat Panel - Hidden on Maya Intelligence page, minimized on others */}
      {selectedModule !== 'maya-intelligence' && <MayaAnalyticsChatPanel defaultMinimized={true} />}
    </div>
  )
}