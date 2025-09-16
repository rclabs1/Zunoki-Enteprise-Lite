"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart, LineChart, PieChart } from "@/components/ui/chart"
import { 
  Download, 
  Filter, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointer,
  Target,
  Users,
  Activity,
  Calendar,
  Globe
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useTrackPageView } from "@/hooks/use-track-page-view"

export default function Analytics() {
  useTrackPageView("Analytics");
  return (
    <ProtectedRoute>
      <div className="min-h-screen netflix-bg netflix-scrollbar">
        {/* Netflix-inspired background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#1a1a1a] to-[#0d0d0d] pointer-events-none" />
        
        <div className="relative z-10 p-6 space-y-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl"
                >
                  <BarChart3 className="h-6 w-6 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold netflix-text-gradient">Campaign Analytics</h1>
              </div>
              <p className="text-[#cccccc] text-lg">
                Deep insights and performance metrics across all your advertising campaigns
              </p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center flex-wrap gap-3"
            >
              <Badge className="bg-[#333333] text-[#cccccc] border-[#404040] px-3 py-1.5">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Data
              </Badge>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5">
                <Calendar className="h-3 w-3 mr-1" />
                Last 30 Days
              </Badge>
              <Button className="netflix-btn-secondary">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button className="netflix-btn-secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button className="netflix-btn-primary">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Tabs defaultValue="overview" className="space-y-8 w-full">
              <TabsList className="bg-[#262626] border border-[#404040] p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="platforms" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                  <Globe className="h-4 w-4 mr-2" />
                  Platforms
                </TabsTrigger>
                <TabsTrigger value="demographics" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                  <Users className="h-4 w-4 mr-2" />
                  Demographics
                </TabsTrigger>
                <TabsTrigger value="geography" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                  <Target className="h-4 w-4 mr-2" />
                  Geography
                </TabsTrigger>
                <TabsTrigger value="conversions" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Conversions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 w-full">
                {/* Enhanced Metrics Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Card className="netflix-card group cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-[#999999] font-medium">Total Impressions</p>
                            <p className="text-3xl font-bold text-white mt-2">2.4M</p>
                            <div className="flex items-center mt-3">
                              <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-sm text-green-400 font-semibold">+12.5%</span>
                              <span className="text-xs text-[#666666] ml-2">vs last month</span>
                            </div>
                          </div>
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg"
                          >
                            <Eye className="h-7 w-7 text-white" />
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
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-[#999999] font-medium">Total Clicks</p>
                            <p className="text-3xl font-bold text-white mt-2">43.2K</p>
                            <div className="flex items-center mt-3">
                              <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-sm text-green-400 font-semibold">+8.3%</span>
                              <span className="text-xs text-[#666666] ml-2">vs last month</span>
                            </div>
                          </div>
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg"
                          >
                            <MousePointer className="h-7 w-7 text-white" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Card className="netflix-card group cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-[#999999] font-medium">Click-Through Rate</p>
                            <p className="text-3xl font-bold text-white mt-2">1.8%</p>
                            <div className="flex items-center mt-3">
                              <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-sm text-green-400 font-semibold">+0.3%</span>
                              <span className="text-xs text-[#666666] ml-2">vs last month</span>
                            </div>
                          </div>
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="p-4 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-lg"
                          >
                            <TrendingUp className="h-7 w-7 text-white" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Card className="netflix-card group cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-[#999999] font-medium">Total Conversions</p>
                            <p className="text-3xl font-bold text-white mt-2">3,845</p>
                            <div className="flex items-center mt-3">
                              <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                              <span className="text-sm text-green-400 font-semibold">+15.2%</span>
                              <span className="text-xs text-[#666666] ml-2">vs last month</span>
                            </div>
                          </div>
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg"
                          >
                            <Target className="h-7 w-7 text-white" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Enhanced Charts Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <Card className="netflix-card">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
                        Performance Trends
                      </CardTitle>
                      <CardDescription className="text-[#cccccc] text-sm">
                        Daily metrics trajectory over the past 30 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <LineChart
                          data={[
                            { date: "2025-04-05", Impressions: 40000, Clicks: 800 },
                            { date: "2025-04-10", Impressions: 45000, Clicks: 900 },
                            { date: "2025-04-15", Impressions: 55000, Clicks: 1100 },
                            { date: "2025-04-20", Impressions: 60000, Clicks: 1200 },
                            { date: "2025-04-25", Impressions: 75000, Clicks: 1500 },
                            { date: "2025-04-30", Impressions: 80000, Clicks: 1600 },
                            { date: "2025-05-05", Impressions: 85000, Clicks: 1700 },
                          ]}
                          index="date"
                          categories={["Impressions", "Clicks"]}
                          colors={["hsl(var(--primary))", "#8b5cf6"]}
                          valueFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}`}
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="netflix-card">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-[hsl(var(--primary))]" />
                        Platform Distribution
                      </CardTitle>
                      <CardDescription className="text-[#cccccc] text-sm">
                        Impressions breakdown by advertising platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <PieChart
                          data={[
                            { name: "Meta Ads", value: 35 },
                            { name: "Google Ads", value: 27 },
                            { name: "CTV", value: 18 },
                            { name: "DOOH", value: 12 },
                            { name: "Influencers", value: 8 },
                          ]}
                          index="name"
                          categories={["value"]}
                          colors={["hsl(var(--primary))", "#8b5cf6", "#22c55e", "#3b82f6", "#f97316"]}
                          valueFormatter={(value) => `${value}%`}
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Full Width Campaign Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.8 }}
                >
                  <Card className="netflix-card w-full">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[hsl(var(--primary))]" />
                        Campaign Performance Comparison
                      </CardTitle>
                      <CardDescription className="text-[#cccccc] text-sm">
                        Comprehensive metrics across all active advertising campaigns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <BarChart
                          data={[
                            { campaign: "Zepto Office Launch", impressions: 1200000, clicks: 24000, conversions: 2400 },
                            { campaign: "Tech Professionals", impressions: 850000, clicks: 15300, conversions: 1200 },
                            { campaign: "Urban Commuters", impressions: 350000, clicks: 3850, conversions: 245 },
                          ]}
                          index="campaign"
                          categories={["impressions", "clicks", "conversions"]}
                          colors={["hsl(var(--primary))", "#8b5cf6", "#22c55e"]}
                          valueFormatter={(value) =>
                            `${value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : (value >= 1000) ? `${(value / 1000).toFixed(1)}K` : value}`
                          }
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="platforms" className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-center py-12"
                >
                  <div className="p-8 netflix-glass rounded-xl">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--primary))] netflix-loading" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Platform Analytics</h3>
                    <p className="text-[#cccccc] text-lg">Deep dive into platform-specific performance metrics</p>
                    <p className="text-[#999999] text-sm mt-2">Detailed analytics dashboard coming soon...</p>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="demographics" className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-center py-12"
                >
                  <div className="p-8 netflix-glass rounded-xl">
                    <Users className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--primary))] netflix-loading" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Demographic Analytics</h3>
                    <p className="text-[#cccccc] text-lg">Audience insights and demographic breakdowns</p>
                    <p className="text-[#999999] text-sm mt-2">Advanced demographic analysis coming soon...</p>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="geography" className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-center py-12"
                >
                  <div className="p-8 netflix-glass rounded-xl">
                    <Target className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--primary))] netflix-loading" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Geographic Analytics</h3>
                    <p className="text-[#cccccc] text-lg">Location-based performance and reach analysis</p>
                    <p className="text-[#999999] text-sm mt-2">Geographic insights dashboard coming soon...</p>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="conversions" className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-center py-12"
                >
                  <div className="p-8 netflix-glass rounded-xl">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--primary))] netflix-loading" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Conversion Analytics</h3>
                    <p className="text-[#cccccc] text-lg">Detailed conversion tracking and optimization insights</p>
                    <p className="text-[#999999] text-sm mt-2">Advanced conversion analytics coming soon...</p>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
