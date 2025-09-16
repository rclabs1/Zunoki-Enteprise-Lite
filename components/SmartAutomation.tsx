
// components/SmartAutomation.tsx
// Enhanced Smart Agentic Automation panel with modern design patterns

"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { useSession } from "next-auth/react";
import { 
  Brain, 
  Zap, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Eye, 
  Clock, 
  Filter, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles,
  Bot,
  Activity,
  BarChart3,
  Settings,
  Command,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Types for enhanced functionality
interface CopilotResponse {
  response?: string;
  graphData?: {
    title: string;
    data: any[];
    xKey: string;
    yKey: string;
  };
  requiresHumanApproval?: boolean;
  actionToApprove?: string;
  approvalCallbackId?: string;
  error?: string;
}

interface AgentAction {
  id: string;
  type: 'optimization' | 'alert' | 'insight' | 'automation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: Date;
  data?: any;
}

interface PromptTemplate {
  id: string;
  command: string;
  description: string;
  example: string;
  category: 'campaigns' | 'analytics' | 'automation' | 'insights';
}

const SmartAutomation: React.FC = () => {
  const { data: session } = useSession();
  const userId = session?.user?.email;

  // Core states
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<CopilotResponse['graphData'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState<{ actionToApprove: string; approvalCallbackId: string } | null>(null);

  // Enhanced states
  const [activeTab, setActiveTab] = useState('automation');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [isListening, setIsListening] = useState(false);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Prompt templates for slash commands
  const promptTemplates: PromptTemplate[] = [
    {
      id: '1',
      command: '/optimize',
      description: 'Optimize campaign performance',
      example: '/optimize budget allocation for Google Ads',
      category: 'automation'
    },
    {
      id: '2', 
      command: '/pause',
      description: 'Pause underperforming campaigns',
      example: '/pause campaigns with CTR < 1%',
      category: 'campaigns'
    },
    {
      id: '3',
      command: '/analyze',
      description: 'Analyze performance metrics',
      example: '/analyze ROAS trends for last 30 days',
      category: 'analytics'
    },
    {
      id: '4',
      command: '/alert',
      description: 'Set up performance alerts',
      example: '/alert when CPC exceeds $2',
      category: 'automation'
    },
    {
      id: '5',
      command: '/insights',
      description: 'Get AI-powered insights',
      example: '/insights audience performance YouTube',
      category: 'insights'
    }
  ];

  // Mock agent actions for demonstration
  const mockAgentActions: AgentAction[] = [
    {
      id: '1',
      type: 'optimization',
      title: 'Budget Reallocation Suggested',
      description: 'Shift $500 from Meta to Google Ads for 15% ROAS improvement',
      confidence: 89,
      impact: 'high',
      status: 'pending',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      data: { fromPlatform: 'Meta', toPlatform: 'Google Ads', amount: 500, expectedROAS: 15 }
    },
    {
      id: '2', 
      type: 'alert',
      title: 'CPC Spike Detected',
      description: 'Google Ads CPC increased 23% in last 2 hours',
      confidence: 95,
      impact: 'medium',
      status: 'completed',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
    {
      id: '3',
      type: 'automation',
      title: 'Auto-Pause Low Performers',
      description: 'Paused 3 campaigns with CTR < 0.8%',
      confidence: 92,
      impact: 'medium', 
      status: 'completed',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setAgentActions(mockAgentActions);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  // Utility functions
  const getActionIcon = (type: AgentAction['type']) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'insight': return <Brain className="h-4 w-4 text-blue-400" />;
      case 'automation': return <Bot className="h-4 w-4 text-purple-400" />;
    }
  };

  const getStatusColor = (status: AgentAction['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'running': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
    }
  };

  const getImpactColor = (impact: AgentAction['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      }
    }
  };

  const handleSlashCommand = (template: PromptTemplate) => {
    setQuery(template.example);
    setShowCommandPalette(false);
    inputRef.current?.focus();
  };

  const executeAgentAction = async (action: AgentAction) => {
    setAgentActions(prev => 
      prev.map(a => a.id === action.id ? { ...a, status: 'running' } : a)
    );

    // Simulate API call
    setTimeout(() => {
      setAgentActions(prev => 
        prev.map(a => a.id === action.id ? { ...a, status: 'completed' } : a)
      );
    }, 2000);
  };

  const sendQuery = async (isApproved: boolean = false, callbackId?: string) => {
    if (!query.trim() && !callbackId) return;

    // Add to recent prompts
    if (query.trim() && !recentPrompts.includes(query.trim())) {
      setRecentPrompts(prev => [query.trim(), ...prev.slice(0, 4)]);
    }

    setLoading(true);
    setResponse(null);
    setGraphData(null);
    setStreamingResponse('');

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          query,
          isApproved,
          approvalCallbackId: callbackId,
          timeFilter,
          selectedCampaign
        }),
      });

      const data: CopilotResponse = await res.json();
      if (res.ok) {
        if (data.requiresHumanApproval) {
          setApprovalDetails({ actionToApprove: data.actionToApprove!, approvalCallbackId: data.approvalCallbackId! });
          setShowApprovalDialog(true);
        } else {
          setResponse(data.response || null);
          setGraphData(data.graphData || null);
          setQuery('');
        }
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to send query:', error);
      setResponse('Failed to connect to the automation service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySubmit = () => {
    sendQuery();
  };

  const handleQuickAction = (actionQuery: string) => {
    setQuery(actionQuery);
    sendQuery(false, undefined);
  };

  const handleApproval = (approved: boolean) => {
    setShowApprovalDialog(false);
    if (approvalDetails) {
      sendQuery(approved, approvalDetails.approvalCallbackId);
      setApprovalDetails(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Netflix-inspired Header with Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 netflix-glass rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-2xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold netflix-text-gradient">Maya Automation Hub</h2>
            <p className="text-[#cccccc]">AI-powered campaign management and insights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32 netflix-input">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#262626] border-[#404040]">
              <SelectItem value="24h" className="text-white hover:bg-[#333333]">Last 24h</SelectItem>
              <SelectItem value="7d" className="text-white hover:bg-[#333333]">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-white hover:bg-[#333333]">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-white hover:bg-[#333333]">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48 netflix-input">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#262626] border-[#404040]">
              <SelectItem value="all" className="text-white hover:bg-[#333333]">All Campaigns</SelectItem>
              <SelectItem value="google-ads" className="text-white hover:bg-[#333333]">Google Ads</SelectItem>
              <SelectItem value="meta-ads" className="text-white hover:bg-[#333333]">Meta Ads</SelectItem>
              <SelectItem value="youtube-ads" className="text-white hover:bg-[#333333]">YouTube Ads</SelectItem>
              <SelectItem value="tiktok-ads" className="text-white hover:bg-[#333333]">TikTok Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Chat Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#262626] border border-[#404040]">
              <TabsTrigger value="automation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bot className="h-4 w-4 mr-2" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="automation" className="space-y-4">
              <Card className="netflix-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Natural Language Interface
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Input Bar */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          ref={inputRef}
                          placeholder="Tell Maya what you want to automate... (Press Cmd+K for commands)"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleQuerySubmit();
                            }
                            if (e.key === '/') {
                              setShowCommandPalette(true);
                            }
                          }}
                          disabled={loading}
                          className="netflix-input pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCommandPalette(true)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                          >
                            <Command className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleVoiceInput}
                            className={`h-8 w-8 p-0 ${isListening ? 'text-red-400' : 'text-neutral-400'} hover:text-white`}
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        onClick={handleQuerySubmit} 
                        disabled={loading || !query.trim()}
                        className="netflix-btn-primary"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Command Palette */}
                    <AnimatePresence>
                      {showCommandPalette && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-[#262626] border border-[#404040] rounded-lg p-2 z-50"
                        >
                          <div className="text-xs text-[#999999] mb-2 px-2">Quick Commands</div>
                          {promptTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleSlashCommand(template)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-[#333333] text-sm transition-colors duration-200"
                            >
                              <div className="text-primary font-mono">{template.command}</div>
                              <div className="text-[#cccccc] text-xs">{template.description}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Response Area */}
                  {(response || graphData || loading) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="netflix-card"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-medium">Maya's Response</span>
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </div>
                      
                      {response && (
                        <div className="text-[#cccccc] leading-relaxed whitespace-pre-wrap">{response}</div>
                      )}
                      
                      {graphData && (
                        <div className="mt-4">
                          <h4 className="text-lg font-semibold mb-4 text-white">{graphData.title || 'Performance Chart'}</h4>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={graphData.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey={graphData.xKey} stroke="#ccc" />
                                <YAxis stroke="#ccc" />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                                  itemStyle={{ color: '#fff' }} 
                                />
                                <Legend />
                                <Line type="monotone" dataKey={graphData.yKey} stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Smart Suggestions */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { text: "Optimize budget allocation", icon: <TrendingUp className="h-4 w-4" /> },
                      { text: "Pause low performers", icon: <Pause className="h-4 w-4" /> },
                      { text: "Analyze ROAS trends", icon: <BarChart3 className="h-4 w-4" /> },
                      { text: "Set up CPC alerts", icon: <AlertTriangle className="h-4 w-4" /> },
                      { text: "YouTube performance", icon: <Play className="h-4 w-4" /> },
                      { text: "Campaign insights", icon: <Eye className="h-4 w-4" /> },
                    ].map((suggestion, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(suggestion.text)}
                        className="flex items-center gap-2 p-3 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] text-left transition-colors duration-200"
                      >
                        <div className="text-primary">{suggestion.icon}</div>
                        <span className="text-sm text-[#cccccc]">{suggestion.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card className="netflix-card">
                <CardHeader>
                  <CardTitle className="text-white">AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[#999999] text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-[#666666] netflix-loading" />
                    <p>Advanced insights coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="netflix-card">
                <CardHeader>
                  <CardTitle className="text-white">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[#999999] text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#666666] netflix-loading" />
                    <p>Advanced analytics dashboard coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Agent Actions & History */}
        <div className="space-y-6">
          <Card className="netflix-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Agent Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 netflix-scrollbar">
                <div className="space-y-3">
                  {agentActions.map((action) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-[#262626] hover:bg-[#333333] rounded-lg border border-[#404040] transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getActionIcon(action.type)}
                          <span className="text-sm font-medium text-white">{action.title}</span>
                        </div>
                        <Badge className={getStatusColor(action.status)}>
                          {action.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400 mb-2">{action.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-500">Confidence:</span>
                          <span className="text-blue-400">{action.confidence}%</span>
                          <span className={`${getImpactColor(action.impact)}`}>• {action.impact} impact</span>
                        </div>
                        {action.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => executeAgentAction(action)}
                            className="h-6 text-xs netflix-btn-primary"
                          >
                            Execute
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Prompts */}
          {recentPrompts.length > 0 && (
            <Card className="netflix-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(prompt)}
                      className="w-full text-left p-2 bg-[#262626] hover:bg-[#333333] rounded text-sm text-[#cccccc] transition-colors duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Netflix-styled Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#404040]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Action Requires Approval</AlertDialogTitle>
            <AlertDialogDescription className="text-[#cccccc]">
              {approvalDetails?.actionToApprove}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleApproval(false)} className="netflix-btn-secondary">
              Deny
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApproval(true)} className="netflix-btn-primary">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SmartAutomation;
