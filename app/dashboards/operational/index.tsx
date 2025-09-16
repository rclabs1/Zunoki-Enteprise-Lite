"use client"

import React, { useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/dashboard-context'
import { useMaya } from '@/contexts/maya-context'

interface OperationalMetrics {
  dailySpend: number
  dailyConversions: number
  activeCampaigns: number
  pausedCampaigns: number
  campaignsNeedingAttention: number
  avgCTR: number
  avgCPC: number
  avgRTAS: number
  impressionShare: number
  qualityScore: number
}

interface CampaignAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  campaign: string
  message: string
  timestamp: Date
  actionRequired: boolean
}

interface PerformanceTrend {
  date: string
  spend: number
  conversions: number
  roas: number
}

export default function OperationalDashboard() {
  const { data, loading } = useDashboard()
  const { sendMessage } = useMaya()
  const [timeframe, setTimeframe] = useState('today')
  const [alerts, setAlerts] = useState<CampaignAlert[]>([])
  const [trends, setTrends] = useState<PerformanceTrend[]>([])

  useEffect(() => {
    // Mock operational data
    setAlerts([
      {
        id: '1',
        type: 'error',
        campaign: 'Competitor Keywords',
        message: 'CPA exceeded target by 85% - campaign paused automatically',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        actionRequired: true
      },
      {
        id: '2',
        type: 'warning',
        campaign: 'Brand Search',
        message: 'Quality Score dropped to 6.2 - keywords need optimization',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionRequired: true
      },
      {
        id: '3',
        type: 'info',
        campaign: 'Product Launch',
        message: 'Budget utilization at 85% - consider increasing daily budget',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        actionRequired: false
      },
      {
        id: '4',
        type: 'warning',
        campaign: 'Retargeting Campaign',
        message: 'Frequency capping reached - audience saturation detected',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        actionRequired: true
      }
    ])

    setTrends([
      { date: '2024-01-20', spend: 2340, conversions: 23, roas: 3.2 },
      { date: '2024-01-21', spend: 2180, conversions: 27, roas: 3.8 },
      { date: '2024-01-22', spend: 2450, conversions: 31, roas: 4.1 },
      { date: '2024-01-23', spend: 2890, conversions: 28, roas: 3.6 },
      { date: '2024-01-24', spend: 3120, conversions: 35, roas: 4.3 },
      { date: '2024-01-25', spend: 2760, conversions: 29, roas: 3.9 },
      { date: '2024-01-26', spend: 2950, conversions: 33, roas: 4.2 }
    ])
  }, [])

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const getAlertIcon = (type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'error': return '🔴'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
    }
  }

  const getAlertColor = (type: 'warning' | 'error' | 'info') => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
    }
  }

  const operationalMetrics: OperationalMetrics = {
    dailySpend: 2950,
    dailyConversions: 33,
    activeCampaigns: 12,
    pausedCampaigns: 3,
    campaignsNeedingAttention: 2,
    avgCTR: 2.43,
    avgCPC: 9.87,
    avgRTAS: 4.2,
    impressionShare: 68.5,
    qualityScore: 7.8
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operational Dashboard</h1>
          <p className="text-gray-600">Real-time campaign monitoring and alerts</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 days</option>
          </select>
          
          <button
            onClick={() => handleAskMaya("What campaigns need my immediate attention and why?")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            🤖 Ask Agent Maya
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Daily Spend</p>
              <p className="text-lg font-bold text-gray-900">${operationalMetrics.dailySpend.toLocaleString()}</p>
            </div>
            <div className="text-blue-500 text-xl">💰</div>
          </div>
          <p className="text-xs text-green-500 mt-1">↑ 8% vs yesterday</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Conversions</p>
              <p className="text-lg font-bold text-gray-900">{operationalMetrics.dailyConversions}</p>
            </div>
            <div className="text-green-500 text-xl">🎯</div>
          </div>
          <p className="text-xs text-green-500 mt-1">↑ 12% vs yesterday</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active Campaigns</p>
              <p className="text-lg font-bold text-gray-900">{operationalMetrics.activeCampaigns}</p>
            </div>
            <div className="text-green-500 text-xl">●</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{operationalMetrics.pausedCampaigns} paused</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Avg CTR</p>
              <p className="text-lg font-bold text-gray-900">{operationalMetrics.avgCTR}%</p>
            </div>
            <div className="text-blue-500 text-xl">📊</div>
          </div>
          <p className="text-xs text-green-500 mt-1">↑ 0.3% vs yesterday</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">ROAS</p>
              <p className="text-lg font-bold text-gray-900">{operationalMetrics.avgRTAS}x</p>
            </div>
            <div className="text-green-500 text-xl">📈</div>
          </div>
          <p className="text-xs text-green-500 mt-1">↑ 0.4x vs yesterday</p>
        </div>
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Campaign Alerts</h3>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
              {alerts.filter(a => a.actionRequired).length} require action
            </span>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="text-lg">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{alert.campaign}</div>
                    <div className="text-sm text-gray-700 mt-1">{alert.message}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {alert.actionRequired && (
                    <button
                      onClick={() => handleAskMaya(`Help me resolve the issue with ${alert.campaign}: ${alert.message}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      🤖 Fix
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleAskMaya("Pause all campaigns with CPA above target")}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">⏸ Pause High CPA Campaigns</div>
              <div className="text-sm text-gray-600">Automatically pause underperforming campaigns</div>
            </button>

            <button
              onClick={() => handleAskMaya("Increase budget for campaigns with ROAS above 3.5x")}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">💰 Scale Top Performers</div>
              <div className="text-sm text-gray-600">Increase budget for high-performing campaigns</div>
            </button>

            <button
              onClick={() => handleAskMaya("Optimize keywords for campaigns with quality score below 7")}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">🔍 Keyword Optimization</div>
              <div className="text-sm text-gray-600">Improve quality scores and reduce costs</div>
            </button>

            <button
              onClick={() => handleAskMaya("Generate today's performance summary report")}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">📄 Daily Report</div>
              <div className="text-sm text-gray-600">Generate performance summary for today</div>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">7-Day Performance Trend</h3>
        <div className="grid grid-cols-7 gap-2">
          {trends.map((trend, index) => (
            <div key={trend.date} className="text-center">
              <div className="text-xs text-gray-600 mb-2">
                {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="bg-blue-100 rounded p-2 mb-1">
                <div className="text-sm font-medium text-blue-800">${(trend.spend / 1000).toFixed(1)}k</div>
                <div className="text-xs text-blue-600">spend</div>
              </div>
              <div className="bg-green-100 rounded p-2 mb-1">
                <div className="text-sm font-medium text-green-800">{trend.conversions}</div>
                <div className="text-xs text-green-600">conv</div>
              </div>
              <div className="bg-purple-100 rounded p-2">
                <div className="text-sm font-medium text-purple-800">{trend.roas}x</div>
                <div className="text-xs text-purple-600">ROAS</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Real-time Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-900">Product Launch Campaign</span>
            <span className="text-gray-500">generated 3 new conversions</span>
            <span className="text-gray-400">2 min ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-900">Brand Search Campaign</span>
            <span className="text-gray-500">budget increased to $200/day</span>
            <span className="text-gray-400">8 min ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-900">Competitor Keywords</span>
            <span className="text-gray-500">paused due to high CPA</span>
            <span className="text-gray-400">30 min ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-900">Retargeting Campaign</span>
            <span className="text-gray-500">frequency cap reached - audience refreshed</span>
            <span className="text-gray-400">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}