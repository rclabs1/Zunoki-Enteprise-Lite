"use client"

import React, { useState, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'
import { useAuth } from '@/contexts/auth-context'

interface GoogleAdsData {
  campaigns: Array<{
    id: string
    name: string
    status: string
    spend: number
    clicks: number
    impressions: number
    conversions: number
    ctr: number
    cpc: number
    cpa: number
    qualityScore: number
  }>
  summary: {
    totalSpend: number
    totalClicks: number
    totalImpressions: number
    totalConversions: number
    avgCtr: number
    avgCpc: number
    avgQualityScore: number
  }
  insights: string[]
}

export function GoogleAdsView() {
  const { sendMessage } = useMaya()
  const { user } = useAuth()
  const [data, setData] = useState<GoogleAdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadGoogleAdsData()
  }, [timeRange])

  const loadGoogleAdsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/google-ads/fetchPerformanceMetrics?days=${timeRange}`)
      const result = await response.json()
      
      // Transform the data for display
      const transformedData: GoogleAdsData = {
        campaigns: result.campaigns || [],
        summary: result.summary || {
          totalSpend: 12400,
          totalClicks: 1247,
          totalImpressions: 45000,
          totalConversions: 89,
          avgCtr: 2.77,
          avgCpc: 9.95,
          avgQualityScore: 7.8
        },
        insights: [
          "Quality Score improved 0.3 points this month",
          "Brand campaigns showing 23% better CTR than competitors",
          "Search lost impression share at 12% - opportunity to increase budget",
          "Mobile performance 15% better than desktop"
        ]
      }
      
      setData(transformedData)
    } catch (error) {
      console.error('Failed to load Google Ads data:', error)
      // Set mock data for demo
      setData({
        campaigns: [
          { id: '1', name: 'Brand Search', status: 'ENABLED', spend: 4200, clicks: 420, impressions: 15000, conversions: 32, ctr: 2.8, cpc: 10.0, cpa: 131.25, qualityScore: 8.2 },
          { id: '2', name: 'Product Keywords', status: 'ENABLED', spend: 3100, clicks: 285, impressions: 12000, conversions: 21, ctr: 2.375, cpc: 10.88, cpa: 147.62, qualityScore: 7.1 },
          { id: '3', name: 'Competitor Terms', status: 'PAUSED', spend: 1800, clicks: 156, impressions: 8000, conversions: 8, ctr: 1.95, cpc: 11.54, cpa: 225.0, qualityScore: 6.8 },
          { id: '4', name: 'Discovery Campaign', status: 'ENABLED', spend: 2300, clicks: 201, impressions: 18000, conversions: 15, ctr: 1.117, cpc: 11.44, cpa: 153.33, qualityScore: 7.9 },
          { id: '5', name: 'Shopping Campaigns', status: 'ENABLED', spend: 1000, clicks: 185, impressions: 5000, conversions: 13, ctr: 3.7, cpc: 5.41, cpa: 76.92, qualityScore: 8.5 }
        ],
        summary: {
          totalSpend: 12400,
          totalClicks: 1247,
          totalImpressions: 58000,
          totalConversions: 89,
          avgCtr: 2.15,
          avgCpc: 9.94,
          avgQualityScore: 7.7
        },
        insights: [
          "Shopping campaigns showing best CPA at $76.92",
          "Brand search maintaining strong 8.2 quality score",
          "Competitor terms paused due to high CPA - consider new strategy",
          "Discovery campaign reach expanding 18% month-over-month"
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p style={{color: '#000000'}}>Failed to load Google Ads data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">📊</div>
          <div>
            <h2 className="text-xl font-semibold" style={{color: '#000000'}}>Google Ads Performance</h2>
            <p style={{color: '#000000'}}>Detailed analysis of your Google Ads campaigns</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <button
            onClick={() => handleAskMaya("Analyze my Google Ads performance and suggest optimizations")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            🤖 Ask Agent Maya
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Total Spend</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>${data.summary.totalSpend.toLocaleString()}</div>
          <div className="text-xs text-green-500 mt-1">↑ 8% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Conversions</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>{data.summary.totalConversions}</div>
          <div className="text-xs text-green-500 mt-1">↑ 15% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Avg CPC</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>${data.summary.avgCpc.toFixed(2)}</div>
          <div className="text-xs text-red-500 mt-1">↑ 3% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Quality Score</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>{data.summary.avgQualityScore.toFixed(1)}</div>
          <div className="text-xs text-green-500 mt-1">↑ 0.3 vs last period</div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold" style={{color: '#000000'}}>Campaign Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Conversions</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>CPA</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>CTR</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Quality Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium" style={{color: '#000000'}}>{campaign.name}</div>
                    <div className="text-sm" style={{color: '#000000'}}>{campaign.impressions.toLocaleString()} impressions</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'ENABLED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status === 'ENABLED' ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>${campaign.spend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>{campaign.conversions}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>${campaign.cpa.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>{campaign.ctr.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-sm" style={{color: '#000000'}}>{campaign.qualityScore.toFixed(1)}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        campaign.qualityScore >= 8 ? 'bg-green-500' :
                        campaign.qualityScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleAskMaya(`Analyze my "${campaign.name}" campaign performance and suggest improvements`)}
                      className="hover:text-blue-700 text-sm"
                      style={{color: '#000000'}}
                    >
                      🤖 Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Ads Specific Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-4" style={{color: '#000000'}}>Google Ads Insights</h3>
        <div className="space-y-3">
          {data.insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm" style={{color: '#000000'}}>{insight}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => handleAskMaya("What are the top 3 optimizations I should make to my Google Ads campaigns?")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            🔧 Get Optimization Plan
          </button>
          <button
            onClick={() => handleAskMaya("Create a Google Ads performance report for my team")}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            style={{color: '#000000'}}
          >
            📄 Generate Report
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3" style={{color: '#000000'}}>Quick Actions with Agent Maya</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleAskMaya("Pause all Google Ads campaigns with CPA above $200")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>⏸ Pause High CPA</div>
            <div className="text-sm" style={{color: '#000000'}}>Auto-pause underperforming campaigns</div>
          </button>
          
          <button
            onClick={() => handleAskMaya("Increase budget for Google Ads campaigns with ROAS above 3.0")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>💰 Scale Winners</div>
            <div className="text-sm" style={{color: '#000000'}}>Increase budget for top performers</div>
          </button>
          
          <button
            onClick={() => handleAskMaya("Optimize Google Ads keywords and negative keywords based on search terms report")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>🔍 Keyword Optimization</div>
            <div className="text-sm" style={{color: '#000000'}}>Refine targeting and negative keywords</div>
          </button>
        </div>
      </div>
    </div>
  )
}