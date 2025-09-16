"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Plus, BookOpen, Zap } from "lucide-react";
import { AgentKnowledgeTrainer } from "./agent-knowledge-trainer";

interface AgentBuilderEnhancerProps {
  agentId: string;
  agentName: string;
  className?: string;
  onUpdate?: () => void;
}

/**
 * Additive enhancement for existing Agent Builder
 * Adds knowledge training capabilities without modifying core builder
 */
export function AgentBuilderEnhancer({ 
  agentId, 
  agentName, 
  className = "",
  onUpdate 
}: AgentBuilderEnhancerProps) {
  const [activeTab, setActiveTab] = useState("knowledge");

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Advanced Training
          <Badge variant="secondary" className="ml-auto">
            Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="knowledge" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Publish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="mt-4">
            <AgentKnowledgeTrainer
              agentId={agentId}
              agentName={agentName}
              onKnowledgeUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Performance analytics coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Marketplace publishing coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}