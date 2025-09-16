"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Clock,
  Users,
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  MessageSquare,
  TrendingUp,
  Activity
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface BroadcastCampaign {
  id: string
  name: string
  status: 'sending' | 'scheduled' | 'paused' | 'completed' | 'failed' | 'draft'
  platforms: string[]
  audience: {
    total: number
    segments: string[]
  }
  message: {
    preview: string
    hasMedia: boolean
  }
  schedule: {
    createdAt: Date
    scheduledFor?: Date
    startedAt?: Date
    completedAt?: Date
  }
  progress: {
    sent: number
    delivered: number
    failed: number
    pending: number
    responses: number
  }
  performance: {
    deliveryRate: number
    responseRate: number
    openRate: number
  }
  estimatedCompletion?: Date
  cost?: number
}

export function ActiveBroadcasts() {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([])
  const [activeTab, setActiveTab] = useState('active')
  const [refreshing, setRefreshing] = useState(false)

  const mockCampaigns: BroadcastCampaign[] = [
    {
      id: '1',
      name: 'Product Launch Announcement',
      status: 'sending',
      platforms: ['whatsapp', 'telegram'],
      audience: {
        total: 2450,
        segments: ['Premium Users', 'Newsletter Subscribers']
      },
      message: {
        preview: '🚀 Exciting news! We just launched our new product...',
        hasMedia: true
      },
      schedule: {
        createdAt: new Date('2024-01-15T09:00:00'),
        startedAt: new Date('2024-01-15T10:00:00')
      },
      progress: {
        sent: 1834,
        delivered: 1756,
        failed: 23,
        pending: 616,
        responses: 287
      },
      performance: {
        deliveryRate: 95.7,
        responseRate: 15.6,
        openRate: 82.3
      },
      estimatedCompletion: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      cost: 36.80
    },
    {
      id: '2',
      name: 'Weekend Special Offer',
      status: 'scheduled',
      platforms: ['whatsapp', 'twilio-sms'],
      audience: {
        total: 3200,
        segments: ['All Customers', 'Recent Signups']
      },
      message: {
        preview: '🎉 Weekend Special! Get 25% off on all products...',
        hasMedia: false
      },
      schedule: {
        createdAt: new Date('2024-01-14T15:30:00'),
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      },
      progress: {
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 3200,
        responses: 0
      },
      performance: {
        deliveryRate: 0,
        responseRate: 0,
        openRate: 0
      },
      cost: 64.00
    },
    {
      id: '3',
      name: 'Newsletter Update',
      status: 'paused',
      platforms: ['telegram', 'gmail'],
      audience: {
        total: 1890,
        segments: ['Newsletter Subscribers']
      },
      message: {
        preview: 'Monthly newsletter with latest updates and insights...',
        hasMedia: true
      },
      schedule: {
        createdAt: new Date('2024-01-14T11:00:00'),
        startedAt: new Date('2024-01-14T14:00:00')
      },
      progress: {
        sent: 945,
        delivered: 891,
        failed: 12,
        pending: 945,
        responses: 89
      },
      performance: {
        deliveryRate: 94.3,
        responseRate: 9.4,
        openRate: 78.2
      },
      cost: 18.90
    },
    {
      id: '4',
      name: 'Event Reminder',
      status: 'completed',
      platforms: ['whatsapp'],
      audience: {
        total: 567,
        segments: ['Event Attendees']
      },
      message: {
        preview: '📅 Don\'t forget! Our webinar starts in 24 hours...',
        hasMedia: false
      },
      schedule: {
        createdAt: new Date('2024-01-13T16:00:00'),
        startedAt: new Date('2024-01-13T18:00:00'),
        completedAt: new Date('2024-01-13T18:15:00')
      },
      progress: {
        sent: 567,
        delivered: 534,
        failed: 8,
        pending: 0,
        responses: 89
      },
      performance: {
        deliveryRate: 94.2,
        responseRate: 15.7,
        openRate: 86.1
      },
      cost: 11.34
    },
    {
      id: '5',
      name: 'Customer Feedback Survey',
      status: 'failed',
      platforms: ['twilio-sms'],
      audience: {
        total: 1200,
        segments: ['Recent Purchases']
      },
      message: {
        preview: 'How was your recent purchase experience? Please share...',
        hasMedia: false
      },
      schedule: {
        createdAt: new Date('2024-01-12T10:00:00'),
        startedAt: new Date('2024-01-12T14:00:00')
      },
      progress: {
        sent: 234,
        delivered: 198,
        failed: 36,
        pending: 0,
        responses: 23
      },
      performance: {
        deliveryRate: 84.6,
        responseRate: 9.8,
        openRate: 72.1
      },
      cost: 4.68
    }
  ]

  useEffect(() => {
    setCampaigns(mockCampaigns)
  }, [])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sending':
        return { color: 'bg-blue-100 text-blue-800', icon: Activity, label: 'Sending' }
      case 'scheduled':
        return { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'Scheduled' }
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Pause, label: 'Paused' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' }
      case 'failed':
        return { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Failed' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Edit, label: 'Draft' }
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'whatsapp': '💚',
      'telegram': '✈️',
      'twilio-sms': '💬',
      'gmail': '📧',
      'facebook': '📘'
    }
    return icons[platform] || '📱'
  }

  const getProgressPercentage = (campaign: BroadcastCampaign) => {
    const total = campaign.audience.total
    const completed = campaign.progress.sent
    return Math.round((completed / total) * 100)
  }

  const handleCampaignAction = (campaignId: string, action: string) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        switch (action) {
          case 'pause':
            return { ...campaign, status: 'paused' as const }
          case 'resume':
            return { ...campaign, status: 'sending' as const }
          case 'stop':
            return { ...campaign, status: 'completed' as const }
          default:
            return campaign
        }
      }
      return campaign
    }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getFilteredCampaigns = () => {
    switch (activeTab) {
      case 'active':
        return campaigns.filter(c => ['sending', 'scheduled', 'paused'].includes(c.status))
      case 'completed':
        return campaigns.filter(c => c.status === 'completed')
      case 'failed':
        return campaigns.filter(c => c.status === 'failed')
      default:
        return campaigns
    }
  }

  const activeCampaigns = campaigns.filter(c => ['sending', 'scheduled', 'paused'].includes(c.status))
  const totalActive = activeCampaigns.length
  const totalSending = campaigns.filter(c => c.status === 'sending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Active Broadcasts</h2>
          <p className="text-gray-600">Monitor and manage your ongoing messaging campaigns</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            New Broadcast
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Sending</p>
                <p className="text-2xl font-bold">{totalSending}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">
                  {activeCampaigns.reduce((sum, c) => sum + c.audience.total, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Sent Today</p>
                <p className="text-2xl font-bold">
                  {activeCampaigns.reduce((sum, c) => sum + c.progress.sent, 0).toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({campaigns.filter(c => ['sending', 'scheduled', 'paused'].includes(c.status)).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({campaigns.filter(c => c.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({campaigns.filter(c => c.status === 'failed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredCampaigns().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-600">
                  {activeTab === 'active' && "You don't have any active campaigns at the moment."}
                  {activeTab === 'completed' && "No completed campaigns to show."}
                  {activeTab === 'failed' && "No failed campaigns to show."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredCampaigns().map((campaign) => {
                const statusConfig = getStatusConfig(campaign.status)
                const StatusIcon = statusConfig.icon
                const progressPercentage = getProgressPercentage(campaign)

                return (
                  <Card key={campaign.id}>
                    <CardContent className="p-6">
                      {/* Campaign Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <div className="flex space-x-1">
                                {campaign.platforms.map(platform => (
                                  <span key={platform} title={platform}>
                                    {getPlatformIcon(platform)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {campaign.status === 'sending' && (
                              <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'pause')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'resume')}>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </DropdownMenuItem>
                            )}
                            {['sending', 'paused'].includes(campaign.status) && (
                              <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'stop')}>
                                <Square className="h-4 w-4 mr-2" />
                                Stop
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Campaign Progress */}
                      {campaign.status === 'sending' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress: {campaign.progress.sent.toLocaleString()} / {campaign.audience.total.toLocaleString()} sent</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          {campaign.estimatedCompletion && (
                            <p className="text-xs text-gray-500 mt-1">
                              Estimated completion: {campaign.estimatedCompletion.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Message Preview */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Message Preview</span>
                          {campaign.message.hasMedia && (
                            <Badge variant="outline" className="text-xs">Media</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {campaign.message.preview}
                        </p>
                      </div>

                      {/* Statistics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Audience</p>
                          <p className="font-semibold">{campaign.audience.total.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Sent</p>
                          <p className="font-semibold">{campaign.progress.sent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivered</p>
                          <p className="font-semibold">{campaign.progress.delivered.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Responses</p>
                          <p className="font-semibold">{campaign.progress.responses.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivery Rate</p>
                          <p className="font-semibold">{campaign.performance.deliveryRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cost</p>
                          <p className="font-semibold">${campaign.cost?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {campaign.schedule.createdAt.toLocaleDateString()}</span>
                        </div>
                        {campaign.schedule.scheduledFor && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Scheduled: {campaign.schedule.scheduledFor.toLocaleString()}</span>
                          </div>
                        )}
                        {campaign.schedule.startedAt && (
                          <div className="flex items-center space-x-1">
                            <Play className="h-3 w-3" />
                            <span>Started: {campaign.schedule.startedAt.toLocaleString()}</span>
                          </div>
                        )}
                        {campaign.schedule.completedAt && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Completed: {campaign.schedule.completedAt.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}