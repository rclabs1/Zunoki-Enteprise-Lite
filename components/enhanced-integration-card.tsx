'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, User, Calendar, ExternalLink, Play, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface GoogleAccount {
  email: string
  name: string
  picture: string | null
  verified_email: boolean
}

interface ConnectionMetadata {
  data_count: number
  status: 'active' | 'error' | 'no_access' | 'expired'
  last_verified_at: string
  connected_via: string
}

interface IntegrationData {
  platform: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  googleAccount?: GoogleAccount
  connectionMetadata?: ConnectionMetadata
  connectedAt?: string
  features: string[]
}

interface EnhancedIntegrationCardProps {
  integration: IntegrationData
  onConnect: (platform: string) => void
  onSwitch: (platform: string) => void
  onDisconnect: (platform: string) => void
  onTest?: (platform: string) => void
}

export default function EnhancedIntegrationCard({
  integration,
  onConnect,
  onSwitch, 
  onDisconnect,
  onTest
}: EnhancedIntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    platform,
    name,
    description,
    icon,
    isConnected,
    googleAccount,
    connectionMetadata,
    connectedAt,
    features
  } = integration

  const handleAction = async (action: () => void) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50/30'
      case 'no_access':
      case 'error':
        return 'border-yellow-200 bg-yellow-50/30'
      case 'expired':
        return 'border-red-200 bg-red-50/30'
      default:
        return 'border-gray-200'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'no_access':
      case 'error':
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Connected</Badge>
      case 'no_access':
        return <Badge variant="destructive" className="text-xs">No Access</Badge>
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>
      default:
        return null
    }
  }

  const getStatusMessage = (status?: string, dataCount?: number, platform?: string) => {
    if (status === 'no_access') {
      return `No ${platform === 'google_analytics' ? 'properties' : 'accounts'} found. This account might not have the required access.`
    }
    if (status === 'error') {
      return 'Connection error. Please check your account access.'
    }
    if (status === 'expired') {
      return 'Connection expired. Please reconnect.'
    }
    return null
  }

  const getExternalUrl = (platform: string) => {
    switch (platform) {
      case 'google_analytics':
        return 'https://analytics.google.com'
      case 'google_ads':
        return 'https://ads.google.com'
      case 'youtube':
        return 'https://youtube.com/creator'
      default:
        return null
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="p-6 border-gray-200 hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500 mb-2">{description}</p>
              <div className="flex flex-wrap gap-1">
                {features.slice(0, 3).map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button 
            onClick={() => handleAction(() => onConnect(platform))}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </Card>
    )
  }

  // Connected state
  const status = connectionMetadata?.status || 'active'
  const dataCount = connectionMetadata?.data_count || 0

  return (
    <Card className={`p-6 transition-all ${getStatusColor(status)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Service Icon */}
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl relative ${
            status === 'active' ? 'bg-green-100' : 
            status === 'no_access' || status === 'error' ? 'bg-yellow-100' : 'bg-gray-100'
          }`}>
            {icon}
            <div className="absolute -top-1 -right-1">
              {getStatusIcon(status)}
            </div>
          </div>
          
          <div className="flex-1">
            {/* Service Name & Status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{name}</h3>
              {getStatusBadge(status)}
            </div>

            {/* Connected Account Info */}
            {googleAccount && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={googleAccount.picture || undefined} />
                  <AvatarFallback className="text-xs">
                    {googleAccount.name?.charAt(0) || googleAccount.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  Connected as: {googleAccount.email}
                </span>
                {googleAccount.name !== googleAccount.email && (
                  <span className="text-xs text-gray-500">({googleAccount.name})</span>
                )}
              </div>
            )}

            {/* Connection Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {connectedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Connected {formatDistanceToNow(new Date(connectedAt))} ago</span>
                </div>
              )}
              {dataCount !== null && dataCount !== undefined && (
                <>
                  <span>•</span>
                  <span>
                    {dataCount} {platform === 'google_analytics' ? 'properties' : 
                                platform === 'google_ads' ? 'accounts' : 
                                platform === 'youtube' ? 'channels' : 'items'}
                  </span>
                </>
              )}
            </div>

            {/* Status Messages */}
            {status !== 'active' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-100 rounded-md mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">
                  {getStatusMessage(status, dataCount, platform)}
                </span>
              </div>
            )}

            {/* Data Quality Indicators */}
            {status === 'active' && dataCount === 0 && (
              <div className="flex items-start gap-2 p-3 bg-blue-100 rounded-md mb-3">
                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">
                  No {platform === 'google_analytics' ? 'properties' : 'accounts'} found. 
                  This account might not have the required access.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onSwitch(platform))}
            disabled={isLoading}
            className="text-xs whitespace-nowrap"
          >
            Switch Account
          </Button>
          
          {status !== 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(() => onConnect(platform))}
              disabled={isLoading}
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
            >
              Reconnect
            </Button>
          )}

          {onTest && status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction(() => onTest(platform))}
              disabled={isLoading}
              className="text-xs"
            >
              {platform === 'google_analytics' && <><Volume2 className="w-3 h-3 mr-1" />Test</>}
              {platform !== 'google_analytics' && 'Test'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction(() => onDisconnect(platform))}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            Disconnect
          </Button>
          
          {/* Quick Access Link */}
          {getExternalUrl(platform) && (
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => window.open(getExternalUrl(platform)!, '_blank')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open in Google
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}