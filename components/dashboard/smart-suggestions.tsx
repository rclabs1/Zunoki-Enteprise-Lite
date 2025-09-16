"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  Users,
  Clock,
  Lightbulb,
  Zap,
  ChevronRight,
  X,
  RefreshCw,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SuggestionData {
  campaignId?: string
  campaignName?: string
  metric: string
  currentValue: number
  threshold: number
  change: number
  timeframe: string
}

interface SmartSuggestion {
  id: string
  type: "alert" | "opportunity" | "optimization" | "insight"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  impact: string
  confidence: number
  data: SuggestionData
  actions: {
    primary?: {
      label: string
      action: () => void
    }
    secondary?: {
      label: string
      action: () => void
    }
  }
  dismissible: boolean
  createdAt: string
}

interface SmartSuggestionsProps {
  suggestions?: SmartSuggestion[]
  onSuggestionAction?: (suggestionId: string, actionType: 'accept' | 'dismiss' | 'view') => void
  onRefresh?: () => void
  loading?: boolean
  className?: string
}

const generateSmartSuggestions = (): SmartSuggestion[] => [
  {
    id: "high-cac-campaign-x",
    type: "alert",
    priority: "high",
    title: "🔥 High CAC on Campaign X",
    description: "Your Google Ads campaign 'Holiday Sale 2024' has a CAC 47% above your target. Consider pausing underperforming ad sets or adjusting bidding strategy.",
    impact: "Could save ₹15K/week",
    confidence: 92,
    data: {
      campaignId: "camp_123",
      campaignName: "Holiday Sale 2024",
      metric: "CAC",
      currentValue: 1847,
      threshold: 1250,
      change: 47,
      timeframe: "Last 7 days"
    },
    actions: {
      primary: {
        label: "Pause Campaign",
        action: () => console.log("Pausing campaign")
      },
      secondary: {
        label: "Adjust Bids",
        action: () => console.log("Adjusting bids")
      }
    },
    dismissible: true,
    createdAt: "2024-07-19T10:30:00Z"
  },
  {
    id: "weekend-conversions-high",
    type: "opportunity",
    priority: "medium",
    title: "📈 Weekend conversions are high",
    description: "Your Meta Ads campaigns show 34% higher conversion rates on weekends. Consider shifting 20% of your weekday budget to Saturday-Sunday.",
    impact: "+₹8K revenue potential",
    confidence: 87,
    data: {
      metric: "Conversion Rate",
      currentValue: 4.2,
      threshold: 3.1,
      change: 34,
      timeframe: "Last 30 days"
    },
    actions: {
      primary: {
        label: "Shift Budget",
        action: () => console.log("Shifting budget")
      },
      secondary: {
        label: "View Analysis",
        action: () => console.log("Viewing analysis")
      }
    },
    dismissible: true,
    createdAt: "2024-07-19T09:15:00Z"
  },
  {
    id: "mobile-performance-drop",
    type: "optimization",
    priority: "medium", 
    title: "📱 Mobile performance declining",
    description: "Mobile CTR dropped 23% this week across all campaigns. Your mobile landing pages might need optimization or ad creatives refresh.",
    impact: "Potential 15% CTR improvement",
    confidence: 78,
    data: {
      metric: "Mobile CTR",
      currentValue: 2.8,
      threshold: 3.6,
      change: -23,
      timeframe: "Last 7 days"
    },
    actions: {
      primary: {
        label: "Optimize Landing Pages",
        action: () => console.log("Optimizing pages")
      },
      secondary: {
        label: "Refresh Creatives",
        action: () => console.log("Refreshing creatives")
      }
    },
    dismissible: true,
    createdAt: "2024-07-19T08:45:00Z"
  },
  {
    id: "audience-overlap-detected",
    type: "insight",
    priority: "low",
    title: "👥 Audience overlap detected",
    description: "Your 'Tech Enthusiasts' and 'Early Adopters' audiences have 67% overlap. Consider consolidating for better budget efficiency.",
    impact: "Reduce audience competition",
    confidence: 94,
    data: {
      metric: "Audience Overlap",
      currentValue: 67,
      threshold: 30,
      change: 67,
      timeframe: "Current"
    },
    actions: {
      primary: {
        label: "Consolidate Audiences",
        action: () => console.log("Consolidating audiences")
      },
      secondary: {
        label: "View Overlap Report",
        action: () => console.log("Viewing report")
      }
    },
    dismissible: true,
    createdAt: "2024-07-19T07:20:00Z"
  },
  {
    id: "budget-underspend",
    type: "opportunity",
    priority: "medium",
    title: "💰 Budget underspend opportunity",
    description: "Your top-performing campaign is only using 73% of daily budget due to limited audience size. Consider expanding targeting or increasing bids.",
    impact: "+₹12K revenue potential",
    confidence: 89,
    data: {
      campaignId: "camp_456",
      campaignName: "Premium Product Launch",
      metric: "Budget Utilization",
      currentValue: 73,
      threshold: 95,
      change: -27,
      timeframe: "Last 7 days"
    },
    actions: {
      primary: {
        label: "Expand Targeting",
        action: () => console.log("Expanding targeting")
      },
      secondary: {
        label: "Increase Bids",
        action: () => console.log("Increasing bids")
      }
    },
    dismissible: true,
    createdAt: "2024-07-19T06:10:00Z"
  }
]

