"use client"

import React, { useState, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface AttributionData {
  customerJourneys: Array<{
    id: string
    path: string[]
    conversions: number
    percentage: number
    avgTimeToConvert: number
    totalTouchpoints: number
  }>
  attributionModels: {
    lastTouch: { [platform: string]: number }
    firstTouch: { [platform: string]: number }
    linear: { [platform: string]: number }
    timeDecay: { [platform: string]: number }
    positionBased: { [platform: string]: number }
  }
  touchpointAnalysis: {
    avgTouchpoints: number
    avgJourneyLength: number
    topAssistingChannels: Array<{ channel: string; assistedConversions: number; percentage: number }>
  }
  conversionPaths: Array<{
    path: string
    conversions: number
    conversionRate: number
    avgValue: number
  }>
}

export function AttributionAnalysis() {
  const { sendMessage } = useMaya()
  const [data, setData] = useState<AttributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState('linear')
  const [timeWindow, setTimeWindow] = useState('30')

  useEffect(() => {
    loadAttributionData()
  }, [timeWindow])

  const loadAttributionData = async () => {
    setLoading(true)
    try {
      // Mock data for demo - replace with actual API call
      const mockData: AttributionData = {
        customerJourneys: [
          {
            id: '1',
            path: ['Google Ads', 'LinkedIn', 'Meta Ads', 'Direct'],
            conversions: 45,
            percentage: 32.1,
            avgTimeToConvert: 8.5,
            totalTouchpoints: 4
          },
          {
            id: '2',
            path: ['Meta Ads', 'Email', 'Google Ads', 'Direct'],
            conversions: 28,
            percentage: 20.0,
            avgTimeToConvert: 12.3,
            totalTouchpoints: 4
          },
          {
            id: '3',
            path: ['Organic Search', 'Google Ads', 'Meta Ads'],
            conversions: 22,
            percentage: 15.7,
            avgTimeToConvert: 5.2,
            totalTouchpoints: 3
          },
          {
            id: '4',
            path: ['LinkedIn', 'Google Ads', 'Direct'],
            conversions: 18,
            percentage: 12.9,
            avgTimeToConvert: 15.8,
            totalTouchpoints: 3
          },
          {
            id: '5',
            path: ['Meta Ads', 'Google Ads'],
            conversions: 12,
            percentage: 8.6,
            avgTimeToConvert: 3.1,
            totalTouchpoints: 2
          }
        ],
        attributionModels: {
          lastTouch: {
            'Meta Ads': 67,
            'Google Ads': 23,
            'LinkedIn': 6,
            'Direct': 4
          },
          firstTouch: {
            'Google Ads': 45,
            'Meta Ads': 28,
            'Organic Search': 15,
            'LinkedIn': 12
          },
          linear: {
            'Google Ads': 35,
            'Meta Ads': 30,
            'LinkedIn': 20,
            'Email': 8,
            'Direct': 7
          },
          timeDecay: {
            'Meta Ads': 40,
            'Google Ads': 32,
            'LinkedIn': 15,
            'Email': 8,
            'Direct': 5
          },
          positionBased: {
            'Google Ads': 38,
            'Meta Ads': 35,
            'LinkedIn': 16,
            'Email': 6,
            'Direct': 5
          }
        },
        touchpointAnalysis: {
          avgTouchpoints: 3.2,
          avgJourneyLength: 8.5,
          topAssistingChannels: [
            { channel: 'Google Ads', assistedConversions: 78, percentage: 42.3 },
            { channel: 'LinkedIn', assistedConversions: 56, percentage: 30.4 },
            { channel: 'Email', assistedConversions: 34, percentage: 18.5 },
            { channel: 'Organic Search', assistedConversions: 16, percentage: 8.7 }
          ]
        },
        conversionPaths: [
          { path: 'Google Ads → Meta Ads', conversions: 45, conversionRate: 4.2, avgValue: 280 },
          { path: 'Meta Ads → Google Ads', conversions: 38, conversionRate: 3.8, avgValue: 245 },
          { path: 'LinkedIn → Google Ads', conversions: 28, conversionRate: 5.1, avgValue: 420 },
          { path: 'Organic → Meta Ads', conversions: 22, conversionRate: 6.2, avgValue: 180 }
        ]
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Failed to load attribution data:', error)
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
        <p className="text-muted-foreground">Failed to load attribution data.</p>
      </div>
    )
  }

  const selectedModelData = data.attributionModels[selectedModel as keyof typeof data.attributionModels]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground" style={{color: '#000000'}}>Attribution Analysis</h2>
          <p className="text-muted-foreground" style={{color: '#000000'}}>Customer journey mapping and channel attribution insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <button
            onClick={() => handleAskMaya("Analyze my attribution data and recommend budget reallocation strategies")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            🤖 Ask Agent Maya
          </button>
        </div>
      </div>

      {/* Attribution Models */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-foreground" style={{color: '#000000'}}>Attribution Models</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="linear">Linear Attribution</option>
            <option value="lastTouch">Last Touch</option>
            <option value="firstTouch">First Touch</option>
            <option value="timeDecay">Time Decay</option>
            <option value="positionBased">Position Based</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(selectedModelData).map(([platform, percentage]) => (
            <div key={platform} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600" style={{color: '#1d4ed8'}}>{percentage}%</div>
              <div className="text-sm text-gray-600 mt-1" style={{color: '#000000'}}>{platform}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {selectedModel === 'linear' && 'Linear Attribution: Equal credit to all touchpoints'}
            {selectedModel === 'lastTouch' && 'Last Touch: Full credit to final interaction'}
            {selectedModel === 'firstTouch' && 'First Touch: Full credit to initial interaction'}
            {selectedModel === 'timeDecay' && 'Time Decay: More credit to recent interactions'}
            {selectedModel === 'positionBased' && 'Position Based: 40% to first/last, 20% to middle'}
          </h4>
          <p className="text-blue-800 text-sm">
            {selectedModel === 'linear' && 'Shows Google Ads and Meta Ads are both crucial for conversions, deserving balanced investment.'}
            {selectedModel === 'lastTouch' && 'Meta Ads appears to close most deals, but may undervalue upper-funnel channels.'}
            {selectedModel === 'firstTouch' && 'Google Ads is your strongest awareness driver, generating initial interest.'}
            {selectedModel === 'timeDecay' && 'Recent touchpoints matter more - Meta Ads and Google Ads both important for closing.'}
            {selectedModel === 'positionBased' && 'Balanced view showing Google Ads initiates and Meta Ads closes deals effectively.'}
          </p>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-foreground mb-4" style={{color: '#000000'}}>Top Customer Journeys</h3>
        <div className="space-y-4">
          {data.customerJourneys.map((journey, index) => (
            <div key={journey.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-foreground" style={{color: '#000000'}}>Journey #{index + 1}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-foreground" style={{color: '#000000'}}>{journey.conversions} conversions</span>
                  <span className="text-blue-600 font-medium" style={{color: '#1d4ed8'}}>{journey.percentage}%</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mb-3">
                {journey.path.map((step, stepIndex) => (
                  <React.Fragment key={stepIndex}>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {step}
                    </div>
                    {stepIndex < journey.path.length - 1 && (
                      <div className="text-foreground">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span style={{color: '#000000'}}>📅 Avg time: {journey.avgTimeToConvert} days</span>
                <span style={{color: '#000000'}}>🔗 Touchpoints: {journey.totalTouchpoints}</span>
                <button
                  onClick={() => handleAskMaya(`Analyze customer journey ${index + 1} and suggest optimization opportunities`)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  🤖 Optimize Journey
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Touchpoint Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-foreground mb-4" style={{color: '#000000'}}>Journey Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-foreground" style={{color: '#000000'}}>Average Touchpoints</span>
              <span className="font-semibold text-foreground" style={{color: '#000000'}}>{data.touchpointAnalysis.avgTouchpoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground" style={{color: '#000000'}}>Average Journey Length</span>
              <span className="font-semibold text-foreground" style={{color: '#000000'}}>{data.touchpointAnalysis.avgJourneyLength} days</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-foreground mb-3" style={{color: '#000000'}}>Top Assisting Channels</h4>
              <div className="space-y-2">
                {data.touchpointAnalysis.topAssistingChannels.map((channel) => (
                  <div key={channel.channel} className="flex justify-between items-center">
                    <span className="text-foreground" style={{color: '#000000'}}>{channel.channel}</span>
                    <div className="text-right">
                      <div className="font-medium text-foreground" style={{color: '#000000'}}>{channel.assistedConversions}</div>
                      <div className="text-xs text-gray-500" style={{color: '#000000'}}>{channel.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-foreground mb-4" style={{color: '#000000'}}>Conversion Paths</h3>
          <div className="space-y-3">
            {data.conversionPaths.map((path, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-foreground" style={{color: '#000000'}}>{path.path}</div>
                  <div className="text-sm text-gray-600" style={{color: '#000000'}}>{path.conversions} conversions</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{path.conversionRate}%</div>
                  <div className="text-sm text-gray-600" style={{color: '#000000'}}>${path.avgValue} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2" style={{color: '#000000'}}>Agent Maya Attribution Insights</h3>
            <div className="space-y-2 text-blue-800 text-sm" style={{color: '#000000'}}>
              <p>• <strong>Multi-touch journeys dominate:</strong> 87% of conversions involve 3+ touchpoints</p>
              <p>• <strong>Google Ads strong at awareness:</strong> Initiates 45% of converting journeys</p>
              <p>• <strong>Meta Ads excels at closing:</strong> Present in 67% of final touches</p>
              <p>• <strong>LinkedIn high-value assist:</strong> B2B journeys show 3.2x higher avg order value</p>
              <p>• <strong>Email nurtures effectively:</strong> Reduces time to convert by 31%</p>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleAskMaya("Based on this attribution data, how should I reallocate my marketing budget for maximum ROI?")}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Budget Optimization
              </button>
              <button
                onClick={() => handleAskMaya("Create a comprehensive attribution report for my marketing team")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}