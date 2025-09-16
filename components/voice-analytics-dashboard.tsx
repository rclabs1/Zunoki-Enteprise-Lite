"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Phone,
  Mic,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Download,
  Share,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Headphones,
  MessageSquare,
  Globe,
  Target,
  Zap,
  DollarSign,
  Timer,
  Database,
  Cpu,
  Network,
  HardDrive,
  Eye,
  EyeOff,
  Settings,
  Info,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Flag,
  Languages,
  Mic2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed
} from "lucide-react"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, AreaChart, Area } from 'recharts'

interface VoiceAnalytics {
  overview: {
    totalCalls: number
    totalMinutes: number
    avgCallDuration: number
    successRate: number
    customerSatisfaction: number
    costPerCall: number
    activeAgents: number
    peakHours: string
  }
  callMetrics: {
    inbound: number
    outbound: number
    missed: number
    transferred: number
    resolved: number
    escalated: number
  }
  performance: {
    avgResponseTime: number
    avgResolutionTime: number
    firstCallResolution: number
    handoffRate: number
    sentimentScore: number
    speechClarity: number
  }
  trends: {
    callVolume: Array<{ date: string; calls: number; minutes: number }>
    satisfaction: Array<{ date: string; rating: number }>
    performance: Array<{ date: string; response: number; resolution: number }>
  }
  languages: Array<{ language: string; calls: number; percentage: number }>
  emotions: Array<{ emotion: string; count: number; percentage: number }>
  topics: Array<{ topic: string; count: number; avgDuration: number; satisfaction: number }>
  agents: Array<{
    id: string
    name: string
    calls: number
    avgDuration: number
    satisfaction: number
    status: 'active' | 'idle' | 'offline'
  }>
  recentCalls: Array<{
    id: string
    timestamp: string
    duration: number
    type: 'inbound' | 'outbound'
    status: 'completed' | 'missed' | 'transferred'
    sentiment: 'positive' | 'neutral' | 'negative'
    language: string
    transcriptPreview: string
    satisfaction?: number
  }>
}

