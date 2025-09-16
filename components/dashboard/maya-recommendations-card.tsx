"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Zap,
  ArrowRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommendation {
  id: string
  type: "optimization" | "alert" | "opportunity" | "insight"
  title: string
  description: string
  impact: string
  confidence: number
  priority: "high" | "medium" | "low"
  actionText?: string
  onAction?: () => void
  dismissible?: boolean
}

interface MayaRecommendationsCardProps {
  recommendations?: Recommendation[]
  loading?: boolean
  className?: string
}

const defaultRecommendations: Recommendation[] = [
  {
    id: "1",
    type: "optimization",
    title: "Increase Google Ads budget by 25%",
    description: "Your Google Ads campaigns are showing 4.2x ROAS with room for scale. Current daily budget utilization is at 98%.",
    impact: "+₹45K potential revenue",
    confidence: 92,
    priority: "high",
    actionText: "Apply Optimization",
    dismissible: true
  },
  {
    id: "2",
    type: "alert",
    title: "Meta Ads CTR declining",
    description: "Your Meta campaigns show 23% drop in CTR over the last 7 days. Creative fatigue detected across 3 ad sets.",
    impact: "Action required",
    confidence: 87,
    priority: "high",
    actionText: "Review Creatives",
    dismissible: true
  },
  {
    id: "3",
    type: "opportunity",
    title: "Untapped YouTube audience segment",
    description: "Found 156K users with 85% similarity to your top converters. This audience shows strong engagement signals.",
    impact: "+40% reach potential",
    confidence: 78,
    priority: "medium",
    actionText: "Create Campaign",
    dismissible: true
  },
  {
    id: "4",
    type: "insight",
    title: "DOOH + Digital synergy performing well",
    description: "Your outdoor campaigns are driving 18% uplift in digital channel performance. Consider increasing DOOH spend.",
    impact: "+₹12K revenue attribution",
    confidence: 94,
    priority: "medium",
    actionText: "View Analysis",
    dismissible: true
  }
]

export default function MayaRecommendationsCard({
  recommendations = defaultRecommendations,
  loading = false,
  className
}: MayaRecommendationsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return TrendingUp
      case "alert":
        return AlertTriangle
      case "opportunity":
        return Target
      case "insight":
        return Sparkles
      default:
        return Zap
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "optimization":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case "alert":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      case "opportunity":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "insight":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20"
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

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
  }

  const activeRecommendations = recommendations.filter(rec => !dismissedIds.has(rec.id))
  const highPriorityCount = activeRecommendations.filter(rec => rec.priority === "high").length

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-[#1a1a1a] rounded w-48" />
              <div className="h-8 w-8 bg-[#1a1a1a] rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-[#1a1a1a] rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a] overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Maya's Insights</h3>
              <p className="text-sm text-gray-400">AI-powered recommendations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {highPriorityCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {highPriorityCount} urgent
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="pt-0 pb-6">
              {activeRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">All caught up! No new recommendations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRecommendations.map((rec, index) => {
                    const Icon = getTypeIcon(rec.type)
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div className={cn(
                          "p-4 rounded-lg border transition-all duration-200",
                          getTypeColor(rec.type),
                          "hover:border-opacity-60"
                        )}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-black/20">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                  {rec.priority}
                                </Badge>
                                <Badge variant="outline" className="border-[#333] text-gray-400 text-xs">
                                  {rec.confidence}% confidence
                                </Badge>
                              </div>
                            </div>
                            
                            {rec.dismissible && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(rec.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-white">{rec.title}</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">{rec.description}</p>
                            
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-sm font-medium text-white">{rec.impact}</span>
                              
                              {rec.actionText && rec.onAction && (
                                <Button
                                  size="sm"
                                  onClick={rec.onAction}
                                  className="bg-white text-black hover:bg-gray-100 h-7 text-xs"
                                >
                                  {rec.actionText}
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}