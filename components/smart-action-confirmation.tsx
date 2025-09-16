"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, Brain, TrendingUp, DollarSign } from "lucide-react"

interface SmartAction {
  id: string
  type:
    | "budget_increase"
    | "budget_decrease"
    | "pause_campaign"
    | "enable_campaign"
    | "bid_adjustment"
    | "audience_expansion"
  title: string
  description: string
  reasoning: string
  confidence: number
  risk: "low" | "medium" | "high"
  impact: {
    metric: string
    expectedChange: string
    timeframe: string
  }
  campaignName: string
  platform: string
  currentValue?: string
  proposedValue?: string
}

interface SmartActionConfirmationProps {
  action: SmartAction | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (actionId: string) => void
  onDismiss: (actionId: string) => void
  isLoading?: boolean
}

export function SmartActionConfirmation({
  action,
  isOpen,
  onClose,
  onConfirm,
  onDismiss,
  isLoading = false,
}: SmartActionConfirmationProps) {
  const [isDismissing, setIsDismissing] = useState(false)

  if (!action) return null

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      case "high":
        return "text-red-400 bg-red-400/10 border-red-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "medium":
        return <AlertTriangle className="h-4 w-4" />
      case "high":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "budget_increase":
      case "budget_decrease":
        return <DollarSign className="h-5 w-5" />
      case "pause_campaign":
      case "enable_campaign":
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Brain className="h-5 w-5" />
    }
  }

  const handleConfirm = () => {
    onConfirm(action.id)
  }

  const handleDismiss = () => {
    setIsDismissing(true)
    onDismiss(action.id)
    setTimeout(() => {
      setIsDismissing(false)
      onClose()
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400">{getActionIcon(action.type)}</div>
            Maya Recommends an Action
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Overview */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                  <p className="text-gray-400">{action.description}</p>
                </div>
                <Badge className={`${getRiskColor(action.risk)} border`}>
                  {getRiskIcon(action.risk)}
                  <span className="ml-1 capitalize">{action.risk} Risk</span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Campaign:</span>
                  <p className="text-white font-medium">{action.campaignName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Platform:</span>
                  <p className="text-white font-medium">{action.platform}</p>
                </div>
                {action.currentValue && (
                  <div>
                    <span className="text-gray-400">Current Value:</span>
                    <p className="text-white font-medium">{action.currentValue}</p>
                  </div>
                )}
                {action.proposedValue && (
                  <div>
                    <span className="text-gray-400">Proposed Value:</span>
                    <p className="text-green-400 font-medium">{action.proposedValue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Maya's Reasoning */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-red-400" />
                Maya's Analysis
              </h4>
              <p className="text-gray-300 leading-relaxed mb-4">{action.reasoning}</p>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Confidence Level</span>
                  <span className="text-white font-medium">{action.confidence}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${action.confidence}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Impact */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Expected Impact
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Metric</p>
                  <p className="text-white font-medium">{action.impact.metric}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expected Change</p>
                  <p className="text-green-400 font-medium">{action.impact.expectedChange}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Timeframe</p>
                  <p className="text-white font-medium">{action.impact.timeframe}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={isLoading || isDismissing}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
          >
            {isDismissing ? "Dismissing..." : "Dismiss"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isDismissing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Applying..." : "Apply Recommendation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
