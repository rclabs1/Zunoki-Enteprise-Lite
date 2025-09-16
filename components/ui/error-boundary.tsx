"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare, 
  Bug,
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  className?: string
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  retry: () => void
  canRetry: boolean
  retryCount: number
  className?: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  retry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))

    // Add a small delay before retry to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      this.forceUpdate()
    }, 100)
  }

  render() {
    const { children, fallback: FallbackComponent, enableRetry = true, maxRetries = 3, className } = this.props
    const { hasError, error, errorInfo, retryCount } = this.state

    if (hasError && error) {
      const canRetry = enableRetry && retryCount < maxRetries

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo!}
            retry={this.retry}
            canRetry={canRetry}
            retryCount={retryCount}
            className={className}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo!}
          retry={this.retry}
          canRetry={canRetry}
          retryCount={retryCount}
          className={className}
        />
      )
    }

    return children
  }
}

function DefaultErrorFallback({
  error,
  errorInfo,
  retry,
  canRetry,
  retryCount,
  className
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const errorDetails = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A'
  }

  const copyErrorDetails = async () => {
    try {
      const errorText = `
Error: ${errorDetails.message}
Timestamp: ${errorDetails.timestamp}
URL: ${errorDetails.url}
User Agent: ${errorDetails.userAgent}

Stack Trace:
${errorDetails.stack}

Component Stack:
${errorDetails.componentStack}
      `.trim()

      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const reportError = () => {
    // This would typically send to your error reporting service
    console.log('Reporting error:', errorDetails)
    
    // Example: Send to error reporting service
    // errorReportingService.report(errorDetails)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-center min-h-[200px] p-4", className)}
    >
      <Card className="w-full max-w-2xl bg-[#0a0a0a] border-[#1a1a1a] overflow-hidden">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-500/20 rounded-lg flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We encountered an unexpected error. This has been logged and our team 
                will investigate. You can try refreshing or report this issue.
              </p>
              {retryCount > 0 && (
                <p className="text-yellow-400 text-sm mt-2">
                  Retry attempt {retryCount}/3
                </p>
              )}
            </div>
          </div>

          {/* Error Summary */}
          <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4 text-red-400" />
              <span className="font-medium text-red-400 text-sm">Error Details</span>
            </div>
            <p className="text-gray-300 text-sm font-mono bg-[#0a0a0a] p-2 rounded border">
              {error.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {canRetry && (
              <Button
                onClick={retry}
                className="bg-white text-black hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button
              variant="outline"
              onClick={reportError}
              className="bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>

          {/* Technical Details (Collapsible) */}
          <div className="border-t border-[#1a1a1a] pt-6">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-white p-0 h-auto"
            >
              <ChevronDown className={cn(
                "h-4 w-4 mr-2 transition-transform",
                showDetails && "rotate-180"
              )} />
              Technical Details
            </Button>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {/* Error Stack */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Stack Trace</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyErrorDetails}
                      className="text-gray-400 hover:text-white h-6 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copied ? "Copied!" : "Copy All"}
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-400 bg-[#0a0a0a] p-3 rounded border border-[#333] overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </div>

                {/* Component Stack */}
                {errorInfo.componentStack && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">
                      Component Stack
                    </label>
                    <pre className="text-xs text-gray-400 bg-[#0a0a0a] p-3 rounded border border-[#333] overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Environment Info */}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Environment
                  </label>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-gray-300 font-mono">{errorDetails.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">URL:</span>
                      <span className="text-gray-300 font-mono truncate ml-2">{errorDetails.url}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Support Link */}
          <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
            <p className="text-xs text-gray-500 text-center">
              Need help? {" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-400 hover:text-blue-300 text-xs"
              >
                Contact Support
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ErrorBoundary
export { type ErrorBoundaryProps, type ErrorFallbackProps }