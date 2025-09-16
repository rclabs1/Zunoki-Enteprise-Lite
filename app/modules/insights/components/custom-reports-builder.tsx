"use client"

import React, { useState, useCallback } from 'react'
import { useMaya } from '@/contexts/maya-context'

interface ReportWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'text' | 'kpi'
  title: string
  config: {
    metric?: string
    platform?: string
    dateRange?: string
    chartType?: 'line' | 'bar' | 'pie' | 'donut'
    aggregation?: 'sum' | 'avg' | 'count'
    filters?: Array<{ field: string; operator: string; value: string }>
  }
  position: { x: number; y: number }
  size: { width: number; height: number }
}

interface SavedReport {
  id: string
  name: string
  description: string
  widgets: ReportWidget[]
  createdAt: Date
  lastModified: Date
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    recipients: string[]
  }
}

export function CustomReportsBuilder() {
  const { sendMessage } = useMaya()
  const [mode, setMode] = useState<'build' | 'preview' | 'saved'>('build')
  const [currentReport, setCurrentReport] = useState<SavedReport>({
    id: 'new',
    name: 'Untitled Report',
    description: '',
    widgets: [],
    createdAt: new Date(),
    lastModified: new Date()
  })
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  const availableWidgets = [
    { 
      type: 'kpi', 
      title: 'KPI Card', 
      icon: '📊', 
      description: 'Single metric display' 
    },
    { 
      type: 'chart', 
      title: 'Chart', 
      icon: '📈', 
      description: 'Line, bar, or pie charts' 
    },
    { 
      type: 'table', 
      title: 'Data Table', 
      icon: '📋', 
      description: 'Campaign performance table' 
    },
    { 
      type: 'metric', 
      title: 'Metric Comparison', 
      icon: '🔢', 
      description: 'Compare metrics across platforms' 
    },
    { 
      type: 'text', 
      title: 'Text Block', 
      icon: '📝', 
      description: 'Custom text and insights' 
    }
  ]

  const metrics = [
    { id: 'spend', label: 'Total Spend', platforms: ['all', 'google_ads', 'meta_ads', 'linkedin_ads'] },
    { id: 'conversions', label: 'Conversions', platforms: ['all', 'google_ads', 'meta_ads', 'linkedin_ads'] },
    { id: 'roas', label: 'ROAS', platforms: ['all', 'google_ads', 'meta_ads', 'linkedin_ads'] },
    { id: 'ctr', label: 'CTR', platforms: ['all', 'google_ads', 'meta_ads', 'linkedin_ads'] },
    { id: 'cpc', label: 'CPC', platforms: ['all', 'google_ads', 'meta_ads'] },
    { id: 'cpm', label: 'CPM', platforms: ['all', 'meta_ads', 'linkedin_ads'] },
    { id: 'quality_score', label: 'Quality Score', platforms: ['google_ads'] },
    { id: 'relevance_score', label: 'Relevance Score', platforms: ['meta_ads'] },
    { id: 'reach', label: 'Reach', platforms: ['meta_ads', 'linkedin_ads'] },
    { id: 'impressions', label: 'Impressions', platforms: ['all', 'google_ads', 'meta_ads', 'linkedin_ads'] }
  ]

  const platforms = [
    { id: 'all', label: 'All Platforms', icon: '🌐' },
    { id: 'google_ads', label: 'Google Ads', icon: '📊' },
    { id: 'meta_ads', label: 'Meta Ads', icon: '📱' },
    { id: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼' }
  ]

  const handleDragStart = (widgetType: string) => {
    setDraggedWidget(widgetType)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedWidget) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newWidget: ReportWidget = {
      id: `widget_${Date.now()}`,
      type: draggedWidget as ReportWidget['type'],
      title: `New ${draggedWidget.charAt(0).toUpperCase() + draggedWidget.slice(1)}`,
      config: {
        metric: 'spend',
        platform: 'all',
        dateRange: '30',
        chartType: 'line',
        aggregation: 'sum',
        filters: []
      },
      position: { x: Math.max(0, x - 100), y: Math.max(0, y - 50) },
      size: { width: 200, height: 150 }
    }

    setCurrentReport(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      lastModified: new Date()
    }))

    setDraggedWidget(null)
    setSelectedWidget(newWidget.id)
  }

  const updateWidget = (widgetId: string, updates: Partial<ReportWidget>) => {
    setCurrentReport(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates, lastModified: new Date() } : w
      ),
      lastModified: new Date()
    }))
  }

  const deleteWidget = (widgetId: string) => {
    setCurrentReport(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      lastModified: new Date()
    }))
    setSelectedWidget(null)
  }

  const saveReport = () => {
    const reportToSave = {
      ...currentReport,
      id: currentReport.id === 'new' ? `report_${Date.now()}` : currentReport.id,
      lastModified: new Date()
    }

    setSavedReports(prev => {
      const existing = prev.findIndex(r => r.id === reportToSave.id)
      if (existing >= 0) {
        return prev.map((r, i) => i === existing ? reportToSave : r)
      } else {
        return [...prev, reportToSave]
      }
    })

    setCurrentReport(reportToSave)
    sendMessage(`Report "${reportToSave.name}" saved successfully! You can now schedule it or share with your team.`)
  }

  const handleAskMaya = (question: string) => {
    sendMessage(question)
  }

  const renderWidget = (widget: ReportWidget) => {
    const isSelected = selectedWidget === widget.id

    return (
      <div
        key={widget.id}
        className={`absolute bg-white border-2 rounded-lg p-4 cursor-move ${
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: widget.position.x,
          top: widget.position.y,
          width: widget.size.width,
          height: widget.size.height
        }}
        onClick={() => setSelectedWidget(widget.id)}
        onDoubleClick={() => setMode('preview')}
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm text-foreground truncate" style={{color: '#000000'}}>{widget.title}</h4>
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedWidget(widget.id)
              }}
              className="text-gray-400 hover:text-foreground text-xs"
            >
              ⚙️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteWidget(widget.id)
              }}
              className="text-gray-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="text-xs text-foreground mb-2" style={{color: '#000000'}}>
          {widget.config.platform} • {widget.config.metric}
        </div>

        {/* Widget Preview */}
        <div className="flex items-center justify-center h-16 bg-gray-50 rounded">
          {widget.type === 'kpi' && (
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">$12.4k</div>
              <div className="text-xs text-foreground" style={{color: '#000000'}}>{widget.config.metric}</div>
            </div>
          )}
          {widget.type === 'chart' && (
            <div className="text-gray-400">📈 Chart Preview</div>
          )}
          {widget.type === 'table' && (
            <div className="text-gray-400">📋 Table Preview</div>
          )}
          {widget.type === 'metric' && (
            <div className="text-gray-400">🔢 Metrics Preview</div>
          )}
          {widget.type === 'text' && (
            <div className="text-gray-400">📝 Text Block</div>
          )}
        </div>
      </div>
    )
  }

  const renderWidgetConfig = () => {
    if (!selectedWidget) return null

    const widget = currentReport.widgets.find(w => w.id === selectedWidget)
    if (!widget) return null

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-4" style={{color: '#000000'}}>Widget Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" style={{color: '#000000'}}>Title</label>
            <input
              type="text"
              value={widget.title}
              onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" style={{color: '#000000'}}>Metric</label>
            <select
              value={widget.config.metric}
              onChange={(e) => updateWidget(widget.id, { 
                config: { ...widget.config, metric: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metrics.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" style={{color: '#000000'}}>Platform</label>
            <select
              value={widget.config.platform}
              onChange={(e) => updateWidget(widget.id, { 
                config: { ...widget.config, platform: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" style={{color: '#000000'}}>Date Range</label>
            <select
              value={widget.config.dateRange}
              onChange={(e) => updateWidget(widget.id, { 
                config: { ...widget.config, dateRange: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {widget.type === 'chart' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" style={{color: '#000000'}}>Chart Type</label>
              <select
                value={widget.config.chartType}
                onChange={(e) => updateWidget(widget.id, { 
                  config: { ...widget.config, chartType: e.target.value as 'line' | 'bar' | 'pie' | 'donut' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="donut">Donut Chart</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => handleAskMaya(`Help me optimize this ${widget.type} widget configuration for better insights`)}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              🤖 Optimize with Agent Maya
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'saved') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground" style={{color: '#000000'}}>Saved Reports</h2>
          <button
            onClick={() => {
              setMode('build')
              setCurrentReport({
                id: 'new',
                name: 'Untitled Report',
                description: '',
                widgets: [],
                createdAt: new Date(),
                lastModified: new Date()
              })
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            ➕ New Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedReports.map(report => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-foreground mb-2" style={{color: '#000000'}}>{report.name}</h3>
              <p className="text-sm text-foreground mb-3" style={{color: '#000000'}}>{report.description || 'No description'}</p>
              <div className="text-xs text-foreground mb-4" style={{color: '#000000'}}>
                {report.widgets.length} widgets • Modified {report.lastModified.toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentReport(report)
                    setMode('build')
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setCurrentReport(report)
                    setMode('preview')
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-foreground rounded text-sm hover:bg-gray-50"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {savedReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-medium text-foreground mb-2" style={{color: '#000000'}}>No saved reports yet</h3>
            <p className="text-foreground mb-4" style={{color: '#000000'}}>Create your first custom report to get started</p>
            <button
              onClick={() => setMode('build')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create Report
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={currentReport.name}
            onChange={(e) => setCurrentReport(prev => ({ ...prev, name: e.target.value }))}
            className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('build')}
              className={`px-3 py-1 rounded text-sm ${
                mode === 'build' ? 'bg-blue-100 text-blue-700' : 'text-foreground hover:bg-gray-100'
              }`}
            >
              🔧 Build
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded text-sm ${
                mode === 'preview' ? 'bg-blue-100 text-blue-700' : 'text-foreground hover:bg-gray-100'
              }`}
            >
              👁 Preview
            </button>
            <button
              onClick={() => setMode('saved')}
              className={`px-3 py-1 rounded text-sm ${
                mode === 'saved' ? 'bg-blue-100 text-blue-700' : 'text-foreground hover:bg-gray-100'
              }`}
            >
              📁 Saved
            </button>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={saveReport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            💾 Save Report
          </button>
          <button
            onClick={() => handleAskMaya("Help me create an effective custom report for my marketing data")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            🤖 Ask Agent Maya
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Widget Library */}
        {mode === 'build' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground" style={{color: '#000000'}}>Widget Library</h3>
            <div className="space-y-2">
              {availableWidgets.map(widget => (
                <div
                  key={widget.type}
                  draggable
                  onDragStart={() => handleDragStart(widget.type)}
                  className="p-3 bg-white border border-gray-200 rounded cursor-grab hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{widget.icon}</span>
                    <span className="font-medium text-sm">{widget.title}</span>
                  </div>
                  <p className="text-xs text-foreground" style={{color: '#000000'}}>{widget.description}</p>
                </div>
              ))}
            </div>

            {selectedWidget && renderWidgetConfig()}
          </div>
        )}

        {/* Canvas */}
        <div className={mode === 'build' ? 'col-span-3' : 'col-span-4'}>
          <div
            className="relative bg-gray-50 border border-gray-200 rounded-lg min-h-96 p-4"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => setSelectedWidget(null)}
          >
            {currentReport.widgets.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-foreground" style={{color: '#000000'}}>
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="font-medium" style={{color: '#000000'}}>Drag widgets here to build your report</p>
                  <p className="text-sm mt-2" style={{color: '#000000'}}>Start with KPI cards or charts from the library</p>
                </div>
              </div>
            ) : (
              currentReport.widgets.map(renderWidget)
            )}
          </div>
        </div>
      </div>

      {/* Report Actions */}
      {mode === 'preview' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4" style={{color: '#000000'}}>Report Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleAskMaya(`Export my "${currentReport.name}" report as PDF`)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium text-foreground" style={{color: '#000000'}}>📄 Export PDF</div>
              <div className="text-sm text-foreground" style={{color: '#000000'}}>Generate printable report</div>
            </button>
            
            <button
              onClick={() => handleAskMaya(`Schedule my "${currentReport.name}" report to be sent weekly`)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium text-foreground" style={{color: '#000000'}}>📅 Schedule</div>
              <div className="text-sm text-foreground" style={{color: '#000000'}}>Automated delivery</div>
            </button>
            
            <button
              onClick={() => handleAskMaya(`Share my "${currentReport.name}" report with my team`)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium text-foreground" style={{color: '#000000'}}>📤 Share</div>
              <div className="text-sm text-foreground" style={{color: '#000000'}}>Send to team members</div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}