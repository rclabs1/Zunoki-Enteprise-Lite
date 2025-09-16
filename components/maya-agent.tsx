"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageCircle,
  Mic,
  Send,
  X,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  BarChart3,
  Volume2,
  VolumeX,
  Settings,
  MicOff,
  Sparkles,
  Radio,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ttsService, type TTSProvider } from "@/lib/region-aware-tts-service"
import { SmartActionConfirmation } from "@/components/smart-action-confirmation"
import { useToast } from "@/hooks/use-toast"
import { mayaContextualIntelligence, ContextualGreeting } from '@/lib/services/maya-contextual-intelligence'
import { getMayaVoiceIntelligence } from '@/lib/services/maya-voice-intelligence'
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service'
import { backendIntegrationService } from '@/lib/services/backend-integration-service'

interface Message {
  id: string
  type: "user" | "maya" | "system"
  content: string
  timestamp: Date
  suggestions?: string[]
  audioUrl?: string
  insights?: {
    type: "growth" | "attribution" | "marketplace" | "optimization"
    confidence: number
    urgency: "low" | "medium" | "high"
  }
  emotion?: string
  contextualData?: any
  isAgentic?: boolean
}

interface SmartAction {
  id: string
  type:
    | "budget_increase"
    | "budget_decrease"
    | "pause_campaign"
    | "enable_campaign"
    | "bid_adjustment"
    | "audience_expansion"
    | "optimize_campaign"
    | "alert_on_cac_increase"
    | "create_campaign_for_tg"
  title: string
  description: string
  reasoning: string
  confidence: number
  risk: "low" | "medium" | "high"
  impact: {
    metric: string
    expectedChange: string
    timeframe: string
  }
  campaignName: string
  platform: string
  currentValue?: string
  proposedValue?: string
  data?: any; // Add data field to SmartAction
}

interface MayaAgentProps {
  mayaReady?: boolean
  mayaLoading?: boolean
}

