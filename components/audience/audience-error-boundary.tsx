"use client"

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AudienceErrorBoundaryProps {
  children: React.ReactNode
}

interface AudienceErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class AudienceErrorBoundary extends React.Component<
  AudienceErrorBoundaryProps,
  AudienceErrorBoundaryState
> {
  constructor(props: AudienceErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AudienceErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Audience Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-[#1f1f1f] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              There was an error loading your audience data. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-[#141414] rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export default AudienceErrorBoundary