"use client"

import React from 'react'
import { useDashboard } from '@/contexts/dashboard-context'
import { useMaya } from '@/contexts/maya-context'

export default function ExecutiveDashboard() {
  const { data, loading } = useDashboard()
  const { sendMessage } = useMaya()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600">High-level insights for strategic decision making</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleAskMaya("Generate an executive summary report for the board")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            📧 Email Report
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
            📅 Schedule
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data?.metrics.totalRevenue ? (data.metrics.totalRevenue / 1000).toFixed(0) : '0'}k
              </p>
              <p className="text-sm text-green-600 mt-1">↑ 15% vs last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROAS</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.metrics.roas ? data.metrics.roas.toFixed(1) : '0.0'}x
              </p>
              <p className="text-sm text-green-600 mt-1">↑ 8% improvement</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.metrics.activeCampaigns || 0}
              </p>
              <p className="text-sm text-blue-600 mt-1">2 launching this week</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🚀</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer LTV</p>
              <p className="text-2xl font-bold text-gray-900">$2,340</p>
              <p className="text-sm text-green-600 mt-1">↑ 12% vs last quarter</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <button
              onClick={() => handleAskMaya("Analyze the revenue trend and predict next quarter performance")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Ask Maya 🤖
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Revenue chart visualization</p>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Channel Performance</h3>
            <button
              onClick={() => handleAskMaya("Which marketing channels are performing best and why?")}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Ask Maya 🤖
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Google Ads</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm text-gray-600">75%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Meta Ads</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm text-gray-600">65%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">LinkedIn Ads</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm text-gray-600">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Strategic Insights</h3>
          <button
            onClick={() => handleAskMaya("What are the top 3 strategic recommendations for this quarter?")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Get Recommendations
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <h4 className="font-medium text-green-900">Growth Opportunity</h4>
            </div>
            <p className="text-sm text-green-700">
              Mobile conversion rates are 23% higher than desktop. Consider mobile-first campaigns.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <h4 className="font-medium text-yellow-900">Attention Needed</h4>
            </div>
            <p className="text-sm text-yellow-700">
              Customer acquisition cost increased 15% last month. Review targeting strategies.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">💡</span>
              <h4 className="font-medium text-blue-900">Innovation</h4>
            </div>
            <p className="text-sm text-blue-700">
              AI-powered personalization could improve email CTR by 35% based on industry trends.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleAskMaya("Create a board presentation for this month's performance")}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl mb-2 block">📊</span>
            <span className="text-sm font-medium text-gray-900">Board Report</span>
          </button>
          
          <button
            onClick={() => handleAskMaya("Schedule a strategy review meeting with the team")}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl mb-2 block">📅</span>
            <span className="text-sm font-medium text-gray-900">Schedule Review</span>
          </button>
          
          <button
            onClick={() => handleAskMaya("What's our competitor analysis for this quarter?")}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl mb-2 block">🎯</span>
            <span className="text-sm font-medium text-gray-900">Competitor Intel</span>
          </button>
          
          <button
            onClick={() => handleAskMaya("Generate a budget forecast for next quarter")}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl mb-2 block">💼</span>
            <span className="text-sm font-medium text-gray-900">Budget Forecast</span>
          </button>
        </div>
      </div>
    </div>
  )
}