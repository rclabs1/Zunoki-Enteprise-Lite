"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Plug,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Crown,
  Zap,
  Sparkles,
} from "lucide-react"
import { useTrackPageView } from "@/hooks/use-track-page-view"

interface Integration {
  id: string
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  status: "healthy" | "warning" | "error" | "syncing"
  description: string
  category: "advertising" | "analytics" | "media"
  isPremium?: boolean
  syncProgress?: number
}

const integrations: Integration[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    icon: "🔍",
    connected: true,
    lastSync: "2 minutes ago",
    status: "healthy",
    description: "Connect your Google Ads campaigns for comprehensive performance tracking.",
    category: "advertising",
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    icon: "📘",
    connected: true,
    lastSync: "5 minutes ago",
    status: "healthy",
    description: "Integrate Facebook and Instagram advertising data.",
    category: "advertising",
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    icon: "🎵",
    connected: false,
    status: "healthy",
    description: "Connect your TikTok Ads account for performance insights.",
    category: "advertising",
  },
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    icon: "💼",
    connected: false,
    status: "healthy",
    description: "Connect your LinkedIn Ads for B2B campaign analysis.",
    category: "advertising",
  },
  {
    id: "amazon-ads",
    name: "Amazon Ads",
    icon: "📦",
    connected: false,
    status: "healthy",
    description: "Track advertising performance on the Amazon marketplace.",
    category: "advertising",
  },
  {
    id: "dv360",
    name: "Google DV360",
    icon: "🌐",
    connected: false,
    status: "healthy",
    description: "Integrate programmatic ad campaigns from Display & Video 360.",
    category: "advertising",
  },
  {
    id: "youtube-ads",
    name: "YouTube Ads",
    icon: "📺",
    connected: false,
    status: "healthy",
    description: "Track YouTube advertising campaigns and video performance.",
    category: "advertising",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🧡",
    connected: false,
    status: "healthy",
    description: "Sync CRM data to enrich audience and conversion metrics.",
    category: "analytics",
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    icon: "📊",
    connected: true,
    lastSync: "1 hour ago",
    status: "warning",
    description: "Advanced analytics and user behavior tracking.",
    category: "analytics",
  },
  {
    id: "appsflyer",
    name: "Appsflyer",
    icon: "✈️",
    connected: false,
    status: "healthy",
    description: "Mobile attribution and marketing analytics.",
    category: "analytics",
    isPremium: true,
  },
  {
    id: "amplitude",
    name: "Amplitude",
    icon: "🌊",
    connected: false,
    status: "healthy",
    description: "Product analytics to understand user journeys.",
    category: "analytics",
    isPremium: true,
  },
  {
    id: "ctv",
    name: "Connected TV",
    icon: "📱",
    connected: false,
    status: "healthy",
    description: "Connected TV advertising and viewership analytics.",
    category: "media",
    isPremium: true,
  },
  {
    id: "dooh",
    name: "Digital Out-of-Home",
    icon: "🏢",
    connected: false,
    status: "healthy",
    description: "Digital billboard and outdoor advertising metrics.",
    category: "media",
    isPremium: true,
  },
  {
    id: "kantar",
    name: "Kantar",
    icon: "🌍",
    connected: false,
    status: "healthy",
    description: "Leverage Kantar's media measurement and audience insights.",
    category: "media",
    isPremium: true,
  },
  {
    id: "nielsen",
    name: "Nielsen",
    icon: "📈",
    connected: false,
    status: "healthy",
    description: "Integrate Nielsen data for comprehensive media planning.",
    category: "media",
    isPremium: true,
  },
  {
    id: "comscore",
    name: "Comscore",
    icon: "⭐",
    connected: false,
    status: "healthy",
    description: "Access Comscore data for cross-platform audience measurement.",
    category: "media",
    isPremium: true,
  },
]

