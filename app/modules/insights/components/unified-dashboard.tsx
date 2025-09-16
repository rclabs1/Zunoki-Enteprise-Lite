"use client"

import React, { useState } from 'react'
import { useDashboard } from '@/contexts/dashboard-context'
import { useMaya } from '@/contexts/maya-context'

export function UnifiedDashboard() {
  const { data, loading, refreshData, isRefreshing } = useDashboard()
  const { sendMessage } = useMaya()
  const [dateRange, setDateRange] = useState('30')

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
        <p style={{color: '#000000'}}>No data available. Please connect your platforms first.</p>
      </div>
    )
  }

  const { metrics, platforms } = data

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{color: '#000000'}}>Unified Performance Dashboard</h1>
          <p style={{color: '#000000'}}>Cross-platform analytics and attribution insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Cross-Platform Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4" style={{color: '#000000'}}>Cross-Platform Performance</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{color: '#000000'}}>
              ${(metrics.totalSpend / 1000).toFixed(1)}k
            </div>
            <div className="text-sm" style={{color: '#000000'}}>Total Spend</div>
            <div className="text-xs text-green-500 mt-1">↑ 12% vs last period</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold" style={{color: '#000000'}}>
              {metrics.totalConversions}
            </div>
            <div className="text-sm" style={{color: '#000000'}}>Conversions</div>
            <div className="text-xs text-green-500 mt-1">↑ 18% vs last period</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold" style={{color: '#000000'}}>
              ${(metrics.totalSpend / metrics.totalConversions).toFixed(0)}
            </div>
            <div className="text-sm" style={{color: '#000000'}}>Blended CPA</div>
            <div className="text-xs text-red-500 mt-1">↑ 5% vs last period</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold" style={{color: '#000000'}}>
              {metrics.roas.toFixed(1)}x
            </div>
            <div className="text-sm" style={{color: '#000000'}}>Blended ROAS</div>
            <div className="text-xs text-green-500 mt-1">↑ 8% vs last period</div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{color: '#000000'}}>Platform Breakdown</h2>
          <button
            onClick={() => handleAskMaya("Which platform is performing best and why?")}
            className="hover:text-gray-700 text-sm"
            style={{color: '#000000'}}
          >
            Ask Agent Maya 🤖
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium" style={{color: '#000000'}}>Platform</th>
                <th className="text-right py-3 font-medium" style={{color: '#000000'}}>Spend</th>
                <th className="text-right py-3 font-medium" style={{color: '#000000'}}>Conversions</th>
                <th className="text-right py-3 font-medium" style={{color: '#000000'}}>CPA</th>
                <th className="text-right py-3 font-medium" style={{color: '#000000'}}>ROAS</th>
                <th className="text-right py-3 font-medium" style={{color: '#000000'}}>Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium" style={{color: '#000000'}}>Google Ads</span>
                    {platforms.google_ads.connected && (
                      <span className="text-green-500 text-xs">●</span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3" style={{color: '#000000'}}>$12,400</td>
                <td className="text-right py-3" style={{color: '#000000'}}>89</td>
                <td className="text-right py-3" style={{color: '#000000'}}>$139</td>
                <td className="text-right py-3" style={{color: '#000000'}}>3.2x</td>
                <td className="text-right py-3 text-green-500">↗</td>
              </tr>
              
              <tr>
                <td className="py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="font-medium" style={{color: '#000000'}}>Meta Ads</span>
                    {platforms.meta_ads.connected && (
                      <span className="text-green-500 text-xs">●</span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3" style={{color: '#000000'}}>$11,200</td>
                <td className="text-right py-3" style={{color: '#000000'}}>97</td>
                <td className="text-right py-3" style={{color: '#000000'}}>$115</td>
                <td className="text-right py-3" style={{color: '#000000'}}>3.6x</td>
                <td className="text-right py-3 text-green-500">↗</td>
              </tr>
              
              <tr>
                <td className="py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
                    <span className="font-medium" style={{color: '#000000'}}>LinkedIn Ads</span>
                    <span className="text-xs" style={{color: '#000000'}}>○</span>
                  </div>
                </td>
                <td className="text-right py-3" style={{color: '#000000'}}>$5,300</td>
                <td className="text-right py-3" style={{color: '#000000'}}>61</td>
                <td className="text-right py-3" style={{color: '#000000'}}>$87</td>
                <td className="text-right py-3" style={{color: '#000000'}}>2.8x</td>
                <td className="text-right py-3 text-red-500">↘</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribution Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{color: '#000000'}}>Attribution Journey</h2>
          <button
            onClick={() => handleAskMaya("Show me detailed attribution analysis for my conversions")}
            className="hover:text-gray-700 text-sm"
            style={{color: '#000000'}}
          >
            Deep Dive with Agent Maya 🤖
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2" style={{color: '#000000'}}>Top Customer Journey</h3>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">Google Ads</div>
              <div style={{color: '#000000'}}>→</div>
              <div className="bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm">LinkedIn</div>
              <div style={{color: '#000000'}}>→</div>
              <div className="bg-blue-300 text-blue-800 px-3 py-1 rounded text-sm">Meta Ads</div>
              <div style={{color: '#000000'}}>→</div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">Conversion</div>
            </div>
            <p className="text-sm mt-2" style={{color: '#000000'}}>45% of conversions follow this path</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold" style={{color: '#000000'}}>67%</div>
              <div className="text-sm" style={{color: '#000000'}}>Meta Final Touch</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{color: '#000000'}}>45%</div>
              <div className="text-sm" style={{color: '#000000'}}>Google First Touch</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{color: '#000000'}}>3.2</div>
              <div className="text-sm" style={{color: '#000000'}}>Avg Touchpoints</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{color: '#000000'}}>8 days</div>
              <div className="text-sm" style={{color: '#000000'}}>Avg Journey Length</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3" style={{color: '#000000'}}>Agent Maya Recommendations</h3>
        <div className="space-y-2">
          <p className="text-sm" style={{color: '#000000'}}>
            • Meta Ads showing best efficiency at $115 CPA - consider 20% budget increase
          </p>
          <p className="text-sm" style={{color: '#000000'}}>
            • Google Ads driving strong initial awareness - maintain brand campaign investment
          </p>
          <p className="text-sm" style={{color: '#000000'}}>
            • LinkedIn showing decline - investigate keyword performance
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => handleAskMaya("Optimize my budget allocation based on current performance")}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Auto-Optimize Budget
          </button>
          <button
            onClick={() => handleAskMaya("Generate a performance report for my team")}
            className="bg-white border border-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50"
            style={{color: '#000000'}}
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}