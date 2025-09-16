"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useGoogleAdsAuth } from "@/hooks/use-google-ads-auth"
import { cn } from "@/lib/utils"
import { AlertTriangle, X, Shield, Loader2 } from "lucide-react"

interface GoogleAdsReAuthBannerProps {
  className?: string
  position?: 'top' | 'sticky' | 'relative'
}

export function GoogleAdsReAuthBanner({ 
  className, 
  position = 'sticky' 
}: GoogleAdsReAuthBannerProps) {
  const {
    showReAuthBanner,
    status,
    isExpired,
    isExpiringSoon,
    formatLastSync,
    getDaysUntilExpiry,
    initiateReAuth,
    dismissBanner,
    hideBanner
  } = useGoogleAdsAuth()

  const [isReconnecting, setIsReconnecting] = useState(false)

  // Don't render if banner shouldn't be shown
  if (!showReAuthBanner) return null

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true)
      await initiateReAuth()
      // Redirect happens automatically, so we won't reach this point
    } catch (error) {
      console.error('Failed to initiate reconnection:', error)
      setIsReconnecting(false)
      // Could show an error toast here
    }
  }

  const handleDismiss = () => {
    dismissBanner()
  }

  const handleClose = () => {
    hideBanner()
  }

  // Determine banner style based on status
  const getBannerConfig = () => {
    const lastSync = formatLastSync()
    const daysUntilExpiry = getDaysUntilExpiry()

    if (isExpired || status === 'expired') {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        title: 'Google Ads connection expired',
        message: lastSync 
          ? `Last synced: ${lastSync}. Reconnect to see latest data and manage campaigns.`
          : 'Reconnect to see latest data and manage campaigns.',
        buttonText: 'Reconnect Now',
        buttonVariant: 'destructive' as const
      }
    }

    if (isExpiringSoon && daysUntilExpiry !== null) {
      return {
        variant: 'default' as const,
        icon: Shield,
        title: `Google Ads connection expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        message: 'Reconnect your account to avoid data sync interruptions.',
        buttonText: 'Reconnect Early',
        buttonVariant: 'outline' as const
      }
    }

    // Fallback
    return {
      variant: 'default' as const,
      icon: AlertTriangle,
      title: 'Google Ads connection needs attention',
      message: 'Please reconnect your account to continue syncing data.',
      buttonText: 'Reconnect',
      buttonVariant: 'outline' as const
    }
  }

  const config = getBannerConfig()
  const BannerIcon = config.icon

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    sticky: 'sticky top-0 z-40',
    relative: 'relative'
  }

  return (
    <div className={cn(positionClasses[position], className)}>
      <Alert 
        variant={config.variant}
        className="rounded-none border-x-0 border-t-0"
      >
        <BannerIcon className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">{config.title}</div>
                <div className="text-sm opacity-90">{config.message}</div>
              </div>
            </AlertDescription>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={handleReconnect}
              disabled={isReconnecting}
              variant={config.buttonVariant}
              size="sm"
              className="whitespace-nowrap"
            >
              {isReconnecting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                config.buttonText
              )}
            </Button>
            
            {/* Remind me later button for expiring (not expired) */}
            {!isExpired && (
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-xs whitespace-nowrap opacity-70 hover:opacity-100"
              >
                Remind Later
              </Button>
            )}
            
            {/* Close button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  )
}