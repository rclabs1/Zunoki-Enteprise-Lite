"use client"

import React, { useState } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface FinancialMetrics {
  totalRevenue: number
  totalSpend: number
  netROI: number
  blendedROAS: number
  ltv: number
  cac: number
  ltvCacRatio: number
  paybackPeriod: number
  marginPercent: number
  burnRate: number
  runway: number
  cashFlow: number
}

interface SpendBreakdown {
  platform: string
  spend: number
  percentage: number
  roi: number
  color: string
}

interface RevenueAttribution {
  source: string
  revenue: number
  percentage: number
  cac: number
  ltv: number
}

export default function FinancialDashboard() {
  const { sendMessage } = useMaya()
  const [timeframe, setTimeframe] = useState('monthly')
  const [viewType, setViewType] = useState('summary')

  const financialMetrics: FinancialMetrics = {
    totalRevenue: 145000,
    totalSpend: 42300,
    netROI: 243,
    blendedROAS: 3.43,
    ltv: 420,
    cac: 117,
    ltvCacRatio: 3.6,
    paybackPeriod: 3.2,
    marginPercent: 71,
    burnRate: 28000,
    runway: 14.2,
    cashFlow: 102700
  }

  const spendBreakdown: SpendBreakdown[] = [
    { platform: 'Google Ads', spend: 18400, percentage: 43.5, roi: 285, color: 'bg-blue-500' },
    { platform: 'Meta Ads', spend: 12800, percentage: 30.3, roi: 320, color: 'bg-blue-600' },
    { platform: 'LinkedIn Ads', spend: 6200, percentage: 14.7, roi: 245, color: 'bg-blue-700' },
    { platform: 'TikTok Ads', spend: 2900, percentage: 6.9, roi: 180, color: 'bg-blue-800' },
    { platform: 'Email Marketing', spend: 1200, percentage: 2.8, roi: 450, color: 'bg-blue-900' },
    { platform: 'Content Marketing', spend: 800, percentage: 1.9, roi: 380, color: 'bg-blue-950' }
  ]

  const revenueAttribution: RevenueAttribution[] = [
    { source: 'Google Ads', revenue: 52400, percentage: 36.1, cac: 139, ltv: 445 },
    { source: 'Meta Ads', revenue: 40960, percentage: 28.2, cac: 115, ltv: 398 },
    { source: 'LinkedIn Ads', revenue: 15190, percentage: 10.5, cac: 87, ltv: 520 },
    { source: 'Organic Search', revenue: 18850, percentage: 13.0, cac: 0, ltv: 380 },
    { source: 'Direct', revenue: 12600, percentage: 8.7, cac: 0, ltv: 485 },
    { source: 'Referral', revenue: 5000, percentage: 3.4, cac: 25, ltv: 350 }
  ]

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Revenue, profitability, and unit economics analysis</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>
          
          <button
            onClick={() => handleAskMaya("Analyze my marketing ROI and suggest budget optimization strategies")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            🤖 Ask Agent Maya
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
            <div className="text-green-500 text-xl">💰</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(financialMetrics.totalRevenue)}</div>
          <p className="text-xs text-green-500 mt-1">↑ 18% vs last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Marketing Spend</h3>
            <div className="text-blue-500 text-xl">📊</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(financialMetrics.totalSpend)}</div>
          <p className="text-xs text-red-500 mt-1">↑ 12% vs last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Net ROI</h3>
            <div className="text-green-500 text-xl">📈</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{financialMetrics.netROI}%</div>
          <p className="text-xs text-green-500 mt-1">↑ 23% vs last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Blended ROAS</h3>
            <div className="text-purple-500 text-xl">🎯</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{financialMetrics.blendedROAS}x</div>
          <p className="text-xs text-green-500 mt-1">↑ 0.4x vs last month</p>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Unit Economics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Customer Lifetime Value (LTV)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(financialMetrics.ltv)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Customer Acquisition Cost (CAC)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(financialMetrics.cac)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-700">LTV:CAC Ratio</span>
              <span className="font-semibold text-green-700">{financialMetrics.ltvCacRatio.toFixed(1)}:1</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Payback Period</span>
              <span className="font-semibold text-gray-900">{financialMetrics.paybackPeriod} months</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Gross Margin</span>
              <span className="font-semibold text-gray-900">{financialMetrics.marginPercent}%</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-blue-800 text-sm">
              <strong>💡 Health Check:</strong> Your LTV:CAC ratio of {financialMetrics.ltvCacRatio}:1 is healthy (target: &gt;3:1). 
              Payback period of {financialMetrics.paybackPeriod} months is excellent for SaaS.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Cash Flow & Runway</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Monthly Cash Flow</span>
              <span className="font-semibold text-green-700">{formatCurrency(financialMetrics.cashFlow)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Monthly Burn Rate</span>
              <span className="font-semibold text-red-700">{formatCurrency(financialMetrics.burnRate)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-gray-700">Runway</span>
              <span className="font-semibold text-yellow-700">{financialMetrics.runway} months</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Runway Progress</span>
              <span>{financialMetrics.runway} / 18 months</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(financialMetrics.runway / 18) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Runway Alert:</strong> At current burn rate, consider fundraising or reducing costs within 6 months.
            </p>
          </div>
        </div>
      </div>

      {/* Spend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Marketing Spend Breakdown</h3>
            <button
              onClick={() => handleAskMaya("Analyze my marketing spend allocation and suggest optimizations")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🤖 Optimize
            </button>
          </div>
          
          <div className="space-y-3">
            {spendBreakdown.map((item) => (
              <div key={item.platform} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">{item.platform}</span>
                    <span className="text-gray-600">{formatCurrency(item.spend)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{item.percentage}%</span>
                    <span className="text-green-600">{item.roi}% ROI</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Revenue Attribution</h3>
            <button
              onClick={() => handleAskMaya("Show me which channels are driving the highest value customers")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🤖 Analyze
            </button>
          </div>
          
          <div className="space-y-3">
            {revenueAttribution.map((item) => (
              <div key={item.source} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">{item.source}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.percentage}% of revenue</span>
                  <div className="space-x-2">
                    <span className="text-gray-500">CAC: {formatCurrency(item.cac)}</span>
                    <span className="text-blue-600">LTV: {formatCurrency(item.ltv)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Insights & Actions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">Agent Maya Financial Insights</h3>
            <div className="space-y-2 text-blue-800 text-sm">
              <p>• <strong>Strong unit economics:</strong> LTV:CAC ratio of 3.6:1 indicates healthy growth</p>
              <p>• <strong>Email marketing efficiency:</strong> Highest ROI at 450% - consider increasing allocation</p>
              <p>• <strong>LinkedIn premium customers:</strong> Higher LTV ($520) justifies premium CAC</p>
              <p>• <strong>Runway optimization:</strong> Current burn sustainable for 14 months</p>
              <p>• <strong>Scaling opportunity:</strong> Meta Ads showing 320% ROI with room for growth</p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => handleAskMaya("Create a financial forecast for the next 6 months based on current trends")}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                📊 Financial Forecast
              </button>
              <button
                onClick={() => handleAskMaya("Optimize my marketing budget allocation for maximum ROI")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                💰 Budget Optimization
              </button>
              <button
                onClick={() => handleAskMaya("Generate a CFO report with key financial metrics and recommendations")}
                className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50"
              >
                📄 CFO Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}