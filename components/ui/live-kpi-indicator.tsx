"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { platformConnectionService, ConnectedPlatform } from '@/lib/services/platform-connection-service'
import { useAuth } from '@/contexts/auth-context'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react'

export function LiveKPIIndicator() {
  const { user } = useAuth()
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([])
  const [connectionCounts, setConnectionCounts] = useState({ messaging: 0, advertising: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadConnectionData = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      const [platforms, counts] = await Promise.all([
        platformConnectionService.getConnectedPlatforms(user.uid),
        platformConnectionService.getConnectionCounts(user.uid)
      ])

      setConnectedPlatforms(platforms.filter(p => p.connected))
      setConnectionCounts(counts)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading connection data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when user changes
  useEffect(() => {
    loadConnectionData()
  }, [user])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadConnectionData, 30000)
    return () => clearInterval(interval)
  }, [user])

  if (!user || loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    )
  }

  const messagingPlatforms = connectedPlatforms.filter(p => p.type === 'messaging')
  const adPlatforms = connectedPlatforms.filter(p => p.type === 'advertising')

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 rounded-lg border">
      {/* Messaging Platforms */}
      {connectionCounts.messaging > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="secondary" 
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span className="font-medium">Messaging</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
                    {connectionCounts.messaging}
                  </Badge>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </Badge>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-blue-700">
              💬 Messaging Platforms ({connectionCounts.messaging})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {messagingPlatforms.map((platform) => (
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

      {/* Advertising Platforms */}
      {connectionCounts.advertising > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="secondary" 
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer transition-colors px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span>📺</span>
                  <span className="font-medium">Advertising</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
                    {connectionCounts.advertising}
                  </Badge>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </Badge>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-green-700">
              📺 Ad Platforms ({connectionCounts.advertising})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {adPlatforms.map((platform) => (
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

        {/* Separator and Total */}
        {connectionCounts.total > 0 && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium">Total: {connectionCounts.total}</span>
            </div>
          </>
        )}

      {/* No Connections State */}
      {connectionCounts.total === 0 && (
        <Badge 
          variant="outline" 
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>No Connections</span>
        </Badge>
      )}

      {/* Last Update and Live Indicator */}
      {lastUpdate && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">
              Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-green-600 font-medium">🔄 Live</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}