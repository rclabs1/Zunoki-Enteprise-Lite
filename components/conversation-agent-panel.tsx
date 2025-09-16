"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bot,
  User,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  ArrowRight,
  Brain,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ConversationAgentSelector } from "./conversation-agent-selector";
import { teamService } from "@/lib/api/team-service";
import { AgentKnowledgeTrainer } from "./agent-knowledge-trainer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AgentAssignment {
  id: string;
  conversationId: string;
  agentType: 'ai_agent' | 'human_agent';
  agentId: string;
  agentName: string;
  autoResponseEnabled: boolean;
  assignedAt: string;
  status: 'active' | 'inactive';
}

interface ConversationAgentPanelProps {
  conversationId: string;
  className?: string;
  onAgentResponse?: (response: string) => void;
}

/**
 * Additive Agent Panel - Enhances existing conversation without breaking it
 * Can be dropped into any existing conversation view
 */
export function ConversationAgentPanel({ 
  conversationId, 
  className = "",
  onAgentResponse 
}: ConversationAgentPanelProps) {
  const [currentAssignment, setCurrentAssignment] = useState<AgentAssignment | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoResponse, setAutoResponse] = useState(false);
  const [teamAgents, setTeamAgents] = useState<any[]>([]);
  const [loadingTeamAgents, setLoadingTeamAgents] = useState(true);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedAgentForTraining, setSelectedAgentForTraining] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Load current agent assignment
  useEffect(() => {
    if (!user || !conversationId) return;
    
    loadCurrentAssignment();
    
    // Load team agents only when userProfile is available
    if (userProfile?.uid) {
      loadTeamAgents();
    }
  }, [user, userProfile, conversationId]);

  const loadTeamAgents = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoadingTeamAgents(true);
      
      // Get all team agents using the API service
      const allTeamAgents = await teamService.getTeamAgents(userProfile.uid);
      setTeamAgents(allTeamAgents);
      
      // Show success message for real-time feedback
      if (allTeamAgents.length > 0) {
        console.log(`🔄 ${allTeamAgents.length} team agents loaded successfully`);
      }
    } catch (error) {
      console.error('Error loading team agents:', error);
      // Set empty array on error to prevent UI breaking
      setTeamAgents([]);
    } finally {
      setLoadingTeamAgents(false);
    }
  };

  const loadCurrentAssignment = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAssignment(data.assignment);
        setAutoResponse(data.assignment?.autoResponseEnabled || false);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle agent assignment
  const handleAgentAssigned = async (assignment: any) => {
    setCurrentAssignment(assignment);
    setAutoResponse(assignment.autoResponseEnabled);
    
    toast({
      title: "Agent Assigned",
      description: `${assignment.agentName} will now handle this conversation.`
    });
  };

  // Toggle auto-response
  const handleAutoResponseToggle = async (enabled: boolean) => {
    if (!user || !currentAssignment) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...currentAssignment,
          autoResponseEnabled: enabled
        })
      });

      if (response.ok) {
        setAutoResponse(enabled);
        toast({
          title: enabled ? "Auto-Response Enabled" : "Auto-Response Disabled",
          description: enabled 
            ? "Agent will automatically respond to new messages"
            : "Agent responses require manual approval"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update auto-response setting",
        variant: "destructive"
      });
    }
  };

  // Unassign agent
  const handleUnassignAgent = async () => {
    if (!user || !currentAssignment) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setCurrentAssignment(null);
        setAutoResponse(false);
        toast({
          title: "Agent Unassigned",
          description: "This conversation is now handled manually."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unassign agent",
        variant: "destructive"
      });
    }
  };

  // Handle quick training (modal)
  const handleQuickTraining = (agent: any) => {
    setSelectedAgentForTraining(agent);
    setShowTrainingModal(true);
  };

  // Handle advanced training (navigate to shell with agent builder module)
  const handleAdvancedTraining = (agent: any) => {
    const url = `/shell?module=agent-builder&agentId=${agent.id}&tab=knowledge&returnTo=conversation`;
    window.location.href = url;
  };

  // Manual refresh team agents
  const handleRefreshTeamAgents = () => {
    if (userProfile?.uid) {
      setLastRefresh(new Date());
      loadTeamAgents();
      toast({
        title: "Refreshing Team Agents",
        description: "Loading latest team members...",
        variant: "default",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading agent info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`border-primary/20 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Agent Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {currentAssignment ? (
            // Agent is assigned
            <div className="space-y-3">
              {/* Current Agent Info */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                {currentAssignment.agentType === 'ai_agent' ? (
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentAssignment.agentName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={currentAssignment.agentType === 'ai_agent' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {currentAssignment.agentType === 'ai_agent' ? 'AI Agent' : 'Human Agent'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Auto-Response Toggle (only for AI agents) */}
              {currentAssignment.agentType === 'ai_agent' && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <Label htmlFor="auto-response" className="text-sm font-medium">
                      Auto-Response
                    </Label>
                  </div>
                  <Switch
                    id="auto-response"
                    checked={autoResponse}
                    onCheckedChange={handleAutoResponseToggle}
                    size="sm"
                  />
                </div>
              )}

              {/* Agent Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAgentSelector(true)}
                    className="flex-1"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Change Agent
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUnassignAgent}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowAgentSelector(true)}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Bot className="h-3 w-3 mr-1" />
                  Add More Agents
                </Button>
              </div>
            </div>
          ) : (
            // No agent assigned
            <div className="text-center space-y-3">
              <div className="p-4 bg-muted/30 rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No agent assigned to this conversation
                </p>
              </div>
              
              <Button 
                onClick={() => setShowAgentSelector(true)}
                size="sm"
                className="w-full"
              >
                <Bot className="h-4 w-4 mr-2" />
                Assign Agent
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Assign an AI or human agent to handle responses
              </p>
            </div>
          )}

          {/* Performance Hint */}
          {currentAssignment && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>
                  {currentAssignment.agentType === 'ai_agent' && autoResponse
                    ? "Agent will auto-respond to new messages"
                    : "Agent responses require manual approval"
                  }
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Agents Section */}
      <Card className={`border-border ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Your Team Agents
              {teamAgents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {teamAgents.length} active
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefreshTeamAgents}
              disabled={loadingTeamAgents}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loadingTeamAgents ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {loadingTeamAgents ? (
            <div className="flex items-center justify-center py-4">
              <Clock className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading team agents...</span>
            </div>
          ) : teamAgents.length > 0 ? (
            <div className="space-y-3">
              {teamAgents.slice(0, 3).map((agent) => (
                <div key={agent.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Bot className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {agent.teamName}
                          </Badge>
                          {agent.specialization && agent.specialization.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {agent.specialization[0]}
                            </Badge>
                          )}
                          {/* Real-time connection status */}
                          <Badge className="text-xs px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Team Member Connected
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Training Buttons - Hybrid Approach */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleQuickTraining(agent)}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Train Agent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdvancedTraining(agent)}
                      className="border-border text-muted-foreground hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Advanced
                    </Button>
                  </div>
                </div>
              ))}
              {teamAgents.length > 3 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    +{teamAgents.length - 3} more agents
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                No team agents yet
              </p>
              <p className="text-xs text-muted-foreground">
                Add agents from the marketplace to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Training Modal */}
      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Train Agent: {selectedAgentForTraining?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAgentForTraining && (
            <AgentKnowledgeTrainer
              agentId={selectedAgentForTraining.id}
              agentName={selectedAgentForTraining.name}
              onKnowledgeUpdate={() => {
                // Refresh team agents or show success message
                toast({
                  title: "Training Updated",
                  description: `${selectedAgentForTraining.name} has been trained successfully.`,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Selector Modal */}
      {showAgentSelector && (
        <ConversationAgentSelector
          conversationId={conversationId}
          currentAssignment={currentAssignment}
          onAgentAssigned={handleAgentAssigned}
          onClose={() => setShowAgentSelector(false)}
        />
      )}
    </>
  );
}