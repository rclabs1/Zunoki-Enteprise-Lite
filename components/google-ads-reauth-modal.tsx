"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGoogleAdsAuth } from "@/hooks/use-google-ads-auth"
import { AlertTriangle, Shield, Loader2, ExternalLink } from "lucide-react"

interface GoogleAdsReAuthModalProps {
  isOpen?: boolean
  onClose?: () => void
  authStatus?: {
    status: 'connected' | 'expired' | 'not_connected'
    expiresAt?: string | null
    lastSync?: string | null
  }
  title?: string
  reason?: 'expired' | 'error' | 'manual'
}

export function GoogleAdsReAuthModal({ 
  isOpen: propIsOpen,
  onClose: propOnClose,
  authStatus: propAuthStatus,
  title,
  reason = 'expired'
}: GoogleAdsReAuthModalProps) {
  const {
    showReAuthModal,
    status,
    formatLastSync,
    getDaysUntilExpiry,
    isExpired,
    initiateReAuth,
    hideModal
  } = useGoogleAdsAuth()

  const [isReconnecting, setIsReconnecting] = useState(false)

  // Use props if provided, otherwise use hook state
  const isOpen = propIsOpen !== undefined ? propIsOpen : showReAuthModal
  const onClose = propOnClose || hideModal
  const authStatus = propAuthStatus || { status, expiresAt: null, lastSync: null }

  if (!isOpen) return null

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true)
      await initiateReAuth()
      // Redirect happens automatically, so we won't reach this point
    } catch (error) {
      console.error('Failed to initiate reconnection:', error)
      setIsReconnecting(false)
      // Error will be visible to user through the redirect failure
    }
  }

  const getModalConfig = () => {
    const lastSync = formatLastSync()
    const daysUntilExpiry = getDaysUntilExpiry()

    switch (reason) {
      case 'error':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          title: title || 'Google Ads Re-authentication Required',
          description: 'Your Google Ads connection has expired while trying to fetch data. Please reconnect to continue.',
          urgency: 'high' as const
        }
      
      case 'expired':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          title: title || 'Google Ads Connection Expired',
          description: lastSync 
            ? `Your connection expired. Last successful sync: ${lastSync}. Reconnect to resume data access.`
            : 'Your Google Ads connection has expired. Reconnect to resume data access.',
          urgency: 'high' as const
        }

      case 'manual':
      default:
        if (authStatus.status === 'expired' || isExpired) {
          return {
            icon: AlertTriangle,
            iconColor: 'text-red-500',
            title: title || 'Google Ads Connection Expired',
            description: 'Your connection has expired. Please reconnect to continue accessing your Google Ads data.',
            urgency: 'high' as const
          }
        } else {
          return {
            icon: Shield,
            iconColor: 'text-yellow-500',
            title: title || 'Reconnect Google Ads',
            description: daysUntilExpiry 
              ? `Your connection expires in ${daysUntilExpiry} days. Reconnect now to avoid interruption.`
              : 'Reconnect your Google Ads account to ensure continuous data access.',
            urgency: 'medium' as const
          }
        }
    }
  }

  const config = getModalConfig()
  const ModalIcon = config.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${config.urgency === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <ModalIcon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <DialogTitle className="text-lg font-semibold">
              {config.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant={config.urgency === 'high' ? 'destructive' : 'default'}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">What happens when you reconnect:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Secure OAuth 2.0 authentication with Google</li>
                  <li>• Immediate access to your latest campaign data</li>
                  <li>• Automated data sync resumes</li>
                  <li>• No interruption to your existing campaigns</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>🔒 Your credentials are never stored on our servers</div>
              <div>⚡ Connection typically takes 10-15 seconds</div>
              <div>🔄 You'll be redirected back here after authentication</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isReconnecting}>
            Cancel
          </Button>
          <Button 
            onClick={handleReconnect} 
            disabled={isReconnecting}
            className="min-w-[120px]"
          >
            {isReconnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Reconnect Google Ads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}