// Mock data
const mockAnalytics: VoiceAnalytics = {
  overview: {
    totalCalls: 2847,
    totalMinutes: 8942,
    avgCallDuration: 3.2,
    successRate: 94.7,
    customerSatisfaction: 4.6,
    costPerCall: 0.08,
    activeAgents: 12,
    peakHours: '10:00 AM - 2:00 PM'
  },
  callMetrics: {
    inbound: 2145,
    outbound: 702,
    missed: 89,
    transferred: 234,
    resolved: 2458,
    escalated: 156
  },
  performance: {
    avgResponseTime: 1.2,
    avgResolutionTime: 4.8,
    firstCallResolution: 87.3,
    handoffRate: 8.2,
    sentimentScore: 0.73,
    speechClarity: 96.4
  },
  trends: {
    callVolume: [
      { date: '2024-01-10', calls: 342, minutes: 1089 },
      { date: '2024-01-11', calls: 398, minutes: 1247 },
      { date: '2024-01-12', calls: 425, minutes: 1356 },
      { date: '2024-01-13', calls: 389, minutes: 1198 },
      { date: '2024-01-14', calls: 456, minutes: 1432 },
      { date: '2024-01-15', calls: 412, minutes: 1298 },
      { date: '2024-01-16', calls: 425, minutes: 1322 }
    ],
    satisfaction: [
      { date: '2024-01-10', rating: 4.5 },
      { date: '2024-01-11', rating: 4.7 },
      { date: '2024-01-12', rating: 4.6 },
      { date: '2024-01-13', rating: 4.8 },
      { date: '2024-01-14', rating: 4.5 },
      { date: '2024-01-15', rating: 4.7 },
      { date: '2024-01-16', rating: 4.6 }
    ],
    performance: [
      { date: '2024-01-10', response: 1.3, resolution: 5.1 },
      { date: '2024-01-11', response: 1.1, resolution: 4.8 },
      { date: '2024-01-12', response: 1.2, resolution: 4.9 },
      { date: '2024-01-13', response: 1.0, resolution: 4.5 },
      { date: '2024-01-14', response: 1.4, resolution: 5.2 },
      { date: '2024-01-15', response: 1.2, resolution: 4.7 },
      { date: '2024-01-16', response: 1.2, resolution: 4.8 }
    ]
  },
  languages: [
    { language: 'English', calls: 2145, percentage: 75.3 },
    { language: 'Spanish', calls: 428, percentage: 15.0 },
    { language: 'French', calls: 171, percentage: 6.0 },
    { language: 'German', calls: 103, percentage: 3.6 }
  ],
  emotions: [
    { emotion: 'Satisfied', count: 1368, percentage: 48.1 },
    { emotion: 'Neutral', count: 997, percentage: 35.0 },
    { emotion: 'Frustrated', count: 312, percentage: 11.0 },
    { emotion: 'Confused', count: 170, percentage: 6.0 }
  ],
  topics: [
    { topic: 'Account Support', count: 847, avgDuration: 3.8, satisfaction: 4.7 },
    { topic: 'Technical Issues', count: 623, avgDuration: 5.2, satisfaction: 4.2 },
    { topic: 'Billing Inquiries', count: 445, avgDuration: 2.9, satisfaction: 4.8 },
    { topic: 'Product Information', count: 398, avgDuration: 2.1, satisfaction: 4.9 },
    { topic: 'Cancellation', count: 234, avgDuration: 4.6, satisfaction: 3.8 }
  ],
  agents: [
    { id: 'agent-1', name: 'Voice Agent Alpha', calls: 342, avgDuration: 3.1, satisfaction: 4.8, status: 'active' },
    { id: 'agent-2', name: 'Voice Agent Beta', calls: 298, avgDuration: 3.4, satisfaction: 4.6, status: 'active' },
    { id: 'agent-3', name: 'Voice Agent Gamma', calls: 267, avgDuration: 2.9, satisfaction: 4.7, status: 'idle' },
    { id: 'agent-4', name: 'Voice Agent Delta', calls: 189, avgDuration: 3.8, satisfaction: 4.4, status: 'active' }
  ],
  recentCalls: [
    {
      id: 'call-001',
      timestamp: '2024-01-16T14:23:00Z',
      duration: 245,
      type: 'inbound',
      status: 'completed',
      sentiment: 'positive',
      language: 'English',
      transcriptPreview: 'Hello, I need help with my account settings...',
      satisfaction: 5
    },
    {
      id: 'call-002',
      timestamp: '2024-01-16T14:18:00Z',
      duration: 432,
      type: 'inbound',
      status: 'transferred',
      sentiment: 'neutral',
      language: 'Spanish',
      transcriptPreview: 'Hola, tengo una pregunta sobre mi factura...'
    },
    {
      id: 'call-003',
      timestamp: '2024-01-16T14:15:00Z',
      duration: 0,
      type: 'inbound',
      status: 'missed',
      sentiment: 'neutral',
      language: 'English',
      transcriptPreview: 'No transcript available'
    }
  ]
}

interface VoiceAnalyticsDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: string) => void
}

