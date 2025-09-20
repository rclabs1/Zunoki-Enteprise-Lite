"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './auth-context'
import { backendIntegrationService } from '@/lib/services/backend-integration-service'

export interface MayaMessage {
  id: string
  type: 'user' | 'maya'
  content: string
  timestamp: Date
  actionButtons?: Array<{
    label: string
    action: string
    variant?: 'primary' | 'secondary'
    callbackId?: string
  }>
  suggestedModule?: string
  toolsUsed?: string[]
  confidence?: number
  requiresApproval?: boolean
}

export interface MayaContextType {
  messages: MayaMessage[]
  isListening: boolean
  isProcessing: boolean
  currentModule: string | null
  conversationHistory: MayaMessage[]
  sendMessage: (message: string, options?: { voiceEnabled?: boolean }) => Promise<void>
  startListening: () => void
  stopListening: () => void
  executeAction: (action: string, data?: any) => Promise<void>
  navigateToModule: (module: string) => void
  clearConversation: () => void
  getPredictions: (timeframe?: '1d' | '7d' | '30d') => Promise<any[]>
  getAnomalies: () => Promise<any[]>
  getRecommendations: () => Promise<any[]>
  searchMemory: (query: string, type?: string) => Promise<any[]>
  storeMemory: (content: string, type: string, metadata?: any) => Promise<string>
  executeApprovedAction: (callbackId: string, actionData: any) => Promise<any>
}

const MayaContext = createContext<MayaContextType | undefined>(undefined)

export function useMaya() {
  const context = useContext(MayaContext)
  if (context === undefined) {
    throw new Error('useMaya must be used within a MayaProvider')
  }
  return context
}

