"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Settings,
  TestTube,
  Zap,
  MessageSquare,
  Clock,
  Activity
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    responseTime?: number
    confidence?: number
    classification?: any
  }
}

interface AgentTestPanelProps {
  isOpen: boolean
  onClose: () => void
  agentConfig: {
    name: string
    model: string
    temperature: number
    systemPrompt: string
    voiceConfig: {
      enabled: boolean
      voice: string
      speed: number
    }
    capabilities: string[]
  }
}

export function AgentTestPanel({ isOpen, onClose, agentConfig }: AgentTestPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [testMode, setTestMode] = useState<'chat' | 'performance'>('chat')
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: 0,
    totalMessages: 0,
    successRate: 0,
    lastResponseTime: 0
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user, userProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      // Initialize test session
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: `🤖 Testing ${agentConfig.name || 'Agent'} - Send a message to start the conversation`,
        timestamp: new Date()
      }])
      setPerformanceMetrics({
        averageResponseTime: 0,
        totalMessages: 0,
        successRate: 0,
        lastResponseTime: 0
      })
      inputRef.current?.focus()
    }
  }, [isOpen, agentConfig.name])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    const startTime = Date.now()

    try {
      // Test the agent with the current configuration
      const response = await fetch('/api/agents/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          message: content,
          agentConfig: {
            model: agentConfig.model,
            temperature: agentConfig.temperature,
            systemPrompt: agentConfig.systemPrompt,
            maxTokens: 500
          }
        })
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            responseTime,
            confidence: data.confidence || 0.9,
            classification: data.classification
          }
        }

        setMessages(prev => [...prev, agentMessage])

        // Update performance metrics
        setPerformanceMetrics(prev => {
          const newTotal = prev.totalMessages + 1
          const newAverage = ((prev.averageResponseTime * prev.totalMessages) + responseTime) / newTotal
          return {
            averageResponseTime: Math.round(newAverage),
            totalMessages: newTotal,
            successRate: 100, // Would calculate based on actual success/failure
            lastResponseTime: responseTime
          }
        })

        // Play voice response if enabled
        if (agentConfig.voiceConfig.enabled && voiceEnabled && data.audioUrl) {
          const audio = new Audio(data.audioUrl)
          audio.play().catch(console.error)
        }

      } else {
        throw new Error('Failed to get response')
      }

    } catch (error) {
      console.error('Test message error:', error)
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: '❌ Failed to get response from agent. Please check your configuration.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Test Failed",
        description: "Failed to get response from agent. Please check your configuration.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startVoiceRecording = () => {
    // In a real implementation, you'd use the Web Speech API
    setIsVoiceRecording(true)
    toast({
      title: "Voice Recording",
      description: "Voice recording would start here (Web Speech API integration needed)",
    })
    
    // Simulate voice recording
    setTimeout(() => {
      setIsVoiceRecording(false)
      setInputMessage("This would be the transcribed voice message")
    }, 3000)
  }

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: `🤖 Testing ${agentConfig.name || 'Agent'} - Send a message to start the conversation`,
      timestamp: new Date()
    }])
    setPerformanceMetrics({
      averageResponseTime: 0,
      totalMessages: 0,
      successRate: 0,
      lastResponseTime: 0
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] max-w-[90vw] bg-[#0d0d0d] border-[#333333] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="border-b border-[#333333] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/80] rounded-lg">
                  <TestTube className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-white">Agent Tester</SheetTitle>
                  <p className="text-sm text-[#cccccc]">
                    Testing: {agentConfig.name || 'Unnamed Agent'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={testMode === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestMode('chat')}
                  className="border-[#404040]"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button
                  variant={testMode === 'performance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestMode('performance')}
                  className="border-[#404040]"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Metrics
                </Button>
              </div>
            </div>
          </SheetHeader>

          {testMode === 'chat' ? (
            <>
              {/* Agent Info */}
              <div className="p-4 bg-[#1a1a1a] border-b border-[#333333]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-[#404040] text-[#cccccc]">
                      {agentConfig.model}
                    </Badge>
                    <Badge variant="outline" className="border-[#404040] text-[#cccccc]">
                      Temp: {agentConfig.temperature}
                    </Badge>
                    {agentConfig.voiceConfig.enabled && (
                      <Badge variant="outline" className="border-green-600 text-green-400">
                        Voice
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {agentConfig.voiceConfig.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={voiceEnabled ? 'text-green-400' : 'text-[#666666]'}
                      >
                        {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConversation}
                      className="text-[#666666] hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {agentConfig.capabilities.slice(0, 4).map(capability => (
                    <Badge 
                      key={capability}
                      variant="outline" 
                      className="border-[#404040] text-[#cccccc] text-xs"
                    >
                      {capability.replace('_', ' ')}
                    </Badge>
                  ))}
                  {agentConfig.capabilities.length > 4 && (
                    <Badge variant="outline" className="border-[#404040] text-[#cccccc] text-xs">
                      +{agentConfig.capabilities.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-[hsl(var(--primary))]' 
                            : message.type === 'agent'
                            ? 'bg-green-600'
                            : 'bg-[#666666]'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : message.type === 'agent' ? (
                            <Bot className="h-4 w-4 text-white" />
                          ) : (
                            <Settings className="h-4 w-4 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={`${
                          message.type === 'user' 
                            ? 'bg-[hsl(var(--primary))] text-white' 
                            : message.type === 'agent'
                            ? 'bg-[#262626] text-white'
                            : 'bg-[#1a1a1a] text-[#cccccc]'
                        } rounded-lg p-3`}>
                          <p className="text-sm">{message.content}</p>
                          
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                            <span>
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            
                            {message.metadata?.responseTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {message.metadata.responseTime}ms
                              </div>
                            )}
                          </div>

                          {message.metadata?.classification && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs border-white/20">
                                  {message.metadata.classification.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-white/20">
                                  {message.metadata.classification.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-white/20">
                                  {(message.metadata.confidence * 100).toFixed(0)}% confident
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-[#262626] rounded-lg p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#333333] bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message to test your agent..."
                      className="bg-[#262626] border-[#404040] pr-20"
                      disabled={isLoading}
                    />
                    
                    {agentConfig.voiceConfig.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={startVoiceRecording}
                        disabled={isLoading || isVoiceRecording}
                      >
                        {isVoiceRecording ? (
                          <MicOff className="h-4 w-4 text-red-400" />
                        ) : (
                          <Mic className="h-4 w-4 text-[#666666]" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Performance Metrics View */
            <div className="flex-1 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-[#1a1a1a] border-[#333333]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">Avg Response Time</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {performanceMetrics.averageResponseTime}ms
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#333333]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium">Total Messages</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {performanceMetrics.totalMessages}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#333333]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {performanceMetrics.successRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#333333]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium">Last Response</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {performanceMetrics.lastResponseTime}ms
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Configuration Summary */}
              <Card className="bg-[#1a1a1a] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Model:</span>
                    <span>{agentConfig.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Temperature:</span>
                    <span>{agentConfig.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Voice:</span>
                    <span>{agentConfig.voiceConfig.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Capabilities:</span>
                    <span>{agentConfig.capabilities.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}