export function VoiceAnalyticsDashboard({ 
  timeRange = '7d', 
  onTimeRangeChange 
}: VoiceAnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [analytics, setAnalytics] = useState<VoiceAnalytics>(mockAnalytics)
  const [isLive, setIsLive] = useState(true)

  // Auto-refresh for live data
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      // Simulate real-time updates
      setAnalytics(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          totalCalls: prev.overview.totalCalls + Math.floor(Math.random() * 3),
          activeAgents: 8 + Math.floor(Math.random() * 8)
        }
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [isLive])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'transferred':
        return <PhoneCall className="h-4 w-4 text-blue-600" />
      default:
        return <Phone className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Voice Analytics Dashboard
          </h2>
          <p className="text-gray-600">Real-time insights into your voice agent performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">{isLive ? 'Live' : 'Paused'}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{analytics.overview.totalCalls.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% from last week
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.overview.successRate}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +2.3% from last week
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{analytics.overview.customerSatisfaction}/5</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +0.2 from last week
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost per Call</p>
                <p className="text-2xl font-bold">${analytics.overview.costPerCall}</p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -5.1% from last week
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="calls">Call Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Call Volume Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.trends.callVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [value, name === 'calls' ? 'Calls' : 'Minutes']}
                    />
                    <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
                    <Area type="monotone" dataKey="minutes" stackId="2" stroke="#10b981" fill="#86efac" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Call Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Call Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Inbound', value: analytics.callMetrics.inbound, fill: '#3b82f6' },
                        { name: 'Outbound', value: analytics.callMetrics.outbound, fill: '#10b981' },
                        { name: 'Missed', value: analytics.callMetrics.missed, fill: '#ef4444' },
                        { name: 'Transferred', value: analytics.callMetrics.transferred, fill: '#f59e0b' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Inbound', value: analytics.callMetrics.inbound, fill: '#3b82f6' },
                        { name: 'Outbound', value: analytics.callMetrics.outbound, fill: '#10b981' },
                        { name: 'Missed', value: analytics.callMetrics.missed, fill: '#ef4444' },
                        { name: 'Transferred', value: analytics.callMetrics.transferred, fill: '#f59e0b' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Languages and Emotions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.languages.map((lang) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Languages className="h-4 w-4 text-gray-600" />
                        <span>{lang.language}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${lang.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{lang.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emotion Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.emotions.map((emotion) => (
                    <div key={emotion.emotion} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {emotion.emotion === 'Satisfied' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                        {emotion.emotion === 'Neutral' && <MessageSquare className="h-4 w-4 text-gray-600" />}
                        {emotion.emotion === 'Frustrated' && <ThumbsDown className="h-4 w-4 text-red-600" />}
                        {emotion.emotion === 'Confused' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                        <span>{emotion.emotion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              emotion.emotion === 'Satisfied' ? 'bg-green-600' :
                              emotion.emotion === 'Neutral' ? 'bg-gray-600' :
                              emotion.emotion === 'Frustrated' ? 'bg-red-600' :
                              'bg-yellow-600'
                            }`}
                            style={{ width: `${emotion.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{emotion.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Response & Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analytics.trends.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [
                        `${value}s`, 
                        name === 'response' ? 'Response Time' : 'Resolution Time'
                      ]}
                    />
                    <Line type="monotone" dataKey="response" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolution" stroke="#10b981" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Timer className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{analytics.performance.avgResponseTime}s</div>
                      <div className="text-sm text-gray-600">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{analytics.performance.firstCallResolution}%</div>
                      <div className="text-sm text-gray-600">First Call Resolution</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{analytics.performance.speechClarity}%</div>
                      <div className="text-sm text-gray-600">Speech Clarity</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Heart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-600">{(analytics.performance.sentimentScore * 100).toFixed(0)}%</div>
                      <div className="text-sm text-gray-600">Positive Sentiment</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Topic Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Topic Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topics.map((topic) => (
                  <div key={topic.topic} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{topic.topic}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{topic.count} calls</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{topic.satisfaction}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="block">Call Count</span>
                        <span className="font-medium text-gray-900">{topic.count}</span>
                      </div>
                      <div>
                        <span className="block">Avg Duration</span>
                        <span className="font-medium text-gray-900">{topic.avgDuration} min</span>
                      </div>
                      <div>
                        <span className="block">Satisfaction</span>
                        <span className="font-medium text-gray-900">{topic.satisfaction}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mic className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              agent.status === 'active' ? 'default' :
                              agent.status === 'idle' ? 'secondary' :
                              'outline'
                            }>
                              {agent.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{agent.satisfaction}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 block">Total Calls</span>
                        <span className="font-medium text-lg">{agent.calls}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Avg Duration</span>
                        <span className="font-medium text-lg">{agent.avgDuration} min</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Satisfaction</span>
                        <span className="font-medium text-lg">{agent.satisfaction}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          {/* Recent Calls */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Call Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {analytics.recentCalls.map((call) => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {call.type === 'inbound' ? (
                              <PhoneIncoming className="h-4 w-4 text-green-600" />
                            ) : (
                              <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                            )}
                            {getStatusIcon(call.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Call {call.id}</span>
                              <Badge variant="outline" className="text-xs">{call.language}</Badge>
                              {getSentimentIcon(call.sentiment)}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {call.transcriptPreview}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                              <span>{call.duration > 0 ? formatDuration(call.duration) : 'No duration'}</span>
                              <span className="capitalize">{call.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {call.satisfaction && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{call.satisfaction}</span>
                            </div>
                          )}
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Listen
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VoiceAnalyticsDashboard