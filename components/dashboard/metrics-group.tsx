"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MetricCard from "./metric-card"
import { ChevronDown, ChevronUp, Filter, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MetricData {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  category?: string
  loading?: boolean
  onClick?: () => void
}

interface MetricsGroupProps {
  title: string
  description?: string
  metrics: MetricData[]
  category: string
  priority?: "high" | "medium" | "low"
  collapsible?: boolean
  defaultExpanded?: boolean
  loading?: boolean
  className?: string
  onMetricClick?: (metric: MetricData) => void
  onGroupAction?: () => void
  actionLabel?: string
}

export default function MetricsGroup({
  title,
  description,
  metrics,
  category,
  priority = "medium",
  collapsible = false,
  defaultExpanded = true,
  loading = false,
  className,
  onMetricClick,
  onGroupAction,
  actionLabel = "View Details"
}: MetricsGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "revenue":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "performance":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "engagement":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "audience":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "campaigns":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardHeader className="pb-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-[#1a1a1a] rounded w-48" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
            </div>
            <div className="h-4 bg-[#1a1a1a] rounded w-64" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(metrics.length || 3)].map((_, i) => (
              <div key={i} className="h-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333] transition-all duration-200", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              {collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor(category)}>
                  {category}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(priority)}>
                  {priority}
                </Badge>
              </div>
            </div>
            
            {description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#333] text-gray-400">
              {metrics.length} metrics
            </Badge>
            
            {onGroupAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGroupAction}
                className="bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
              >
                {actionLabel}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {(!collapsible || isExpanded) && (
        <motion.div
          initial={collapsible ? { height: 0, opacity: 0 } : false}
          animate={collapsible ? { height: "auto", opacity: 1 } : {}}
          exit={collapsible ? { height: 0, opacity: 0 } : {}}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MetricCard
                    {...metric}
                    onClick={() => {
                      if (metric.onClick) {
                        metric.onClick()
                      } else if (onMetricClick) {
                        onMetricClick(metric)
                      }
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </motion.div>
      )}
    </Card>
  )
}