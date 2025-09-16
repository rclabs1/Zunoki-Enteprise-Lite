"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, CheckCircle, Target, DollarSign, MousePointer, Zap, ArrowRight } from "lucide-react"
import { useMayaInsights } from "@/hooks/useDashboardData"

export function MayaInsightCard() {
  const { data: mayaData, isLoading } = useMayaInsights();

  const keyMetrics = [
    {
      label: "ROAS",
      value: mayaData?.roas ? `${mayaData.roas.toFixed(1)}x` : "0x",
      change: "+0.8x", // Static for now
      trend: "up",
      icon: DollarSign,
    },
    {
      label: "CTR",
      value: mayaData?.averageCtr ? `${mayaData.averageCtr.toFixed(1)}%` : "0%",
      change: "+0.3%",
      trend: "up",
      icon: MousePointer,
    },
    {
      label: "Spend",
      value: mayaData?.totalSpend ? `₹${(mayaData.totalSpend / 1000).toFixed(0)}K` : "₹0",
      change: "-2.5%",
      trend: "down",
      icon: TrendingUp,
    },
    {
      label: "Conversions",
      value: mayaData?.totalConversions ? `${mayaData.totalConversions.toLocaleString()}` : "0",
      change: "+18%",
      trend: "up",
      icon: Target,
    },
  ]

  // Use real Maya recommendations when available
  const recommendations = mayaData?.recommendations?.length ? 
    mayaData.recommendations.slice(0, 3).map((rec: any) => ({
      title: rec.title,
      impact: rec.impact.expectedChange,
      urgency: rec.risk === 'high' ? 'high' : rec.risk === 'medium' ? 'medium' : 'low',
      confidence: Math.round(rec.confidence * 100),
      action: rec.type === 'budget_increase' ? 'Optimize' :
               rec.type === 'optimize_campaign' ? 'Update' :
               rec.type === 'pause_campaign' ? 'Pause' :
               rec.type === 'enable_campaign' ? 'Enable' : 'Scale',
    })) : [
    {
      title: "Increase Google Ads Budget",
      impact: "+₹12K revenue potential",
      urgency: "high",
      confidence: 92,
      action: "Optimize",
    },
    {
      title: "Refresh Meta Creative Assets",
      impact: "+0.4% CTR improvement",
      urgency: "medium",
      confidence: 87,
      action: "Update",
    },
    {
      title: "Expand DOOH Campaign",
      impact: "+15% brand awareness",
      urgency: "low",
      confidence: 78,
      action: "Scale",
    },
  ]

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border-neutral-700 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Maya's Intelligence Summary</CardTitle>
              <p className="text-sm text-neutral-400 mt-1">Real-time analysis • Last updated 2 minutes ago</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
            23% above industry avg
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Analysis Summary */}
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2">Great performance this week!</h4>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Your campaigns are generating strong returns with a 3.2x ROAS. However, I've detected creative fatigue
                in your Meta campaigns and a significant opportunity to scale your Google Ads budget. Your cross-channel
                attribution shows excellent synergy between DOOH and digital touchpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-400">{metric.label}</span>
                  <Icon className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{metric.value}</div>
                <div
                  className={`text-xs flex items-center mt-1 ${
                    metric.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${metric.trend === "down" ? "rotate-180" : ""}`} />
                  {metric.change}
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Recommendations */}
        <div>
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Zap className="h-4 w-4 text-[hsl(var(--primary))] mr-2" />
            Recommended Actions
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30 hover:border-neutral-600/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-white text-sm">{rec.title}</h5>
                    <Badge className={getUrgencyColor(rec.urgency)}>{rec.urgency}</Badge>
                  </div>
                  <p className="text-xs text-emerald-400 mb-2">{rec.impact}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-400">Confidence:</span>
                    <Progress value={rec.confidence} className="w-16 h-1" />
                    <span className="text-xs text-neutral-400">{rec.confidence}%</span>
                  </div>
                </div>
                <Button size="sm" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white ml-4">
                  {rec.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Channel Attribution Status */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white mb-1">Cross-Channel Attribution</h4>
              <p className="text-sm text-neutral-300">15% lift detected from DOOH + Digital synergy</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
