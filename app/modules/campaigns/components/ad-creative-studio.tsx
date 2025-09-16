"use client"

import React, { useState } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface CreativeTemplate {
  id: string
  name: string
  platform: string
  format: string
  description: string
  thumbnail: string
  performance: {
    avgCtr: number
    avgCvr: number
    uses: number
  }
}

interface GeneratedCreative {
  id: string
  headline: string
  description: string
  cta: string
  format: string
  preview: string
  aiScore: number
  variations: number
}

const renderTemplates = (platforms, creativeTemplates, selectedPlatform, setSelectedPlatform, handleAskMaya) => (
    <div className="space-y-6">
      {/* Platform Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-foreground">Platform:</span>
        <div className="flex space-x-2">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedPlatform === platform.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {platform.icon} {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creativeTemplates
          .filter(template => selectedPlatform === 'all' || template.platform === selectedPlatform)
          .map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">Template Preview</span>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{template.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    {template.format}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                  <div>CTR: {template.performance.avgCtr}%</div>
                  <div>CVR: {template.performance.avgCvr}%</div>
                  <div>Uses: {template.performance.uses}</div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAskMaya(`Help me customize the "${template.name}" template for my campaign`)}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => handleAskMaya(`Show me performance insights for the "${template.name}" template`)}
                    className="px-3 py-2 border border-border rounded text-sm hover:bg-muted"
                  >
                    📊
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const renderGenerator = (handleGenerateCreatives, isGenerating, generatedCreatives, handleAskMaya) => (
    <div className="space-y-6">
      {/* AI Creative Generator */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">AI Creative Generator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Campaign Objective</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Lead Generation</option>
              <option>Conversions</option>
              <option>Brand Awareness</option>
              <option>Traffic</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target Platform</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="linkedin_ads">LinkedIn Ads</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Product/Service</label>
            <input
              type="text"
              placeholder="e.g., Marketing Analytics Platform"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target Audience</label>
            <input
              type="text"
              placeholder="e.g., Marketing Directors, 25-45"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Key Benefits (one per line)</label>
          <textarea
            rows={4}
            placeholder="Increase ROI by 3x&#10;AI-powered optimization&#10;Real-time analytics&#10;24/7 automation"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Agent Maya will analyze your best-performing creatives to generate optimized variations
          </div>
          <button
            onClick={handleGenerateCreatives}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? '🤖 Generating...' : '🤖 Generate Creatives'}
          </button>
        </div>
      </div>

      {/* Generated Creatives */}
      {generatedCreatives.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Generated Creatives</h3>
          <div className="space-y-4">
            {generatedCreatives.map((creative) => (
              <div key={creative.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{creative.headline}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{creative.description}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                      {creative.cta}
                    </span>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-600">{creative.aiScore}</div>
                    <div className="text-xs text-muted-foreground">AI Score</div>
                    <div className="text-xs text-muted-foreground mt-1">{creative.variations} variations</div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAskMaya(`Create more variations of this creative: "${creative.headline}"`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    More Variations
                  </button>
                  <button
                    onClick={() => handleAskMaya(`Launch this creative as a campaign: "${creative.headline}"`)}
                    className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Launch Campaign
                  </button>
                  <button
                    onClick={() => handleAskMaya(`Analyze why this creative scored ${creative.aiScore} and suggest improvements`)}
                    className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    📊 Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="font-medium text-blue-900">Agent Maya is generating your creatives...</h3>
          <p className="text-blue-700 text-sm mt-2">
            Analyzing your top-performing campaigns and creating optimized variations
          </p>
        </div>
      )}
    </div>
  )

  const renderPerformance = (handleAskMaya) => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Creative Performance Analytics</h3>
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-4">📊</div>
          <p>Creative performance tracking coming soon...</p>
          <button
            onClick={() => handleAskMaya("Show me insights about my creative performance across all campaigns")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🤖 Get Creative Insights
          </button>
        </div>
      </div>
    </div>
  )

export function AdCreativeStudio() {
  const { sendMessage } = useMaya()
  const [activeTab, setActiveTab] = useState('templates')
  const [selectedPlatform, setSelectedPlatform] = useState('meta_ads')
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const platforms = [
    { id: 'meta_ads', name: 'Meta Ads', icon: '📱' },
    { id: 'google_ads', name: 'Google Ads', icon: '📊' },
    { id: 'linkedin_ads', name: 'LinkedIn Ads', icon: '💼' },
    { id: 'tiktok_ads', name: 'TikTok Ads', icon: '🎵' }
  ]

  const creativeTemplates: CreativeTemplate[] = [
    {
      id: '1',
      name: 'Product Showcase',
      platform: 'meta_ads',
      format: 'Single Image',
      description: 'Highlight your product with clean, professional imagery',
      thumbnail: '/api/placeholder/300/200',
      performance: { avgCtr: 2.8, avgCvr: 4.2, uses: 1247 }
    },
    {
      id: '2',
      name: 'Customer Testimonial',
      platform: 'meta_ads',
      format: 'Video',
      description: 'Social proof that drives conversions',
      thumbnail: '/api/placeholder/300/200',
      performance: { avgCtr: 3.4, avgCvr: 5.8, uses: 856 }
    },
    {
      id: '3',
      name: 'Problem/Solution',
      platform: 'google_ads',
      format: 'Text Ad',
      description: 'Address pain points and offer solutions',
      thumbnail: '/api/placeholder/300/200',
      performance: { avgCtr: 4.1, avgCvr: 6.2, uses: 2134 }
    },
    {
      id: '4',
      name: 'Professional Carousel',
      platform: 'linkedin_ads',
      format: 'Carousel',
      description: 'Multi-slide B2B focused content',
      thumbnail: '/api/placeholder/300/200',
      performance: { avgCtr: 2.1, avgCvr: 7.3, uses: 423 }
    },
    {
      id: '5',
      name: 'Trend-Based',
      platform: 'tiktok_ads',
      format: 'Video',
      description: 'Leverage current trends and hashtags',
      thumbnail: '/api/placeholder/300/200',
      performance: { avgCtr: 5.2, avgCvr: 3.9, uses: 678 }
    }
  ]

  const handleGenerateCreatives = async () => {
    setIsGenerating(true)
    try {
      // Simulate AI creative generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const generated: GeneratedCreative[] = [
        {
          id: '1',
          headline: 'Transform Your Marketing ROI with AI-Powered Optimization',
          description: 'Join 10,000+ marketers who increased their ROAS by 3.4x using our intelligent campaign management platform.',
          cta: 'Start Free Trial',
          format: 'Single Image',
          preview: '/api/placeholder/400/300',
          aiScore: 92,
          variations: 8
        },
        {
          id: '2',
          headline: 'Stop Wasting Ad Spend on Underperforming Campaigns',
          description: 'Our AI identifies what works and automatically optimizes your campaigns for maximum ROI.',
          cta: 'Get Free Audit',
          format: 'Single Image',
          preview: '/api/placeholder/400/300',
          aiScore: 89,
          variations: 6
        },
        {
          id: '3',
          headline: 'Marketing Analytics That Actually Drive Results',
          description: 'See exactly which touchpoints convert and reallocate budget to your highest-performing channels.',
          cta: 'See Demo',
          format: 'Single Image',
          preview: '/api/placeholder/400/300',
          aiScore: 87,
          variations: 7
        }
      ]
      
      setGeneratedCreatives(generated)
      sendMessage("I've generated 3 high-performing ad creative variations for you. Each one targets different pain points and has been optimized based on your best-performing campaigns.")
    } catch (error) {
      console.error('Failed to generate creatives:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const tabs = [
    { id: 'templates', label: 'Templates', icon: '🎨' },
    { id: 'generator', label: 'AI Generator', icon: '🤖' },
    { id: 'performance', label: 'Performance', icon: '📊' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Ad Creative Studio</h2>
          <p className="text-muted-foreground">AI-powered creative generation and optimization</p>
        </div>
        
        <button
          onClick={() => handleAskMaya("Help me create high-converting ad creatives for my campaigns")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          🤖 Ask Agent Maya
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'templates' && renderTemplates(platforms, creativeTemplates, selectedPlatform, setSelectedPlatform, handleAskMaya)}
        {activeTab === 'generator' && renderGenerator(handleGenerateCreatives, isGenerating, generatedCreatives, handleAskMaya)}
        {activeTab === 'performance' && renderPerformance(handleAskMaya)}
      </div>
    </div>
  )
}