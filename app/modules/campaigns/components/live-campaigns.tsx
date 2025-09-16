"use client"

import React, { useState, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'
import { useAuth } from '@/contexts/auth-context'

interface Campaign {
  id: string
  name: string
  platform: string
  status: 'active' | 'paused' | 'learning' | 'needs_attention'
  spend: number
  conversions: number
  cpa: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
}

export function LiveCampaigns() {
  const { sendMessage } = useMaya()
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Brand Search Campaign',
        platform: 'google_ads',
        status: 'active',
        spend: 2400,
        conversions: 23,
        cpa: 104,
        roas: 4.1,
        impressions: 45000,
        clicks: 1200,
        ctr: 2.67
      },
      {
        id: '2',
        name: 'Product Launch Campaign',
        platform: 'meta_ads',
        status: 'active',
        spend: 3100,
        conversions: 31,
        cpa: 100,
        roas: 3.8,
        impressions: 89000,
        clicks: 2100,
        ctr: 2.36
      },
      {
        id: '3',
        name: 'Competitor Keywords',
        platform: 'google_ads',
        status: 'needs_attention',
        spend: 1800,
        conversions: 8,
        cpa: 225,
        roas: 1.2,
        impressions: 23000,
        clicks: 600,
        ctr: 2.61
      },
      {
        id: '4',
        name: 'Retargeting Campaign',
        platform: 'meta_ads',
        status: 'active',
        spend: 2200,
        conversions: 18,
        cpa: 122,
        roas: 3.9,
        impressions: 34000,
        clicks: 980,
        ctr: 2.88
      },
      {
        id: '5',
        name: 'LinkedIn B2B Campaign',
        platform: 'linkedin_ads',
        status: 'paused',
        spend: 890,
        conversions: 5,
        cpa: 178,
        roas: 2.1,
        impressions: 12000,
        clicks: 340,
        ctr: 2.83
      }
    ]
    
    setTimeout(() => {
      setCampaigns(mockCampaigns)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return '●'
      case 'paused': return '⏸'
      case 'learning': return '🔄'
      case 'needs_attention': return '⚠'
      default: return '○'
    }
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'paused': return 'text-gray-500'
      case 'learning': return 'text-blue-500'
      case 'needs_attention': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_ads': return '📊'
      case 'meta_ads': return '📱'
      case 'linkedin_ads': return '💼'
      default: return '🎯'
    }
  }

  const handleCampaignAction = async (action: string, campaignIds: string[]) => {
    // This would call your existing campaign management APIs
    console.log(`${action} campaigns:`, campaignIds)
    
    // Update local state optimistically
    setCampaigns(prev => prev.map(campaign => 
      campaignIds.includes(campaign.id) 
        ? { ...campaign, status: action === 'pause' ? 'paused' : 'active' }
        : campaign
    ))
    
    sendMessage(`${action === 'pause' ? 'Paused' : 'Activated'} ${campaignIds.length} campaign(s). Would you like me to monitor the impact?`)
  }

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  const askMayaAboutCampaign = (campaign: Campaign) => {
    sendMessage(`Analyze the performance of my "${campaign.name}" campaign and suggest optimizations`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Status Overview */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Live Campaigns</h2>
          <p className="text-gray-600">Monitor and optimize your running campaigns</p>
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">●</span>
            <span>Active: {campaigns.filter(c => c.status === 'active').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">⏸</span>
            <span>Paused: {campaigns.filter(c => c.status === 'paused').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠</span>
            <span>Issues: {campaigns.filter(c => c.status === 'needs_attention').length}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedCampaigns.length} campaign(s) selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => handleCampaignAction('pause', selectedCampaigns)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                ⏸ Pause
              </button>
              <button
                onClick={() => handleCampaignAction('activate', selectedCampaigns)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                ▶ Activate
              </button>
              <button
                onClick={() => sendMessage(`Analyze these ${selectedCampaigns.length} selected campaigns and suggest optimizations`)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                🤖 Ask Zunoki.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaigns(campaigns.map(c => c.id))
                      } else {
                        setSelectedCampaigns([])
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Campaign</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Spend</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Conv.</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">CPA</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">ROAS</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">CTR</th>
                <th className="px-4 py-3 text-center font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => handleSelectCampaign(campaign.id)}
                      className="rounded"
                    />
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getPlatformIcon(campaign.platform)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{campaign.platform.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusColor(campaign.status)}>
                        {getStatusIcon(campaign.status)}
                      </span>
                      <span className="capitalize text-sm">{campaign.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-right">${campaign.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{campaign.conversions}</td>
                  <td className="px-4 py-3 text-right">${campaign.cpa}</td>
                  <td className="px-4 py-3 text-right">{campaign.roas.toFixed(1)}x</td>
                  <td className="px-4 py-3 text-right">{campaign.ctr.toFixed(2)}%</td>
                  
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => askMayaAboutCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                        title="Ask Maya about this campaign"
                      >
                        🤖
                      </button>
                      <button
                        onClick={() => handleCampaignAction(
                          campaign.status === 'active' ? 'pause' : 'activate', 
                          [campaign.id]
                        )}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                        title={campaign.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
                      >
                        {campaign.status === 'active' ? '⏸' : '▶'}
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-700 text-sm"
                        title="Edit campaign"
                      >
                        ⚙
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Quick actions powered by Agent Maya:
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => sendMessage("Pause all underperforming campaigns with ROAS below 2.0")}
              className="px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              ⏸ Pause Low ROAS
            </button>
            <button
              onClick={() => sendMessage("Increase budget for top performing campaigns by 20%")}
              className="px-4 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
            >
              💰 Scale Winners
            </button>
            <button
              onClick={() => sendMessage("Run optimization analysis on all active campaigns")}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              📈 Auto-Optimize
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}