export default function IntegrationPage() {
  useTrackPageView("Integration Hub");
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const connectedCount = integrations.filter((i) => i.connected).length
  const healthyCount = integrations.filter((i) => i.status === "healthy").length
  const warningCount = integrations.filter((i) => i.status === "warning").length

  const filteredIntegrations = integrations.filter((integration) => {
    if (selectedCategory === "all") return true
    return integration.category === selectedCategory
  })

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Integration["status"]) => {
    switch (status) {
      case "healthy":
        return "text-emerald-500"
      case "warning":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      case "syncing":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen netflix-bg netflix-scrollbar">
      {/* Netflix-inspired background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background pointer-events-none" />
      
      <div className="relative z-10 p-6 space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl"
              >
                <Plug className="h-6 w-6 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-primary">Integration Hub</h1>
            </div>
            <p className="text-secondary-foreground text-lg">Connect and manage your marketing platforms and data sources.</p>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 mt-4 md:mt-0"
          >
            <Button className="bg-secondary hover:bg-muted text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 ease-in-out border border-border">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-md shadow-2xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Integration
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-popover border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Integration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">Select a platform to connect and start syncing your marketing data.</p>
                <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                  {integrations
                    .filter((i) => !i.connected)
                    .map((integration) => (
                      <div
                        key={integration.id}
                        className="p-4 bg-card rounded-lg hover:bg-accent transition-colors cursor-pointer border border-border hover:border-primary"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{integration.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{integration.name}</h4>
                              {integration.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
                          disabled={integration.isPremium}
                        >
                          {integration.isPremium ? "Upgrade Required" : "Connect"}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="netflix-card group cursor-pointer overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#999999] font-medium">Connected</p>
                    <p className="text-3xl font-bold text-white mt-2">{connectedCount}</p>
                    <div className="flex items-center mt-3">
                      <span className="text-sm text-green-400 font-semibold">of {integrations.length} platforms</span>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="p-4 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-lg"
                  >
                    <Plug className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="netflix-card group cursor-pointer overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#999999] font-medium">Healthy</p>
                    <p className="text-3xl font-bold text-white mt-2">{healthyCount}</p>
                    <div className="flex items-center mt-3">
                      <span className="text-sm text-green-400 font-semibold">integrations running</span>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg"
                  >
                    <Activity className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="netflix-card group cursor-pointer overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#999999] font-medium">Warnings</p>
                    <p className="text-3xl font-bold text-white mt-2">{warningCount}</p>
                    <div className="flex items-center mt-3">
                      <span className="text-sm text-yellow-400 font-semibold">need attention</span>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg"
                  >
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="netflix-card group cursor-pointer overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#999999] font-medium">Last Sync</p>
                    <p className="text-3xl font-bold text-white mt-2">2m</p>
                    <div className="flex items-center mt-3">
                      <span className="text-sm text-green-400 font-semibold">ago</span>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg"
                  >
                    <RefreshCw className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Primary Connections */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Card className="netflix-card">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Plug className="h-5 w-5 text-[hsl(var(--primary))]" />
                Connect Your Ad Accounts
              </CardTitle>
              <p className="text-[#cccccc] text-sm pt-1">
                Connect your primary ad accounts to automatically sync audience insights and campaign data.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Ads Connection */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] hover:border-[hsl(var(--primary))] transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">🔍</div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Google Ads</h4>
                    <p className="text-sm text-[#cccccc]">Pull audience data from Audience Manager and track campaign performance.</p>
                  </div>
                </div>
                <Button
                  className="netflix-btn-primary"
                  onClick={() => {
                    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent`;
                    window.location.href = googleAuthUrl;
                  }}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </motion.div>
              
              {/* Meta Ads Connection */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] hover:border-[hsl(var(--primary))] transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">📘</div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Meta Ads</h4>
                    <p className="text-sm text-[#cccccc]">Get insights from Facebook and Instagram campaigns and audiences.</p>
                  </div>
                </div>
                <Button
                  className="netflix-btn-primary"
                  onClick={() => {
                    const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_META_REDIRECT_URI}&scope=ads_management,ads_read,pages_show_list,business_management,public_profile&response_type=code&auth_type=rerequest`;
                    window.location.href = metaAuthUrl;
                  }}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </motion.div>
              
              {/* Google Analytics Connection */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] hover:border-[hsl(var(--primary))] transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">📊</div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Google Analytics</h4>
                    <p className="text-sm text-[#cccccc]">Enrich audience data with website traffic and user behavior insights.</p>
                  </div>
                </div>
                <Button
                  className="netflix-btn-primary"
                  onClick={() => {
                    const googleAnalyticsAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent`;
                    window.location.href = googleAnalyticsAuthUrl;
                  }}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </motion.div>
              
              {/* Mixpanel Connection */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] hover:border-[hsl(var(--primary))] transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">📈</div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Mixpanel</h4>
                    <p className="text-sm text-[#cccccc]">Understand user behavior and product usage to build better audiences.</p>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-md shadow-2xl">
                  <Plug className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="bg-[#262626] border border-[#404040]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                All Platforms
              </TabsTrigger>
              <TabsTrigger
                value="advertising"
                className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]"
              >
                Advertising
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                Media
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Integration Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Card className="netflix-card group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{integration.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base text-white">{integration.name}</CardTitle>
                          {integration.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${
                            integration.category === "advertising"
                              ? "border-blue-500 text-blue-400"
                              : integration.category === "analytics"
                                ? "border-purple-500 text-purple-400"
                                : "border-green-500 text-green-400"
                          }`}
                        >
                          {integration.category.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(integration.status)}
                      <Switch checked={integration.connected} disabled />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <p className="text-sm text-[#cccccc]">{integration.description}</p>

              {integration.connected && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#999999]">Status</span>
                      <span className={getStatusColor(integration.status)}>
                        {integration.status === "syncing" ? "Syncing..." : integration.status}
                      </span>
                    </div>
                    {integration.lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#999999]">Last Sync</span>
                        <span className="text-white">{integration.lastSync}</span>
                      </div>
                    )}
                    {integration.syncProgress && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#999999]">Sync Progress</span>
                          <span className="text-white">{integration.syncProgress}%</span>
                        </div>
                        <Progress value={integration.syncProgress} className="h-2" />
                      </div>
                    )}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                {integration.connected ? (
                  <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#404040] text-[#cccccc] hover:bg-[#333333] bg-transparent"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#404040] text-[#cccccc] hover:bg-[#333333] bg-transparent"
                      >
                        <Settings className="mr-2 h-3 w-3" />
                        Settings
                      </Button>
                  </>
                ) : (
                    <Button
                      className="flex-1 netflix-btn-primary"
                      disabled={integration.isPremium}
                    >
                      {integration.isPremium ? (
                        <>
                          <Crown className="mr-2 h-3 w-3" />
                          Upgrade Required
                        </>
                      ) : (
                        <>
                          <Plug className="mr-2 h-3 w-3" />
                          Connect
                        </>
                      )}
                    </Button>
                )}
              </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <Card className="netflix-card">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-[hsl(var(--primary))]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    platform: "Google Ads",
                    action: "Data sync completed",
                    time: "2 minutes ago",
                    status: "success",
                  },
                  {
                    platform: "Meta Ads",
                    action: "Campaign data updated",
                    time: "5 minutes ago",
                    status: "success",
                  },
                  {
                    platform: "Mixpanel",
                    action: "Authentication token refreshed",
                    time: "1 hour ago",
                    status: "warning",
                  },
                  {
                    platform: "Google DV360",
                    action: "Sync in progress",
                    time: "Ongoing",
                    status: "syncing",
                  },
                ].map((log, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.0 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-[#262626] hover:bg-[#333333] rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status as Integration["status"])}
                      <div>
                        <div className="text-sm font-medium text-white">{log.platform}</div>
                        <div className="text-sm text-[#cccccc]">{log.action}</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#999999]">{log.time}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
