"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricInsight {
  id: string
  title: string
  description: string
  metric: {
    value: string | number
    change: string
    trend: "up" | "down" | "neutral"
    unit?: string
  }
  insight: {
    type: "opportunity" | "warning" | "success" | "info"
    message: string
    confidence: number
    actionable: boolean
  }
  recommendation?: {
    text: string
    action?: () => void
  }
  category: string
  priority: "high" | "medium" | "low"
  icon: React.ComponentType<{ className?: string }>
}

interface MetricInsightTileProps {
  insight: MetricInsight
  onAction?: (insightId: string) => void
  className?: string
  loading?: boolean
  variant?: "default" | "compact"
}

const defaultInsight: MetricInsight = {
  id: "1",
  title: "Conversion Rate Optimization",
  description: "Your Google Ads campaigns show potential for 23% conversion rate improvement",
  metric: {
    value: "4.2",
    change: "+0.8%",
    trend: "up",
    unit: "%"
  },
  insight: {
    type: "opportunity",
    message: "Landing page optimization could increase conversions by 23%",
    confidence: 87,
    actionable: true
  },
  recommendation: {
    text: "Optimize landing pages"
  },
  category: "Performance",
  priority: "high",
  icon: TrendingUp
}

export default function MetricInsightTile({
  insight = defaultInsight,
  onAction,
  className,
  loading = false,
  variant = "default"
}: MetricInsightTileProps) {
  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "opportunity":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "success":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "info":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return Sparkles
      case "warning":
        return AlertTriangle
      case "success":
        return CheckCircle
      case "info":
        return Info
      default:
        return Info
    }
  }

  const getTrendColor = () => {
    switch (insight.metric.trend) {
      case "up":
        return "text-emerald-500"
      case "down":
        return "text-red-500"
      default:
        return "text-gray-400"
    }
  }

  const getTrendIcon = () => {
    switch (insight.metric.trend) {
      case "up":
        return TrendingUp
      case "down":
        return TrendingDown
      default:
        return TrendingUp
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const InsightIcon = getInsightTypeIcon(insight.insight.type)
  const TrendIcon = getTrendIcon()
  const MetricIcon = insight.icon

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-[#1a1a1a] rounded w-32" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
            </div>
            <div className="h-4 bg-[#1a1a1a] rounded w-48" />
            <div className="flex items-center gap-4">
              <div className="h-8 bg-[#1a1a1a] rounded w-16" />
              <div className="h-4 bg-[#1a1a1a] rounded w-24" />
            </div>
            <div className="h-4 bg-[#1a1a1a] rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -1, transition: { duration: 0.2 } }}
        className={className}
      >
        <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333] transition-all duration-200 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1a1a1a] rounded-lg group-hover:bg-[#333] transition-colors">
                  <MetricIcon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-white">
                      {insight.metric.value}{insight.metric.unit}
                    </span>
                    <div className="flex items-center gap-1">
                      <TrendIcon className={cn("h-3 w-3", getTrendColor())} />
                      <span className={cn("text-xs font-medium", getTrendColor())}>
                        {insight.metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className={getInsightTypeColor(insight.insight.type)}>
                <InsightIcon className="h-3 w-3 mr-1" />
                {insight.insight.type}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={className}
    >
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333] transition-all duration-200 group overflow-hidden">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1a1a1a] rounded-xl group-hover:bg-[#333] transition-colors duration-200">
                <MetricIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-gray-100 transition-colors">
                  {insight.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-[#333] text-gray-400">
                    {insight.category}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", getPriorityColor(insight.priority))}>
                    {insight.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className={getInsightTypeColor(insight.insight.type)}>
              <InsightIcon className="h-3 w-3 mr-1" />
              {insight.insight.type}
            </Badge>
          </div>

          {/* Metric */}
          <div className="flex items-end gap-3 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                {insight.metric.value}
              </span>
              {insight.metric.unit && (
                <span className="text-lg text-gray-400">
                  {insight.metric.unit}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 mb-1">
              <TrendIcon className={cn("h-4 w-4", getTrendColor())} />
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {insight.metric.change}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {insight.description}
          </p>

          {/* Insight */}
          <div className={cn(
            "p-4 rounded-lg border mb-4 transition-all duration-200",
            getInsightTypeColor(insight.insight.type),
            "hover:border-opacity-60"
          )}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-white">
                {insight.insight.message}
              </p>
              <Badge variant="outline" className="border-[#333] text-gray-400 text-xs ml-2">
                {insight.insight.confidence}% confidence
              </Badge>
            </div>
          </div>

          {/* Recommendation */}
          {insight.recommendation && insight.insight.actionable && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Recommended action:
              </span>
              <Button
                size="sm"
                onClick={() => {
                  if (insight.recommendation?.action) {
                    insight.recommendation.action()
                  } else if (onAction) {
                    onAction(insight.id)
                  }
                }}
                className="bg-white text-black hover:bg-gray-100 h-8 text-xs"
              >
                {insight.recommendation.text}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}