"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Info,
  Lightbulb,
  Shield
} from 'lucide-react'
import { complianceScoring } from '@/lib/compliance-scoring'

interface ComplianceAnalytics {
  summary: {
    total_campaigns: number;
    avg_compliance_score: number;
    compliant_campaigns: number;
    compliance_rate: number;
    trend_direction: 'up' | 'down' | 'stable';
  };
  platform_scores: Record<string, number>;
  recent_scores: Array<{ date: string; score: number; campaign_name: string }>;
  top_issues: Array<{ issue: string; frequency: number; score_impact: number }>;
  improvement_suggestions: string[];
}

export function ComplianceAnalytics() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<ComplianceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    if (user?.id) {
      loadAnalytics()
    }
  }, [user?.id, selectedPeriod])

  const loadAnalytics = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await complianceScoring.getUserComplianceAnalytics(user.id, selectedPeriod)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading compliance analytics:', error)
      // Set fallback empty data
      setAnalytics({
        summary: {
          total_campaigns: 0,
          avg_compliance_score: 0,
          compliant_campaigns: 0,
          compliance_rate: 0,
          trend_direction: 'stable'
        },
        platform_scores: {},
        recent_scores: [],
        top_issues: [],
        improvement_suggestions: ['Create your first broadcast campaign to get compliance insights']
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  // Chart data transformations
  const platformChartData = analytics ? Object.entries(analytics.platform_scores).map(([platform, score]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    score: score,
    fill: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  })) : []

  const trendChartData = analytics?.recent_scores.slice(-10).reverse().map((item, index) => ({
    day: `Day ${index + 1}`,
    score: item.score,
    campaign: item.campaign_name
  })) || []

  const issuesChartData = analytics?.top_issues.slice(0, 5).map(issue => ({
    issue: issue.issue.length > 30 ? issue.issue.substring(0, 30) + '...' : issue.issue,
    frequency: issue.frequency,
    impact: issue.score_impact
  })) || []

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Data</h3>
        <p className="text-gray-600">Start sending campaigns to see compliance analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance Analytics</h2>
          <p className="text-gray-600">Monitor and improve your broadcast compliance</p>
        </div>
        <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'quarter') => setSelectedPeriod(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{analytics.summary.total_campaigns}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Compliance Score</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{analytics.summary.avg_compliance_score}%</p>
                  {getTrendIcon(analytics.summary.trend_direction)}
                </div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliant Campaigns</p>
                <p className="text-2xl font-bold">{analytics.summary.compliant_campaigns}</p>
                <p className="text-xs text-gray-500">({analytics.summary.compliance_rate}% rate)</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues Detected</p>
                <p className="text-2xl font-bold">{analytics.top_issues.length}</p>
                <p className="text-xs text-gray-500">Active warnings</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Compliance Trend</span>
                </CardTitle>
                <CardDescription>Recent campaign compliance scores</CardDescription>
              </CardHeader>
              <CardContent>
                {trendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`${value}%`, 'Compliance Score']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.1} 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No trend data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Platform Breakdown</span>
                </CardTitle>
                <CardDescription>Compliance scores by platform</CardDescription>
              </CardHeader>
              <CardContent>
                {platformChartData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={platformChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="score"
                          label={({ platform, score }) => `${platform}: ${score}%`}
                        >
                          {platformChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value}%`, 'Score']} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="space-y-2">
                      {Object.entries(analytics.platform_scores).map(([platform, score]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{platform}</span>
                          <Badge variant={getScoreBadgeVariant(score)}>
                            {score}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <PieChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No platform data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Compliance Scores</CardTitle>
              <CardDescription>Detailed compliance analysis by messaging platform</CardDescription>
            </CardHeader>
            <CardContent>
              {platformChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={platformChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Compliance Score']} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {platformChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No platform data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Compliance Issues</CardTitle>
                <CardDescription>Most frequent compliance problems</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.top_issues.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.top_issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{issue.issue}</p>
                          <p className="text-xs text-gray-600">Impact: -{issue.score_impact} points avg</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {issue.frequency} times
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No compliance issues detected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issue Frequency</CardTitle>
                <CardDescription>Frequency of compliance violations</CardDescription>
              </CardHeader>
              <CardContent>
                {issuesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issuesChartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="issue" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="frequency" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No issue data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Improvement Suggestions</span>
              </CardTitle>
              <CardDescription>Actionable recommendations to improve your compliance</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.improvement_suggestions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.improvement_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Great job! No specific suggestions at this time.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>General guidelines for maintaining high compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Always include opt-out instructions in marketing messages',
                  'Use approved message templates for bulk campaigns',
                  'Verify consent before sending promotional content',
                  'Keep messages concise and platform-appropriate',
                  'Include clear business identification',
                  'Monitor delivery rates and user feedback',
                  'Update consent records when users opt out',
                  'Regular compliance audits and reviews'
                ].map((practice, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <p className="text-sm text-green-700">{practice}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}