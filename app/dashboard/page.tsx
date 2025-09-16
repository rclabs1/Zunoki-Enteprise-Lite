"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { AttributionHeatmap } from "@/components/attribution-heatmap"
import { ModularPerformancePanels } from "@/components/modular-performance-panels"
import AnalyticsChart from "@/components/dashboard/analytics-chart"
import CreditsModal from "@/components/dashboard/credits-modal"
import PlatformConnectionDropdown from "@/components/dashboard/platform-connection-dropdown"
import SmartSuggestions from "@/components/dashboard/smart-suggestions"
import OnboardingWalkthrough from "@/components/dashboard/onboarding-walkthrough"
import WhatsAppOnboardingBanner from "@/components/dashboard/whatsapp-onboarding-banner"
import MetricCard from "@/components/dashboard/metric-card"
import TimeFilterBar, { type TimeRange } from "@/components/dashboard/time-filter-bar"
import MayaRecommendationsCard from "@/components/dashboard/maya-recommendations-card"
import CampaignSummaryCard from "@/components/dashboard/campaign-summary-card"
import MetricInsightTile from "@/components/dashboard/metric-insight-tile"
import MetricsGroup from "@/components/dashboard/metrics-group"
import ErrorBoundary from "@/components/ui/error-boundary"
import { DashboardSkeleton, ChartSkeleton } from "@/components/ui/skeleton"
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
  Users, 
  Plus, 
  Zap, 
  Activity, 
  RefreshCw,
  Sparkles,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointer,
  CreditCard,
  MessageCircle,
  Phone,
  Clock,
  Star,
  Bot,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { useDashboardData } from "@/hooks/useDashboardData"
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
// import MayaAgentEnhanced from '@/components/maya-agent-enhanced' // Removed to prevent bundling
import { subDays } from "date-fns"

// Enhanced dashboard metrics for WhatsApp CRM
interface WhatsAppCRMMetrics {
  conversations: {
    total: number;
    active: number;
    pending: number;
    resolved: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churn: number;
    lifetimeValue: number;
    segmentation: Record<string, number>;
  };
  agents: {
    total: number;
    active: number;
    busy: number;
    offline: number;
    avgHandlingTime: number;
    topPerformer: string;
  };
  maya: {
    sessionsToday: number;
    voiceInteractions: number;
    chatInteractions: number;
    avgSessionDuration: number;
    escalationRate: number;
    successRate: number;
  };
  realTime: {
    activeConversations: number;
    queuedMessages: number;
    agentsOnline: number;
    avgWaitTime: number;
  };
}

