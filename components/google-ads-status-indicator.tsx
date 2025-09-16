"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useGoogleAdsAuth } from "@/hooks/use-google-ads-auth"
import { cn } from "@/lib/utils"
import { Loader2, Wifi, WifiOff, AlertTriangle } from "lucide-react"

interface GoogleAdsStatusIndicatorProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function GoogleAdsStatusIndicator({ 
  className, 
  showLabel = false, 
  size = 'md' 
}: GoogleAdsStatusIndicatorProps) {
  const {
    isConnected,
    status,
    isChecking,
    customerCount,
    formatLastSync,
    getDaysUntilExpiry,
    isExpired,
    isExpiringSoon
  } = useGoogleAdsAuth()

  // Loading state
  if (isChecking) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        {showLabel && (
          <span className="text-xs text-muted-foreground">Checking...</span>
        )}
      </div>
    )
  }

  // Determine status color and icon
  const getStatusConfig = () => {
    if (!isConnected || status === 'not_connected') {
      return {
        color: 'bg-gray-400',
        badgeVariant: 'secondary' as const,
        icon: WifiOff,
        text: 'Disconnected',
        label: 'Not Connected'
      }
    }

    if (status === 'expired' || isExpired) {
      return {
        color: 'bg-red-500',
        badgeVariant: 'destructive' as const,
        icon: WifiOff,
        text: 'Expired',
        label: 'Connection Expired'
      }
    }

    if (isExpiringSoon) {
      const daysLeft = getDaysUntilExpiry()
      return {
        color: 'bg-yellow-500',
        badgeVariant: 'outline' as const,
        icon: AlertTriangle,
        text: 'Expiring',
        label: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
      }
    }

    return {
      color: 'bg-green-500',
      badgeVariant: 'default' as const,
      icon: Wifi,
      text: 'Connected',
      label: 'Connected'
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  const lastSync = formatLastSync()
  const daysUntilExpiry = getDaysUntilExpiry()

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">Google Ads Connection</div>
      <div className="text-xs space-y-1">
        <div>Status: <span className="font-medium">{statusConfig.label}</span></div>
        {customerCount > 0 && (
          <div>Accounts: <span className="font-medium">{customerCount}</span></div>
        )}
        {lastSync && (
          <div>Last sync: <span className="font-medium">{lastSync}</span></div>
        )}
        {daysUntilExpiry !== null && isConnected && (
          <div>
            {daysUntilExpiry > 0 ? (
              <>Expires in: <span className="font-medium">{daysUntilExpiry} days</span></>
            ) : (
              <span className="font-medium text-red-400">Expired</span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  if (showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusConfig.badgeVariant}
              className={cn("flex items-center gap-1.5 cursor-default", className)}
            >
              <div 
                className={cn(
                  "rounded-full animate-pulse",
                  statusConfig.color,
                  sizeClasses[size]
                )}
              />
              <StatusIcon className="h-3 w-3" />
              <span className="text-xs">{statusConfig.text}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Just the dot indicator
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center cursor-default", className)}>
            <div 
              className={cn(
                "rounded-full animate-pulse",
                statusConfig.color,
                sizeClasses[size]
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}