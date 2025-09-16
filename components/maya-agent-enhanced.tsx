'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { backendIntegrationService, MayaRequest, MayaResponse } from '@/lib/services/backend-integration-service';
import { supabaseMultiUserService, MayaConversation } from '@/lib/supabase/multi-user-service';
import { v4 as uuidv4 } from 'uuid';

interface Message extends MayaConversation {
  isLoading?: boolean;
}

interface Suggestion {
  text: string;
  type: 'optimization' | 'insight' | 'action';
  confidence: number;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  type: string;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed';
}

export default function MayaAgentEnhanced() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => uuidv4());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [platformContext, setPlatformContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationHistory();
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const history = await supabaseMultiUserService.getMayaConversations(conversationId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: uuidv4(),
      user_id: '',
      conversation_id: conversationId,
      message_type: 'user',
      content: userMessage,
      context_data: null,
      backend_processed: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    // Add loading assistant message
    const loadingMessage: Message = {
      id: uuidv4(),
      user_id: '',
      conversation_id: conversationId,
      message_type: 'assistant',
      content: '',
      context_data: null,
      backend_processed: false,
      created_at: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Get campaign context if available
      const campaignData = await getCampaignContext();

      const mayaRequest: MayaRequest = {
        message: userMessage,
        conversationId,
        context: {
          platformContext,
          campaignData,
          timestamp: new Date().toISOString(),
        },
        platform: platformContext || undefined,
        campaignData,
      };

      const response = await backendIntegrationService.queryMaya(mayaRequest);

      // Remove loading message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        const assistantMessage: Message = {
          id: uuidv4(),
          user_id: '',
          conversation_id: conversationId,
          message_type: 'assistant',
          content: response.response,
          context_data: {
            suggestions: response.suggestions,
            actions: response.actions,
            confidence: response.confidence,
            jobId: response.jobId,
          },
          backend_processed: true,
          created_at: new Date().toISOString(),
        };
        return [...filtered, assistantMessage];
      });

      // Update suggestions
      if (response.suggestions) {
        setSuggestions(
          response.suggestions.map(suggestion => ({
            text: suggestion,
            type: 'insight' as const,
            confidence: response.confidence,
          }))
        );
      }

      // Update action items
      if (response.actions && response.actions.length > 0) {
        const newActionItems: ActionItem[] = response.actions.map(action => ({
          id: uuidv4(),
          title: action.title || 'Optimization Action',
          description: action.description || '',
          platform: action.platform || platformContext || 'general',
          type: action.type || 'optimization',
          requiresApproval: response.requiresApproval || false,
          status: 'pending',
        }));
        setActionItems(prev => [...prev, ...newActionItems]);
      }

    } catch (error) {
      console.error('Maya query failed:', error);
      
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading);
        const errorMessage: Message = {
          id: uuidv4(),
          user_id: '',
          conversation_id: conversationId,
          message_type: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          context_data: { error: true },
          backend_processed: false,
          created_at: new Date().toISOString(),
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaignContext = async () => {
    try {
      const campaigns = await supabaseMultiUserService.getCampaignMetrics();
      return campaigns.slice(0, 5); // Get recent campaigns for context
    } catch (error) {
      console.error('Failed to get campaign context:', error);
      return null;
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputMessage(suggestion.text);
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
      // Track approval
      await supabaseMultiUserService.trackActivity('maya_action_approved', {
        actionId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'executing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Maya Agent
            <Badge variant="secondary">Admolabs Intelligence</Badge>
          </CardTitle>
          {platformContext && (
            <Badge variant="outline">{platformContext}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 h-64">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Hi! I'm Zunoki. your AI smart assistant.</h3>
                <p className="text-sm">
                  Ask me about campaign optimization, audience insights, or performance analysis.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.message_type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.message_type === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.message_type === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Maya is thinking...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatTimestamp(message.created_at)}
                        </span>
                        {message.context_data?.confidence && (
                          <span className={`text-xs ${getConfidenceColor(message.context_data.confidence)}`}>
                            {Math.round(message.context_data.confidence * 100)}% confident
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {message.message_type === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-8"
                >
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Recommended Actions
            </div>
            <div className="space-y-2">
              {actionItems.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getActionStatusIcon(action.status)}
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {action.platform}
                      </Badge>
                    </div>
                  </div>
                  
                  {action.requiresApproval && action.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionApproval(action.id, false)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleActionApproval(action.id, true)}
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
            placeholder="Ask Maya about your campaigns, optimization ideas, or insights..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}