export default function DashboardPage() {
  useTrackPageView("Dashboard");
  const router = useRouter();
  const { data, isLoading, error, refreshData, canRefresh } = useDashboardData();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Maya Agent state
  const [showMayaAgent, setShowMayaAgent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [realTimeData, setRealTimeData] = useState<{campaigns: any[], activities: any[]} | null>(null);
  
  // WhatsApp CRM specific state
  const [whatsappMetrics, setWhatsappMetrics] = useState<WhatsAppCRMMetrics | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  
  // Mock WhatsApp CRM data - in real implementation, this would come from APIs
  const mockWhatsAppMetrics: WhatsAppCRMMetrics = {
    conversations: {
      total: 1247,
      active: 23,
      pending: 8,
      resolved: 1216,
      avgResponseTime: 2.4,
      satisfactionScore: 4.3
    },
    customers: {
      total: 8943,
      new: 127,
      returning: 8816,
      churn: 23,
      lifetimeValue: 342.50,
      segmentation: {
        'leads': 2341,
        'prospects': 3421,
        'customers': 2934,
        'churned': 247
      }
    },
    agents: {
      total: 12,
      active: 8,
      busy: 3,
      offline: 1,
      avgHandlingTime: 8.2,
      topPerformer: 'Sarah Wilson'
    },
    maya: {
      sessionsToday: 89,
      voiceInteractions: 34,
      chatInteractions: 156,
      avgSessionDuration: 4.2,
      escalationRate: 12.3,
      successRate: 87.7
    },
    realTime: {
      activeConversations: 23,
      queuedMessages: 5,
      agentsOnline: 8,
      avgWaitTime: 1.8
    }
  };

  // Load real user data from Supabase
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [campaigns, activities] = await Promise.all([
          supabaseMultiUserService.getCampaignMetrics(),
          supabaseMultiUserService.getUserActivities(10)
        ]);
        
        setRealTimeData({ campaigns, activities });
        
        // Load WhatsApp CRM metrics (mock for now)
        setWhatsappMetrics(mockWhatsAppMetrics);
        setWhatsappLoading(false);
        
        // Track dashboard view
        await supabaseMultiUserService.trackActivity('dashboard_viewed', {
          campaigns_count: campaigns.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
        setWhatsappLoading(false);
      }
    };
    
    loadUserData();
  }, [timeRange]);
  
  // Modal states
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  
  // Time filter state
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    label: "Last 7 days",
    value: "7d",
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  // Navigation handlers
  const handleCreateCampaign = () => {
    router.push('/campaigns/create');
  };

  const handleOptimizeBudgets = () => {
    router.push('/campaigns/optimize');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handleManageAudiences = () => {
    router.push('/audiences');
  };

  // Enhanced refresh function for WhatsApp CRM
  const refreshWhatsAppData = async () => {
    setWhatsappLoading(true);
    try {
      // In real implementation, fetch from multiple APIs
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setWhatsappMetrics(mockWhatsAppMetrics);
      toast({
        title: 'Data Refreshed',
        description: 'WhatsApp CRM dashboard has been updated',
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const exportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your dashboard report is being generated',
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Enhanced WhatsApp CRM quick stats
  const whatsappQuickStats = [
    {
      title: "Total Conversations",
      value: whatsappMetrics?.conversations.total.toLocaleString() || "1,247",
      change: "+12%",
      trend: "up" as const,
      icon: MessageCircle,
      category: "Conversations"
    },
    {
      title: "Active Customers", 
      value: whatsappMetrics?.customers.total.toLocaleString() || "8,943",
      change: `+${whatsappMetrics?.customers.new || 127} new today`,
      trend: "up" as const,
      icon: Users,
      category: "Customers"
    },
    {
      title: "Avg Response Time",
      value: `${whatsappMetrics?.conversations.avgResponseTime || 2.4}m`,
      change: "-0.3m improvement",
      trend: "up" as const,
      icon: Clock,
      category: "Performance"
    },
    {
      title: "Satisfaction Score",
      value: `${whatsappMetrics?.conversations.satisfactionScore || 4.3}/5`,
      change: "+0.2 this week",
      trend: "up" as const,
      icon: Star,
      category: "Satisfaction"
    },
  ];

  // Use real data when available, fall back to static data for UI consistency
  const quickStats = [
    {
      title: "Total Revenue",
      value: data ? `₹${(data.totalRevenue || 0).toLocaleString()}` : "₹847K",
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
      category: "Revenue"
    },
    {
      title: "Active Campaigns",
      value: data ? `${data.activeCampaigns || 0}` : "12",
      change: "+3",
      trend: "up" as const,
      icon: Target,
      category: "Campaigns"
    },
    {
      title: "Conversion Rate",
      value: data ? `${(data.conversionRate || 0).toFixed(1)}%` : "4.2%",
      change: "+0.7%",
      trend: "up" as const,
      icon: TrendingUp,
      category: "Performance"
    },
    {
      title: "Audience Reach",
      value: data ? formatNumber(data.audienceReach || 0) : "2.4M",
      change: "+18.2%",
      trend: "up" as const,
      icon: Users,
      category: "Reach"
    },
  ]

  // Use real recent activity data
  const recentActivities = data?.recentActivity?.length ? 
    data.recentActivity.map((activity: any) => ({
      action: activity.action === 'pause_campaign' ? `Campaign ${activity.campaign_id} paused` :
               activity.action === 'enable_campaign' ? `Campaign ${activity.campaign_id} enabled` :
               activity.action === 'sync' ? `${activity.platform} data synced` :
               activity.action,
      impact: activity.platform === 'google_ads' ? 'Google Ads' :
              activity.platform === 'meta_ads' ? 'Meta Ads' :
              activity.platform === 'youtube' ? 'YouTube' : 'Platform action',
      time: formatTimeAgo(activity.created_at),
      type: activity.action === 'pause_campaign' || activity.action === 'enable_campaign' ? 'optimization' :
            activity.action === 'sync' ? 'insight' : 'optimization',
    })) : [
    {
      action: "Maya optimized Google Ads budget",
      impact: "+₹12K revenue",
      time: "2 minutes ago",
      type: "optimization",
    },
    {
      action: "Creative fatigue detected in Meta campaign",
      impact: "Action required",
      time: "5 minutes ago",
      type: "alert",
    },
    {
      action: "New marketplace partner activated",
      impact: "+15% reach potential",
      time: "12 minutes ago",
      type: "opportunity",
    },
    {
      action: "DOOH campaign showing strong lift",
      impact: "+18% digital synergy",
      time: "25 minutes ago",
      type: "insight",
    },
  ]

  // Helper functions
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "optimization":
        return "text-emerald-500"
      case "alert":
        return "text-destructive"
      case "opportunity":
        return "text-blue-500"
      case "insight":
        return "text-purple-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return Zap
      case "alert":
        return Activity
      case "opportunity":
        return Plus
      case "insight":
        return TrendingUp
      default:
        return Activity
    }
  }

  // Sample insights data
  const sampleInsights = [
    {
      id: "1",
      title: "Google Ads Performance",
      description: "Your Google Ads campaigns are outperforming industry benchmarks with strong ROAS",
      metric: {
        value: "4.8",
        change: "+0.3%",
        trend: "up" as const,
        unit: "x"
      },
      insight: {
        type: "success" as const,
        message: "Campaigns showing 23% above average ROAS for your industry",
        confidence: 94,
        actionable: true
      },
      recommendation: {
        text: "Increase budget by 20%"
      },
      category: "Advertising",
      priority: "high" as const,
      icon: Target
    },
    {
      id: "2",
      title: "Audience Engagement",
      description: "New lookalike audiences showing promising early results",
      metric: {
        value: "156",
        change: "+42%",
        trend: "up" as const,
        unit: "K users"
      },
      insight: {
        type: "opportunity" as const,
        message: "Untapped audience segment with high conversion potential",
        confidence: 78,
        actionable: true
      },
      recommendation: {
        text: "Create targeted campaign"
      },
      category: "Audience",
      priority: "medium" as const,
      icon: Users
    }
  ]

  // Sample campaign data
  const sampleCampaigns = [
    {
      id: "1",
      name: "Q4 Holiday Campaign - Google Ads",
      platform: "google_ads" as const,
      status: "active" as const,
      budget: {
        spent: 125420,
        total: 150000,
        currency: "₹"
      },
      performance: {
        impressions: 542000,
        clicks: 25680,
        conversions: 1847,
        roas: 4.8,
        ctr: 4.7
      },
      trend: "up" as const,
      lastUpdated: "2024-07-19T10:30:00Z"
    },
    {
      id: "2",
      name: "Brand Awareness - Meta Ads",
      platform: "meta_ads" as const,
      status: "active" as const,
      budget: {
        spent: 89750,
        total: 100000,
        currency: "₹"
      },
      performance: {
        impressions: 892000,
        clicks: 18940,
        conversions: 1203,
        roas: 3.9,
        ctr: 2.1
      },
      trend: "down" as const,
      lastUpdated: "2024-07-19T09:15:00Z"
    }
  ]

  // Handle credits click
  const handleCreditsClick = () => {
    setShowCreditsModal(true)
  }
  
  // Handle platform connection
  const handlePlatformConnect = (platformId: string) => {
    // Simulate OAuth flow
    console.log('Connecting to platform:', platformId)
    // After successful connection, redirect to integration hub
    setTimeout(() => {
      router.push('/integration-hub')
    }, 1000)
  }
  
  if ((isLoading && !data) || whatsappLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0a0a] relative">
        {/* Netflix-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background pointer-events-none" />
        
        <div className="relative z-10 p-4 sm:p-6 space-y-6 lg:space-y-8">
          {/* Enhanced Header with WhatsApp CRM Focus */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-3 bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl border border-green-500/30 shadow-2xl"
                >
                  <MessageCircle className="h-6 w-6 text-green-400" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  WhatsApp CRM Dashboard <sub className="text-[0.7rem] align-middle">powered by Agent Maya</sub>
                </h1>
              </div>
              <p className="text-secondary-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                Monitor customer conversations, agent performance, and AI-powered insights
                {whatsappMetrics && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    • Last updated just now
                  </span>
                )}
              </p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center flex-wrap gap-2 sm:gap-3"
            >
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button 
                onClick={refreshWhatsAppData}
                disabled={whatsappLoading}
                variant="outline"
                className="bg-secondary border-muted hover:bg-muted text-secondary-foreground hover:text-foreground transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${whatsappLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={() => router.push('/conversations')} 
                className="bg-green-600 text-white hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                View Conversations
              </Button>
            </motion.div>
          </motion.div>

          {/* Real-time Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Live Status</p>
                        <p className="text-xs text-muted-foreground">System Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{whatsappMetrics?.realTime.activeConversations}</p>
                        <p className="text-xs text-muted-foreground">Active Chats</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">{whatsappMetrics?.realTime.agentsOnline}</p>
                        <p className="text-xs text-muted-foreground">Agents Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{whatsappMetrics?.realTime.avgWaitTime}m</p>
                        <p className="text-xs text-muted-foreground">Avg Wait</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    All Systems Operational
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WhatsApp Integration Onboarding Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <WhatsAppOnboardingBanner />
          </motion.div>

          {/* WhatsApp CRM Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {whatsappQuickStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getTrendIcon(stat.trend)}
                      <span>{stat.change}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          {/* WhatsApp CRM Main Content Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="maya">Agent Maya</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Conversation Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Conversation Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active</span>
                        <div className="flex items-center gap-2">
                          <Progress value={75} className="w-20" />
                          <span className="text-sm">{whatsappMetrics?.conversations.active}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending</span>
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="w-20" />
                          <span className="text-sm">{whatsappMetrics?.conversations.pending}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Resolved</span>
                        <div className="flex items-center gap-2">
                          <Progress value={95} className="w-20" />
                          <span className="text-sm">{whatsappMetrics?.conversations.resolved}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Segmentation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Customer Segments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(whatsappMetrics?.customers.segmentation || {}).map(([segment, count]) => (
                        <div key={segment} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{segment}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count / (whatsappMetrics?.customers.total || 1)) * 100} 
                              className="w-20" 
                            />
                            <span className="text-sm">{count.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Agent Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Agent Performance Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{whatsappMetrics?.agents.active}</div>
                        <div className="text-sm text-muted-foreground">Active Agents</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{whatsappMetrics?.agents.avgHandlingTime}m</div>
                        <div className="text-sm text-muted-foreground">Avg Handling Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{whatsappMetrics?.agents.topPerformer}</div>
                        <div className="text-sm text-muted-foreground">Top Performer</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conversations Tab */}
              <TabsContent value="conversations" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Conversation Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-muted-foreground">Chart visualization would go here</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Priority Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">High Priority</span>
                        </div>
                        <span className="text-sm font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Medium Priority</span>
                        </div>
                        <span className="text-sm font-medium">34</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Low Priority</span>
                        </div>
                        <span className="text-sm font-medium">89</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Agents Tab */}
              <TabsContent value="agents" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Online</span>
                        </div>
                        <span className="text-sm font-medium">{whatsappMetrics?.agents.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Busy</span>
                        </div>
                        <span className="text-sm font-medium">{whatsappMetrics?.agents.busy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-sm">Offline</span>
                        </div>
                        <span className="text-sm font-medium">{whatsappMetrics?.agents.offline}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: 'Sarah Wilson', score: 4.8, conversations: 23 },
                        { name: 'Mike Johnson', score: 4.6, conversations: 19 },
                        { name: 'Emma Davis', score: 4.5, conversations: 21 }
                      ].map((agent, index) => (
                        <div key={agent.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.conversations} conversations</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{agent.score}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Agent Maya Tab */}
              <TabsContent value="maya" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{whatsappMetrics?.maya.sessionsToday}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getTrendIcon('up')}
                        <span>+15% vs yesterday</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Voice Interactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{whatsappMetrics?.maya.voiceInteractions}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>38% of total</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{whatsappMetrics?.maya.successRate}%</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getTrendIcon('up')}
                        <span>Above target</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{whatsappMetrics?.maya.escalationRate}%</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getTrendIcon('down')}
                        <span>Within target</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Agent Maya Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Average Session Duration</span>
                          <span className="text-sm">{whatsappMetrics?.maya.avgSessionDuration}m</span>
                        </div>
                        <Progress value={70} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Customer Satisfaction</span>
                          <span className="text-sm">4.2/5</span>
                        </div>
                        <Progress value={84} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Issue Resolution</span>
                          <span className="text-sm">87.7%</span>
                        </div>
                        <Progress value={88} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Smart Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <ErrorBoundary>
              <SmartSuggestions
                onSuggestionAction={(id, action) => {
                  console.log('Suggestion action:', id, action)
                }}
                onRefresh={refreshData}
                loading={isLoading}
              />
            </ErrorBoundary>
          </motion.div>

          {/* Campaign Performance Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Active Campaigns</h2>
              <Button
                onClick={handleCreateCampaign}
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-red-500/25 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {sampleCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                >
                  <ErrorBoundary>
                    <CampaignSummaryCard
                      campaign={campaign}
                      onViewDetails={(id) => router.push(`/campaigns/${id}`)}
                      loading={isLoading}
                    />
                  </ErrorBoundary>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">AI Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {sampleInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7 + index * 0.1 }}
                >
                  <ErrorBoundary>
                    <MetricInsightTile
                      insight={insight}
                      loading={isLoading}
                    />
                  </ErrorBoundary>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Performance Panels - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ErrorBoundary>
                <ModularPerformancePanels />
              </ErrorBoundary>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 lg:space-y-6">
              {/* Maya Agent Panel - Now handled by ConditionalMayaAgent in layout */}
              <Card className="bg-card border-border hover:border-[#333] transition-all duration-200">
                <CardContent className="p-6">
                  <div className="text-center text-gray-400">
                    <p>Maya Agent is available via the chat window</p>
                  </div>
                </CardContent>
              </Card>
              {/* Recent Activity */}
              <Card className="bg-card border-border hover:border-[#333] transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="font-bold text-white text-base sm:text-lg">Recent Activity</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs animate-pulse">
                      Live
                    </Badge>
                  </div>
                  <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                    {recentActivities.map((activity, index) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.1 + index * 0.1 }}
                          className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors duration-200 group"
                        >
                          <div className="p-1.5 sm:p-2 bg-secondary rounded-lg group-hover:bg-muted transition-colors duration-200 flex-shrink-0">
                            <ActivityIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${getActivityColor(activity.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-white font-medium truncate">{activity.action}</p>
                            <p className={`text-xs mt-1 font-semibold ${getActivityColor(activity.type)} truncate`}>{activity.impact}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card border-border hover:border-[#333] transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <h3 className="font-bold text-white text-base sm:text-lg">Quick Actions</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleCreateCampaign} 
                        variant="outline"
                                                className="w-full justify-start bg-secondary border-border hover:bg-muted text-secondary-foreground hover:text-foreground text-left text-xs sm:text-sm h-8 sm:h-10 transition-all duration-200"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                        Create New Campaign
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleOptimizeBudgets} 
                        variant="outline"
                                                className="w-full justify-start bg-secondary border-border hover:bg-muted text-secondary-foreground hover:text-foreground text-left text-xs sm:text-sm h-8 sm:h-10 transition-all duration-200"
                      >
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                        Optimize Budgets
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={() => setShowMayaAgent(!showMayaAgent)} 
                        variant="outline"
                                                className="w-full justify-start bg-secondary border-border hover:bg-muted text-secondary-foreground hover:text-foreground text-left text-xs sm:text-sm h-8 sm:h-10 transition-all duration-200"
                      >
                        <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                        {showMayaAgent ? 'Hide Maya Agent' : 'Ask Maya Agent'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleViewAnalytics} 
                        variant="outline"
                                                className="w-full justify-start bg-secondary border-border hover:bg-muted text-secondary-foreground hover:text-foreground text-left text-xs sm:text-sm h-8 sm:h-10 transition-all duration-200"
                      >
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                        View Analytics
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleManageAudiences} 
                        variant="outline"
                                                className="w-full justify-start bg-secondary border-border hover:bg-muted text-secondary-foreground hover:text-foreground text-left text-xs sm:text-sm h-8 sm:h-10 transition-all duration-200"
                      >
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                        Manage Audiences
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Attribution Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.8 }}
          >
            <ErrorBoundary>
              <AttributionHeatmap />
            </ErrorBoundary>
          </motion.div>
        </div>

        {/* Modals */}
        <CreditsModal
          isOpen={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
          currentCredits={data?.creditsUsage?.remaining || 25}
          creditLimit={data?.creditsUsage?.limit || 25}
          onUpgrade={(planId) => {
            console.log('Upgrading to plan:', planId)
            // Handle upgrade logic here
          }}
        />

        <OnboardingWalkthrough
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
    </ErrorBoundary>
  )
}
