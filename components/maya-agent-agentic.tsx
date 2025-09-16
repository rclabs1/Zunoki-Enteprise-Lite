'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  Activity,
  Sparkles,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';
import { mayaContextualIntelligence, ContextualGreeting } from '@/lib/services/maya-contextual-intelligence';
import { mayaVoiceIntelligence, VoiceInteraction, VoiceResponse } from '@/lib/services/maya-voice-intelligence';
import { backendIntegrationService } from '@/lib/services/backend-integration-service';
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { v4 as uuidv4 } from 'uuid';

interface AgenticMessage {
  id: string;
  type: 'user' | 'maya' | 'system';
  content: string;
  timestamp: string;
  context?: any;
  emotion?: string;
  confidence?: number;
  actions?: ActionItem[];
  voiceResponse?: VoiceResponse;
  isLoading?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  type: string;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed';
  predictedImpact?: number;
  confidence?: number;
}

interface PredictiveInsight {
  type: 'optimization' | 'alert' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  action: string;
}

export default function MayaAgentAgentic() {
  // Core state
  const [messages, setMessages] = useState<AgenticMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => uuidv4());
  
  // Contextual intelligence state
  const [contextualGreeting, setContextualGreeting] = useState<ContextualGreeting | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  
  // Voice intelligence state
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceCapabilities, setVoiceCapabilities] = useState<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [agentMode, setAgentMode] = useState<'chat' | 'voice' | 'hybrid'>('hybrid');
  const [intelligenceLevel, setIntelligenceLevel] = useState<'basic' | 'advanced' | 'predictive'>('predictive');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);

  // Initialize Maya's contextual intelligence
  useEffect(() => {
    initializeMayaIntelligence();
    setupVoiceIntelligence();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMayaIntelligence = async () => {
    try {
      // Initialize contextual intelligence
      await mayaContextualIntelligence.initializeContext();
      
      // Generate contextual greeting
      const greeting = await mayaContextualIntelligence.generateContextualGreeting();
      setContextualGreeting(greeting);
      
      // Add greeting as first message
      const systemMessage: AgenticMessage = {
        id: uuidv4(),
        type: 'system',
        content: greeting.message,
        timestamp: new Date().toISOString(),
        context: {
          greetingType: greeting.type,
          priority: greeting.priority,
          businessImpact: greeting.businessImpact
        },
        actions: greeting.actions.map((action, index) => ({
          id: `greeting-${index}`,
          title: action,
          description: `Based on current context: ${greeting.businessImpact}`,
          platform: 'maya',
          type: 'contextual',
          requiresApproval: false,
          status: 'pending' as const,
          confidence: 85
        }))
      };

      setMessages([systemMessage]);
      
      // Load predictive insights
      const predictions = await mayaContextualIntelligence.predictUserNeeds();
      setPredictiveInsights(predictions.map((prediction, index) => ({
        type: 'optimization' as const,
        title: `Predictive Insight ${index + 1}`,
        description: prediction,
        confidence: 0.8,
        timeframe: 'Next 24 hours',
        action: 'Review and implement'
      })));

    } catch (error) {
      console.error('Failed to initialize Maya intelligence:', error);
    }
  };

  const setupVoiceIntelligence = () => {
    try {
      // Get voice capabilities
      const capabilities = mayaVoiceIntelligence.getVoiceCapabilities();
      setVoiceCapabilities(capabilities);
      setIsVoiceEnabled(capabilities.speechRecognition && capabilities.speechSynthesis);

      // Setup event handlers
      mayaVoiceIntelligence.onListeningStateChange = (listening: boolean) => {
        setIsListening(listening);
      };

      mayaVoiceIntelligence.onInterimResult = (transcript: string) => {
        setInterimTranscript(transcript);
      };

      mayaVoiceIntelligence.onVoiceInteraction = (interaction: VoiceInteraction) => {
        handleVoiceInteraction(interaction);
      };

      mayaVoiceIntelligence.onError = (error: any) => {
        console.error('Voice intelligence error:', error);
      };

    } catch (error) {
      console.error('Failed to setup voice intelligence:', error);
    }
  };

  const handleVoiceInteraction = (interaction: VoiceInteraction) => {
    // Add user voice message
    const userMessage: AgenticMessage = {
      id: interaction.id + '-user',
      type: 'user',
      content: interaction.userInput,
      timestamp: interaction.timestamp,
      context: { voiceInput: true, emotion: interaction.emotion },
      emotion: interaction.emotion
    };

    // Add Maya voice response
    const mayaMessage: AgenticMessage = {
      id: interaction.id + '-maya',
      type: 'maya',
      content: interaction.mayaResponse.text,
      timestamp: interaction.timestamp,
      context: { voiceResponse: true },
      emotion: interaction.mayaResponse.emotion,
      confidence: interaction.confidence,
      voiceResponse: interaction.mayaResponse
    };

    setMessages(prev => [...prev, userMessage, mayaMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: AgenticMessage = {
      id: uuidv4(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    // Add loading message
    const loadingMessage: AgenticMessage = {
      id: uuidv4(),
      type: 'maya',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Get contextual response from Maya intelligence
      const contextualResponse = await mayaContextualIntelligence.getContextualResponse(userMessage);
      
      // Update contextual memory
      await mayaContextualIntelligence.updateContextualMemory({
        timestamp: new Date().toISOString(),
        intent: classifyIntent(userMessage),
        entities: extractEntities(userMessage),
        outcome: 'response_generated'
      });

      // Generate voice response if enabled
      let voiceResponse: VoiceResponse | undefined;
      if (isVoiceEnabled && agentMode !== 'chat') {
        voiceResponse = await generateVoiceResponse(contextualResponse.response);
        if (voiceResponse.audioUrl) {
          setIsSpeaking(true);
          await mayaVoiceIntelligence.speakResponse(voiceResponse);
          setIsSpeaking(false);
        }
      }

      // Create Maya response message
      const mayaMessage: AgenticMessage = {
        id: uuidv4(),
        type: 'maya',
        content: contextualResponse.response,
        timestamp: new Date().toISOString(),
        context: contextualResponse.context,
        confidence: contextualResponse.confidence,
        voiceResponse,
        actions: contextualResponse.actions?.map((action: any, index: number) => ({
          id: uuidv4(),
          title: action.title || `Action ${index + 1}`,
          description: action.description || '',
          platform: action.platform || 'general',
          type: action.type || 'optimization',
          requiresApproval: action.requiresApproval || false,
          status: 'pending' as const,
          predictedImpact: action.predictedImpact,
          confidence: action.confidence
        })) || []
      };

      // Remove loading message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        return [...filtered, mayaMessage];
      });

      // Update action items
      if (mayaMessage.actions?.length) {
        setActionItems(prev => [...prev, ...mayaMessage.actions!]);
      }

    } catch (error) {
      console.error('Maya query failed:', error);
      
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        const errorMessage: AgenticMessage = {
          id: uuidv4(),
          type: 'maya',
          content: 'I apologize, but I encountered an error processing your request. My contextual intelligence is still learning. Please try again.',
          timestamp: new Date().toISOString(),
          context: { error: true }
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoiceResponse = async (text: string): Promise<VoiceResponse> => {
    // This would integrate with the voice intelligence system
    return {
      text,
      emotion: 'neutral',
      urgency: 'medium',
      visualCues: [{
        type: 'waveform',
        color: 'hsl(var(--primary))',
        intensity: 0.7,
        duration: 2000
      }]
    };
  };

  const classifyIntent = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('metrics')) {
      return 'performance_check';
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return 'budget_optimization';
    } else if (lowerMessage.includes('creative') || lowerMessage.includes('ad')) {
      return 'creative_analysis';
    } else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
      return 'optimization_request';
    }
    
    return 'general_query';
  };

  const extractEntities = (message: string): string[] => {
    const entities = [];
    const lowerMessage = message.toLowerCase();
    
    // Platform entities
    if (lowerMessage.includes('google')) entities.push('google_ads');
    if (lowerMessage.includes('meta') || lowerMessage.includes('facebook')) entities.push('meta_ads');
    if (lowerMessage.includes('linkedin')) entities.push('linkedin_ads');
    
    // Metric entities
    if (lowerMessage.includes('roas')) entities.push('roas');
    if (lowerMessage.includes('cpc')) entities.push('cpc');
    if (lowerMessage.includes('ctr')) entities.push('ctr');
    
    return entities;
  };

  const toggleVoiceListening = async () => {
    try {
      if (isListening) {
        mayaVoiceIntelligence.stopListening();
      } else {
        await mayaVoiceIntelligence.startListening();
      }
    } catch (error) {
      console.error('Voice toggle failed:', error);
    }
  };

  const handleActionApproval = async (actionId: string, approved: boolean) => {
    setActionItems(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, status: approved ? 'approved' : 'rejected' }
          : action
      )
    );

    if (approved) {
      await supabaseMultiUserService.trackActivity('maya_action_approved', {
        actionId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageIcon = (type: string, emotion?: string) => {
    if (type === 'maya') {
      if (emotion === 'excited') return <Sparkles className="h-4 w-4 text-yellow-400" />;
      if (emotion === 'concerned') return <AlertCircle className="h-4 w-4 text-red-400" />;
      return <Brain className="h-4 w-4 text-blue-400" />;
    }
    return <User className="h-4 w-4" />;
  };

  const getGreetingIcon = (type: string) => {
    switch (type) {
      case 'urgent_alerts':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'performance_spike':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'new_recommendations':
        return <Target className="h-5 w-5 text-blue-400" />;
      default:
        return <Brain className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <Card className="h-full max-h-[800px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700">
      <CardHeader className="pb-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-800">
                <AvatarFallback className="bg-transparent">
                  <Brain className="h-5 w-5 text-white" />
                </AvatarFallback>
              </Avatar>
              {isListening && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse">
                  <Activity className="h-2 w-2 text-white m-1" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Zunoki. Intelligence
                <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-500/30">
                  Agentic
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-400">
                {intelligenceLevel === 'predictive' ? 'Contextual Predictive AI' : 'Standard Assistant'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Voice Controls */}
            {isVoiceEnabled && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoiceListening}
                  className={`${isListening ? 'bg-red-600/20 text-red-400' : 'text-gray-400'} hover:bg-red-600/30`}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isSpeaking ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contextual Greeting */}
        {contextualGreeting && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-600/10 to-red-800/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getGreetingIcon(contextualGreeting.type)}
              <span className="text-sm font-medium text-white">
                {contextualGreeting.type.replace('_', ' ').toUpperCase()}
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  contextualGreeting.priority === 'high' ? 'border-red-500 text-red-400' :
                  contextualGreeting.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                  'border-gray-500 text-gray-400'
                }`}
              >
                {contextualGreeting.priority} priority
              </Badge>
            </div>
            <p className="text-sm text-gray-300">{contextualGreeting.businessImpact}</p>
          </div>
        )}

        {/* Predictive Insights */}
        {predictiveInsights.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
              <BarChart3 className="h-4 w-4" />
              Predictive Insights
            </div>
            {predictiveInsights.slice(0, 2).map((insight, index) => (
              <div key={index} className="p-2 bg-purple-600/10 border border-purple-500/20 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-medium">{insight.title}</span>
                  <Badge variant="outline" className="border-purple-500 text-purple-400">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-gray-300 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        {/* Messages */}
        <ScrollArea className="flex-1 h-80">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-red-600/20 text-red-400">
                      {getMessageIcon(message.type, message.emotion)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : message.type === 'system'
                      ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-400">Maya is thinking contextually...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.confidence && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-green-400">
                              {Math.round(message.confidence * 100)}% confident
                            </span>
                            <Progress value={message.confidence * 100} className="w-8 h-1" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {message.type === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-700">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Interim Voice Transcript */}
        {interimTranscript && (
          <div className="p-2 bg-yellow-600/10 border border-yellow-500/30 rounded text-sm text-yellow-200">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-yellow-400 animate-pulse" />
              <span>Listening: {interimTranscript}</span>
            </div>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-2">
            <Separator className="bg-gray-700" />
            <div className="flex items-center gap-2 text-sm font-medium text-green-400">
              <Zap className="h-4 w-4" />
              Contextual Actions
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {actionItems.slice(-3).map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <p className="text-xs text-gray-400">{action.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {action.platform}
                        </Badge>
                        {action.predictedImpact && (
                          <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                            +{action.predictedImpact}% impact
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {action.requiresApproval && action.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionApproval(action.id, false)}
                        className="border-red-500 text-red-400 hover:bg-red-600/20"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleActionApproval(action.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Maya about your campaigns, or speak naturally..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Intelligence Level Indicator */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            <span>Contextual Memory Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            <span>Predictive Analytics On</span>
          </div>
          {isVoiceEnabled && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
              <span>Voice Intelligence Ready</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}