export default function SmartSuggestions({
  suggestions = generateSmartSuggestions(),
  onSuggestionAction,
  onRefresh,
  loading = false,
  className
}: SmartSuggestionsProps) {
  const [filter, setFilter] = useState<"all" | "alert" | "opportunity" | "optimization" | "insight">("all")
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter(suggestion => !dismissedSuggestions.has(suggestion.id))
      .filter(suggestion => filter === "all" || suggestion.type === filter)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }, [suggestions, filter, dismissedSuggestions])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert":
        return AlertTriangle
      case "opportunity":
        return TrendingUp
      case "optimization":
        return Zap
      case "insight":
        return Lightbulb
      default:
        return Lightbulb
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "opportunity":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "optimization":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "insight":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

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

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId))
    if (onSuggestionAction) {
      onSuggestionAction(suggestionId, 'dismiss')
    }
  }

  const handleAccept = (suggestion: SmartSuggestion) => {
    if (suggestion.actions.primary) {
      suggestion.actions.primary.action()
    }
    if (onSuggestionAction) {
      onSuggestionAction(suggestion.id, 'accept')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const filterOptions = [
    { value: "all", label: "All", count: suggestions.length },
    { value: "alert", label: "Alerts", count: suggestions.filter(s => s.type === "alert").length },
    { value: "opportunity", label: "Opportunities", count: suggestions.filter(s => s.type === "opportunity").length },
    { value: "optimization", label: "Optimizations", count: suggestions.filter(s => s.type === "optimization").length },
    { value: "insight", label: "Insights", count: suggestions.filter(s => s.type === "insight").length }
  ]

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-[#1a1a1a] rounded w-48" />
              <div className="h-8 w-24 bg-[#1a1a1a] rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-[#1a1a1a] rounded-lg" />
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Suggestions</h3>
            <p className="text-gray-400 text-sm">AI-powered recommendations based on your campaign data</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] border border-[#333] rounded-lg">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(option.value as any)}
                  className={cn(
                    "h-7 px-3 text-xs font-medium transition-all relative",
                    filter === option.value
                      ? "bg-white text-black hover:bg-gray-100"
                      : "text-gray-400 hover:text-white hover:bg-[#333]"
                  )}
                >
                  {option.label}
                  {option.count > 0 && (
                    <Badge className={cn(
                      "ml-1 h-4 text-xs",
                      filter === option.value 
                        ? "bg-black/20 text-black" 
                        : "bg-[#333] text-gray-400"
                    )}>
                      {option.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No suggestions available</p>
            <p className="text-sm text-gray-500">
              {filter === "all" 
                ? "All suggestions have been addressed or dismissed"
                : `No ${filter} suggestions at this time`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSuggestions.map((suggestion, index) => {
                const TypeIcon = getTypeIcon(suggestion.type)
                
                return (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="bg-[#1a1a1a] border-[#333] hover:border-[#555] transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn(
                              "p-2 rounded-lg flex-shrink-0",
                              getTypeColor(suggestion.type)
                            )}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-white truncate">{suggestion.title}</h4>
                                <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                                  {suggestion.priority}
                                </Badge>
                                <Badge variant="outline" className="border-[#333] text-gray-400 text-xs">
                                  {suggestion.confidence}% confidence
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                {suggestion.description}
                              </p>
                              
                              {/* Data Insights */}
                              <div className="flex items-center gap-4 mb-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-400">
                                    {suggestion.data.metric}: 
                                  </span>
                                  <span className="text-white font-medium">
                                    {suggestion.data.currentValue}
                                    {suggestion.data.metric.includes('Rate') || suggestion.data.metric.includes('CTR') ? '%' : ''}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {suggestion.data.change > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-400" />
                                  )}
                                  <span className={cn(
                                    "font-medium",
                                    suggestion.data.change > 0 ? "text-emerald-400" : "text-red-400"
                                  )}>
                                    {suggestion.data.change > 0 ? '+' : ''}{suggestion.data.change}%
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-400">{suggestion.data.timeframe}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-emerald-400" />
                                  <span className="text-sm font-medium text-emerald-400">
                                    {suggestion.impact}
                                  </span>
                                </div>
                                
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(suggestion.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {suggestion.dismissible && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismiss(suggestion.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-gray-400 hover:text-white flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {suggestion.actions.primary && (
                            <Button
                              size="sm"
                              onClick={() => handleAccept(suggestion)}
                              className="bg-white text-black hover:bg-gray-100 h-8 text-xs"
                            >
                              {suggestion.actions.primary.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          
                          {suggestion.actions.secondary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={suggestion.actions.secondary.action}
                              className="bg-[#0a0a0a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white h-8 text-xs"
                            >
                              {suggestion.actions.secondary.label}
                            </Button>
                          )}
                          
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-green-400"
                              title="Helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                              title="Not helpful"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}