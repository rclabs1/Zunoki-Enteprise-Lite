"use client"

import React, { useState } from 'react'
import { useMaya } from '@/contexts/maya-context'

export function CampaignBuilder() {
  const { sendMessage } = useMaya()
  const [campaignData, setCampaignData] = useState({
    platform: 'google_ads',
    objective: 'conversions',
    campaignName: '',
    budget: 100,
    budgetType: 'daily',
    targeting: {
      locations: ['United States'],
      ageRange: { min: 25, max: 45 },
      interests: []
    }
  })

  const platforms = [
    { id: 'google_ads', name: 'Google Ads', icon: '📊' },
    { id: 'meta_ads', name: 'Meta Ads', icon: '📱' },
    { id: 'linkedin_ads', name: 'LinkedIn Ads', icon: '💼' }
  ]

  const objectives = [
    { id: 'conversions', name: 'Conversions', description: 'Drive sales and leads' },
    { id: 'traffic', name: 'Traffic', description: 'Send people to your website' },
    { id: 'awareness', name: 'Awareness', description: 'Increase brand awareness' },
    { id: 'engagement', name: 'Engagement', description: 'Get more likes, comments, shares' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const handleLaunchCampaign = async () => {
    // This would call your existing campaign creation API
    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      })
      
      if (response.ok) {
        sendMessage(`Campaign "${campaignData.campaignName}" created successfully! Would you like me to monitor its performance?`)
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Campaign Builder</h2>
          <p className="text-muted-foreground">Create AI-optimized campaigns with Agent Maya's guidance</p>
        </div>
        <button
          onClick={() => handleAskMaya("Help me create the best campaign for my business goals")}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Get Agent Maya's Help 🤖
        </button>
      </div>

      {/* Platform Selection */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="font-medium text-foreground mb-4">Choose Platform</h3>
        <div className="grid grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleInputChange('platform', platform.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                campaignData.platform === platform.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="text-2xl mb-2">{platform.icon}</div>
              <div className="font-medium text-foreground">{platform.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Details */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="font-medium text-foreground mb-4">Campaign Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignData.campaignName}
              onChange={(e) => handleInputChange('campaignName', e.target.value)}
              placeholder="e.g., Q4 Product Launch Campaign"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Objective
            </label>
            <select
              value={campaignData.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.name} - {objective.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Budget
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={campaignData.budget}
                onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={campaignData.budgetType}
                onChange={(e) => handleInputChange('budgetType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">per day</option>
                <option value="total">total</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Age Range
            </label>
            <div className="flex space-x-2 items-center">
              <input
                type="number"
                value={campaignData.targeting.ageRange.min}
                onChange={(e) => handleInputChange('targeting', {
                  ...campaignData.targeting,
                  ageRange: { ...campaignData.targeting.ageRange, min: parseInt(e.target.value) }
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-foreground">to</span>
              <input
                type="number"
                value={campaignData.targeting.ageRange.max}
                onChange={(e) => handleInputChange('targeting', {
                  ...campaignData.targeting,
                  ageRange: { ...campaignData.targeting.ageRange, max: parseInt(e.target.value) }
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Maya Recommendations */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">Agent Maya Recommendations</h3>
            <div className="space-y-2 text-blue-800 text-sm">
              <p>• For tech products, targeting 25-45 age group typically shows 23% better performance</p>
              <p>• Consider starting with $100/day budget and scaling based on initial performance</p>
              <p>• Conversion objective works best for products with clear value proposition</p>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleAskMaya("Optimize this campaign setup based on my industry")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Get Industry-Specific Tips
              </button>
              <button
                onClick={() => handleAskMaya("What budget should I start with for this campaign?")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Budget Advice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => handleAskMaya("Review my campaign setup before I launch")}
          className="px-6 py-2 border border-gray-300 text-foreground rounded-lg hover:bg-gray-50"
        >
          Ask Maya to Review
        </button>
        <button
          onClick={handleLaunchCampaign}
          disabled={!campaignData.campaignName}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🚀 Launch Campaign
        </button>
      </div>
    </div>
  )
}