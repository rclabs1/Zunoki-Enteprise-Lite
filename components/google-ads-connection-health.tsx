"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useGoogleAdsAuth } from "@/hooks/use-google-ads-auth"
import { cn } from "@/lib/utils"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar,
  RefreshCw,
  TrendingUp
} from "lucide-react"

interface GoogleAdsConnectionHealthProps {
  className?: string
  showMetrics?: boolean
}

export function GoogleAdsConnectionHealth({ 
  className, 
  showMetrics = true 
}: GoogleAdsConnectionHealthProps) {
  const {
    isConnected,
    status,
    expiresAt,
    lastSync,
    customerCount,
    customerIds,
    isChecking,
    isExpired,
    isExpiringSoon,
    formatLastSync,
    getDaysUntilExpiry,
    checkAuthStatus,
    showModal
  } = useGoogleAdsAuth()

  const [healthScore, setHealthScore] = useState(0)

  // Calculate connection health score
  useEffect(() => {
    let score = 0

    // Base connection (40 points)
    if (isConnected && status === 'connected') {
      score += 40
    }

    // Token validity (30 points)
    if (!isExpired) {
      if (!isExpiringSoon) {
        score += 30 // Healthy expiry
      } else {
        score += 15 // Expiring soon
      }
    }

    // Recent sync (20 points)
    if (lastSync) {
      const syncDate = new Date(lastSync)
      const hoursSinceSync = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceSync < 1) score += 20      // Very recent
      else if (hoursSinceSync < 6) score += 15 // Recent
      else if (hoursSinceSync < 24) score += 10 // Today
      else if (hoursSinceSync < 48) score += 5  // Yesterday
    }

    // Multiple accounts (10 points)
    if (customerCount > 1) score += 10
    else if (customerCount === 1) score += 5

    setHealthScore(score)
  }, [isConnected, status, isExpired, isExpiringSoon, lastSync, customerCount])

  const getHealthStatus = () => {
    if (healthScore >= 85) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
    if (healthScore >= 70) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
    if (healthScore >= 50) return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' }
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  }

  const healthStatus = getHealthStatus()
  const daysUntilExpiry = getDaysUntilExpiry()
  const formattedLastSync = formatLastSync()

  const getStatusIcon = () => {
    if (!isConnected) return <AlertTriangle className="h-5 w-5 text-gray-500" />
    if (isExpired) return <AlertTriangle className="h-5 w-5 text-red-500" />
    if (isExpiringSoon) return <Clock className="h-5 w-5 text-yellow-500" />
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  return (
    <Card className={cn("w-full", healthStatus.bg, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Google Ads Connection Health</CardTitle>
          </div>
          <Badge variant={healthScore >= 70 ? 'default' : 'destructive'} className="font-medium">
            {healthScore}% Health
          </Badge>
        </div>
        <CardDescription>
          Connection status, token validity, and sync performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Health</span>
            <span className={cn("font-medium", healthStatus.color)}>
              {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </span>
          </div>
          <Progress 
            value={healthScore} 
            className={cn(
              "h-2",
              healthScore >= 85 ? "bg-green-100" :
              healthScore >= 70 ? "bg-blue-100" :
              healthScore >= 50 ? "bg-yellow-100" : "bg-red-100"
            )}
          />
        </div>

        {/* Connection Metrics */}
        {showMetrics && (
          <div className="grid grid-cols-2 gap-4">
            {/* Connection Status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Connection</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {isConnected ? (
                  <span className="text-green-600">✓ Active</span>
                ) : (
                  <span className="text-red-600">✗ Disconnected</span>
                )}
              </div>
            </div>

            {/* Token Status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Token</span>
              </div>
              <div className="text-xs">
                {isExpired ? (
                  <span className="text-red-600">Expired</span>
                ) : isExpiringSoon ? (
                  <span className="text-yellow-600">Expires in {daysUntilExpiry} days</span>
                ) : (
                  <span className="text-green-600">Valid</span>
                )}
              </div>
            </div>

            {/* Last Sync */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Sync</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedLastSync || 'Never'}
              </div>
            </div>

            {/* Accounts */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Accounts</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {customerCount} connected
              </div>
            </div>
          </div>
        )}

        {/* Detailed Status Messages */}
        <div className="space-y-2">
          {!isConnected && (
            <div className="flex items-start gap-2 p-2 rounded bg-gray-50 border border-gray-200">
              <AlertTriangle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-gray-700">Not Connected</div>
                <div className="text-gray-600">Connect your Google Ads account to start tracking performance.</div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="flex items-start gap-2 p-2 rounded bg-red-50 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-red-700">Token Expired</div>
                <div className="text-red-600">Your authentication has expired. Reconnect to resume data access.</div>
              </div>
            </div>
          )}

          {isExpiringSoon && !isExpired && (
            <div className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200">
              <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-yellow-700">Expiring Soon</div>
                <div className="text-yellow-600">
                  Token expires in {daysUntilExpiry} days. Reconnect early to avoid interruption.
                </div>
              </div>
            </div>
          )}

          {isConnected && !isExpired && !isExpiringSoon && (
            <div className="flex items-start gap-2 p-2 rounded bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-green-700">Healthy Connection</div>
                <div className="text-green-600">
                  Your Google Ads connection is active and syncing properly.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {(!isConnected || isExpired || isExpiringSoon) && (
            <Button 
              size="sm" 
              onClick={showModal}
              variant={isExpired ? "destructive" : "default"}
              className="flex-1"
            >
              {!isConnected ? 'Connect Google Ads' : 'Reconnect Account'}
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={checkAuthStatus}
            disabled={isChecking}
            className="flex items-center gap-1"
          >
            <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
            Check Status
          </Button>
        </div>

        {/* Customer IDs (if multiple accounts) */}
        {customerIds.length > 1 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Connected Accounts</div>
            <div className="flex flex-wrap gap-1">
              {customerIds.slice(0, 3).map((id, index) => (
                <Badge key={id} variant="outline" className="text-xs">
                  {id.slice(-4)}
                </Badge>
              ))}
              {customerIds.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{customerIds.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}