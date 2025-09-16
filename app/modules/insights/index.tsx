"use client"

import React, { useState } from 'react'
import { UnifiedDashboard } from './components/unified-dashboard'
import { GoogleAdsView } from './components/google-ads-view'
import { MetaAdsView } from './components/meta-ads-view'
import { AttributionAnalysis } from './components/attribution-analysis'
import { CustomReportsBuilder } from './components/custom-reports-builder'

export default function InsightsModule() {
  const [activeView, setActiveView] = useState('unified')

  const views = [
    { id: 'unified', label: 'Unified Dashboard', icon: '🌐' },
    { id: 'google-ads', label: 'Google Ads', icon: '📊' },
    { id: 'meta-ads', label: 'Meta Ads', icon: '📱' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'attribution', label: 'Attribution', icon: '📈' },
    { id: 'reports', label: 'Custom Reports', icon: '📋' }
  ]

  const renderView = () => {
    switch (activeView) {
      case 'unified':
        return <UnifiedDashboard />
      case 'google-ads':
        return <GoogleAdsView />
      case 'meta-ads':
        return <MetaAdsView />
      case 'linkedin':
        return <div className="text-center py-12" style={{color: '#000000'}}>LinkedIn deep dive coming soon...</div>
      case 'attribution':
        return <AttributionAnalysis />
      case 'reports':
        return <CustomReportsBuilder />
      default:
        return <UnifiedDashboard />
    }
  }

  return (
    <div className="p-6">
      {/* Module Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>Insights & Analytics</h1>
        <p style={{color: '#000000'}}>Comprehensive performance analysis across all your marketing platforms</p>
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
      <div className="bg-white rounded-lg">
        {renderView()}
      </div>
    </div>
  )
}