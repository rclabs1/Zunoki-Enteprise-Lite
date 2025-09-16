"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, Settings, TrendingUp, DollarSign, Target, Zap, CheckCircle, Clock, Activity } from "lucide-react"
import { SmartActionConfirmation } from "@/components/smart-action-confirmation"
import { automationService } from "@/lib/supabase-campaign-service"
import { useAuth } from "@/contexts/auth-context"
import { useTrackPageView } from "@/hooks/use-track-page-view"

interface AutomationRule {
  id: string
  category: "budget" | "bidding" | "targeting" | "creative" | "performance"
  name: string
  description: string
  enabled: boolean
  confidence_threshold: number
  conditions: string[]
  actions: string[]
}

interface PendingAction {
  id: string
  type: string
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
  created_at: string
}

export default function AutopilotPage() {
  useTrackPageView("Autopilot");
  const { user } = useAuth()
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState(false)
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    actionsToday: 0,
    actionsThisWeek: 0,
    avgConfidence: 0,
    successRate: 0,
  })

  // Default automation rules
  const defaultRules: AutomationRule[] = [
    {
      id: "budget-optimization",
      category: "budget",
      name: "Budget Optimization",
      description: "Automatically adjust campaign budgets based on performance",
      enabled: true,
      confidence_threshold: 80,
      conditions: ["ROAS > 3.0", "Spend < 80% of budget", "CTR > 2%"],
      actions: ["Increase budget by 20%", "Redistribute budget across campaigns"],
    },
    {
      id: "bid-management",
      category: "bidding",
      name: "Smart Bidding",
      description: "Optimize bids for maximum ROI across all campaigns",
      enabled: true,
      confidence_threshold: 75,
      conditions: ["CPC trending up", "Conversion rate stable", "Competition analysis"],
      actions: ["Adjust bid modifiers", "Switch bidding strategy", "Optimize for conversions"],
    },
    {
      id: "audience-expansion",
      category: "targeting",
      name: "Audience Expansion",
      description: "Expand or narrow audience targeting based on performance",
      enabled: false,
      confidence_threshold: 85,
      conditions: ["Audience saturation > 70%", "CPM increasing", "Similar audiences available"],
      actions: ["Add lookalike audiences", "Expand geographic targeting", "Add interest categories"],
    },
    {
      id: "creative-rotation",
      category: "creative",
      name: "Creative Optimization",
      description: "Rotate and optimize ad creatives for better performance",
      enabled: true,
      confidence_threshold: 70,
      conditions: ["Creative fatigue detected", "CTR declining", "New creatives available"],
      actions: ["Pause underperforming ads", "Increase budget for top performers", "Test new creatives"],
    },
    {
      id: "performance-alerts",
      category: "performance",
      name: "Performance Monitoring",
      description: "Monitor campaigns and alert for significant changes",
      enabled: true,
      confidence_threshold: 90,
      conditions: ["Performance drop > 20%", "Spend anomaly detected", "Conversion tracking issues"],
      actions: ["Pause affected campaigns", "Send alert notification", "Investigate issues"],
    },
  ]

  useEffect(() => {
    if (user) {
      loadAutomationData()
    }
  }, [user])

  const loadAutomationData = async () => {
    try {
      setIsLoading(true)

      // Load automation rules (in real app, this would come from user preferences)
      setAutomationRules(defaultRules)

      // Load pending actions
      if (!user) return
      const actions = await automationService.getPendingActions(user.uid)
      setPendingActions(
        actions.map((action) => ({
          id: action.id,
          type: action.action,
          title: action.details.title || "Optimization Recommendation",
          description: action.details.description || "Maya has identified an optimization opportunity",
          reasoning: action.details.reasoning || "Based on recent performance data and trends",
          confidence: action.details.confidence || 75,
          risk: action.details.risk || "medium",
          impact: action.details.impact || {
            metric: "ROAS",
            expectedChange: "+15%",
            timeframe: "7 days",
          },
          campaignName: action.details.campaignName || "Campaign",
          platform: action.details.platform || "Google Ads",
          currentValue: action.details.currentValue,
          proposedValue: action.details.proposedValue,
          created_at: action.timestamp,
        })),
      )

      // Load stats
      const history = await automationService.getAutomationHistory(user.uid, 100)
      const today = new Date().toDateString()
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      setStats({
        actionsToday: history.filter((h) => new Date(h.timestamp).toDateString() === today).length,
        actionsThisWeek: history.filter((h) => new Date(h.timestamp) >= weekAgo).length,
        avgConfidence: history.reduce((acc, h) => acc + (h.details.confidence || 75), 0) / Math.max(history.length, 1),
        successRate: 85, // This would be calculated based on actual performance impact
      })
    } catch (error) {
      console.error("Error loading automation data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    setAutomationRules((rules) => rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule)))
  }

  const handleActionClick = (action: PendingAction) => {
    setSelectedAction(action)
    setIsConfirmationOpen(true)
  }

  const handleActionConfirm = async (actionId: string) => {
    try {
      setIsLoading(true)

      // Log the confirmed action
      if (!user) return
      await automationService.logAction(user.uid, selectedAction?.type || "unknown", selectedAction || {}, true)

      // Remove from pending actions
      setPendingActions((actions) => actions.filter((a) => a.id !== actionId))

      setIsConfirmationOpen(false)
      setSelectedAction(null)

      // Reload stats
      await loadAutomationData()
    } catch (error) {
      console.error("Error confirming action:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActionDismiss = async (actionId: string) => {
    try {
      // Remove from pending actions
      setPendingActions((actions) => actions.filter((a) => a.id !== actionId))

      setIsConfirmationOpen(false)
      setSelectedAction(null)
    } catch (error) {
      console.error("Error dismissing action:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "budget":
        return <DollarSign className="h-4 w-4" />
      case "bidding":
        return <TrendingUp className="h-4 w-4" />
      case "targeting":
        return <Target className="h-4 w-4" />
      case "creative":
        return <Zap className="h-4 w-4" />
      case "performance":
        return <Activity className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-400 bg-green-400/10"
      case "medium":
        return "text-yellow-400 bg-yellow-400/10"
      case "high":
        return "text-red-400 bg-red-400/10"
      default:
        return "text-gray-400 bg-gray-400/10"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Brain className="h-8 w-8 text-red-400" />
                </div>
                Maya Autopilot
              </h1>
              <p className="text-gray-400 mt-2">Autonomous campaign optimization powered by AI</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Autopilot Status</p>
                <p className={`font-medium ${isAutopilotEnabled ? "text-green-400" : "text-gray-400"}`}>
                  {isAutopilotEnabled ? "Active" : "Inactive"}
                </p>
              </div>
              <Switch
                checked={isAutopilotEnabled}
                onCheckedChange={setIsAutopilotEnabled}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Actions Today</p>
                  <p className="text-2xl font-bold text-white">{stats.actionsToday}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">This Week</p>
                  <p className="text-2xl font-bold text-white">{stats.actionsThisWeek}</p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Confidence</p>
                  <p className="text-2xl font-bold text-white">{Math.round(stats.avgConfidence)}%</p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="pending" className="data-[state=active]:bg-red-600">
              Pending Actions ({pendingActions.length})
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-red-600">
              Automation Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingActions.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                  <p className="text-gray-400">
                    Maya is monitoring your campaigns. New recommendations will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingActions.map((action) => (
                <Card key={action.id} className="bg-gray-900 border-gray-800 hover:border-red-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                          <Badge className={`${getRiskColor(action.risk)} border-0`}>{action.risk} risk</Badge>
                        </div>
                        <p className="text-gray-400 mb-3">{action.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <span>Campaign: {action.campaignName}</span>
                          <span>Platform: {action.platform}</span>
                          <span>Confidence: {action.confidence}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Expected Impact</p>
                          <p className="text-green-400 font-medium">{action.impact.expectedChange}</p>
                        </div>
                        <Button onClick={() => handleActionClick(action)} className="bg-red-600 hover:bg-red-700">
                          Review
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Confidence Level</span>
                        <span className="text-white">{action.confidence}%</span>
                      </div>
                      <Progress value={action.confidence} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            {automationRules.map((rule) => (
              <Card key={rule.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg text-red-400">{getCategoryIcon(rule.category)}</div>
                      <div>
                        <CardTitle className="text-white">{rule.name}</CardTitle>
                        <p className="text-gray-400 text-sm">{rule.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => handleRuleToggle(rule.id, enabled)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Conditions</h4>
                      <ul className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-400 rounded-full" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Actions</h4>
                      <ul className="space-y-1">
                        {rule.actions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Confidence Threshold</span>
                      <span className="text-white">{rule.confidence_threshold}%</span>
                    </div>
                    <Progress value={rule.confidence_threshold} className="h-2 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Smart Action Confirmation Modal */}
        <SmartActionConfirmation
          action={selectedAction as any}
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleActionConfirm}
          onDismiss={handleActionDismiss}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
