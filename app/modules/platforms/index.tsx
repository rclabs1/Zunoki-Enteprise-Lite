"use client"

import React, { useState } from 'react'
import { useMaya } from '@/contexts/maya-context'

export default function PlatformsModule() {
  const { sendMessage } = useMaya()
  const [activeTab, setActiveTab] = useState('connected')

  // Mock connected platforms data
  const connectedPlatforms = [
    { id: 'google_ads', name: 'Google Ads', status: 'connected', lastSync: '2 min ago', icon: '📊' },
    { id: 'meta_ads', name: 'Meta Ads', status: 'connected', lastSync: '5 min ago', icon: '📱' },
    { id: 'linkedin_ads', name: 'LinkedIn Ads', status: 'connected', lastSync: '1 min ago', icon: '💼' },
    { id: 'google_analytics', name: 'Google Analytics 4', status: 'connected', lastSync: '3 min ago', icon: '📈' },
    { id: 'hubspot', name: 'HubSpot', status: 'auth_needed', lastSync: 'Never', icon: '🔶' }
  ]

  const availablePlatforms = [
    { id: 'tiktok_ads', name: 'TikTok Ads', category: 'advertising', description: 'Reach Gen Z audiences', icon: '🎵' },
    { id: 'mixpanel', name: 'Mixpanel', category: 'analytics', description: 'Advanced event tracking', icon: '📊' },
    { id: 'segment', name: 'Segment', category: 'analytics', description: 'Customer data platform', icon: '🔄' },
    { id: 'salesforce', name: 'Salesforce', category: 'crm', description: 'CRM and automation', icon: '☁️' },
    { id: 'shopify', name: 'Shopify', category: 'ecommerce', description: 'E-commerce platform', icon: '🛒' },
    { id: 'mailchimp', name: 'Mailchimp', category: 'email', description: 'Email marketing', icon: '📧' },
    { id: 'amazon_ads', name: 'Amazon Ads', category: 'advertising', description: 'Marketplace advertising', icon: '📦' },
    { id: 'dv360', name: 'Google DV360', category: 'advertising', description: 'Programmatic advertising', icon: '🌐' },
    { id: 'youtube_ads', name: 'YouTube Ads', category: 'advertising', description: 'Video advertising platform', icon: '📺' },
    { id: 'snapchat_ads', name: 'Snapchat Ads', category: 'advertising', description: 'AR and Gen Z marketing', icon: '👻' },
    { id: 'twitter_ads', name: 'Twitter Ads', category: 'advertising', description: 'Real-time engagement', icon: '🐦' },
    { id: 'pinterest_ads', name: 'Pinterest Ads', category: 'advertising', description: 'Visual discovery platform', icon: '📌' },
    { id: 'adobe_analytics', name: 'Adobe Analytics', category: 'analytics', description: 'Enterprise analytics suite', icon: '🎨' },
    { id: 'amplitude', name: 'Amplitude', category: 'analytics', description: 'Product analytics platform', icon: '📈' },
    { id: 'hotjar', name: 'Hotjar', category: 'analytics', description: 'User behavior analytics', icon: '🔥' },
    { id: 'zapier', name: 'Zapier', category: 'automation', description: 'Workflow automation', icon: '⚡' },
    { id: 'slack', name: 'Slack', category: 'communication', description: 'Team communication', icon: '💬' },
    { id: 'discord', name: 'Discord', category: 'communication', description: 'Community engagement', icon: '🎮' }
  ]

  const marketplaceBrands = [
    { 
      id: 'netflix', 
      name: 'Netflix', 
      category: 'CTV', 
      cpm: '$12.50', 
      reach: '15M', 
      impressions: '50M',
      description: 'Premium streaming inventory',
      icon: '🎬',
      tags: ['Premium', 'CTV', 'Streaming']
    },
    { 
      id: 'disney', 
      name: 'Disney+', 
      category: 'CTV', 
      cpm: '$18.00', 
      reach: '12M', 
      impressions: '35M',
      description: 'Family-friendly streaming content',
      icon: '🏰',
      tags: ['Family', 'CTV', 'Streaming']
    },
    { 
      id: 'spotify', 
      name: 'Spotify', 
      category: 'Digital', 
      cpm: '$8.75', 
      reach: '25M', 
      impressions: '80M',
      description: 'Audio advertising platform',
      icon: '🎵',
      tags: ['Audio', 'Music', 'Digital']
    },
    { 
      id: 'youtube', 
      name: 'YouTube', 
      category: 'Digital', 
      cpm: '$6.50', 
      reach: '45M', 
      impressions: '200M',
      description: 'Video advertising platform',
      icon: '📺',
      tags: ['Video', 'Digital', 'Social']
    },
    { 
      id: 'clear_channel', 
      name: 'Clear Channel', 
      category: 'DOOH', 
      cpm: '$15.00', 
      reach: '8M', 
      impressions: '25M',
      description: 'Digital out-of-home advertising',
      icon: '🛣️',
      tags: ['DOOH', 'Outdoor', 'Billboard']
    },
    { 
      id: 'lamar', 
      name: 'Lamar Advertising', 
      category: 'DOOH', 
      cpm: '$12.00', 
      reach: '6M', 
      impressions: '18M',
      description: 'Billboard and transit advertising',
      icon: '🚌',
      tags: ['DOOH', 'Transit', 'Billboard']
    },
    { 
      id: 'uber', 
      name: 'Uber', 
      category: 'App', 
      cpm: '$10.25', 
      reach: '18M', 
      impressions: '45M',
      description: 'In-app advertising during rides',
      icon: '🚗',
      tags: ['App', 'Mobility', 'In-App']
    },
    { 
      id: 'doordash', 
      name: 'DoorDash', 
      category: 'App', 
      cpm: '$9.50', 
      reach: '22M', 
      impressions: '60M',
      description: 'Food delivery app advertising',
      icon: '🍔',
      tags: ['App', 'Food', 'Delivery']
    },
    { 
      id: 'samsung_tv', 
      name: 'Samsung TV Plus', 
      category: 'Smart Devices', 
      cpm: '$14.00', 
      reach: '10M', 
      impressions: '30M',
      description: 'Smart TV advertising platform',
      icon: '📱',
      tags: ['Smart TV', 'Connected', 'Devices']
    },
    { 
      id: 'roku', 
      name: 'Roku', 
      category: 'Smart Devices', 
      cpm: '$11.75', 
      reach: '14M', 
      impressions: '40M',
      description: 'Streaming device advertising',
      icon: '📺',
      tags: ['Roku', 'Streaming', 'CTV']
    }
  ]

  const handleConnect = async (platformId: string) => {
    // This would trigger your existing OAuth flow
    window.location.href = `/api/auth/callback/${platformId}`
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const tabs = [
    { id: 'connected', label: 'Connected', icon: '✅', count: connectedPlatforms.filter(p => p.status === 'connected').length },
    { id: 'marketplace', label: 'Brand Marketplace', icon: '🛒', count: 47 },
    { id: 'available', label: 'Browse All', icon: '🔍', count: availablePlatforms.length },
    { id: 'analytics', label: 'Analytics Setup', icon: '📊', count: 3 }
  ]

  const renderMarketplace = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Digital', 'CTV', 'DOOH', 'App', 'Smart Devices'].map((category) => (
          <button
            key={category}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaceBrands.map((brand) => (
          <div key={brand.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{brand.icon}</span>
                <div>
                  <h3 className="font-semibold " style={{color: "#000000"}}>{brand.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{brand.category}</span>
                </div>
              </div>
              <button
                onClick={() => handleAskMaya(`Tell me more about advertising with ${brand.name}`)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                🤖 Ask Zunoki.
              </button>
            </div>
            
            <p className=" text-sm mb-4" style={{color: "#000000"}}>{brand.description}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs " style={{color: "#000000"}}>CPM</div>
                <div className="font-semibold text-green-600">{brand.cpm}</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs " style={{color: "#000000"}}>Reach</div>
                <div className="font-semibold text-blue-600">{brand.reach}</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs " style={{color: "#000000"}}>Impressions</div>
                <div className="font-semibold text-purple-600">{brand.impressions}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {brand.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-gray-100  px-2 py-1 rounded" style={{color: "#000000"}}>
                  {tag}
                </span>
              ))}
            </div>
            
            <button
              onClick={() => handleAskMaya(`Help me purchase ad inventory from ${brand.name}`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              🛒 Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Agent Maya Marketplace Insights */}
      <div className="bg-green-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h4 className="font-medium text-green-900 mb-2">Agent Maya Marketplace Insights</h4>
            <div className="space-y-2 text-green-800 text-sm">
              <p>• <strong>CTV Opportunity:</strong> Netflix and Disney+ inventory perfect for premium brand awareness</p>
              <p>• <strong>Cost Effective:</strong> YouTube offers lowest CPM at $6.50 with highest reach of 45M</p>
              <p>• <strong>DOOH Growth:</strong> Clear Channel DOOH showing 35% higher engagement than traditional OOH</p>
              <p>• <strong>Mobile First:</strong> Uber and DoorDash in-app ads have 89% completion rates</p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => handleAskMaya("Create a media mix recommendation for my brand")}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                📊 Get Media Mix
              </button>
              <button
                onClick={() => handleAskMaya("Compare CTV vs DOOH vs Digital advertising options")}
                className="bg-white text-green-600 border border-green-600 px-4 py-2 rounded text-sm hover:bg-green-50"
              >
                🔄 Compare Channels
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderConnectedPlatforms = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {connectedPlatforms.map((platform) => (
          <div key={platform.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{platform.icon}</div>
                <div>
                  <h3 className="font-semibold " style={{color: "#000000"}}>{platform.name}</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    {platform.status === 'connected' ? (
                      <>
                        <span className="text-green-500">● Connected</span>
                        <span className="text-gray-400">•</span>
                        <span className="" style={{color: "#000000"}}>Last sync: {platform.lastSync}</span>
                      </>
                    ) : (
                      <span className="text-red-500">⚠ Authentication needed</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {platform.status === 'connected' ? (
                  <>
                    <button
                      onClick={() => handleAskMaya(`Show me insights for my ${platform.name} performance`)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      🤖 Ask Zunoki.
                    </button>
                    <button className="px-3 py-1  border border-gray-300 rounded hover:bg-gray-50 text-sm" style={{color: "#000000"}}>
                      🔄 Sync Now
                    </button>
                    <button className="px-3 py-1  border border-gray-300 rounded hover:bg-gray-50 text-sm" style={{color: "#000000"}}>
                      ⚙️ Settings
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    🔗 Reconnect
                  </button>
                )}
              </div>
            </div>
            
            {platform.id === 'google_analytics' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium  mb-2" style={{color: "#000000"}}>Attribution Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="" style={{color: "#000000"}}>UTM Tracking:</span>
                    <span className="ml-2 text-green-600">✅ Configured</span>
                  </div>
                  <div>
                    <span className="" style={{color: "#000000"}}>Cross-domain:</span>
                    <span className="ml-2 text-green-600">✅ Active</span>
                  </div>
                  <div>
                    <span className="" style={{color: "#000000"}}>Goals:</span>
                    <span className="ml-2 text-blue-600">5 configured</span>
                  </div>
                  <div>
                    <span className="" style={{color: "#000000"}}>Attribution Window:</span>
                    <span className="ml-2">30 days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Maya Recommendations */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">Agent Maya Platform Insights</h3>
            <div className="space-y-2 text-blue-800 text-sm">
              <p>• Your HubSpot connection needs re-authentication for lead tracking</p>
              <p>• Consider adding TikTok Ads to reach Gen Z - estimated 25% audience expansion</p>
              <p>• Mixpanel would provide better funnel analysis than GA4 alone</p>
            </div>
            <button
              onClick={() => handleAskMaya("What platforms should I connect next to improve my marketing performance?")}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Get Personalized Recommendations →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAvailablePlatforms = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['advertising', 'analytics', 'crm', 'email'].map((category) => (
          <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">
              {category === 'advertising' && '🎯'}
              {category === 'analytics' && '📊'}
              {category === 'crm' && '👥'}
              {category === 'email' && '📧'}
            </div>
            <div className="font-medium  capitalize" style={{color: "#000000"}}>{category}</div>
            <div className="text-xs " style={{color: "#000000"}}>
              {availablePlatforms.filter(p => p.category === category).length} platforms
            </div>
          </div>
        ))}
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlatforms.map((platform) => (
          <div key={platform.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{platform.icon}</div>
                <div>
                  <h3 className="font-semibold " style={{color: "#000000"}}>{platform.name}</h3>
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100  rounded capitalize" style={{color: "#000000"}}>
                    {platform.category}
                  </span>
                </div>
              </div>
            </div>
            
            <p className=" text-sm mb-4" style={{color: "#000000"}}>{platform.description}</p>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleAskMaya(`Tell me more about integrating ${platform.name} with my current setup`)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                🤖 Ask Zunoki.
              </button>
              <button
                onClick={() => handleConnect(platform.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                🔗 Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAnalyticsSetup = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold  mb-4" style={{color: "#000000"}}>Attribution & Analytics Configuration</h3>
        
        <div className="space-y-6">
          {/* UTM Parameters */}
          <div>
            <h4 className="font-medium  mb-3" style={{color: "#000000"}}>UTM Parameter Tracking</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="" style={{color: "#000000"}}>Auto UTM Generation:</span>
                  <span className="ml-2 text-green-600">✅ Enabled</span>
                </div>
                <div>
                  <span className="" style={{color: "#000000"}}>Campaign Tagging:</span>
                  <span className="ml-2 text-green-600">✅ Active</span>
                </div>
                <div>
                  <span className="" style={{color: "#000000"}}>Custom Parameters:</span>
                  <span className="ml-2 text-blue-600">3 configured</span>
                </div>
                <div>
                  <span className="" style={{color: "#000000"}}>Validation:</span>
                  <span className="ml-2 text-green-600">✅ Passing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Goals */}
          <div>
            <h4 className="font-medium  mb-3" style={{color: "#000000"}}>Conversion Goals</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="" style={{color: "#000000"}}>Purchase Conversion</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="" style={{color: "#000000"}}>Lead Form Submission</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="" style={{color: "#000000"}}>Email Signup</span>
                <span className="text-green-600">✅ Active</span>
              </div>
            </div>
          </div>

          {/* Attribution Models */}
          <div>
            <h4 className="font-medium  mb-3" style={{color: "#000000"}}>Attribution Models</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-medium " style={{color: "#000000"}}>Last Touch Attribution</h5>
                <p className="text-sm  mt-1" style={{color: "#000000"}}>Credit goes to final interaction</p>
                <div className="mt-2 text-lg font-semibold">67% Meta Ads</div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-medium " style={{color: "#000000"}}>First Touch Attribution</h5>
                <p className="text-sm  mt-1" style={{color: "#000000"}}>Credit goes to initial interaction</p>
                <div className="mt-2 text-lg font-semibold">45% Google Ads</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => handleAskMaya("Optimize my attribution setup for better insights")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            🤖 Optimize with Maya
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
            ⚙️ Advanced Settings
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Module Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold  mb-2" style={{color: "#000000"}}>Platform Hub</h1>
        <p className="" style={{color: "#000000"}}>Manage integrations and optimize your marketing technology stack</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              <span className="ml-2 bg-gray-100  px-2 py-1 rounded-full text-xs" style={{color: "#000000"}}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'connected' && renderConnectedPlatforms()}
        {activeTab === 'marketplace' && renderMarketplace()}
        {activeTab === 'available' && renderAvailablePlatforms()}
        {activeTab === 'analytics' && renderAnalyticsSetup()}
      </div>
    </div>
  )
}