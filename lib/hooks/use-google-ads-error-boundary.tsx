"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"
import { useGoogleAdsAuthStore } from "@/lib/stores/google-ads-auth-store"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  isGoogleAdsError: boolean
}

/**
 * Error Boundary specifically for Google Ads components
 * Automatically detects Google Ads auth errors and provides appropriate UI
 */
export class GoogleAdsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      isGoogleAdsError: false
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a Google Ads related error
    const isGoogleAdsError = 
      error.message.includes('GOOGLE_ADS_TOKEN_EXPIRED') ||
      error.message.includes('Google Ads') ||
      error.message.includes('google-ads-proxy') ||
      error.name === 'GoogleAdsAuthError'

    return {
      hasError: true,
      error,
      isGoogleAdsError
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GoogleAdsErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // If it's a Google Ads auth error, trigger re-auth modal
    if (this.state.isGoogleAdsError) {
      const { showModal } = useGoogleAdsAuthStore.getState()
      showModal()
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isGoogleAdsError: false })
  }

  handleReconnect = () => {
    const { showModal } = useGoogleAdsAuthStore.getState()
    showModal()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Google Ads specific error UI
      if (this.state.isGoogleAdsError) {
        return <GoogleAdsErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
          onReconnect={this.handleReconnect}
        />
      }

      // Generic error UI
      return <GenericErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
      />
    }

    return this.props.children
  }
}

/**
 * Error fallback specifically for Google Ads authentication errors
 */
function GoogleAdsErrorFallback({ 
  error, 
  onRetry, 
  onReconnect 
}: { 
  error: Error | null
  onRetry: () => void
  onReconnect: () => void
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Google Ads Connection Error
        </CardTitle>
        <CardDescription className="text-red-600">
          There was an issue with your Google Ads connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error?.message.includes('GOOGLE_ADS_TOKEN_EXPIRED') 
              ? 'Your Google Ads authentication has expired. Please reconnect your account to continue.'
              : error?.message || 'An error occurred while connecting to Google Ads.'
            }
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={onReconnect}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Reconnect Google Ads
          </Button>
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Generic error fallback for non-Google Ads errors
 */
function GenericErrorFallback({ 
  error, 
  onRetry 
}: { 
  error: Error | null
  onRetry: () => void
}) {
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-700">
          <AlertTriangle className="h-5 w-5" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          An error occurred while loading this component
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>

        <Button 
          variant="outline" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Hook version of the error boundary for functional components
 */
export function useGoogleAdsErrorBoundary() {
  const { showModal } = useGoogleAdsAuthStore()
  
  const handleError = React.useCallback((error: any) => {
    // Check if it's a Google Ads auth error
    if (
      error?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED' ||
      error?.message?.includes('GOOGLE_ADS_TOKEN_EXPIRED') ||
      error?.message?.includes('Google Ads authentication expired')
    ) {
      showModal()
      return true // Indicates error was handled
    }
    
    return false // Indicates error was not handled
  }, [showModal])

  return { handleError }
}

/**
 * Higher-order component to wrap components with Google Ads error boundary
 */
export function withGoogleAdsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <GoogleAdsErrorBoundary fallback={fallback}>
      <Component {...props} />
    </GoogleAdsErrorBoundary>
  )
  
  WrappedComponent.displayName = `withGoogleAdsErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}