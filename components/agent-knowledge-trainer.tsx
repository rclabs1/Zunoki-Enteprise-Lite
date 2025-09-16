"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  FileText,
  Globe,
  Image,
  Video,
  Mic,
  File,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Brain,
  Zap,
  RefreshCw,
  Download,
  Eye,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface KnowledgeSource {
  id?: string;
  sourceType: 'pdf' | 'url' | 'text' | 'image' | 'video' | 'audio' | 'document';
  sourceName: string;
  sourceUrl?: string;
  content?: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  vectorCount?: number;
  createdAt?: string;
  errorMessage?: string;
}

interface AgentKnowledgeTrainerProps {
  agentId: string;
  agentName: string;
  onKnowledgeUpdate?: () => void;
}

export function AgentKnowledgeTrainer({ 
  agentId, 
  agentName, 
  onKnowledgeUpdate 
}: AgentKnowledgeTrainerProps) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [activeTab, setActiveTab] = useState("sources");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState<KnowledgeSource | null>(null);
  
  // Test agent state
  const [testMessages, setTestMessages] = useState<Array<{role: 'user' | 'agent', content: string, timestamp: Date}>>([]);
  const [testInput, setTestInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  // Add source form state
  const [newSource, setNewSource] = useState<Partial<KnowledgeSource>>({
    sourceType: 'text',
    sourceName: '',
    sourceUrl: '',
    content: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Load existing knowledge sources
  const loadKnowledgeSources = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const sources = await response.json();
        setKnowledgeSources(sources);
      }
    } catch (error) {
      console.error('Error loading knowledge sources:', error);
    }
  }, [agentId, user]);

  React.useEffect(() => {
    loadKnowledgeSources();
  }, [loadKnowledgeSources]);

  // Add new knowledge source
  const handleAddSource = async () => {
    if (!user || !newSource.sourceName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your knowledge source.",
        variant: "destructive"
      });
      return;
    }

    if (newSource.sourceType === 'text' && !newSource.content?.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide text content for your knowledge source.",
        variant: "destructive"
      });
      return;
    }

    if (newSource.sourceType === 'url' && !newSource.sourceUrl?.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a valid URL for your knowledge source.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...newSource,
          agentId,
          userId: user.uid
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Knowledge Source Added",
          description: `${newSource.sourceName} is being processed for training.`
        });

        // Reset form
        setNewSource({
          sourceType: 'text',
          sourceName: '',
          sourceUrl: '',
          content: ''
        });
        setShowAddModal(false);

        // Reload sources
        loadKnowledgeSources();
        onKnowledgeUpdate?.();
      } else {
        throw new Error('Failed to add knowledge source');
      }
    } catch (error) {
      toast({
        title: "Error Adding Source",
        description: "Failed to add knowledge source. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Delete knowledge source
  const handleDeleteSource = async (sourceId: string) => {
    if (!user) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this knowledge source? This action cannot be undone.')) {
      return;
    }

    try {
      console.log(`Deleting knowledge source: ${sourceId}`);
      
      const response = await fetch(`/api/agents/${agentId}/knowledge/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        toast({
          title: "Knowledge Source Deleted",
          description: "The knowledge source has been removed from your agent."
        });

        // Reload knowledge sources
        await loadKnowledgeSources();
        onKnowledgeUpdate?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete knowledge source');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error Deleting Source",
        description: error instanceof Error ? error.message : "Failed to delete knowledge source. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Start training process
  const handleStartTraining = async () => {
    if (!user) return;

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const response = await fetch(`/api/agents/${agentId}/train`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        // Simulate training progress
        const progressInterval = setInterval(() => {
          setTrainingProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setIsTraining(false);
              
              toast({
                title: "Training Complete",
                description: `${agentName} has been successfully trained with your knowledge sources.`
              });
              
              onKnowledgeUpdate?.();
              return 100;
            }
            return prev + 10;
          });
        }, 1000);
      } else {
        throw new Error('Failed to start training');
      }
    } catch (error) {
      setIsTraining(false);
      toast({
        title: "Training Failed",
        description: "Failed to start agent training. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Preview knowledge source content
  const handlePreviewSource = (source: KnowledgeSource) => {
    setPreviewContent(source);
    setShowPreviewModal(true);
  };

  // Test agent with a message
  const handleTestAgent = async () => {
    if (!testInput.trim() || !user) return;

    const userMessage = {
      role: 'user' as const,
      content: testInput.trim(),
      timestamp: new Date()
    };

    setTestMessages(prev => [...prev, userMessage]);
    setTestInput('');
    setIsTesting(true);

    try {
      const response = await fetch(`/api/agents/${agentId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      });

      if (response.ok) {
        const result = await response.json();
        const agentMessage = {
          role: 'agent' as const,
          content: result.response || 'I apologize, but I could not generate a response.',
          timestamp: new Date()
        };
        setTestMessages(prev => [...prev, agentMessage]);
      } else {
        const agentMessage = {
          role: 'agent' as const,
          content: 'Sorry, I encountered an error while processing your message.',
          timestamp: new Date()
        };
        setTestMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Test error:', error);
      const agentMessage = {
        role: 'agent' as const,
        content: 'Sorry, I encountered a technical error.',
        timestamp: new Date()
      };
      setTestMessages(prev => [...prev, agentMessage]);
    } finally {
      setIsTesting(false);
    }
  };

  // Get icon for source type
  const getSourceTypeIcon = (type: KnowledgeSource['sourceType']) => {
    switch (type) {
      case 'text': return FileText;
      case 'url': return Globe;
      case 'pdf': return File;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Mic;
      case 'document': return File;
      default: return FileText;
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: KnowledgeSource['processingStatus']) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50 border-green-200' };
      case 'failed':
        return { color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-50 border-red-200' };
      case 'processing':
        return { color: 'text-blue-600', icon: RefreshCw, bg: 'bg-blue-50 border-blue-200' };
      default:
        return { color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-50 border-yellow-200' };
    }
  };

  const totalVectors = knowledgeSources.reduce((sum, source) => sum + (source.vectorCount || 0), 0);
  const completedSources = knowledgeSources.filter(s => s.processingStatus === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Knowledge Training for {agentName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Train your agent with documents, URLs, and other content for context-aware responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Add Knowledge
          </Button>
          {knowledgeSources.length > 0 && (
            <Button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="flex items-center gap-2"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Start Training
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Training Progress */}
      {isTraining && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Training Progress</span>
              <span className="text-sm text-muted-foreground">{trainingProgress}%</span>
            </div>
            <Progress value={trainingProgress} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Processing knowledge sources and generating embeddings...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{knowledgeSources.length}</p>
                <p className="text-sm text-muted-foreground">Knowledge Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSources}</p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVectors}</p>
                <p className="text-sm text-muted-foreground">Knowledge Vectors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Knowledge Sources</TabsTrigger>
          <TabsTrigger value="training">Training History</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
          <TabsTrigger value="test">Test Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          {knowledgeSources.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Knowledge Sources</h3>
                <p className="text-muted-foreground mb-4">
                  Add documents, URLs, or other content to train your agent
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add First Source
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeSources.map((source) => {
                const IconComponent = getSourceTypeIcon(source.sourceType || 'text');
                const status = getStatusDisplay(source.processingStatus || 'pending');
                const StatusIcon = status.icon;

                return (
                  <Card key={source.id} className={`hover:shadow-md transition-shadow ${status.bg}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {source.sourceType?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`h-4 w-4 ${status.color} ${
                            source.processingStatus === 'processing' ? 'animate-spin' : ''
                          }`} />
                        </div>
                      </div>

                      <h4 className="font-medium text-sm mb-2 line-clamp-2">
                        {source.sourceName || 'Untitled Source'}
                      </h4>

                      {source.vectorCount && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {source.vectorCount} knowledge vectors
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreviewSource(source)}
                            className="h-7 px-2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSource(source.id!)}
                          className="h-7 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Training history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Agent performance analytics will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Test Your Agent
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Chat with your trained agent to test its responses and knowledge
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="border rounded-lg h-96 overflow-y-auto p-4 space-y-3">
                {testMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation to test your agent</p>
                      <p className="text-xs mt-1">Try: "I'm interested in your platform"</p>
                    </div>
                  </div>
                ) : (
                  testMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isTesting && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Agent is thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your test message..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isTesting && handleTestAgent()}
                  disabled={isTesting}
                />
                <Button 
                  onClick={handleTestAgent}
                  disabled={!testInput.trim() || isTesting}
                  size="sm"
                >
                  Send
                </Button>
              </div>

              {/* Quick Test Prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick test prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "I'm interested in your platform",
                    "What does your pricing look like?",
                    "We need help with customer service",
                    "Can you schedule a demo?"
                  ].map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestInput(prompt)}
                      disabled={isTesting}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Knowledge Source Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Knowledge Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceType">Source Type</Label>
                <Select
                  value={newSource.sourceType}
                  onValueChange={(value: any) => setNewSource(prev => ({ ...prev, sourceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Content</SelectItem>
                    <SelectItem value="url">Website URL</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image (OCR)</SelectItem>
                    <SelectItem value="audio">Audio (Transcription)</SelectItem>
                    <SelectItem value="video">Video (Transcription)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  placeholder="e.g., Company FAQ, Product Manual"
                  value={newSource.sourceName || ''}
                  onChange={(e) => setNewSource(prev => ({ ...prev, sourceName: e.target.value }))}
                />
              </div>
            </div>

            {newSource.sourceType === 'url' && (
              <div>
                <Label htmlFor="sourceUrl">Website URL</Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  placeholder="https://example.com/documentation"
                  value={newSource.sourceUrl || ''}
                  onChange={(e) => setNewSource(prev => ({ ...prev, sourceUrl: e.target.value }))}
                />
              </div>
            )}

            {newSource.sourceType === 'text' && (
              <div>
                <Label htmlFor="content">Text Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your text content here..."
                  rows={8}
                  value={newSource.content || ''}
                  onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            )}

            {['pdf', 'image', 'audio', 'video'].includes(newSource.sourceType!) && (
              <div>
                <Label htmlFor="sourceUrl">File URL or Upload Path</Label>
                <Input
                  id="sourceUrl"
                  placeholder="File path or URL to your media"
                  value={newSource.sourceUrl || ''}
                  onChange={(e) => setNewSource(prev => ({ ...prev, sourceUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your file to a cloud storage service and paste the public URL here
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSource}>
                Add Source
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewContent?.sourceName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewContent?.content && (
              <div>
                <Label>Content Preview</Label>
                <div className="mt-2 p-3 bg-muted rounded-md max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {previewContent.content.substring(0, 1000)}
                    {previewContent.content.length > 1000 && '...'}
                  </pre>
                </div>
              </div>
            )}
            
            {previewContent?.sourceUrl && (
              <div>
                <Label>Source URL</Label>
                <p className="text-sm text-muted-foreground mt-1">{previewContent.sourceUrl}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Processing Status</Label>
                <p className="mt-1">{previewContent?.processingStatus || 'Unknown'}</p>
              </div>
              <div>
                <Label>Knowledge Vectors</Label>
                <p className="mt-1">{previewContent?.vectorCount || 0} vectors</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}