"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Save, 
  Play, 
  Upload,
  Download,
  TestTube,
  Sparkles,
  Workflow,
  Zap,
  FileText,
  Settings,
  Globe
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { useSearchParams } from "next/navigation"
import { AgentTestPanel } from "@/components/agent-test-panel"
import { EnhancedVisualAgentBuilder } from "@/components/enhanced-visual-agent-builder"
import { AgentBuilderEnhancer } from "@/components/agent-builder-enhancer"

// Comprehensive AgentConfig interface
interface AgentConfig {
  id?: string
  name: string
  description: string
  category: string
  
  // AI Configuration
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  
  // Capabilities & Features
  capabilities: string[]
  languages: string[]
  specialization: string[]
  
  // Voice Configuration
  voiceConfig: {
    enabled: boolean
    voice: string
    language: string
    speed: number
    pitch: number
  }
  
  // Knowledge Base
  knowledgeBase: {
    sources: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      vectorCount: number;
    }>;
    totalVectors: number;
    lastTrainingDate?: string;
  }
  
  // Personality
  personality: {
    tone: string
    style: string
    empathy: number
    formality: number
  }
  
  // Integration & Publishing
  integrations: string[]
  workflows: Array<{
    id: string
    name: string
    trigger: string
    actions: any[]
  }>
  
  // Marketplace
  isPublic: boolean
  marketplacePrice?: number
  marketplaceCategory?: string
  tags?: string[]
  
  // Visual Workflow
  visualWorkflow?: {
    nodes: any[]
    edges: any[]
    lastModified: string
  }
}

const defaultAgentConfig: AgentConfig = {
  name: "New Agent",
  description: "A helpful AI assistant",
  category: "General",
  model: "gpt-oss-120b",
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: "You are a helpful AI assistant.",
  capabilities: [],
  languages: ["English"],
  specialization: [],
  voiceConfig: {
    enabled: false,
    voice: "alloy",
    language: "en-US",
    speed: 1.0,
    pitch: 1.0
  },
  knowledgeBase: {
    sources: [],
    totalVectors: 0
  },
  personality: {
    tone: "friendly",
    style: "professional", 
    empathy: 7,
    formality: 5
  },
  integrations: [],
  workflows: [],
  isPublic: false
}

export default function VisualAgentBuilderPage() {
  useTrackPageView("Zunoki. Agent Builder")
  
  // Redirect to shell if accessed directly
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/agent-builder') {
      window.location.replace('/shell?module=agent-builder');
    }
  }, []);

  const [agentConfig, setAgentConfig] = useState<AgentConfig>(defaultAgentConfig)
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setAgentConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const saveAgent = async () => {
    if (!userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your agent.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await userProfile.getIdToken()}`
        },
        body: JSON.stringify({
          ...agentConfig,
          userId: userProfile.uid,
          lastModified: new Date().toISOString()
        })
      });

      if (response.ok) {
        const savedAgent = await response.json();
        updateConfig({ id: savedAgent.id });
        
        toast({
          title: "Agent Saved",
          description: "Your agent has been saved successfully."
        });
      } else {
        throw new Error('Failed to save agent');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const publishToMarketplace = async () => {
    if (!agentConfig.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please give your agent a name before publishing.",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // First save the agent
      await saveAgent();
      
      // Then publish to marketplace
      const response = await fetch('/api/marketplace/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await userProfile.getIdToken()}`
        },
        body: JSON.stringify({
          agentId: agentConfig.id,
          isPublic: true,
          price: agentConfig.marketplacePrice || 0,
          category: agentConfig.marketplaceCategory || agentConfig.category,
          tags: agentConfig.tags || []
        })
      });

      if (response.ok) {
        updateConfig({ isPublic: true });
        toast({
          title: "Published Successfully",
          description: "Your agent is now available in the marketplace!"
        });
      } else {
        throw new Error('Failed to publish agent');
      }
    } catch (error) {
      console.error('Error publishing agent:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const exportWorkflow = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        agent: agentConfig,
        exportedAt: new Date().toISOString(),
        version: "1.0.0"
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${agentConfig.name.toLowerCase().replace(/\s+/g, '-')}-agent.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Export Complete",
        description: "Agent workflow has been exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Failed to export workflow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Workflow className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Zunoki. Agent Builder</h1>
                <p className="text-muted-foreground text-sm">
                  Design, configure, and deploy AI agents through visual workflows
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Agent Status */}
              <div className="hidden md:flex items-center gap-3 mr-4">
                <Badge variant="outline" className="gap-1">
                  <Bot className="h-3 w-3" />
                  {agentConfig.name || "Unnamed Agent"}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {agentConfig.model}
                </Badge>
                {agentConfig.knowledgeBase?.totalVectors > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {agentConfig.knowledgeBase.totalVectors} vectors
                  </Badge>
                )}
                {agentConfig.integrations?.length > 0 && (
                  <Badge variant="default" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {agentConfig.integrations.length} integrations
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTestPanelOpen(true)}
                className="border-border hover:bg-accent"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>

              <Button
                variant="outline" 
                size="sm"
                onClick={exportWorkflow}
                disabled={isExporting}
                className="border-border hover:bg-accent"
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </div>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
              
              <Button
                onClick={saveAgent}
                disabled={isSaving}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>

              <Button
                onClick={publishToMarketplace}
                disabled={isPublishing}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-100"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Builder */}
      <div className="flex-1">
        <EnhancedVisualAgentBuilder 
          agentConfig={agentConfig}
          onConfigChange={updateConfig}
        />
      </div>

      {/* Test Panel */}
      <AgentTestPanel
        isOpen={isTestPanelOpen}
        onClose={() => setIsTestPanelOpen(false)}
        agentConfig={agentConfig}
      />
    </div>
  )
}