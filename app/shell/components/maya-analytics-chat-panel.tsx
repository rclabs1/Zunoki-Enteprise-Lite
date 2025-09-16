"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'
import { mayaVoiceService } from '@/lib/voice-recognition'
import { mayaChartIntelligenceService } from '@/lib/services/maya-chart-intelligence-service'
import { mayaVoiceNarrationService } from '@/lib/services/maya-voice-narration-service'
import MayaMessageWithCharts from '@/components/maya/maya-message-with-charts'
import MayaKPIBar, { createDefaultMarketingKPIs } from '@/components/maya/maya-kpi-bar'
import { BarChart3, TrendingUp, Minimize2, Maximize2, Settings, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area';
  data: any;
  options: any;
  insights: string[];
  voiceNarration: string;
  quickActions: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface MayaAnalyticsChatPanelProps {
  defaultMinimized?: boolean
}

export function MayaAnalyticsChatPanel({ defaultMinimized = false }: MayaAnalyticsChatPanelProps) {
  const {
    messages,
    isListening,
    isProcessing,
    sendMessage,
    startListening,
    stopListening,
    executeAction,
    clearConversation
  } = useMaya()

  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(defaultMinimized)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showKPIBar, setShowKPIBar] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [currentCharts, setCurrentCharts] = useState<Map<string, ChartData>>(new Map())
  const [analyticsMode, setAnalyticsMode] = useState(false)
  const [kpiMetrics] = useState(createDefaultMarketingKPIs())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentCharts])

  // Initialize voice services
  useEffect(() => {
    const initVoice = async () => {
      const mayaVoiceInitialized = await mayaVoiceService.initialize()
      const narrationInitialized = await mayaVoiceNarrationService.initialize()
      setVoiceEnabled(mayaVoiceInitialized && narrationInitialized)
      if (!mayaVoiceInitialized || !narrationInitialized) {
        setVoiceError('Voice features require microphone permission')
      }
    }
    initVoice()
  }, [])

  // Detect analytics queries and enable analytics mode
  const detectAnalyticsQuery = (query: string): boolean => {
    const analyticsKeywords = [
      'show', 'chart', 'graph', 'trend', 'analysis', 'performance', 
      'roas', 'revenue', 'conversion', 'campaign', 'compare', 'metrics',
      'dashboard', 'data', 'report', 'insights', 'analytics', 'visualize'
    ];
    
    return analyticsKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  };

  const handleSendMessage = async () => {
    if (input.trim() && !isProcessing) {
      const message = input.trim()
      
      // Detect if this is an analytics query
      if (detectAnalyticsQuery(message)) {
        setAnalyticsMode(true)
        setShowKPIBar(true)
        
        // Generate chart data for analytics queries
        try {
          const chartData = await generateChartForQuery(message)
          if (chartData) {
            setCurrentCharts(prev => new Map(prev.set(Date.now().toString(), chartData)))
          }
        } catch (error) {
          console.error('Chart generation failed:', error)
        }
      }
      
      setInput('')
      await sendMessage(message)
    }
  }

  const generateChartForQuery = async (query: string): Promise<ChartData | null> => {
    try {
      const chartConfig = await mayaChartIntelligenceService.generateChart({
        userQuery: query,
        dataContext: { query, timestamp: Date.now() },
        platformData: {
          googleAds: [], // TODO: Fetch real data
          metaAds: [],
          linkedin: [],
          messaging: []
        }
      });

      return chartConfig;
    } catch (error) {
      console.error('Failed to generate chart:', error);
      return null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceToggle = () => {
    if (!voiceEnabled) {
      setVoiceError('Voice features not available. Please enable microphone access.')
      return
    }

    if (isRecording) {
      mayaVoiceService.stopListening()
      setIsRecording(false)
    } else {
      setVoiceError(null)
      const started = mayaVoiceService.startListening(
        (transcript) => {
          setInput(transcript)
          setIsRecording(false)
          if (transcript.trim()) {
            setTimeout(() => {
              handleSendMessage()
            }, 500)
          }
        },
        (error) => {
          setVoiceError(error)
          setIsRecording(false)
        },
        () => {
          setIsRecording(true)
          setVoiceError(null)
        },
        () => {
          setIsRecording(false)
        }
      )

      if (!started) {
        setVoiceError('Failed to start voice recognition')
      }
    }
  }

  const handleChartAction = (action: string, data?: any) => {
    console.log('Chart action:', action, data)
    // Handle chart-specific actions
    switch (action) {
      case 'optimize_campaigns':
        sendMessage('Optimize my campaigns based on this analysis')
        break
      case 'analyze_creative':
        sendMessage('Analyze creative performance for this data')
        break
      case 'deep_dive':
        sendMessage('Show me a deeper analysis of this data')
        break
      default:
        executeAction(action, data)
    }
  }

  const handleKPIClick = (metricId: string) => {
    const metric = kpiMetrics.find(m => m.id === metricId)
    if (metric) {
      sendMessage(`Tell me more about my ${metric.name} performance`)
    }
  }

  const handleAddKPI = () => {
    sendMessage('Help me add a new KPI to my dashboard')
  }

  // Handle Maya responses with voice (only when panel is active/visible)
  useEffect(() => {
    if (messages.length > 0 && !isMinimized) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'maya' && voiceEnabled) {
        console.log('🔊 Maya Analytics Chat Panel - Speaking:', lastMessage.content.substring(0, 50) + '...')
        mayaVoiceService.speakResponse(lastMessage.content)
      }
    } else if (isMinimized && messages.length > 0) {
      console.log('🔊 Maya Analytics Chat Panel - Minimized, NOT speaking')
    }
  }, [messages, voiceEnabled, isMinimized])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <BarChart3 size={24} />
        </button>
      </div>
    )
  }

  const panelWidth = isExpanded ? 'w-[900px]' : 'w-96'
  const panelHeight = analyticsMode ? 'h-[600px]' : 'h-96'

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {analyticsMode ? <BarChart3 size={20} /> : <span className="text-xl">🤖</span>}
            </div>
            <div>
              <h3 className="font-semibold">
                {analyticsMode ? 'Zunoki. Analytics - Fullscreen' : 'Agent Zunoki - Fullscreen'}
              </h3>
              <p className="text-xs text-blue-100">
                {analyticsMode ? 'Conversational Analytics Intelligence' : 'Zunoki. Intelligence'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Voice Toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-white bg-opacity-10'
              }`}
              title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Analytics Mode Toggle */}
            <button
              onClick={() => {
                setAnalyticsMode(!analyticsMode)
                setShowKPIBar(!showKPIBar)
              }}
              className={`p-2 rounded-lg transition-colors ${
                analyticsMode ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10 hover:bg-opacity-20'
              }`}
              title={analyticsMode ? 'Exit Analytics Mode' : 'Enter Analytics Mode'}
            >
              <TrendingUp size={16} />
            </button>

            {/* Clear */}
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
              title="Clear conversation"
            >
              🗑️
            </button>

            {/* Exit Fullscreen */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
              title="Exit fullscreen"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* KPI Bar in Fullscreen */}
        {showKPIBar && analyticsMode && (
          <MayaKPIBar
            metrics={kpiMetrics}
            onMetricClick={handleKPIClick}
            onAddMetric={handleAddKPI}
            isCollapsible={false}
            className="border-b"
          />
        )}

        {/* Messages in Fullscreen */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => {
            const messageCharts = Array.from(currentCharts.entries()).filter(([timestamp]) => 
              Math.abs(parseInt(timestamp) - message.timestamp.getTime()) < 10000
            );

            return (
              <MayaMessageWithCharts
                key={message.id}
                message={message}
                onActionClick={executeAction}
                onChartActionClick={handleChartAction}
                chartData={messageCharts.length > 0 ? messageCharts[0][1] : undefined}
                className="transition-all duration-200"
              />
            );
          })}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">
                    {analyticsMode ? 'Zunoki. is analyzing your data...' : 'Agent Zunoki is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Error Display in Fullscreen */}
        {voiceError && (
          <div className="border-t border-gray-200 px-6 py-3 bg-red-50">
            <div className="text-sm text-red-600 flex items-center space-x-2">
              <span>⚠️</span>
              <span>{voiceError}</span>
            </div>
          </div>
        )}

        {/* Voice Status in Fullscreen */}
        {isRecording && (
          <div className="border-t border-gray-200 px-6 py-3 bg-green-50">
            <div className="flex items-center space-x-2 text-green-700">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <Mic size={14} />
              <span className="text-sm font-medium">Listening... Speak now</span>
            </div>
          </div>
        )}

        {/* Input in Fullscreen */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex items-center space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                analyticsMode 
                  ? "Ask Zunoki. about your data... (e.g., 'Show ROAS trends')"
                  : "Ask Agent Zunoki anything..."
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            
            <button
              onClick={handleVoiceToggle}
              className={`p-3 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : voiceEnabled
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={
                !voiceEnabled 
                  ? 'Voice features not available' 
                  : isRecording 
                  ? 'Stop listening' 
                  : 'Start voice input'
              }
              disabled={!voiceEnabled}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {analyticsMode ? 'Analyze' : 'Send'}
            </button>
          </div>

          {/* Quick Analytics Prompts in Fullscreen */}
          {analyticsMode && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Show ROAS trends',
                'Compare platforms',
                'Revenue analysis',
                'Campaign performance'
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt)
                    setTimeout(handleSendMessage, 100)
                  }}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 ${panelWidth} bg-white border border-gray-200 rounded-xl shadow-2xl z-50 transition-all duration-300`}>
      {/* KPI Bar - Shows when analytics mode is active */}
      {showKPIBar && analyticsMode && (
        <MayaKPIBar
          metrics={kpiMetrics}
          onMetricClick={handleKPIClick}
          onAddMetric={handleAddKPI}
          isCollapsible={!isExpanded}
          className="rounded-t-xl border-b"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {analyticsMode ? <BarChart3 size={20} /> : <span className="text-xl">🤖</span>}
          </div>
          <div>
            <h3 className="font-semibold">
              {analyticsMode ? 'Zunoki. Analytics' : 'Agent Zunoki'}
            </h3>
            <p className="text-xs text-blue-100">
              {analyticsMode ? 'Conversational Analytics Intelligence' : 'Zunoki. Intelligence'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-white bg-opacity-10'
            }`}
            title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Analytics Mode Toggle */}
          <button
            onClick={() => {
              setAnalyticsMode(!analyticsMode)
              setShowKPIBar(!showKPIBar)
            }}
            className={`p-2 rounded-lg transition-colors ${
              analyticsMode ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10 hover:bg-opacity-20'
            }`}
            title={analyticsMode ? 'Exit Analytics Mode' : 'Enter Analytics Mode'}
          >
            <TrendingUp size={16} />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Settings */}
          <button
            className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Clear */}
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
            title="Clear conversation"
          >
            🗑️
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
            title="Minimize"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`${panelHeight} overflow-y-auto p-4 space-y-4 bg-gray-50`}>
        {messages.map((message) => {
          const messageCharts = Array.from(currentCharts.entries()).filter(([timestamp]) => 
            Math.abs(parseInt(timestamp) - message.timestamp.getTime()) < 10000
          );

          return (
            <MayaMessageWithCharts
              key={message.id}
              message={message}
              onActionClick={executeAction}
              onChartActionClick={handleChartAction}
              chartData={messageCharts.length > 0 ? messageCharts[0][1] : undefined}
              className="transition-all duration-200"
            />
          );
        })}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">
                  {analyticsMode ? 'Zunoki. is analyzing your data...' : 'Agent Zunoki is thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Error Display */}
      {voiceError && (
        <div className="border-t border-gray-200 px-4 py-2 bg-red-50">
          <div className="text-xs text-red-600 flex items-center space-x-2">
            <span>⚠️</span>
            <span>{voiceError}</span>
          </div>
        </div>
      )}

      {/* Voice Status */}
      {isRecording && (
        <div className="border-t border-gray-200 px-4 py-2 bg-green-50">
          <div className="flex items-center space-x-2 text-green-700">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            <Mic size={14} />
            <span className="text-xs font-medium">Listening... Speak now</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              analyticsMode 
                ? "Ask Zunoki. about your data... (e.g., 'Show ROAS trends')"
                : "Ask Agent Zunoki anything..."
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isProcessing}
          />
          
          <button
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : voiceEnabled
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !voiceEnabled 
                ? 'Voice features not available' 
                : isRecording 
                ? 'Stop listening' 
                : 'Start voice input'
            }
            disabled={!voiceEnabled}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            {analyticsMode ? 'Analyze' : 'Send'}
          </button>
        </div>

        {/* Quick Analytics Prompts */}
        {analyticsMode && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Show ROAS trends',
              'Compare platforms',
              'Revenue analysis',
              'Campaign performance'
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt)
                  setTimeout(handleSendMessage, 100)
                }}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}