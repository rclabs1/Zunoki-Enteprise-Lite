"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { useDashboard } from "@/contexts/dashboard-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MessageSquare,
  Bot,
  BarChart3,
  Activity,
  Send,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Zap,
  Shield,
  RefreshCw
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import ErrorBoundary from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/skeleton"
import AnalyticsChart from "@/components/dashboard/analytics-chart"
import TimeFilterBar, { type TimeRange } from "@/components/dashboard/time-filter-bar"
import { BroadcastAnalytics } from "@/app/modules/campaigns/components/broadcast-analytics"
import { ComplianceAnalytics } from "@/app/modules/campaigns/components/compliance-analytics"

interface OverviewMetrics {
  totalRevenue: number
  revenueGrowth: number
  totalSpend: number
  roas: number
  totalConversations: number
  activeAgents: number
  totalBroadcasts: number
  complianceScore: number
  deliveryRate: number
  responseRate: number
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = "neutral",
  format = "number" 
}: {
  title: string
  value: string | number
  change?: number
  icon: any
  trend?: "up" | "down" | "neutral"
  format?: "currency" | "percentage" | "number"
}) => {
  const formatValue = (val: string | number) => {
    if (format === "currency") return `$${val.toLocaleString()}`
    if (format === "percentage") return `${val}%`
    return val.toLocaleString()
  }

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600"
    if (trend === "down") return "text-red-600"
    return "text-gray-600"
  }

  const getTrendIcon = () => {
    if (trend === "up") return ArrowUpRight
    if (trend === "down") return ArrowDownRight
    return null
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold">{formatValue(value)}</p>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{Math.abs(change)}% from last period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const AgentPerformanceCard = ({ agents }: { agents: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Bot className="h-5 w-5" />
        <span>Agent Performance</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {agents.slice(0, 5).map((agent, index) => (
          <div key={agent.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.conversations_handled || 0} conversations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status || 'inactive'}
              </Badge>
              <span className="text-sm font-mono">
                {agent.customer_satisfaction_score || 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const PlatformOverviewCard = ({ platforms }: { platforms: any }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Globe className="h-5 w-5" />
        <span>Platform Performance</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(platforms || {}).map(([platform, data]: [string, any]) => (
          <div key={platform} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{platform.replace('_', ' ')}</span>
              <Badge variant={data.connected ? 'default' : 'secondary'}>
                {data.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            {data.connected && (
              <div className="text-xs text-muted-foreground">
                {data.summary?.totalSpend ? `$${data.summary.totalSpend.toLocaleString()} spend` : 'No data'}
              </div>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const QuickActionsCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Zap className="h-5 w-5" />
        <span>Quick Actions</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 gap-3">
        <Button variant="outline" className="justify-start">
          <Send className="mr-2 h-4 w-4" />
          Create Broadcast Campaign
        </Button>
        <Button variant="outline" className="justify-start">
          <Bot className="mr-2 h-4 w-4" />
          Deploy New Agent
        </Button>
        <Button variant="outline" className="justify-start">
          <MessageSquare className="mr-2 h-4 w-4" />
          View Conversations
        </Button>
        <Button variant="outline" className="justify-start">
          <Shield className="mr-2 h-4 w-4" />
          Compliance Check
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default function Overview() {
  const { user } = useAuth()
  const { dashboardData, loading, error, refreshData } = useDashboard()
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    label: "Last 7 days",
    value: "7d", 
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  })
  const [selectedView, setSelectedView] = useState("overview")

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalSpend: 0,
    roas: 0,
    totalConversations: 0,
    activeAgents: 0,
    totalBroadcasts: 0,
    complianceScore: 85,
    deliveryRate: 94,
    responseRate: 23
  })

  useEffect(() => {
    if (dashboardData) {
      const platformMetrics = dashboardData.metrics || {}
      setMetrics({
        totalRevenue: platformMetrics.totalRevenue || 0,
        revenueGrowth: 12.5,
        totalSpend: platformMetrics.totalSpend || 0,
        roas: platformMetrics.roas || 0,
        totalConversations: platformMetrics.totalImpressions || 0,
        activeAgents: dashboardData.connectedPlatforms?.filter(p => p.connected).length || 0,
        totalBroadcasts: 156, // This would come from broadcast service
        complianceScore: 85,
        deliveryRate: 94,
        responseRate: 23
      })
    }
  }, [dashboardData])

  if (loading) return <DashboardSkeleton />
  if (error) return <div className="p-6 text-center">Error loading overview data</div>

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground">
              Your complete business performance snapshot
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TimeFilterBar selectedRange={selectedTimeRange} onRangeChange={setSelectedTimeRange} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={metrics.totalRevenue}
            change={metrics.revenueGrowth}
            icon={DollarSign}
            trend="up"
            format="currency"
          />
          <MetricCard
            title="ROAS"
            value={metrics.roas.toFixed(1)}
            change={8.2}
            icon={Target}
            trend="up"
          />
          <MetricCard
            title="Active Agents"
            value={metrics.activeAgents}
            icon={Bot}
            trend="neutral"
          />
          <MetricCard
            title="Compliance Score"
            value={metrics.complianceScore}
            change={2.1}
            icon={Shield}
            trend="up"
            format="percentage"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            title="Total Spend"
            value={metrics.totalSpend}
            icon={TrendingDown}
            format="currency"
          />
          <MetricCard
            title="Conversations"
            value={metrics.totalConversations}
            icon={MessageSquare}
          />
          <MetricCard
            title="Broadcasts Sent"
            value={metrics.totalBroadcasts}
            icon={Send}
          />
          <MetricCard
            title="Delivery Rate"
            value={metrics.deliveryRate}
            icon={CheckCircle}
            format="percentage"
          />
          <MetricCard
            title="Response Rate"
            value={metrics.responseRate}
            icon={Activity}
            format="percentage"
          />
          <MetricCard
            title="Platform Health"
            value={dashboardData?.connectedPlatforms?.length || 0}
            icon={Globe}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Analytics</TabsTrigger>
            <TabsTrigger value="broadcasts">Broadcast Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Platform Overview */}
              <PlatformOverviewCard platforms={dashboardData?.platforms} />
              
              {/* Agent Performance */}
              <AgentPerformanceCard agents={dashboardData?.connectedPlatforms || []} />
              
              {/* Quick Actions */}
              <QuickActionsCard />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary fallback={() => (
                    <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm text-muted-foreground">Performance charts will appear here</p>
                      </div>
                    </div>
                  )}>
                    <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
                      <AnalyticsChart />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dashboardData?.platforms || {}).map(([platform, data]: [string, any]) => (
                      <div key={platform} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{platform.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={data.connected ? 75 : 0} 
                            className="w-20" 
                          />
                          <span className="text-xs text-muted-foreground">
                            {data.connected ? '75%' : '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="grid gap-6">
              <AgentPerformanceCard agents={dashboardData?.connectedPlatforms || []} />
              {/* Additional agent analytics would go here */}
            </div>
          </TabsContent>

          <TabsContent value="broadcasts" className="space-y-4">
            <ErrorBoundary fallback={() => (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Broadcast Analytics</h3>
                  <p className="text-muted-foreground">Broadcast analytics will appear here once you start sending campaigns.</p>
                </CardContent>
              </Card>
            )}>
              <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded h-96" />}>
                <BroadcastAnalytics />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <ErrorBoundary fallback={() => (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Compliance Dashboard</h3>
                  <p className="text-muted-foreground">Compliance analytics will appear here once you start sending messages.</p>
                </CardContent>
              </Card>
            )}>
              <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded h-96" />}>
                <ComplianceAnalytics />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}