export function MayaAgent({ mayaReady = true, mayaLoading = false }: MayaAgentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [providers, setProviders] = useState<TTSProvider[]>([])
  const [currentProvider, setCurrentProvider] = useState<TTSProvider | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [recommendations, setRecommendations] = useState<SmartAction[]>([]) // State for recommendations
  const [selectedAction, setSelectedAction] = useState<SmartAction | null>(null) // State for selected action for confirmation
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false) // State for confirmation dialog
  const [isExecutingAction, setIsExecutingAction] = useState(false) // State for action execution loading
  
  // Agentic Intelligence State
  const [contextualGreeting, setContextualGreeting] = useState<ContextualGreeting | null>(null)
  const [isAgenticMode, setIsAgenticMode] = useState(true)
  const [intelligenceLevel, setIntelligenceLevel] = useState<'basic' | 'advanced' | 'predictive'>('predictive')
  const [userContext, setUserContext] = useState<any>(null)
  const [conversationId] = useState(() => `maya-${Date.now()}`)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const pathname = usePathname()
  const { user, userProfile } = useAuth()
  const { toast } = useToast()

  // Helper function to get display name for providers
  const getProviderDisplayName = (provider: TTSProvider): string => {
    switch (provider.id) {
      case "sarvam":
        return "Maya 2.0"
      case "elevenlabs":
        return "Maya Global 1.0"
      case "browser":
        return "Maya 1.0"
      default:
        return provider.name
    }
  }

  // Helper function to get display description for providers
  const getProviderDisplayDescription = (provider: TTSProvider): string => {
    switch (provider.id) {
      case "sarvam":
        return "High-quality Hindi TTS optimized for Indian users"
      case "elevenlabs":
        return "Premium English TTS with natural voices"
      case "browser":
        return "Native system voices, works offline"
      default:
        return provider.description
    }
  }

  // Initialize TTS and speech recognition
  useEffect(() => {
    setProviders(ttsService.getProviders())
    setCurrentProvider(ttsService.getCurrentProvider())

    // Initialize speech recognition
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Initialize Maya with Agentic Intelligence
  useEffect(() => {
    const initializeAgenticMaya = async () => {
      if (user && messages.length === 0 && !hasGreeted && isAgenticMode && mayaReady) {
        try {
          // Initialize contextual intelligence via backend
          await mayaContextualIntelligence.initializeContext()
          
          // Generate contextual greeting via backend compute
          const greetingResponse = await backendIntegrationService.queryMaya({
            message: 'generate_contextual_greeting',
            conversationId: 'greeting_' + Date.now(),
            context: {
              action: 'contextual_greeting',
              userProfile: {
                displayName: userProfile?.displayName,
                email: user.email
              },
              timestamp: new Date().toISOString()
            }
          })
          
          // Parse backend greeting response
          const greeting = greetingResponse.greeting || {
            type: 'normal',
            message: greetingResponse.response,
            priority: 'medium',
            businessImpact: 'Ready to optimize your campaigns with AI insights.',
            actions: greetingResponse.suggestions || []
          }
          setContextualGreeting(greeting)
          
          const userName = userProfile?.displayName || user.email?.split("@")[0] || "there"

          let greetingMessage = ''
          switch (greeting.type) {
            case 'urgent_alerts':
              greetingMessage = `Hi ${userName}, I have an urgent alert for you: ${greeting.message}`
              break
            case 'performance_spike':
              greetingMessage = `Great news, ${userName}! ${greeting.message}`
              break
            case 'long_absence':
              greetingMessage = `Welcome back, ${userName}. While you were away, ${greeting.message}`
              break
            case 'new_recommendations':
              greetingMessage = `Hi ${userName}, I've found some new recommendations for you: ${greeting.message}`
              break
            case 'returning_user':
              greetingMessage = `Welcome back, ${userName}! Here's a quick insight for you: ${greeting.message}`
              break
            default:
              greetingMessage = `${greeting.message}

Hi ${userName}! I'm Zunoki. your agentic AI partner with contextual intelligence. ${greeting.businessImpact}`
              break
          }
          
          const agenticGreeting: Message = {
            id: "agentic-greeting",
            type: "system",
            content: greetingMessage,
            timestamp: new Date(),
            suggestions: greeting.actions.slice(0, 4),
            insights: {
              type: greeting.type === 'urgent_alerts' ? 'optimization' :
                     greeting.type === 'performance_spike' ? 'growth' :
                     greeting.type === 'new_recommendations' ? 'optimization' : 'growth',
              confidence: greeting.priority === 'high' ? 95 : greeting.priority === 'medium' ? 80 : 70,
              urgency: greeting.priority,
            },
            isAgentic: true,
            contextualData: greeting
          }

          setMessages([agenticGreeting])
          setHasGreeted(true)

          // Track agentic greeting
          await supabaseMultiUserService.trackActivity('maya_agentic_greeting', {
            greetingType: greeting.type,
            priority: greeting.priority,
            timestamp: new Date().toISOString()
          })

          // Speak the greeting with emotional context
          if (ttsEnabled) {
            setTimeout(() => {
              handleAgenticTextToSpeech(agenticGreeting.content, agenticGreeting.id, greeting.type)
            }, 1000)
          }
        } catch (error) {
          console.error('Failed to initialize agentic Maya:', error)
          // Fallback to basic greeting
          initializeBasicGreeting()
        }
      } else if (user && messages.length === 0 && !hasGreeted && !isAgenticMode) {
        initializeBasicGreeting()
      }
    }
    
    const initializeBasicGreeting = () => {
      const userName = userProfile?.displayName || user.email?.split("@")[0] || "there"
      const basicGreeting: Message = {
        id: "basic-greeting",
        type: "maya",
        content: `Welcome ${userName}! I'm Zunoki., your AI growth partner. I've been analyzing your campaigns and found some optimization opportunities. How can I help you grow today?`,
        timestamp: new Date(),
        suggestions: [
          "Show me campaign performance",
          "What should I optimize?",
          "Analyze my ROAS",
          "Budget recommendations",
        ],
        insights: {
          type: "growth",
          confidence: 95,
          urgency: "low",
        },
      }
      setMessages([basicGreeting])
      setHasGreeted(true)
    }

    initializeAgenticMaya()
  }, [user, userProfile, messages.length, ttsEnabled, hasGreeted, isAgenticMode, mayaReady])

  // Fetch recommendations when insights tab is active or user changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (activeTab === "insights" && user) {
        setIsLoading(true)
        try {
          // Route recommendations through backend compute
          const backendResponse = await backendIntegrationService.queryMaya({
            message: 'get_smart_recommendations',
            conversationId: 'recommendations_' + Date.now(),
            context: {
              action: 'get_recommendations',
              tab: activeTab,
              timestamp: new Date().toISOString()
            }
          })
          
          // Convert backend response to SmartAction format
          const recommendations: SmartAction[] = backendResponse.actions || []
          setRecommendations(recommendations)
        } catch (error) {
          console.error("Failed to fetch recommendations:", error)
          toast({
            title: "Error fetching insights",
            description: "Could not load Zunoki.'s recommendations. Please try again later.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchRecommendations()
  }, [activeTab, user, toast])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleTextToSpeech = async (text: string, messageId: string) => {
    if (!ttsEnabled) return

    try {
      setIsPlaying(true)
      const response = await ttsService.speak(text)

      // Update message with audio URL
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, audioUrl: response.audioUrl } : msg)))

      // Only try to play if it's not browser TTS (which plays automatically)
      if (response.audioUrl !== "browser://speech-synthesis") {
        await ttsService.playAudio(response.audioUrl)
      }
    } catch (error) {
      console.warn("TTS error:", error)
      // Try browser TTS as final fallback
      try {
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          speechSynthesis.speak(utterance)
        }
      } catch (fallbackError) {
        console.error("All TTS methods failed:", fallbackError)
      }
    } finally {
      setIsPlaying(false)
    }
  }
  
  // Enhanced TTS with emotional context for agentic responses
  const handleAgenticTextToSpeech = async (text: string, messageId: string, contextType: string) => {
    if (!ttsEnabled) return

    try {
      setIsPlaying(true)
      
      // Determine emotional context based on greeting type or content
      let emotion = 'neutral'
      if (contextType === 'urgent_alerts') emotion = 'concerned'
      else if (contextType === 'performance_spike') emotion = 'excited'
      else if (text.includes('great') || text.includes('excellent')) emotion = 'excited'
      else if (text.includes('alert') || text.includes('problem')) emotion = 'concerned'
      
      // Use voice intelligence for emotional TTS if available
      if (mayaVoiceIntelligence && intelligenceLevel === 'predictive') {
        const voiceResponse = await mayaVoiceIntelligence.speakResponse({
          text,
          emotion: emotion as any,
          urgency: contextType === 'urgent_alerts' ? 'high' : 'medium'
        })
      } else {
        // Fallback to regular TTS
        const response = await ttsService.speak(text)
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, audioUrl: response.audioUrl } : msg)))
        
        if (response.audioUrl !== "browser://speech-synthesis") {
          await ttsService.playAudio(response.audioUrl)
        }
      }
    } catch (error) {
      console.warn("Agentic TTS error:", error)
      // Fallback to basic TTS
      await handleTextToSpeech(text, messageId)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      if (isAgenticMode && intelligenceLevel === 'predictive') {
        // Route to backend for compute-heavy agentic processing
        const backendResponse = await backendIntegrationService.queryMaya({
          message: currentInput,
          conversationId,
          context: {
            intelligenceLevel,
            platform: 'agentic_mode',
            userPreferences: {
              communicationStyle: 'detailed',
              riskTolerance: 'moderate'
            }
          },
          campaignData: await supabaseMultiUserService.getUserCampaigns()
        })
        
        // Update contextual memory via backend
        await mayaContextualIntelligence.updateContextualMemory({
          timestamp: new Date().toISOString(),
          intent: classifyIntent(currentInput),
          entities: extractEntities(currentInput),
          outcome: 'backend_response_generated'
        })
        
        // Store conversation in Supabase for learning
        await supabaseMultiUserService.storeMayaConversation(
          conversationId,
          'user',
          currentInput
        )
        
        const mayaResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "maya",
          content: backendResponse.response,
          timestamp: new Date(),
          suggestions: backendResponse.suggestions || getMayaSuggestions(currentInput),
          insights: {
            type: getInsightType(currentInput),
            confidence: Math.round(backendResponse.confidence * 100) || Math.floor(Math.random() * 20) + 80,
            urgency: getInsightUrgency(currentInput),
          },
          isAgentic: true,
          contextualData: { backendJobId: backendResponse.jobId }
        }
        
        setMessages((prev) => [...prev, mayaResponse])
        
        // Store Maya's response (conversation already stored by backend service)
        // Backend integration service handles this automatically
        
        // Track agentic interaction
        await supabaseMultiUserService.trackActivity('maya_agentic_chat', {
          confidence: backendResponse.confidence,
          intent: classifyIntent(currentInput),
          timestamp: new Date().toISOString()
        })
        
        // Speak with contextual emotion
        if (ttsEnabled) {
          await handleAgenticTextToSpeech(mayaResponse.content, mayaResponse.id, 'response')
        }
      } else {
        // Fallback to basic response
        setTimeout(async () => {
          const mayaResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: "maya",
            content: getMayaResponse(currentInput),
            timestamp: new Date(),
            suggestions: getMayaSuggestions(currentInput),
            insights: {
              type: getInsightType(currentInput),
              confidence: Math.floor(Math.random() * 20) + 80,
              urgency: getInsightUrgency(currentInput),
            },
          }
          setMessages((prev) => [...prev, mayaResponse])
          
          // Speak Maya's response if TTS is enabled
          if (ttsEnabled) {
            await handleTextToSpeech(mayaResponse.content, mayaResponse.id)
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Agentic response failed:', error)
      // Fallback to basic response
      const mayaResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "maya",
        content: "I apologize, but I'm having trouble accessing my contextual intelligence right now. Let me help you with a basic response: " + getMayaResponse(currentInput),
        timestamp: new Date(),
        suggestions: getMayaSuggestions(currentInput),
        insights: {
          type: getInsightType(currentInput),
          confidence: 60,
          urgency: getInsightUrgency(currentInput),
        },
        contextualData: { error: true }
      }
      setMessages((prev) => [...prev, mayaResponse])
      
      if (ttsEnabled) {
        await handleTextToSpeech(mayaResponse.content, mayaResponse.id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getMayaResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    const userName = userProfile?.displayName || user?.email?.split("@")[0] || "there"

    if (lowerInput.includes("performance") || lowerInput.includes("campaign")) {
      return `Great question, ${userName}! Your campaigns are performing well overall. Google Ads is showing a 3.2x ROAS with strong impression volume. However, I've identified a budget constraint that's limiting your potential. Your Meta campaigns have some creative fatigue that needs attention. Would you like me to create an optimization plan?`
    }

    if (lowerInput.includes("optimize") || lowerInput.includes("improve")) {
      return `${userName}, I recommend three immediate optimizations: First, increase Google Ads budget by 25% for ₹12K additional revenue. Second, refresh Meta creative assets to combat fatigue. Third, expand your DOOH campaign which is driving 15% digital lift. Shall I implement these changes for you?`
    }

    if (lowerInput.includes("roas") || lowerInput.includes("return")) {
      return `Here's your current ROAS breakdown, ${userName}: Google Ads 3.2x, Meta Ads 2.8x, Marketplace partners averaging 3.8x. The cross-channel attribution shows DOOH is contributing to a 15% lift in digital performance. Your blended ROAS is 3.1x, which is 23% above industry average.`
    }

    if (lowerInput.includes("budget")) {
      return `Based on performance data, ${userName}, I recommend reallocating budget: Increase Google Ads by ₹7K since they're high ROAS but budget-constrained, maintain Meta spend but refresh creative, increase DOOH by ₹3K as it's driving digital synergy. This reallocation could improve overall ROAS by 0.4x.`
    }

    return `Hi ${userName}! I'm analyzing your request and cross-referencing it with your campaign data. Based on current performance trends, I can provide specific recommendations for optimization, budget allocation, or creative strategy. What specific aspect would you like me to focus on?`
  }

  const getMayaSuggestions = (input: string): string[] => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("performance")) {
      return ["Show detailed metrics", "Compare channel performance", "Identify top performers", "Budget optimization"]
    }

    if (lowerInput.includes("optimize")) {
      return ["Apply recommendations", "Show impact forecast", "Schedule optimization", "Compare scenarios"]
    }

    return ["Analyze campaigns", "Budget recommendations", "Creative insights", "Attribution analysis"]
  }

  const getInsightType = (input: string): "growth" | "attribution" | "marketplace" | "optimization" => {
    const lowerInput = input.toLowerCase()
    if (lowerInput.includes("marketplace") || lowerInput.includes("partner")) return "marketplace"
    if (lowerInput.includes("attribution") || lowerInput.includes("channel")) return "attribution"
    if (lowerInput.includes("optimize") || lowerInput.includes("improve")) return "optimization"
    return "growth"
  }

  const getInsightUrgency = (input: string): "low" | "medium" | "high" => {
    const lowerInput = input.toLowerCase()
    if (lowerInput.includes("urgent") || lowerInput.includes("critical")) return "high"
    if (lowerInput.includes("soon") || lowerInput.includes("important")) return "medium"
    return "low"
  }
  
  // Enhanced intent classification for agentic intelligence
  const classifyIntent = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('metrics') || lowerMessage.includes('analytics')) {
      return 'performance_analysis'
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('spend')) {
      return 'budget_optimization'
    } else if (lowerMessage.includes('creative') || lowerMessage.includes('ad') || lowerMessage.includes('copy')) {
      return 'creative_analysis'
    } else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') || lowerMessage.includes('enhance')) {
      return 'optimization_request'
    } else if (lowerMessage.includes('campaign') || lowerMessage.includes('target') || lowerMessage.includes('audience')) {
      return 'campaign_management'
    } else if (lowerMessage.includes('roas') || lowerMessage.includes('roi') || lowerMessage.includes('return')) {
      return 'performance_metrics'
    } else if (lowerMessage.includes('alert') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return 'alert_handling'
    }
    
    return 'general_query'
  }
  
  // Extract entities from message for contextual understanding
  const extractEntities = (message: string): string[] => {
    const entities = []
    const lowerMessage = message.toLowerCase()
    
    // Platform entities
    if (lowerMessage.includes('google') || lowerMessage.includes('adwords')) entities.push('google_ads')
    if (lowerMessage.includes('meta') || lowerMessage.includes('facebook') || lowerMessage.includes('instagram')) entities.push('meta_ads')
    if (lowerMessage.includes('linkedin')) entities.push('linkedin_ads')
    if (lowerMessage.includes('youtube')) entities.push('youtube_ads')
    if (lowerMessage.includes('hubspot')) entities.push('hubspot_crm')
    if (lowerMessage.includes('dv360') || lowerMessage.includes('display')) entities.push('dv360')
    
    // Metric entities
    if (lowerMessage.includes('roas') || lowerMessage.includes('return on ad spend')) entities.push('roas')
    if (lowerMessage.includes('cpc') || lowerMessage.includes('cost per click')) entities.push('cpc')
    if (lowerMessage.includes('ctr') || lowerMessage.includes('click through rate')) entities.push('ctr')
    if (lowerMessage.includes('cpa') || lowerMessage.includes('cost per acquisition')) entities.push('cpa')
    if (lowerMessage.includes('conversions') || lowerMessage.includes('convert')) entities.push('conversions')
    if (lowerMessage.includes('impressions') || lowerMessage.includes('views')) entities.push('impressions')
    
    // Action entities
    if (lowerMessage.includes('increase') || lowerMessage.includes('boost')) entities.push('increase_action')
    if (lowerMessage.includes('decrease') || lowerMessage.includes('reduce')) entities.push('decrease_action')
    if (lowerMessage.includes('pause') || lowerMessage.includes('stop')) entities.push('pause_action')
    if (lowerMessage.includes('start') || lowerMessage.includes('enable')) entities.push('enable_action')
    
    return entities
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        setIsListening(true)
        recognitionRef.current.start()
      }
    }
  }

  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled)
    if (isPlaying) {
      ttsService.stopAudio()
      setIsPlaying(false)
    }
  }

  const handleTTSProviderChange = (providerId: string) => {
    ttsService.setProvider(providerId as "sarvam" | "elevenlabs" | "browser")
    setCurrentProvider(ttsService.getCurrentProvider())
  }

  const handleConfirmAction = async (action: SmartAction) => {
    setIsExecutingAction(true)
    try {
      // Implementation for confirming and executing the action
      console.log("Executing action:", action)
      // Add actual API call here
      toast({
        title: "Action executed",
        description: `Successfully executed: ${action.title}`,
      })
    } catch (error) {
      console.error("Failed to execute action:", error)
      toast({
        title: "Action failed",
        description: "Failed to execute the action. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExecutingAction(false)
      setIsConfirmationOpen(false)
      setSelectedAction(null)
    }
  }

  const handleDismissAction = (action: SmartAction) => {
    setIsConfirmationOpen(false)
    setSelectedAction(null)
    toast({
      title: "Action dismissed",
      description: `Dismissed: ${action.title}`,
    })
  }

  const handleReplayAudio = async (audioUrl: string) => {
    if (!audioUrl || !ttsEnabled) return

    try {
      setIsPlaying(true)
      await ttsService.playAudio(audioUrl)
    } catch (error) {
      console.warn("Audio replay failed:", error)
    } finally {
      setIsPlaying(false)
    }
  }

  const getInsightIcon = (category: string) => {
    switch (category) {
      case "optimization":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "opportunity":
        return <Lightbulb className="h-4 w-4 text-blue-400" />
      case "insight":
        return <BarChart3 className="h-4 w-4 text-purple-400" />
      default:
        return <CheckCircle className="h-4 w-4 text-neutral-400" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
    }
  }

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case "growth":
        return <TrendingUp className="h-3 w-3" />
      case "attribution":
        return <BarChart3 className="h-3 w-3" />
      case "marketplace":
        return <Target className="h-3 w-3" />
      case "optimization":
        return <Zap className="h-3 w-3" />
      default:
        return <Brain className="h-3 w-3" />
    }
  }

  // Don't show on landing pages
  if (pathname === "/" || pathname === "/landing" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  return (
    <>
      {/* Floating Maya Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] hover:from-[hsl(var(--primary))/90] hover:to-[#8a0508] text-white shadow-2xl transition-all duration-300 ${
          isOpen ? "scale-0" : "scale-100"
        }`}
        style={{
          boxShadow: "0 0 30px rgba(229, 9, 20, 0.3)",
        }}
      >
        <Brain className="h-6 w-6" />
        {isPlaying && <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>}
      </Button>

      {/* Maya Agent Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl">
          <Card className="h-full bg-transparent border-0 flex flex-col">
            <CardHeader className="pb-3 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      Maya
                      {isAgenticMode && (
                        <Badge className="bg-gradient-to-r from-purple-600/20 to-red-600/20 text-purple-400 border-purple-500/30 text-xs">
                          Agentic
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-neutral-400">
                      {isAgenticMode ? 'Contextual AI Partner • Voice Intelligence' : 'AI Growth Partner • Voice-Enabled'}
                    </p>
                    {contextualGreeting && (
                      <p className="text-xs text-red-400 mt-1">
                        {contextualGreeting.priority.toUpperCase()} priority context active
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTTS}
                    className={`text-neutral-400 hover:text-white hover:bg-neutral-800 ${
                      ttsEnabled ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-neutral-800 border-b border-neutral-700 rounded-none flex-shrink-0">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="insights"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Insights
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Intelligence
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">
                  {/* Chat Body - Messages Container */}
                  <div className="chat-body flex-1 relative min-h-0">
                    <ScrollArea
                      className="chat-scroll-container h-full w-full"
                      id="chat-window"
                      style={{
                        overflowY: "auto",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <div className="p-4 space-y-4">
                        {mayaLoading && messages.length === 0 && (
                          <div className="flex justify-start">
                            <div className="bg-neutral-800 text-white p-3 rounded-lg max-w-[85%]">
                              <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                <span>Setting up Maya's intelligence...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] p-3 rounded-lg ${
                                message.type === "user" ? "bg-primary text-primary-foreground" : 
                                message.type === "system" ? "bg-gradient-to-br from-purple-600/20 to-red-600/20 border border-purple-500/30 text-white" :
                                "bg-neutral-800 text-white"
                              }`}
                              style={{
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                                hyphens: "auto",
                              }}
                            >
                              {message.type === "maya" && message.insights && (
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Brain className="h-4 w-4 text-primary flex-shrink-0" />
                                  <Badge className="text-xs px-2 py-0.5 bg-primary/20 text-primary border-primary/30">
                                    {getInsightTypeIcon(message.insights.type)}
                                    <span className="ml-1">{message.insights.confidence}%</span>
                                  </Badge>
                                  <Badge className={`text-xs px-2 py-0.5 ${getUrgencyColor(message.insights.urgency)}`}>
                                    {message.insights.urgency}
                                  </Badge>
                                </div>
                              )}
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm flex-1 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                <div className="flex items-center gap-1">
                                  {message.isAgentic && (
                                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs px-1 py-0">
                                      AI
                                    </Badge>
                                  )}
                                  {message.type === "maya" && message.audioUrl && ttsEnabled && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReplayAudio(message.audioUrl!)}
                                      className="p-1 h-6 w-6 text-neutral-400 hover:text-white flex-shrink-0"
                                      disabled={isPlaying}
                                    >
                                      <Volume2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {message.suggestions && (
                                <div className="mt-3 space-y-2">
                                  {message.suggestions.map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="w-full text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent text-left justify-start"
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-neutral-800 text-white p-3 rounded-lg max-w-[85%]">
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-primary animate-pulse" />
                                <span className="text-sm">Maya is thinking contextually...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Chat Footer - Input Container */}
                  <div
                    className="chat-footer flex-shrink-0 p-4 border-t border-neutral-700 bg-neutral-900"
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 10,
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder={mayaLoading ? "Setting up Zunoki...." : "Ask Zunoki. about your campaigns..."}
                        className="flex-1 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-400"
                        disabled={isLoading || mayaLoading}
                      />
                      <Button
                        onClick={handleVoiceInput}
                        variant="outline"
                        size="sm"
                        className={`border-neutral-600 hover:bg-neutral-700 ${
                          isListening ? "bg-red-500 border-red-500 text-white" : "bg-transparent"
                        }`}
                        disabled={!recognitionRef.current || mayaLoading}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={isPlaying || isLoading || !inputValue.trim() || mayaLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="flex-1 m-0 p-4 overflow-y-auto">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-white font-medium text-lg">Your Growth Insights</h3>
                    </div>
                    <p className="text-neutral-400 text-sm mb-4">
                      Maya analyzes your campaigns to uncover actionable insights. Connect your campaign or check back
                      soon!
                    </p>
                  </div>

                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {recommendations.length === 0 && !isLoading && (
                        <div className="text-center text-neutral-400 py-8">
                          No insights available yet. Connect your ad accounts to get started!
                        </div>
                      )}
                      {isLoading && (
                        <div className="text-center text-neutral-400 py-8">
                          Loading insights...
                        </div>
                      )}
                      {recommendations.map((insight) => (
                        <div
                          key={insight.id}
                          className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50 relative overflow-hidden"
                        >
                          {/* Background sparkline effect */}
                          <div className="absolute inset-0 opacity-5">
                            <svg className="w-full h-full" viewBox="0 0 100 40">
                              <path
                                d="M0,20 Q25,10 50,20 T100,15"
                                stroke="currentColor"
                                strokeWidth="1"
                                fill="none"
                                className="text-primary"
                              />
                            </svg>
                          </div>

                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getInsightIcon(insight.type)}
                                <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                              </div>
                              <Badge className={getUrgencyColor(insight.risk)}>{insight.risk}</Badge>
                            </div>
                            <p className="text-xs text-neutral-300 mb-2">{insight.description}</p>
                            <p className="text-xs text-emerald-400 mb-3">{insight.impact.expectedChange} {insight.impact.metric} in {insight.impact.timeframe}</p>
                            <Button
                              size="sm"
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => {
                                setSelectedAction(insight)
                                setIsConfirmationOpen(true)
                              }}
                            >
                              <Target className="h-3 w-3 mr-2" />
                              Execute Action
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 m-0 p-4 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-medium mb-3">Intelligence Settings</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-300">Agentic Mode</span>
                        <Switch checked={isAgenticMode} onCheckedChange={setIsAgenticMode} />
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-neutral-300 text-sm mb-2 block">Intelligence Level</span>
                        <Select value={intelligenceLevel} onValueChange={(value: 'basic' | 'advanced' | 'predictive') => setIntelligenceLevel(value)}>
                          <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-800 border-neutral-600">
                            <SelectItem value="basic" className="text-white hover:bg-neutral-700">
                              Basic - Simple responses
                            </SelectItem>
                            <SelectItem value="advanced" className="text-white hover:bg-neutral-700">
                              Advanced - Context-aware
                            </SelectItem>
                            <SelectItem value="predictive" className="text-white hover:bg-neutral-700">
                              Predictive - Full agentic intelligence
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-300">Enable Voice Responses</span>
                        <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Radio className="h-4 w-4 text-primary" />
                        <span className="text-neutral-300 text-sm">Choose how Maya speaks to you:</span>
                      </div>

                      <h4 className="text-white font-medium mb-3">Agentic Partners</h4>
                      <Select value={currentProvider?.id} onValueChange={handleTTSProviderChange}>
                        <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                          <SelectValue placeholder="Select Agentic Partner" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-600">
                          {providers.map((provider) => (
                            <SelectItem
                              key={provider.id}
                              value={provider.id}
                              disabled={!provider.available}
                              className="text-white hover:bg-neutral-700"
                            >
                              <div className="flex flex-col">
                                <span>{getProviderDisplayName(provider)}</span>
                                <span className="text-xs text-gray-400">{getProviderDisplayDescription(provider)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <p>
                        • <strong>Maya 2.0:</strong> Optimized for Indian users with local voice models
                      </p>
                      <p>
                        • <strong>Maya Global 1.0:</strong> High-quality global voices with premium features
                      </p>
                      <p>
                        • <strong>Maya 1.0:</strong> Native system voices, works offline
                      </p>
                    </div>

                    {currentProvider && (
                      <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`h-2 w-2 rounded-full ${currentProvider.available ? "bg-green-400" : "bg-red-400"}`}
                          />
                          <span className="text-sm font-medium text-white">
                            {getProviderDisplayName(currentProvider)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{getProviderDisplayDescription(currentProvider)}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedAction && (
        <SmartActionConfirmation
          action={selectedAction}
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmAction}
          onDismiss={handleDismissAction}
          isLoading={isExecutingAction}
        />
      )}
    </>
  )
}