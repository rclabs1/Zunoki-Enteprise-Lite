"use client"

import React, { useState } from 'react'
import { BroadcastCampaignBuilder } from './components/broadcast-campaign-builder'
import { ActiveBroadcasts } from './components/active-broadcasts'
import { MessageTemplateStudio } from './components/message-template-studio'
import { BroadcastAnalytics } from './components/broadcast-analytics'

function BroadcastOverview({ setActiveView }: { setActiveView: (view: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: '#000000'}}>Active Broadcasts</p>
              <p className="text-2xl font-bold" style={{color: '#000000'}}>8</p>
            </div>
            <div className="text-green-500 text-2xl">📱</div>
          </div>
          <p className="text-xs text-green-500 mt-2">↑ 3 from last week</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: '#000000'}}>Messages Sent</p>
              <p className="text-2xl font-bold" style={{color: '#000000'}}>24.5k</p>
            </div>
            <div className="text-blue-500 text-2xl">💬</div>
          </div>
          <p className="text-xs text-green-500 mt-2">↑ 18% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: '#000000'}}>Delivery Rate</p>
              <p className="text-2xl font-bold" style={{color: '#000000'}}>94.2%</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
          <p className="text-xs text-green-500 mt-2">↑ 2% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: '#000000'}}>Response Rate</p>
              <p className="text-2xl font-bold" style={{color: '#000000'}}>12.8%</p>
            </div>
            <div className="text-green-500 text-2xl">📈</div>
          </div>
          <p className="text-xs text-green-500 mt-2">↑ 5% from last month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4" style={{color: '#000000'}}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveView('create')}
            className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">📤</div>
            <div className="font-medium text-blue-600">Create Broadcast</div>
            <div className="text-xs text-blue-500">Launch new broadcast</div>
          </button>

          <button 
            onClick={() => setActiveView('active')}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-green-600">Manage Active</div>
            <div className="text-xs text-green-500">Monitor broadcasts</div>
          </button>

          <button 
            onClick={() => setActiveView('analytics')}
            className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-purple-600">Analytics</div>
            <div className="text-xs text-purple-500">View performance</div>
          </button>

          <button 
            onClick={() => setActiveView('templates')}
            className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-orange-600">Templates</div>
            <div className="text-xs text-orange-500">Message templates</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4" style={{color: '#000000'}}>Recent Broadcast Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span style={{color: '#000000'}}>Product Launch WhatsApp</span>
            <span style={{color: '#000000'}}>delivered to 2,450 contacts</span>
            <span style={{color: '#000000'}}>2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span style={{color: '#000000'}}>Newsletter Telegram</span>
            <span style={{color: '#000000'}}>sent to 890 subscribers</span>
            <span style={{color: '#000000'}}>4 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span style={{color: '#000000'}}>SMS Reminder Campaign</span>
            <span style={{color: '#000000'}}>queued for 1,200 recipients</span>
            <span style={{color: '#000000'}}>6 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BroadcastsModule() {
  const [activeView, setActiveView] = useState('overview')

  const views = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'create', label: 'Create Broadcast', icon: '📤' },
    { id: 'active', label: 'Active Broadcasts', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'templates', label: 'Templates', icon: '📝' }
  ]

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <BroadcastOverview setActiveView={setActiveView} />
      case 'create':
        return <BroadcastCampaignBuilder />
      case 'active':
        return <ActiveBroadcasts />
      case 'analytics':
        return <BroadcastAnalytics />
      case 'templates':
        return <MessageTemplateStudio />
      default:
        return <BroadcastOverview setActiveView={setActiveView} />
    }
  }

  return (
    <div className="p-6">
      {/* Module Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>Messaging Broadcasts</h1>
        <p style={{color: '#000000'}}>Create and manage messaging campaigns across WhatsApp, Telegram, SMS, and more</p>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === view.id
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{color: '#000000'}}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div>
        {renderView()}
      </div>
    </div>
  )
}