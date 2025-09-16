"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronDown, 
  Plus, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Settings,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Platform {
  id: string
  name: string
  icon: string
  category: "advertising" | "analytics" | "insights"
  connected: boolean
  status: "connected" | "disconnected" | "error" | "pending"
  description: string
  features: string[]
  oauth?: {
    authUrl: string
    scopes: string[]
  }
  lastSync?: string
  dataPoints?: number
}

interface PlatformConnectionDropdownProps {
  platforms?: Platform[]
  onConnect?: (platformId: string) => void
  onDisconnect?: (platformId: string) => void
  onManage?: () => void
  loading?: boolean
  className?: string
}

const defaultPlatforms: Platform[] = [
  {
    id: "google_ads",
    name: "Google Ads",
    icon: "🎯",
    category: "advertising",
    connected: true,
    status: "connected",
    description: "Campaign performance, keywords, and ad spend data",
    features: ["Campaign Metrics", "Keyword Performance", "Ad Group Data", "Conversion Tracking"],
    lastSync: "2 minutes ago",
    dataPoints: 15420,
    oauth: {
      authUrl: "/auth/google-ads",
      scopes: ["ads.read", "ads.write"]
    }
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    icon: "📘",
    category: "advertising", 
    connected: true,
    status: "connected",
    description: "Facebook & Instagram advertising insights",
    features: ["Ad Performance", "Audience Insights", "Creative Analytics", "Attribution Data"],
    lastSync: "5 minutes ago",
    dataPoints: 8934,
    oauth: {
      authUrl: "/auth/meta-ads",
      scopes: ["ads_read", "ads_management"]
    }
  },
  {
    id: "ga_analytics",
    name: "GA Analytics",
    icon: "📊",
    category: "analytics",
    connected: false,
    status: "disconnected",
    description: "Website traffic and user behavior analytics",
    features: ["Traffic Analytics", "User Behavior", "Conversion Funnels", "Attribution Models"],
    oauth: {
      authUrl: "/auth/google-analytics",
      scopes: ["analytics.readonly"]
    }
  },
  {
    id: "youtube_insights",
    name: "YouTube Insights",
    icon: "📺",
    category: "insights",
    connected: false,
    status: "disconnected", 
    description: "Video performance and audience engagement data",
    features: ["Video Analytics", "Audience Demographics", "Engagement Metrics", "Revenue Data"],
    oauth: {
      authUrl: "/auth/youtube",
      scopes: ["youtube.readonly", "youtube-analytics.readonly"]
    }
  },
  {
    id: "facebook_insights",
    name: "Facebook Insights",
    icon: "👥",
    category: "insights",
    connected: false,
    status: "disconnected",
    description: "Page performance and audience insights",
    features: ["Page Analytics", "Post Performance", "Audience Insights", "Engagement Data"],
    oauth: {
      authUrl: "/auth/facebook-insights",
      scopes: ["pages_read_engagement", "read_insights"]
    }
  },
  {
    id: "google_insights",
    name: "Google Insights",
    icon: "🔍",
    category: "insights",
    connected: false,
    status: "error",
    description: "Search trends and market intelligence",
    features: ["Search Trends", "Market Intelligence", "Competitor Analysis", "Keyword Research"],
    oauth: {
      authUrl: "/auth/google-insights",
      scopes: ["search.readonly"]
    }
  }
]

export default function PlatformConnectionDropdown({
  platforms = defaultPlatforms,
  onConnect,
  onDisconnect,
  onManage,
  loading = false,
  className
}: PlatformConnectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const router = useRouter()

  const connectedPlatforms = platforms.filter(p => p.connected)
  const disconnectedPlatforms = platforms.filter(p => !p.connected)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "advertising":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "analytics":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "insights":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Check className="h-3 w-3" />
      case "error":
        return <AlertCircle className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      default:
        return <Plus className="h-3 w-3" />
    }
  }

  const handleConnect = async (platform: Platform) => {
    if (!platform.oauth) return
    
    setConnectingPlatform(platform.id)
    
    try {
      if (onConnect) {
        await onConnect(platform.id)
      } else {
        // Simulate OAuth flow
        window.location.href = platform.oauth.authUrl
      }
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    if (onDisconnect) {
      await onDisconnect(platformId)
    }
  }

  const handleManageConnections = () => {
    if (onManage) {
      onManage()
    } else {
      router.push('/integration-hub')
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white",
            className
          )}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Platforms</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-1">
              {connectedPlatforms.length}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 bg-[#0a0a0a] border-[#1a1a1a] text-white p-0"
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Platform Connections</h3>
            <Badge className="bg-[#1a1a1a] text-gray-300 border-[#333] text-xs">
              {connectedPlatforms.length}/{platforms.length} connected
            </Badge>
          </div>
          <p className="text-xs text-gray-400">
            Connect your advertising and analytics platforms to unlock AI insights
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Connected Platforms */}
          {connectedPlatforms.length > 0 && (
            <div className="p-3 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Connected</span>
              </div>
              <div className="space-y-2">
                {connectedPlatforms.map((platform) => (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333] group hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{platform.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{platform.name}</span>
                          <Badge className={getStatusColor(platform.status)} variant="outline">
                            {getStatusIcon(platform.status)}
                            {platform.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(platform.category)} variant="outline">
                            {platform.category}
                          </Badge>
                          {platform.lastSync && (
                            <span className="text-xs text-gray-500">
                              Synced {platform.lastSync}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(platform.id)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          {disconnectedPlatforms.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">Available to Connect</span>
              </div>
              <div className="space-y-2">
                {disconnectedPlatforms.map((platform) => (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333] hover:border-blue-500/30 transition-all group cursor-pointer"
                    onClick={() => handleConnect(platform)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{platform.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{platform.name}</span>
                            <Badge className={getStatusColor(platform.status)} variant="outline">
                              {getStatusIcon(platform.status)}
                              {platform.status === "disconnected" ? "connect" : platform.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(platform.category)} variant="outline">
                              {platform.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {connectingPlatform === platform.id ? (
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2 ml-8">
                      {platform.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-2 ml-8">
                      {platform.features.slice(0, 2).map((feature, index) => (
                        <Badge key={index} className="bg-[#333] text-gray-400 border-[#444] text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {platform.features.length > 2 && (
                        <Badge className="bg-[#333] text-gray-400 border-[#444] text-xs">
                          +{platform.features.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#1a1a1a]">
          <Button
            onClick={handleManageConnections}
            variant="outline"
            size="sm"
            className="w-full bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage All Connections
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}