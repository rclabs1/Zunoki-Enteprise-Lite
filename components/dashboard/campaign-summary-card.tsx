"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Target,
  DollarSign,
  Users,
  MoreHorizontal,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  platform: "google_ads" | "meta_ads" | "youtube" | "linkedin" | "other"
  status: "active" | "paused" | "draft" | "completed"
  budget: {
    spent: number
    total: number
    currency: string
  }
  performance: {
    impressions: number
    clicks: number
    conversions: number
    roas: number
    ctr: number
  }
  trend: "up" | "down" | "neutral"
  lastUpdated: string
}

interface CampaignSummaryCardProps {
  campaign: Campaign
  onStatusChange?: (campaignId: string, status: Campaign["status"]) => void
  onEdit?: (campaignId: string) => void
  onViewDetails?: (campaignId: string) => void
  className?: string
  loading?: boolean
}

const defaultCampaign: Campaign = {
  id: "1",
  name: "Q1 Product Launch - Google Ads",
  platform: "google_ads",
  status: "active",
  budget: {
    spent: 75420,
    total: 100000,
    currency: "₹"
  },
  performance: {
    impressions: 245000,
    clicks: 12250,
    conversions: 892,
    roas: 4.2,
    ctr: 5.0
  },
  trend: "up",
  lastUpdated: "2024-07-19T10:30:00Z"
}

export default function CampaignSummaryCard({
  campaign = defaultCampaign,
  onStatusChange,
  onEdit,
  onViewDetails,
  className,
  loading = false
}: CampaignSummaryCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google_ads":
        return "🎯"
      case "meta_ads":
        return "📘"
      case "youtube":
        return "📺"
      case "linkedin":
        return "💼"
      default:
        return "🚀"
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "google_ads":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "meta_ads":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "youtube":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "linkedin":
        return "bg-sky-500/20 text-sky-400 border-sky-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTrendColor = () => {
    switch (campaign.trend) {
      case "up":
        return "text-emerald-500"
      case "down":
        return "text-red-500"
      default:
        return "text-gray-400"
    }
  }

  const getTrendIcon = () => {
    switch (campaign.trend) {
      case "up":
        return TrendingUp
      case "down":
        return TrendingDown
      default:
        return TrendingUp
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleStatusToggle = async () => {
    if (!onStatusChange) return
    
    setIsUpdating(true)
    const newStatus = campaign.status === "active" ? "paused" : "active"
    
    try {
      await onStatusChange(campaign.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const budgetPercentage = (campaign.budget.spent / campaign.budget.total) * 100
  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-[#1a1a1a] rounded w-48" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
            </div>
            <div className="h-4 bg-[#1a1a1a] rounded w-32" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-[#1a1a1a] rounded w-16" />
                  <div className="h-5 bg-[#1a1a1a] rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={className}
    >
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333] transition-all duration-200 group overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getPlatformIcon(campaign.platform)}</span>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-gray-100 transition-colors">
                    {campaign.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getPlatformColor(campaign.platform)}>
                      {campaign.platform.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStatusToggle}
                disabled={isUpdating}
                className="text-gray-400 hover:text-white"
              >
                {campaign.status === "active" ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(campaign.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
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

        <CardContent className="pt-0">
          {/* Budget Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Budget Used</span>
              <span className="text-sm text-white font-medium">
                {campaign.budget.currency}{campaign.budget.spent.toLocaleString()} / {campaign.budget.currency}{campaign.budget.total.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  budgetPercentage > 90 ? "bg-red-500" :
                  budgetPercentage > 75 ? "bg-yellow-500" : "bg-emerald-500"
                )}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{budgetPercentage.toFixed(1)}% used</span>
              <span>{formatTimeAgo(campaign.lastUpdated)}</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">Impressions</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {formatNumber(campaign.performance.impressions)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">CTR</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {campaign.performance.ctr.toFixed(1)}%
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">Conversions</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {formatNumber(campaign.performance.conversions)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">ROAS</span>
                <TrendIcon className={cn("h-3 w-3", getTrendColor())} />
              </div>
              <p className="text-lg font-semibold text-white">
                {campaign.performance.roas.toFixed(1)}x
              </p>
            </div>
          </div>

          {/* Actions */}
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(campaign.id)}
              variant="outline"
              size="sm"
              className="w-full bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
            >
              View Details
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}