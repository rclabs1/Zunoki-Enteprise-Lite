"use client"

import React, { useState, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface MetaAdsData {
  campaigns: Array<{
    id: string
    name: string
    objective: string
    status: string
    spend: number
    reach: number
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    cpc: number
    cpm: number
    cpa: number
    frequency: number
    relevanceScore: number
  }>
  summary: {
    totalSpend: number
    totalReach: number
    totalConversions: number
    avgCtr: number
    avgCpc: number
    avgCpm: number
    avgFrequency: number
  }
  audienceInsights: {
    topAgeGroup: string
    topGender: string
    topLocation: string
    topInterest: string
  }
}

export function MetaAdsView() {
  const { sendMessage } = useMaya()
  const [data, setData] = useState<MetaAdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadMetaAdsData()
  }, [timeRange])

  const loadMetaAdsData = async () => {
    setLoading(true)
    try {
      // Mock data for demo - replace with actual API call
      const mockData: MetaAdsData = {
        campaigns: [
          { 
            id: '1', 
            name: 'Product Launch Campaign', 
            objective: 'CONVERSIONS', 
            status: 'ACTIVE', 
            spend: 4200, 
            reach: 85000, 
            impressions: 125000, 
            clicks: 2100, 
            conversions: 37, 
            ctr: 1.68, 
            cpc: 2.0, 
            cpm: 33.6, 
            cpa: 113.51, 
            frequency: 1.47, 
            relevanceScore: 8.2 
          },
          { 
            id: '2', 
            name: 'Retargeting Campaign', 
            objective: 'CONVERSIONS', 
            status: 'ACTIVE', 
            spend: 2800, 
            reach: 45000, 
            impressions: 67000, 
            clicks: 1340, 
            conversions: 28, 
            ctr: 2.0, 
            cpc: 2.09, 
            cpm: 41.8, 
            cpa: 100.0, 
            frequency: 1.49, 
            relevanceScore: 8.8 
          },
          { 
            id: '3', 
            name: 'Brand Awareness', 
            objective: 'REACH', 
            status: 'ACTIVE', 
            spend: 1500, 
            reach: 125000, 
            impressions: 180000, 
            clicks: 720, 
            conversions: 12, 
            ctr: 0.4, 
            cpc: 2.08, 
            cpm: 8.33, 
            cpa: 125.0, 
            frequency: 1.44, 
            relevanceScore: 7.5 
          },
          { 
            id: '4', 
            name: 'Lead Generation', 
            objective: 'LEAD_GENERATION', 
            status: 'ACTIVE', 
            spend: 2700, 
            reach: 62000, 
            impressions: 89000, 
            clicks: 1423, 
            conversions: 25, 
            ctr: 1.6, 
            cpc: 1.9, 
            cpm: 30.3, 
            cpa: 108.0, 
            frequency: 1.44, 
            relevanceScore: 8.1 
          }
        ],
        summary: {
          totalSpend: 11200,
          totalReach: 317000,
          totalConversions: 102,
          avgCtr: 1.42,
          avgCpc: 2.02,
          avgCpm: 28.5,
          avgFrequency: 1.46
        },
        audienceInsights: {
          topAgeGroup: '25-34',
          topGender: 'Female (58%)',
          topLocation: 'United States',
          topInterest: 'Technology'
        }
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Failed to load Meta Ads data:', error)
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
        <p style={{color: '#000000'}}>Failed to load Meta Ads data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">📱</div>
          <div>
            <h2 className="text-xl font-semibold" style={{color: '#000000'}}>Meta Ads Performance</h2>
            <p style={{color: '#000000'}}>Facebook & Instagram campaign insights</p>
          </div>
        </div>
        
        <button
          onClick={() => handleAskMaya("Analyze my Meta Ads performance and suggest audience optimizations")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          🤖 Ask Agent Maya
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Total Spend</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>${data.summary.totalSpend.toLocaleString()}</div>
          <div className="text-xs text-green-500 mt-1">↑ 12% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Total Reach</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>{(data.summary.totalReach / 1000).toFixed(0)}k</div>
          <div className="text-xs text-green-500 mt-1">↑ 18% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Conversions</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>{data.summary.totalConversions}</div>
          <div className="text-xs text-green-500 mt-1">↑ 22% vs last period</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm" style={{color: '#000000'}}>Avg CPM</div>
          <div className="text-2xl font-bold" style={{color: '#000000'}}>${data.summary.avgCpm.toFixed(2)}</div>
          <div className="text-xs text-red-500 mt-1">↑ 5% vs last period</div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold" style={{color: '#000000'}}>Campaign Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Objective</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Reach</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Conversions</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>CPA</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>CTR</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Relevance</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{color: '#000000'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium" style={{color: '#000000'}}>{campaign.name}</div>
                    <div className="text-sm" style={{color: '#000000'}}>Frequency: {campaign.frequency.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {campaign.objective.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>${campaign.spend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>{(campaign.reach / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>{campaign.conversions}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>${campaign.cpa.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm" style={{color: '#000000'}}>{campaign.ctr.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-sm" style={{color: '#000000'}}>{campaign.relevanceScore.toFixed(1)}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        campaign.relevanceScore >= 8 ? 'bg-green-500' :
                        campaign.relevanceScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleAskMaya(`Optimize my "${campaign.name}" Meta Ads campaign targeting and creative`)}
                      className="hover:text-blue-700 text-sm"
                      style={{color: '#000000'}}
                    >
                      🤖 Optimize
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audience Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold mb-4" style={{color: '#000000'}}>Audience Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium" style={{color: '#000000'}}>Top Age Group</div>
            <div className="text-blue-600 font-semibold">{data.audienceInsights.topAgeGroup}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">⚤</div>
            <div className="font-medium" style={{color: '#000000'}}>Gender Split</div>
            <div className="text-blue-600 font-semibold">{data.audienceInsights.topGender}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">📍</div>
            <div className="font-medium" style={{color: '#000000'}}>Top Location</div>
            <div className="text-blue-600 font-semibold">{data.audienceInsights.topLocation}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">💡</div>
            <div className="font-medium" style={{color: '#000000'}}>Top Interest</div>
            <div className="text-blue-600 font-semibold">{data.audienceInsights.topInterest}</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2" style={{color: '#000000'}}>Meta Ads Optimization Opportunities</h4>
          <div className="space-y-2 text-sm">
            <p style={{color: '#000000'}}>• Your retargeting campaign shows the best CPA at $100 - consider scaling</p>
            <p style={{color: '#000000'}}>• Female 25-34 demographic shows 2.3x better engagement - expand targeting</p>
            <p style={{color: '#000000'}}>• Brand awareness campaign has low CTR - test new creative formats</p>
            <p style={{color: '#000000'}}>• Frequency is optimal at 1.46 - maintain current budget levels</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3" style={{color: '#000000'}}>Quick Actions with Agent Maya</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleAskMaya("Create lookalike audiences based on my best converting customers from Meta Ads")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>👥 Create Lookalikes</div>
            <div className="text-sm" style={{color: '#000000'}}>Expand reach with similar audiences</div>
          </button>
          
          <button
            onClick={() => handleAskMaya("Test new Meta Ads creative variations for my top performing campaigns")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>🎨 A/B Test Creatives</div>
            <div className="text-sm" style={{color: '#000000'}}>Optimize ad creative performance</div>
          </button>
          
          <button
            onClick={() => handleAskMaya("Analyze my Meta Ads attribution and recommend budget reallocation")}
            className="p-3 bg-white border border-blue-200 rounded text-left hover:bg-blue-50"
          >
            <div className="font-medium" style={{color: '#000000'}}>📊 Attribution Analysis</div>
            <div className="text-sm" style={{color: '#000000'}}>Optimize budget allocation</div>
          </button>
        </div>
      </div>
    </div>
  )
}