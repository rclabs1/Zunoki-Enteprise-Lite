"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { MayaProvider } from '@/contexts/maya-context'
import { NavigationBar } from '@/app/(app)/shell/components/navigation-bar'
import { MayaChatPanel } from '@/app/(app)/shell/components/maya-chat-panel'
import { ConversationView } from "@/components/conversation-view"
import { useIntegrationStatus } from '@/hooks/use-integration-status'

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth()
  const { getStatusSummary, getConnectedPlatforms } = useIntegrationStatus()
  const [selectedModule, setSelectedModule] = useState<string | null>('conversations')
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

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
    <MayaProvider>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Navigation */}
        <NavigationBar 
          currentModule={selectedModule} 
          onModuleSelect={handleModuleSelect}
        />

        {/* Live KPI Bar - Only show Connected Platforms */}
        <div className="bg-secondary border-b border-border px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Connected Platforms:</span>
                  <span className="font-semibold text-green-600">
                    {getStatusSummary().active}
                  </span>
                  {getConnectedPlatforms().length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({getConnectedPlatforms().join(', ')})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-muted-foreground">
                    Real-time: <span className={`font-semibold ${isRealtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isRealtimeConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          <ConversationView onRealtimeStatusChange={setIsRealtimeConnected} />
        </main>

        {/* Agent Maya Chat Panel */}
        <MayaChatPanel />
      </div>
    </MayaProvider>
  )
}