export function MayaProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<MayaMessage[]>([])
  const [initialGreetingLoaded, setInitialGreetingLoaded] = useState(false)
  const greetingLoadedRef = useRef(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentModule, setCurrentModule] = useState<string | null>(null)

  // Load contextual greeting when user is available (prevent multiple loads)
  useEffect(() => {
    if (user && userProfile && !initialGreetingLoaded && !greetingLoadedRef.current) {
      greetingLoadedRef.current = true
      loadContextualGreeting()
      setInitialGreetingLoaded(true)
    }
  }, [user, userProfile, initialGreetingLoaded])

  const loadContextualGreeting = async () => {
    try {
      const { mayaContextualIntelligence } = await import('@/lib/services/maya-contextual-intelligence')
      const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'there'
      const contextualGreeting = await mayaContextualIntelligence.generateContextualGreeting(displayName)
      
      // The message already includes the name, so we just use it directly
      const personalizedMessage = contextualGreeting.message
      
      const greetingMessage: MayaMessage = {
        id: `greeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'maya',
        content: personalizedMessage,
        timestamp: new Date(),
        actionButtons: contextualGreeting.actions.map((action, index) => ({
          label: action,
          action: `contextual_action_${index}`,
          variant: contextualGreeting.priority === 'high' ? 'primary' : 'secondary'
        }))
      }
      
      setMessages([greetingMessage])
      
      // Speak the greeting if voice is available
      const { mayaVoiceService } = await import('@/lib/voice-recognition')
      if (await mayaVoiceService.initialize()) {
        console.log('🔊 Maya Context - Speaking greeting:', personalizedMessage.substring(0, 50) + '...')
        mayaVoiceService.speakResponse(personalizedMessage)
      }
    } catch (error) {
      console.error('Failed to load contextual greeting:', error)
      // Fallback to default greeting
      setMessages([{
        id: `fallback_greeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'maya',
        content: `Welcome to Zunoki. Agentic Platform! I'm Agent Zunoki, powered by Zunoki. Intelligence. How can I help you optimize your marketing today?`,
        timestamp: new Date(),
        actionButtons: [
          { label: '📊 Show Insights', action: 'navigate_insights', variant: 'primary' },
          { label: '🎯 Create Campaign', action: 'navigate_campaigns', variant: 'secondary' },
          { label: '🔗 Connect Platform', action: 'navigate_platforms', variant: 'secondary' }
        ]
      }])
    }
  }

  const sendMessage = useCallback(async (message: string, options?: { voiceEnabled?: boolean }) => {
    if (!user) return

    const { voiceEnabled = false } = options || {};

    const userMessage: MayaMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      // Use new LangChain agent service with fallback to basic Maya
      let agentResponse
      try {
        // Try advanced LangChain agent first
        agentResponse = await backendIntegrationService.queryMayaAgent(
          message,
          messages.slice(-5).map(msg => ({
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          })),
          {
            currentModule,
            userPreferences: userProfile || {},
          }
        )
      } catch (error) {
        console.warn('LangChain agent failed, falling back to local Maya API:', error)
        // Fallback to local Maya API first (with auth)
        try {
          // Get Firebase ID token for authentication
          const auth = await import('@/lib/firebase')
          const idToken = await auth.auth.currentUser?.getIdToken()
          
          console.log('Maya Context: Firebase currentUser:', auth.auth.currentUser?.uid)
          console.log('Maya Context: ID token available:', !!idToken)
          
          if (!idToken) {
            throw new Error(`No Firebase ID token available - user: ${auth.auth.currentUser?.uid}`)
          }
          
          const localResponse = await fetch('/api/maya/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              message,
              currentModule,
              voiceEnabled,
              conversationHistory: messages.slice(-5).map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: msg.timestamp,
              })),
            }),
          })

          if (!localResponse.ok) {
            throw new Error(`Local Maya API failed: ${localResponse.statusText}`)
          }

          const localData = await localResponse.json()
          
          agentResponse = {
            response: localData.response,
            voiceSummary: localData.voiceSummary, // Capture voice summary for synthesis
            toolsUsed: [],
            intermediateSteps: [],
            confidence: 0.8, // High confidence for local API
            actions: localData.actionButtons?.map((button, index) => ({
              id: `action_${Date.now()}_${index}`,
              type: 'navigation',
              description: button.label,
              parameters: { action: button.action },
              requiresApproval: false,
            })) || [],
          }
        } catch (localError) {
          console.error('Local Maya API also failed, trying backend Maya:', localError)
          // Final fallback to backend Maya service (might have auth issues)
          try {
            const fallbackResponse = await backendIntegrationService.queryMaya({
              message,
              conversationId: `conv_${user.uid}_${Date.now()}`,
              context: { currentModule },
              platform: 'web',
            })
            
            agentResponse = {
              response: fallbackResponse.response,
              toolsUsed: [],
              intermediateSteps: [],
              confidence: fallbackResponse.confidence,
              actions: fallbackResponse.actions?.map((action, index) => ({
                id: `action_${Date.now()}_${index}`,
                type: 'navigation',
                description: action.description || action.label,
                parameters: action.data || {},
                requiresApproval: action.requiresApproval || false,
              })) || [],
            }
          } catch (finalError) {
            console.error('All Maya services failed:', finalError)
            throw finalError
          }
        }
      }

      const mayaResponse: MayaMessage = {
        id: `maya_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'maya',
        content: agentResponse.response,
        timestamp: new Date(),
        toolsUsed: agentResponse.toolsUsed,
        confidence: agentResponse.confidence,
        actionButtons: agentResponse.actions?.map(action => ({
          label: action.description,
          action: `execute_${action.type}`,
          variant: action.requiresApproval ? 'primary' : 'secondary',
          callbackId: action.id,
        })) || [],
        requiresApproval: agentResponse.actions?.some(a => a.requiresApproval),
      }

      setMessages(prev => [...prev, mayaResponse])

      // Speak Maya's response if voice is available
      try {
        const { mayaVoiceService } = await import('@/lib/voice-recognition')
        if (await mayaVoiceService.initialize()) {
          // Smart text selection for voice synthesis
          let textToSpeak: string;
          
          if (agentResponse.voiceSummary && agentResponse.voiceSummary.trim().length > 0) {
            // Use voice summary if available and not empty
            textToSpeak = agentResponse.voiceSummary.trim();
          } else if (agentResponse.response.length <= 400) {
            // Use full response if it's short enough
            textToSpeak = agentResponse.response;
          } else {
            // Fallback: Smart truncation of full response
            const sentences = agentResponse.response.split('. ');
            textToSpeak = sentences[0];
            if (textToSpeak.length > 400) {
              textToSpeak = textToSpeak.substring(0, 397) + '...';
            }
          }
          
          console.log('🔊 Maya Context - Speaking:', textToSpeak.substring(0, 50) + '...')
          console.log('🔊 Maya Context - Using:', 
            agentResponse.voiceSummary ? 'voice summary' : 
            agentResponse.response.length <= 400 ? 'full response (short)' : 'truncated response', 
            `(${textToSpeak.length} chars)`)
          
          mayaVoiceService.speakResponse(textToSpeak)
        }
      } catch (error) {
        console.error('TTS error:', error)
      }

      // Store conversation in memory if using advanced agent
      if (agentResponse.toolsUsed && agentResponse.toolsUsed.length > 0) {
        try {
          await backendIntegrationService.storeMemory(
            `User: ${message}\nMaya: ${agentResponse.response}`,
            'conversation',
            {
              module: currentModule,
              toolsUsed: agentResponse.toolsUsed,
              confidence: agentResponse.confidence,
              timestamp: new Date().toISOString(),
            }
          )
        } catch (error) {
          console.warn('Failed to store conversation memory:', error)
        }
      }
    } catch (error) {
      console.error('Error communicating with Agent Zunoki:', error)
      const errorResponse: MayaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'maya',
        content: "I'm having trouble processing that request. Please try again or use the navigation buttons above.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsProcessing(false)
    }
  }, [user, currentModule, messages])

  const startListening = useCallback(async () => {
    const { mayaVoiceService } = await import('@/lib/voice-recognition')
    
    const success = await mayaVoiceService.initialize()
    if (!success) {
      console.warn('Voice recognition not available')
      return
    }

    setIsListening(true)
    mayaVoiceService.startListening(
      (transcript) => {
        sendMessage(transcript)
        setIsListening(false)
      },
      (error) => {
        console.error('Voice recognition error:', error)
        setIsListening(false)
      },
      () => {
        setIsListening(true)
      },
      () => {
        setIsListening(false)
      }
    )
  }, [sendMessage])

  const stopListening = useCallback(async () => {
    const { mayaVoiceService } = await import('@/lib/voice-recognition')
    mayaVoiceService.stopListening()
    setIsListening(false)
  }, [])

  const executeAction = useCallback(async (action: string, data?: any) => {
    switch (action) {
      case 'navigate_insights':
        navigateToModule('zunoki-intelligence')
        break
      case 'navigate_campaigns':
        navigateToModule('campaigns')
        break
      case 'navigate_platforms':
        navigateToModule('platforms')
        break
      case 'navigate_automation':
        navigateToModule('automation')
        break
      case 'navigate_settings':
        navigateToModule('settings')
        break
      case 'navigate_marketplace':
        navigateToModule('marketplace')
        break
      case 'navigate_agent-builder':
        navigateToModule('agent-builder')
        break
      case 'navigate_conversations':
        navigateToModule('conversations')
        break
      case 'execute_campaign_action':
      case 'execute_automation':
      case 'execute_optimization':
        if (data?.callbackId) {
          try {
            const result = await backendIntegrationService.executeApprovedAction(data.callbackId, data)
            const resultMessage: MayaMessage = {
              id: Date.now().toString(),
              type: 'maya',
              content: `✅ Action executed successfully: ${result.result || 'Complete'}`,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, resultMessage])
          } catch (error) {
            console.error('Action execution failed:', error)
            const errorMessage: MayaMessage = {
              id: Date.now().toString(),
              type: 'maya',
              content: `❌ Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
          }
        }
        break
      default:
        console.log('Action not implemented:', action, data)
    }
  }, [])

  const navigateToModule = useCallback((module: string) => {
    // Handle legacy module names for backward compatibility
    let normalizedModule = module
    if (module === 'maya-intelligence' || module === 'insights') {
      normalizedModule = 'zunoki-intelligence'
    }

    setCurrentModule(normalizedModule)

    // Add navigation message with proper module names
    const moduleNames: { [key: string]: string } = {
      'zunoki-intelligence': 'Zunoki Intelligence',
      'conversations': 'Conversations',
      'campaigns': 'Campaigns',
      'platforms': 'Platforms',
      'settings': 'Settings'
    }

    const displayName = moduleNames[normalizedModule] || normalizedModule.charAt(0).toUpperCase() + normalizedModule.slice(1)

    const navMessage: MayaMessage = {
      id: Date.now().toString(),
      type: 'maya',
      content: `Opening ${displayName} module for you...`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, navMessage])
  }, [])

  const clearConversation = useCallback(() => {
    setMessages([
      {
        id: '1',
        type: 'maya',
        content: "Conversation cleared. How can I help you with your marketing today?",
        timestamp: new Date(),
        actionButtons: [
          { label: '📊 Show Insights', action: 'navigate_insights', variant: 'primary' },
          { label: '🎯 Create Campaign', action: 'navigate_campaigns', variant: 'secondary' },
          { label: '🔗 Connect Platform', action: 'navigate_platforms', variant: 'secondary' }
        ]
      }
    ])
  }, [])

  // Advanced intelligence methods
  const getPredictions = useCallback(async (timeframe: '1d' | '7d' | '30d' = '7d') => {
    try {
      return await backendIntegrationService.getCachedForecast(timeframe)
    } catch (error) {
      console.error('Failed to get predictions:', error)
      throw error
    }
  }, [])

  const getAnomalies = useCallback(async () => {
    try {
      return await backendIntegrationService.getCachedAnomalies()
    } catch (error) {
      console.error('Failed to get anomalies:', error)
      throw error
    }
  }, [])

  const getRecommendations = useCallback(async () => {
    try {
      return await backendIntegrationService.getSmartRecommendations()
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      throw error
    }
  }, [])

  const searchMemory = useCallback(async (query: string, type?: string) => {
    try {
      return await backendIntegrationService.searchMemory(query, type as any)
    } catch (error) {
      console.error('Failed to search memory:', error)
      throw error
    }
  }, [])

  const storeMemory = useCallback(async (content: string, type: string, metadata?: any) => {
    try {
      return await backendIntegrationService.storeMemory(content, type as any, metadata)
    } catch (error) {
      console.error('Failed to store memory:', error)
      throw error
    }
  }, [])

  const executeApprovedAction = useCallback(async (callbackId: string, actionData: any) => {
    try {
      return await backendIntegrationService.executeApprovedAction(callbackId, actionData)
    } catch (error) {
      console.error('Failed to execute approved action:', error)
      throw error
    }
  }, [])

  const value: MayaContextType = {
    messages,
    isListening,
    isProcessing,
    currentModule,
    conversationHistory: messages,
    sendMessage,
    startListening,
    stopListening,
    executeAction,
    navigateToModule,
    clearConversation,
    getPredictions,
    getAnomalies,
    getRecommendations,
    searchMemory,
    storeMemory,
    executeApprovedAction
  }

  return (
    <MayaContext.Provider value={value}>
      {children}
    </MayaContext.Provider>
  )
}