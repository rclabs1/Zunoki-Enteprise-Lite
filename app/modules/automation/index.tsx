"use client"

import React, { useState } from 'react'
import { useMaya } from '@/contexts/maya-context'

const AutomationModule = () => {
  const { sendMessage } = useMaya()
  const [activeView, setActiveView] = useState('overview')

  const automations = [
    { id: '1', name: 'Auto-bid Optimizer', status: 'active', saved: '$2,400', actions: 47 },
    { id: '2', name: 'Budget Reallocation', status: 'active', saved: '$1,200', actions: 23 },
    { id: '3', name: 'Lead Scoring', status: 'active', saved: '$800', actions: 156 },
    { id: '4', name: 'Audience Expansion', status: 'paused', saved: '$0', actions: 0 }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{color: "#000000"}}>Automation Center</h1>
        <p style={{color: "#000000"}}>AI-powered automations that optimize your campaigns 24/7</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{color: "#000000"}}>Monthly Savings</p>
              <p className="text-2xl font-bold text-green-600">$4,200</p>
            </div>
            <div className="text-green-500 text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{color: "#000000"}}>Time Saved</p>
              <p className="text-2xl font-bold text-blue-600">15 hrs</p>
            </div>
            <div className="text-blue-500 text-2xl">⏰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{color: "#000000"}}>Actions Taken</p>
              <p className="text-2xl font-bold text-purple-600">226</p>
            </div>
            <div className="text-purple-500 text-2xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Active Automations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900" style={{color: "#000000"}}>Active Automations</h2>
          <button
            onClick={() => sendMessage("Create a new automation for my campaigns")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            ➕ Create Automation
          </button>
        </div>

        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <h3 className="font-medium" style={{color: "#000000"}}>{automation.name}</h3>
                  <p className="text-sm text-gray-600" style={{color: "#000000"}}>
                    Saved ${automation.saved.toLocaleString()} • {automation.actions} actions taken
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => sendMessage(`Analyze the performance of my ${automation.name} automation`)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  🤖 Ask Zunoki.
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white text-sm" style={{color: "#000000"}}>
                  ⚙️ Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Maya Recommendations */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-medium mb-2" style={{color: "#000000"}}>Agent Maya Automation Suggestions</h3>
            <div className="space-y-2 text-sm" style={{color: "#000000"}}>
              <p>• Set up automatic budget shifts from low-performing to high-performing campaigns</p>
              <p>• Create bid adjustments based on time-of-day performance patterns</p>
              <p>• Enable automatic pause for campaigns with ROAS below 2.0x</p>
            </div>
            <button
              onClick={() => sendMessage("Help me set up the most effective automations for my campaigns")}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Get Custom Automation Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomationModule;