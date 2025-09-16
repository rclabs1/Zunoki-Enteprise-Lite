"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bot,
  User,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Settings,
  ArrowRight,
  Check,
  AlertCircle,
  Users,
  Brain,
  MessageSquare,
  Target,
  Sparkles,
  ShoppingCart,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { teamManagementService } from "@/lib/team-management-service";
import { CreateHumanAgentDialog } from "@/components/create-human-agent-dialog";

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  specialization: string[];
  status: 'active' | 'inactive' | 'training';
  knowledgeBaseSize: number;
  averageResponseTime: number;
  confidenceScore: number;
  customerSatisfaction: number;
  conversationsHandled: number;
  isOwned: boolean;
  isPublic: boolean;
  price?: number;
  creator?: string;
  lastTrained?: string;
  personality: {
    tone: string;
    style: string;
    empathy: number;
    formality: number;
  };
}

export interface HumanAgent {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  availability: 'available' | 'busy' | 'offline';
  currentConversations: number;
  maxConversations: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  languages: string[];
  workingHours: string;
}

export interface ConversationAssignment {
  conversationId: string;
  agentType: 'ai_agent' | 'human';
  agentId: string;
  agentName: string;
  autoResponseEnabled: boolean;
  assignedAt: string;
}

interface ConversationAgentSelectorProps {
  conversationId: string;
  currentAssignment?: ConversationAssignment;
  onAgentAssigned: (assignment: ConversationAssignment) => void;
  onClose: () => void;
}

export function ConversationAgentSelector({
  conversationId,
  currentAssignment,
  onAgentAssigned,
  onClose
}: ConversationAgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("my_agents");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [humanAgents, setHumanAgents] = useState<HumanAgent[]>([]);
  const [marketplaceAgents, setMarketplaceAgents] = useState<AIAgent[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | HumanAgent | null>(null);
  const [showCreateHumanAgent, setShowCreateHumanAgent] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Load agents
  const loadAgents = useCallback(async () => {
    if (!user) return;

    try {
      const [aiResponse, humanResponse, marketplaceResponse] = await Promise.all([
        fetch('/api/agents/my', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        }),
        fetch('/api/agents/human', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        }),
        fetch('/api/agents/marketplace?type=agents', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        })
      ]);

      // Handle AI Agents response (owned + team agents)
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        console.log('AI Agents loaded:', aiData);
        
        // The /api/agents/my endpoint now returns properly formatted agents
        const safeAiData = Array.isArray(aiData) ? aiData : [];
        setAiAgents(safeAiData);
      } else {
        console.error('Failed to load AI agents:', aiResponse.status, aiResponse.statusText);
        setAiAgents([]);
      }

      // Handle Human Agents response (team members)
      if (humanResponse.ok) {
        const humanData = await humanResponse.json();
        console.log('Human Agents loaded:', humanData);
        
        // The /api/agents/human endpoint returns properly formatted human agents
        const safeHumanData = Array.isArray(humanData) ? humanData : [];
        setHumanAgents(safeHumanData);
      } else {
        console.error('Failed to load human agents:', humanResponse.status, humanResponse.statusText);
        setHumanAgents([]);
      }

      // Handle Marketplace response
      if (marketplaceResponse.ok) {
        const marketplaceData = await marketplaceResponse.json();
        console.log('Marketplace agents loaded:', marketplaceData);
        
        // Extract agents array from marketplace response
        const agents = marketplaceData.agents || [];
        const formattedMarketplaceAgents = Array.isArray(agents) ? agents.map(agent => ({
          id: agent.id,
          name: agent.name || 'Unnamed Agent',
          description: agent.description || 'No description',
          category: agent.category || 'General',
          capabilities: agent.capabilities || [],
          specialization: agent.specialization || [],
          status: agent.status || 'active',
          knowledgeBaseSize: 0,
          averageResponseTime: agent.avgResponseTimeSeconds || 0,
          confidenceScore: 85,
          customerSatisfaction: agent.marketplaceRating || 0,
          conversationsHandled: agent.conversationsHandled || 0,
          isOwned: false,
          isPublic: true,
          price: agent.marketplacePrice || 0,
          creator: agent.createdBy || 'Community',
          personality: {
            tone: 'professional',
            style: 'helpful',
            empathy: 7,
            formality: 6
          }
        })) : [];
        setMarketplaceAgents(formattedMarketplaceAgents);
      } else {
        console.error('Failed to load marketplace agents:', marketplaceResponse.status, marketplaceResponse.statusText);
        setMarketplaceAgents([]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      // Ensure all states are safe arrays even if there's an error
      setAiAgents([]);
      setHumanAgents([]);
      setMarketplaceAgents([]);
    }
  }, [user]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Assign agent to conversation
  const handleAssignAgent = async (agent: AIAgent | HumanAgent, agentType: 'ai_agent' | 'human') => {
    if (!user) return;

    setIsAssigning(true);
    try {
      const assignment: ConversationAssignment = {
        conversationId,
        agentType,
        agentId: agent.id,
        agentName: agent.name,
        autoResponseEnabled,
        assignedAt: new Date().toISOString()
      };

      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(assignment)
      });

      if (response.ok) {
        toast({
          title: "Agent Assigned",
          description: `${agent.name} has been assigned to handle this conversation.`
        });

        onAgentAssigned(assignment);
        setIsOpen(false);
        onClose();
      } else {
        throw new Error('Failed to assign agent');
      }
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Purchase marketplace agent
  const handlePurchaseAgent = async (agent: AIAgent) => {
    if (!user) return;

    try {
      const response = await fetch('/api/agents/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ agentId: agent.id })
      });

      if (response.ok) {
        toast({
          title: "Agent Purchased",
          description: `${agent.name} has been added to your agents.`
        });

        loadAgents(); // Reload to show in "My Agents"
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter agents
  const filterAgents = (agents: AIAgent[]) => {
    // Defensive programming: ensure agents is an array
    if (!Array.isArray(agents)) {
      console.warn('filterAgents received non-array input:', agents);
      return [];
    }
    
    return agents.filter(agent => {
      // Ensure agent has required properties
      if (!agent || !agent.name) {
        return false;
      }
      
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (agent.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || (agent.category || '').toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  // Get performance badge color
  const getPerformanceBadge = (score: number) => {
    if (score >= 4.5) return { variant: "default" as const, label: "Excellent", color: "bg-green-500" };
    if (score >= 4.0) return { variant: "secondary" as const, label: "Great", color: "bg-blue-500" };
    if (score >= 3.5) return { variant: "outline" as const, label: "Good", color: "bg-yellow-500" };
    return { variant: "destructive" as const, label: "Needs Training", color: "bg-red-500" };
  };

  const categories = ["all", "support", "sales", "technical", "marketing", "general"];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Agent to Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {currentAssignment && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentAssignment.agentType === 'ai_agent' ? (
                      <Bot className="h-5 w-5 text-blue-600" />
                    ) : (
                      <User className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">{currentAssignment.agentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Currently assigned • {currentAssignment.agentType === 'ai_agent' ? 'AI Agent' : 'Human Agent'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-Response Setting */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="auto-response" className="font-medium">
                  Enable Auto-Response
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow assigned agent to automatically respond to customer messages
                </p>
              </div>
            </div>
            <Switch
              id="auto-response"
              checked={autoResponseEnabled}
              onCheckedChange={setAutoResponseEnabled}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my_agents" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                My AI Agents
              </TabsTrigger>
              <TabsTrigger value="human_agents" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Human Agents
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Marketplace
              </TabsTrigger>
            </TabsList>

            {/* My AI Agents Tab */}
            <TabsContent value="my_agents" className="space-y-4">
              {filterAgents(aiAgents).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No AI Agents Available</h3>
                    <p className="text-muted-foreground mb-4">
                      {aiAgents.length === 0 
                        ? "Create your first AI agent or add agents from the marketplace to your team"
                        : "No agents match your current search criteria"
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setActiveTab("marketplace")}>
                        Browse Marketplace
                      </Button>
                      <Button variant="outline" onClick={() => window.open('/agent-builder', '_blank')}>
                        Create Agent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterAgents(aiAgents).map((agent) => {
                    const performance = getPerformanceBadge(agent.customerSatisfaction);
                    return (
                      <Card key={agent.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Bot className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{agent.name}</h4>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {agent.category}
                                  </Badge>
                                  {agent.isTeamAgent && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      <Users className="h-3 w-3 mr-1" />
                                      {agent.teamName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge {...performance} className="text-xs">
                              {performance.label}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {agent.description}
                          </p>

                          {/* Agent Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3" />
                              {agent.knowledgeBaseSize} vectors
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {agent.conversationsHandled} chats
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {agent.averageResponseTime}s avg
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {agent.customerSatisfaction}/5 rating
                            </div>
                          </div>

                          {/* Specializations */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {agent.specialization.slice(0, 3).map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {agent.specialization.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{agent.specialization.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <Button
                            onClick={() => handleAssignAgent(agent, 'ai_agent')}
                            disabled={isAssigning || agent.status !== 'active'}
                            className="w-full"
                            size="sm"
                          >
                            {isAssigning ? (
                              "Assigning..."
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Assign Agent
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Human Agents Tab */}
            <TabsContent value="human_agents" className="space-y-4">
              {humanAgents.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Human Agents Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Create human agents with platform-specific contact information or add team members to enable human agent assignment
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setShowCreateHumanAgent(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Human Agent
                      </Button>
                      <Button variant="outline" onClick={() => window.open('/settings?tab=teams', '_blank')}>
                        Manage Teams
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {humanAgents.length} human agent{humanAgents.length !== 1 ? 's' : ''} available
                    </p>
                    <Button size="sm" onClick={() => setShowCreateHumanAgent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Human Agent
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {humanAgents.map((agent) => (
                    <Card key={agent.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{agent.name}</h4>
                              <p className="text-xs text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              agent.availability === 'available' ? 'default' :
                              agent.availability === 'busy' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {agent.availability}
                          </Badge>
                        </div>

                        {/* Agent Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {agent.currentConversations}/{agent.maxConversations}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {agent.averageResponseTime}s avg
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {agent.customerSatisfaction}/5 rating
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {agent.languages.join(', ')}
                          </div>
                        </div>

                        {/* Specializations */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.specialization.slice(0, 3).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <Button
                          onClick={() => handleAssignAgent(agent, 'human')}
                          disabled={isAssigning || agent.availability !== 'available'}
                          className="w-full"
                          size="sm"
                        >
                          {isAssigning ? (
                            "Assigning..."
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Assign Agent
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-4">
              {filterAgents(marketplaceAgents).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Marketplace Agents Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {marketplaceAgents.length === 0 
                        ? "No agents are currently available in the marketplace"
                        : "No agents match your search criteria"
                      }
                    </p>
                    <Button variant="outline" onClick={() => window.open('/marketplace', '_blank')}>
                      Open Full Marketplace
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterAgents(marketplaceAgents).map((agent) => {
                    const performance = getPerformanceBadge(agent.customerSatisfaction);
                    return (
                      <Card key={agent.id} className="hover:shadow-md transition-shadow border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{agent.name}</h4>
                                <p className="text-xs text-muted-foreground">by {agent.creator}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge {...performance} className="text-xs">
                                {performance.label}
                              </Badge>
                              {agent.price && (
                                <Badge variant="outline" className="text-xs">
                                  ${agent.price}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {agent.description}
                          </p>

                          {/* Specializations */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {agent.specialization.slice(0, 3).map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handlePurchaseAgent(agent)}
                              size="sm"
                              className="flex-1"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {agent.price ? `Buy $${agent.price}` : 'Get Free'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Create Human Agent Dialog */}
      <CreateHumanAgentDialog
        isOpen={showCreateHumanAgent}
        onClose={() => setShowCreateHumanAgent(false)}
        onAgentCreated={loadAgents}
      />
    </Dialog>
  );
}