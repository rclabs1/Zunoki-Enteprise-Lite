"use client"

import React, { useState, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface ABTest {
  id: string
  name: string
  campaign: string
  status: 'draft' | 'running' | 'completed' | 'paused'
  testType: 'ad_copy' | 'creative' | 'audience' | 'landing_page' | 'bidding'
  variants: TestVariant[]
  startDate: Date
  endDate?: Date
  confidence: number
  winner?: string
  traffic_split: number
  results?: ABTestResults
}

interface TestVariant {
  id: string
  name: string
  description: string
  is_control: boolean
  traffic_percentage: number
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    ctr: number
    cpc: number
    cpa: number
    roas: number
  }
}

interface ABTestResults {
  statistical_significance: number
  confidence_level: number
  winner: string
  lift_percentage: number
  recommended_action: string
}

interface UTMCampaign {
  id: string
  name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term?: string
  utm_content?: string
  clicks: number
  conversions: number
  revenue: number
  spend: number
  roas: number
  conversion_rate: number
}

export function CampaignOptimizationTools() {
  const { sendMessage } = useMaya()
  const [activeTab, setActiveTab] = useState<'ab_testing' | 'utm_analytics' | 'optimization'>('ab_testing')
  const [abTests, setAbTests] = useState<ABTest[]>([])
  const [utmCampaigns, setUtmCampaigns] = useState<UTMCampaign[]>([])
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    campaign: '',
    testType: 'ad_copy',
    traffic_split: 50,
    variants: []
  })

  useEffect(() => {
    // Mock A/B test data
    setAbTests([
      {
        id: 'test_1',
        name: 'Headline Testing - Product Launch',
        campaign: 'Product Launch Campaign',
        status: 'running',
        testType: 'ad_copy',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        confidence: 85,
        traffic_split: 50,
        variants: [
          {
            id: 'variant_a',
            name: 'Control - Original Headline',
            description: 'Transform Your Business with AI',
            is_control: true,
            traffic_percentage: 50,
            metrics: {
              impressions: 12400,
              clicks: 340,
              conversions: 23,
              spend: 1240,
              ctr: 2.74,
              cpc: 3.65,
              cpa: 53.91,
              roas: 4.2
            }
          },
          {
            id: 'variant_b',
            name: 'Variant B - Benefit-focused',
            description: 'Boost Revenue 40% with AI Intelligence',
            is_control: false,
            traffic_percentage: 50,
            metrics: {
              impressions: 12200,
              clicks: 390,
              conversions: 31,
              spend: 1220,
              ctr: 3.20,
              cpc: 3.13,
              cpa: 39.35,
              roas: 5.1
            }
          }
        ]
      },
      {
        id: 'test_2',
        name: 'Creative Testing - Meta Ads',
        campaign: 'Social Media Awareness',
        status: 'completed',
        testType: 'creative',
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        confidence: 95,
        winner: 'variant_b',
        traffic_split: 50,
        variants: [
          {
            id: 'variant_a',
            name: 'Video Creative',
            description: 'Animated product demo video',
            is_control: true,
            traffic_percentage: 50,
            metrics: {
              impressions: 45000,
              clicks: 1200,
              conversions: 67,
              spend: 2400,
              ctr: 2.67,
              cpc: 2.00,
              cpa: 35.82,
              roas: 3.8
            }
          },
          {
            id: 'variant_b',
            name: 'Static Image',
            description: 'High-contrast product image',
            is_control: false,
            traffic_percentage: 50,
            metrics: {
              impressions: 44800,
              clicks: 1580,
              conversions: 94,
              spend: 2380,
              ctr: 3.53,
              cpc: 1.51,
              cpa: 25.32,
              roas: 5.2
            }
          }
        ],
        results: {
          statistical_significance: 95,
          confidence_level: 95,
          winner: 'variant_b',
          lift_percentage: 40.3,
          recommended_action: 'Scale variant B to 100% traffic allocation'
        }
      }
    ])

    // Mock UTM campaign data
    setUtmCampaigns([
      {
        id: 'utm_1',
        name: 'Google Ads - Brand Keywords',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'brand_keywords',
        utm_term: 'admolabs',
        utm_content: 'headline_variant_a',
        clicks: 1240,
        conversions: 87,
        revenue: 12400,
        spend: 3200,
        roas: 3.88,
        conversion_rate: 7.02
      },
      {
        id: 'utm_2',
        name: 'Meta Ads - Lookalike Audience',
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'lookalike_prospecting',
        utm_content: 'video_creative_b',
        clicks: 2340,
        conversions: 156,
        revenue: 18720,
        spend: 4560,
        roas: 4.11,
        conversion_rate: 6.67
      },
      {
        id: 'utm_3',
        name: 'LinkedIn Ads - Enterprise Targeting',
        utm_source: 'linkedin',
        utm_medium: 'social',
        utm_campaign: 'enterprise_decision_makers',
        utm_term: 'ai_automation',
        utm_content: 'case_study_carousel',
        clicks: 890,
        conversions: 43,
        revenue: 15480,
        spend: 2670,
        roas: 5.80,
        conversion_rate: 4.83
      },
      {
        id: 'utm_4',
        name: 'Email Marketing - Product Launch',
        utm_source: 'mailchimp',
        utm_medium: 'email',
        utm_campaign: 'product_launch_series',
        utm_content: 'week_2_announcement',
        clicks: 560,
        conversions: 78,
        revenue: 9360,
        spend: 120,
        roas: 78.0,
        conversion_rate: 13.93
      }
    ])
  }, [])

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const createTestVariant = () => {
    const newVariant: TestVariant = {
      id: `variant_${Date.now()}`,
      name: `Variant ${(newTest.variants?.length || 0) + 1}`,
      description: '',
      is_control: newTest.variants?.length === 0,
      traffic_percentage: 50,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0
      }
    }

    setNewTest(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }))
  }

  const saveTest = () => {
    if (!newTest.name || !newTest.campaign || (newTest.variants?.length || 0) < 2) {
      alert('Please fill in all required fields and add at least 2 variants')
      return
    }

    const testToSave: ABTest = {
      id: `test_${Date.now()}`,
      name: newTest.name!,
      campaign: newTest.campaign!,
      status: 'draft',
      testType: newTest.testType!,
      startDate: new Date(),
      confidence: 0,
      traffic_split: newTest.traffic_split!,
      variants: newTest.variants!
    }

    setAbTests(prev => [...prev, testToSave])
    setShowCreateTest(false)
    setNewTest({
      name: '',
      campaign: '',
      testType: 'ad_copy',
      traffic_split: 50,
      variants: []
    })

    handleAskMaya(`I've created a new A/B test "${testToSave.name}". Can you help me set up proper tracking and provide optimization suggestions?`)
  }

  const calculateStatisticalSignificance = (variantA: TestVariant, variantB: TestVariant) => {
    const convRateA = variantA.metrics.conversions / variantA.metrics.clicks
    const convRateB = variantB.metrics.conversions / variantB.metrics.clicks
    
    // Simplified z-test calculation
    const pooledRate = (variantA.metrics.conversions + variantB.metrics.conversions) / 
                      (variantA.metrics.clicks + variantB.metrics.clicks)
    
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * 
                                  (1/variantA.metrics.clicks + 1/variantB.metrics.clicks))
    
    const zScore = Math.abs(convRateA - convRateB) / standardError
    
    // Convert z-score to confidence level (simplified)
    if (zScore > 2.58) return 99
    if (zScore > 1.96) return 95
    if (zScore > 1.64) return 90
    if (zScore > 1.28) return 80
    return Math.round(50 + (zScore / 2.58) * 49)
  }

  const renderABTestingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">A/B Tests</h3>
          <p className="text-gray-600">Create and manage campaign experiments</p>
        </div>
        <button
          onClick={() => setShowCreateTest(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Create Test
        </button>
      </div>

      {showCreateTest && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Create New A/B Test</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                value={newTest.name}
                onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Headline Testing - Q1 Campaign"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select
                value={newTest.campaign}
                onChange={(e) => setNewTest(prev => ({ ...prev, campaign: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Campaign</option>
                <option value="Product Launch Campaign">Product Launch Campaign</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Retargeting Campaign">Retargeting Campaign</option>
                <option value="Lead Generation">Lead Generation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
              <select
                value={newTest.testType}
                onChange={(e) => setNewTest(prev => ({ ...prev, testType: e.target.value as ABTest['testType'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ad_copy">Ad Copy</option>
                <option value="creative">Creative/Images</option>
                <option value="audience">Audience</option>
                <option value="landing_page">Landing Page</option>
                <option value="bidding">Bidding Strategy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Split (%)</label>
              <input
                type="number"
                value={newTest.traffic_split}
                onChange={(e) => setNewTest(prev => ({ ...prev, traffic_split: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="90"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Test Variants</label>
              <button
                onClick={createTestVariant}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ➕ Add Variant
              </button>
            </div>
            
            <div className="space-y-2">
              {newTest.variants?.map((variant, index) => (
                <div key={variant.id} className="p-3 border border-gray-200 rounded">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => {
                        const updatedVariants = [...(newTest.variants || [])]
                        updatedVariants[index].name = e.target.value
                        setNewTest(prev => ({ ...prev, variants: updatedVariants }))
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Variant name"
                    />
                    <input
                      type="text"
                      value={variant.description}
                      onChange={(e) => {
                        const updatedVariants = [...(newTest.variants || [])]
                        updatedVariants[index].description = e.target.value
                        setNewTest(prev => ({ ...prev, variants: updatedVariants }))
                      }}
                      className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Description of changes"
                    />
                  </div>
                  {variant.is_control && (
                    <span className="inline-block mt-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      Control Group
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={saveTest}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              💾 Create Test
            </button>
            <button
              onClick={() => setShowCreateTest(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {abTests.map((test) => (
          <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{test.name}</h4>
                <p className="text-gray-600 text-sm">{test.campaign} • {test.testType.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  test.status === 'running' ? 'bg-green-100 text-green-800' :
                  test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  test.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {test.status}
                </span>
                {test.confidence > 0 && (
                  <span className="text-sm text-gray-600">{test.confidence}% confidence</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {test.variants.map((variant) => (
                <div key={variant.id} className={`p-4 border rounded-lg ${
                  variant.is_control ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-gray-900">{variant.name}</h5>
                    {variant.is_control && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Control</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{variant.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">CTR:</span>
                      <span className="ml-1 font-medium">{variant.metrics.ctr.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CPC:</span>
                      <span className="ml-1 font-medium">${variant.metrics.cpc.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CPA:</span>
                      <span className="ml-1 font-medium">${variant.metrics.cpa.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ROAS:</span>
                      <span className="ml-1 font-medium">{variant.metrics.roas.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {test.status === 'running' && test.variants.length === 2 && (
              <div className="p-3 bg-gray-50 rounded mb-4">
                <div className="text-sm text-gray-700">
                  <strong>Statistical Significance:</strong> {calculateStatisticalSignificance(test.variants[0], test.variants[1])}%
                  {calculateStatisticalSignificance(test.variants[0], test.variants[1]) >= 95 && (
                    <span className="ml-2 text-green-600">✓ Significant result detected</span>
                  )}
                </div>
              </div>
            )}

            {test.results && (
              <div className="p-4 bg-green-50 border border-green-200 rounded mb-4">
                <h6 className="font-medium text-green-900 mb-2">🏆 Test Results</h6>
                <div className="text-sm text-green-800">
                  <p><strong>Winner:</strong> {test.variants.find(v => v.id === test.winner)?.name}</p>
                  <p><strong>Lift:</strong> {test.results.lift_percentage.toFixed(1)}% improvement</p>
                  <p><strong>Recommendation:</strong> {test.results.recommended_action}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => handleAskMaya(`Analyze the performance of "${test.name}" and provide optimization recommendations`)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                🤖 Analyze Results
              </button>
              {test.status === 'running' && (
                <button
                  onClick={() => handleAskMaya(`Should I stop the "${test.name}" test early? Check for statistical significance.`)}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  ⏸ Check Early Stop
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUTMAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">UTM Analytics</h3>
          <p className="text-gray-600">Track campaign performance by source and content</p>
        </div>
        <button
          onClick={() => handleAskMaya("Help me create UTM parameters for my new campaign launch")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          🤖 Generate UTMs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {utmCampaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {utmCampaigns.reduce((sum, c) => sum + c.conversions, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Conversions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            ${utmCampaigns.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {(utmCampaigns.reduce((sum, c) => sum + c.revenue, 0) / 
              utmCampaigns.reduce((sum, c) => sum + c.spend, 0)).toFixed(1)}x
          </div>
          <div className="text-sm text-gray-600">Blended ROAS</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Campaign Performance by UTM</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source/Medium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conv Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utmCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">{campaign.utm_campaign}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.utm_source}</div>
                    <div className="text-sm text-gray-500">{campaign.utm_medium}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.utm_content || campaign.utm_term || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.conversion_rate >= 10 ? 'bg-green-100 text-green-800' :
                      campaign.conversion_rate >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.conversion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${campaign.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.roas >= 4 ? 'bg-green-100 text-green-800' :
                      campaign.roas >= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleAskMaya(`Analyze the UTM performance for "${campaign.name}" and suggest optimizations`)}
                      className="text-blue-600 hover:text-blue-700"
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

      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-2">Agent Maya UTM Insights</h4>
            <div className="space-y-2 text-blue-800 text-sm">
              <p>• <strong>Email marketing excellence:</strong> 78x ROAS with 13.9% conversion rate - consider increasing allocation</p>
              <p>• <strong>LinkedIn premium performance:</strong> Lower volume but highest value customers (5.8x ROAS)</p>
              <p>• <strong>Content optimization:</strong> "video_creative_b" outperforming static images across platforms</p>
              <p>• <strong>UTM standardization:</strong> Implement consistent naming conventions for better tracking</p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => handleAskMaya("Create a UTM naming convention guide for my team")}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                📋 UTM Standards
              </button>
              <button
                onClick={() => handleAskMaya("Generate UTM parameters for my upcoming Black Friday campaign")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                🏷 Generate UTMs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOptimizationTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Campaign Optimization</h3>
        <p className="text-gray-600">AI-powered recommendations and automated optimizations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">🎯 Performance Recommendations</h4>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="font-medium text-green-900">Scale Top Performers</div>
              <div className="text-sm text-green-800 mt-1">
                Increase budget for campaigns with ROAS &gt; 4x (3 campaigns identified)
              </div>
              <button 
                onClick={() => handleAskMaya("Scale my top performing campaigns with ROAS above 4x")}
                className="mt-2 text-green-600 hover:text-green-700 text-sm"
              >
                🤖 Apply Scaling
              </button>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="font-medium text-yellow-900">Pause Underperformers</div>
              <div className="text-sm text-yellow-800 mt-1">
                2 campaigns have CPA 50% above target - consider pausing or optimization
              </div>
              <button 
                onClick={() => handleAskMaya("Review and pause campaigns with high CPA that are underperforming")}
                className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm"
              >
                🤖 Review Campaigns
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="font-medium text-blue-900">Keyword Expansion</div>
              <div className="text-sm text-blue-800 mt-1">
                Identified 12 high-performing keywords ready for expansion
              </div>
              <button 
                onClick={() => handleAskMaya("Suggest keyword expansions for my best performing campaigns")}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                🤖 Expand Keywords
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">⚡ Automated Actions</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <div className="font-medium text-gray-900">Auto-pause high CPA</div>
                <div className="text-sm text-gray-600">When CPA &gt; 150% of target</div>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 text-sm mr-2">✓ Enabled</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm">⚙️</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <div className="font-medium text-gray-900">Dayparting optimization</div>
                <div className="text-sm text-gray-600">Adjust bids by time of day</div>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 text-sm mr-2">✓ Enabled</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm">⚙️</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <div className="font-medium text-gray-900">Budget reallocation</div>
                <div className="text-sm text-gray-600">Move budget to top performers</div>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-2">Disabled</span>
                <button 
                  onClick={() => handleAskMaya("Help me set up automated budget reallocation rules")}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ⚙️
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <div className="font-medium text-gray-900">Negative keyword mining</div>
                <div className="text-sm text-gray-600">Weekly search term reviews</div>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 text-sm mr-2">✓ Enabled</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm">⚙️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-2">Agent Maya Optimization Suite</h4>
            <p className="text-blue-800 text-sm mb-4">
              Let Agent Maya continuously optimize your campaigns using machine learning and industry best practices.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleAskMaya("Analyze all my campaigns and create a comprehensive optimization plan")}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                📊 Full Campaign Audit
              </button>
              <button
                onClick={() => handleAskMaya("Set up automated bidding optimization for my Google Ads campaigns")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                🎯 Smart Bidding Setup
              </button>
              <button
                onClick={() => handleAskMaya("Create a testing roadmap for the next 90 days")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                🗺 Testing Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ab_testing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ab_testing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🧪 A/B Testing
          </button>
          <button
            onClick={() => setActiveTab('utm_analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'utm_analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏷 UTM Analytics
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'optimization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚡ Optimization
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'ab_testing' && renderABTestingTab()}
      {activeTab === 'utm_analytics' && renderUTMAnalyticsTab()}
      {activeTab === 'optimization' && renderOptimizationTab()}
    </div>
  )
}