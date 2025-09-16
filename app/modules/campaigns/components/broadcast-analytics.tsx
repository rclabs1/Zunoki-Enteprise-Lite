"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointer,
  Download,
  Filter,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  period: string
  totalCampaigns: number
  messagesSent: number
  messagesDelivered: number
  messagesRead: number
  responses: number
  unsubscribes: number
  deliveryRate: number
  openRate: number
  responseRate: number
  unsubscribeRate: number
}

interface PlatformPerformance {
  platform: string
  icon: string
  messagesSent: number
  delivered: number
  responses: number
  deliveryRate: number
  responseRate: number
  cost: number
}

interface CampaignPerformance {
  id: string
  name: string
  platform: string[]
  sentAt: Date
  messagesSent: number
  delivered: number
  responses: number
  deliveryRate: number
  responseRate: number
  status: 'completed' | 'sending' | 'scheduled' | 'failed'
}

export function BroadcastAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [platformData, setPlatformData] = useState<PlatformPerformance[]>([])
  const [campaignData, setCampaignData] = useState<CampaignPerformance[]>([])

  // Mock analytics data
  const mockAnalytics: AnalyticsData = {
    period: '7 days',
    totalCampaigns: 12,
    messagesSent: 24567,
    messagesDelivered: 23145,
    messagesRead: 18920,
    responses: 3147,
    unsubscribes: 89,
    deliveryRate: 94.2,
    openRate: 81.7,
    responseRate: 12.8,
    unsubscribeRate: 0.4
  }

  const mockPlatformData: PlatformPerformance[] = [
    {
      platform: 'WhatsApp',
      icon: '💚',
      messagesSent: 12450,
      delivered: 11789,
      responses: 1876,
      deliveryRate: 94.7,
      responseRate: 15.9,
      cost: 248.50
    },
    {
      platform: 'SMS',
      icon: '💬',
      messagesSent: 8920,
      delivered: 8456,
      responses: 892,
      deliveryRate: 94.8,
      responseRate: 10.0,
      cost: 178.40
    },
    {
      platform: 'Telegram',
      icon: '✈️',
      messagesSent: 2890,
      delivered: 2678,
      responses: 312,
      deliveryRate: 92.7,
      responseRate: 10.8,
      cost: 0.00
    },
    {
      platform: 'Facebook',
      icon: '📘',
      messagesSent: 307,
      delivered: 222,
      responses: 67,
      deliveryRate: 72.3,
      responseRate: 21.8,
      cost: 15.35
    }
  ]

  const mockCampaignData: CampaignPerformance[] = [
    {
      id: '1',
      name: 'Product Launch WhatsApp',
      platform: ['whatsapp'],
      sentAt: new Date('2024-01-15T10:00:00'),
      messagesSent: 2450,
      delivered: 2301,
      responses: 387,
      deliveryRate: 93.9,
      responseRate: 15.8,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Newsletter Update',
      platform: ['telegram', 'whatsapp'],
      sentAt: new Date('2024-01-14T14:30:00'),
      messagesSent: 1890,
      delivered: 1792,
      responses: 234,
      deliveryRate: 94.8,
      responseRate: 12.4,
      status: 'completed'
    },
    {
      id: '3',
      name: 'SMS Reminder Campaign',
      platform: ['twilio-sms'],
      sentAt: new Date('2024-01-13T09:15:00'),
      messagesSent: 3200,
      delivered: 3024,
      responses: 298,
      deliveryRate: 94.5,
      responseRate: 9.3,
      status: 'completed'
    },
    {
      id: '4',
      name: 'Weekend Special Offer',
      platform: ['whatsapp', 'facebook'],
      sentAt: new Date('2024-01-12T16:00:00'),
      messagesSent: 1567,
      delivered: 1445,
      responses: 289,
      deliveryRate: 92.2,
      responseRate: 18.4,
      status: 'completed'
    },
    {
      id: '5',
      name: 'Event Invitation',
      platform: ['telegram'],
      sentAt: new Date('2024-01-11T11:45:00'),
      messagesSent: 890,
      delivered: 823,
      responses: 156,
      deliveryRate: 92.5,
      responseRate: 17.5,
      status: 'completed'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setAnalyticsData(mockAnalytics)
    setPlatformData(mockPlatformData)
    setCampaignData(mockCampaignData)
  }, [selectedPeriod])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'sending': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceIcon = (rate: number, threshold: number) => {
    return rate >= threshold ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Broadcast Analytics</h2>
          <p className="text-gray-600">Track performance across all your messaging campaigns</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.messagesSent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.deliveryRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getPerformanceIcon(analyticsData.deliveryRate, 90)}
              <span className={analyticsData.deliveryRate >= 90 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                {analyticsData.deliveryRate >= 90 ? 'Excellent' : 'Needs attention'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.responseRate}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getPerformanceIcon(analyticsData.responseRate, 10)}
              <span className={analyticsData.responseRate >= 10 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                {analyticsData.responseRate >= 10 ? 'Above average' : 'Below average'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.openRate}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              {getPerformanceIcon(analyticsData.openRate, 70)}
              <span className={analyticsData.openRate >= 70 ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                Industry standard
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Results</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Platform</CardTitle>
              <CardDescription>Compare how each messaging platform is performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformData.map((platform, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{platform.icon}</span>
                        <h3 className="font-semibold">{platform.platform}</h3>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        Cost: ${platform.cost.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Messages Sent</p>
                        <p className="font-semibold">{platform.messagesSent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivered</p>
                        <p className="font-semibold">{platform.delivered.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Responses</p>
                        <p className="font-semibold">{platform.responses.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivery Rate</p>
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold">{platform.deliveryRate}%</p>
                          {getPerformanceIcon(platform.deliveryRate, 90)}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">Response Rate</p>
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold">{platform.responseRate}%</p>
                          {getPerformanceIcon(platform.responseRate, 10)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaign Performance</CardTitle>
              <CardDescription>Detailed results for your latest broadcast campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaignData.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {campaign.sentAt.toLocaleDateString()} at {campaign.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      {campaign.platform.map(platformId => {
                        const platformInfo = mockPlatformData.find(p => p.platform.toLowerCase().includes(platformId.split('-')[0]))
                        return platformInfo ? (
                          <span key={platformId} className="text-sm">
                            {platformInfo.icon}
                          </span>
                        ) : null
                      })}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Sent</p>
                        <p className="font-semibold">{campaign.messagesSent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivered</p>
                        <p className="font-semibold">{campaign.delivered.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Responses</p>
                        <p className="font-semibold">{campaign.responses.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivery</p>
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold">{campaign.deliveryRate}%</p>
                          {getPerformanceIcon(campaign.deliveryRate, 90)}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">Response</p>
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold">{campaign.responseRate}%</p>
                          {getPerformanceIcon(campaign.responseRate, 10)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-powered recommendations to improve performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">WhatsApp performing well</h4>
                    <p className="text-sm text-gray-600">Your WhatsApp campaigns have 15.9% response rate, above industry average of 12%.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800">Optimal send time</h4>
                    <p className="text-sm text-gray-600">Messages sent between 10 AM - 2 PM have 23% higher open rates.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800">Audience engagement</h4>
                    <p className="text-sm text-gray-600">Premium users segment shows 28% higher response rates.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actions to improve your broadcast performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Facebook needs attention</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Facebook delivery rate (72.3%) is below average. Consider reviewing your content or audience targeting.
                  </p>
                </div>

                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Try A/B testing</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Test different message formats to potentially improve your 12.8% response rate.
                  </p>
                </div>

                <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MousePointer className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Expand WhatsApp usage</span>
                  </div>
                  <p className="text-sm text-green-700">
                    WhatsApp shows strong performance. Consider migrating more campaigns to this platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}