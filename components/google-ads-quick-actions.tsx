"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useGoogleAdsAuth } from "@/hooks/use-google-ads-auth"
import { useEnhancedGoogleAds } from "@/lib/services/enhanced-google-ads-service"
import { toast } from "sonner"
import { 
  MoreHorizontal, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Settings, 
  Activity,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react"

interface GoogleAdsQuickActionsProps {
  className?: string
  variant?: 'button' | 'dropdown' | 'inline'
  showLabels?: boolean
}

export function GoogleAdsQuickActions({ 
  className, 
  variant = 'dropdown',
  showLabels = false 
}: GoogleAdsQuickActionsProps) {
  const {
    isConnected,
    status,
    isChecking,
    checkAuthStatus,
    showModal,
    formatLastSync
  } = useGoogleAdsAuth()
  
  const { fetchCampaigns, fetchPerformanceMetrics } = useEnhancedGoogleAds()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshData = async () => {
    if (!isConnected) {
      toast.error('Connect Google Ads account first')
      return
    }

    setIsRefreshing(true)
    try {
      const response = await fetchCampaigns()
      if (response.success) {
        toast.success('Google Ads data refreshed')
      } else {
        toast.error(response.error?.message || 'Failed to refresh data')
      }
    } catch (error) {
      toast.error('Failed to refresh Google Ads data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCheckStatus = async () => {
    try {
      await checkAuthStatus()
      toast.success('Connection status updated')
    } catch (error) {
      toast.error('Failed to check status')
    }
  }

  const handleReconnect = () => {
    showModal()
  }

  const handleViewInGoogleAds = () => {
    window.open('https://ads.google.com', '_blank')
  }

  const handleViewReports = () => {
    // Navigate to your reports/insights page
    window.location.href = '/shell?module=insights'
  }

  const handleExportData = async () => {
    if (!isConnected) {
      toast.error('Connect Google Ads account first')
      return
    }

    try {
      const response = await fetchPerformanceMetrics()
      if (response.success && response.data) {
        // Create CSV content
        const campaigns = response.data.campaigns || []
        const csvContent = [
          'Campaign Name,Status,Impressions,Clicks,Cost,CTR,CPC',
          ...campaigns.map(c => 
            `"${c.name}",${c.status},${c.impressions},${c.clicks},${c.cost},${c.ctr},${c.cpc}`
          )
        ].join('\n')

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `google-ads-data-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('Google Ads data exported')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('Failed to export Google Ads data')
    }
  }

  // Inline variant - show buttons in a row
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshData}
          disabled={isRefreshing || !isConnected}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          {showLabels && 'Refresh'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="flex items-center gap-1"
        >
          <Activity className={`h-3 w-3 ${isChecking ? 'animate-pulse' : ''}`} />
          {showLabels && 'Status'}
        </Button>

        {(!isConnected || status !== 'connected') && (
          <Button
            size="sm"
            onClick={handleReconnect}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            {showLabels && 'Connect'}
          </Button>
        )}
      </div>
    )
  }

  // Button variant - single action button
  if (variant === 'button') {
    const primaryAction = !isConnected || status !== 'connected' 
      ? { label: 'Connect Google Ads', action: handleReconnect, icon: ExternalLink }
      : { label: 'Refresh Data', action: handleRefreshData, icon: RefreshCw }

    return (
      <Button
        onClick={primaryAction.action}
        disabled={isRefreshing || isChecking}
        className={`flex items-center gap-2 ${className}`}
      >
        <primaryAction.icon className={`h-4 w-4 ${
          (isRefreshing && primaryAction.icon === RefreshCw) ? 'animate-spin' : ''
        }`} />
        {primaryAction.label}
      </Button>
    )
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Connection Actions */}
        <DropdownMenuItem 
          onClick={handleCheckStatus}
          disabled={isChecking}
        >
          <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-pulse' : ''}`} />
          Check Connection Status
        </DropdownMenuItem>

        {(!isConnected || status !== 'connected') ? (
          <DropdownMenuItem onClick={handleReconnect}>
            <ExternalLink className="h-4 w-4 mr-2" />
            {!isConnected ? 'Connect Google Ads' : 'Reconnect Account'}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleReconnect}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Connection
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Data Actions */}
        <DropdownMenuItem 
          onClick={handleRefreshData}
          disabled={isRefreshing || !isConnected}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Campaign Data
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={handleExportData}
          disabled={!isConnected}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data (CSV)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Navigation Actions */}
        <DropdownMenuItem onClick={handleViewReports}>
          <Calendar className="h-4 w-4 mr-2" />
          View Reports
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleViewInGoogleAds}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Google Ads
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Quick status card with actions
 */
export function GoogleAdsQuickStatus({ className }: { className?: string }) {
  const {
    isConnected,
    status,
    formatLastSync,
    getDaysUntilExpiry,
    isExpired,
    isExpiringSoon
  } = useGoogleAdsAuth()

  const getStatusConfig = () => {
    if (!isConnected) {
      return { icon: AlertCircle, color: 'text-gray-500', text: 'Not connected' }
    }
    if (isExpired) {
      return { icon: AlertCircle, color: 'text-red-500', text: 'Connection expired' }
    }
    if (isExpiringSoon) {
      const days = getDaysUntilExpiry()
      return { icon: AlertCircle, color: 'text-yellow-500', text: `Expires in ${days} days` }
    }
    return { icon: CheckCircle, color: 'text-green-500', text: 'Connected' }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  const lastSync = formatLastSync()

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            <div>
              <div className="font-medium text-sm">Google Ads</div>
              <div className="text-xs text-muted-foreground">
                {statusConfig.text}
                {lastSync && ` • Last sync: ${lastSync}`}
              </div>
            </div>
          </div>
          <GoogleAdsQuickActions variant="dropdown" />
        </div>
      </CardContent>
    </Card>
  )
}