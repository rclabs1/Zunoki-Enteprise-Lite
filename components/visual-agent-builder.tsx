"use client"

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  MessageSquare, 
  Brain, 
  Zap, 
  Settings, 
  Database,
  Workflow,
  Play,
  Save
} from "lucide-react";

// Custom Node Components
import { TriggerNode } from './visual-nodes/trigger-node';
import { PromptNode } from './visual-nodes/prompt-node';
import { MemoryNode } from './visual-nodes/memory-node';
import { ToolNode } from './visual-nodes/tool-node';
import { ResponseNode } from './visual-nodes/response-node';
import { ConditionNode } from './visual-nodes/condition-node';

// Node types for React Flow (defined outside component to prevent re-creation)
const nodeTypes = {
  trigger: TriggerNode,
  prompt: PromptNode,
  memory: MemoryNode,
  tool: ToolNode,
  response: ResponseNode,
  condition: ConditionNode,
};

interface VisualAgentBuilderProps {
  agentConfig: any;
  onConfigChange: (updates: any) => void;
}

// Initial nodes based on agent config
const createInitialNodes = (agentConfig: any): Node[] => [
  {
    id: 'start',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      label: 'User Input',
      config: {
        platforms: ['whatsapp', 'slack', 'email']
      }
    }
  },
  {
    id: 'identity',
    type: 'prompt',
    position: { x: 100, y: 250 },
    data: {
      label: 'Agent Identity',
      config: {
        role: 'system',
        template: `You are ${agentConfig.name}. ${agentConfig.description}
        
Personality: ${agentConfig.personality?.tone} and ${agentConfig.personality?.style}
Capabilities: ${agentConfig.capabilities?.join(', ')}`
      }
    }
  },
  {
    id: 'memory',
    type: 'memory',
    position: { x: 400, y: 200 },
    data: {
      label: 'Conversation Memory',
      config: {
        type: 'conversation',
        scope: 'user_session',
        maxEntries: 10
      }
    }
  },
  {
    id: 'knowledge',
    type: 'tool',
    position: { x: 400, y: 350 },
    data: {
      label: 'Knowledge Search',
      config: {
        tool: 'rag_search',
        vectorCount: agentConfig.knowledgeBase?.totalVectors || 0
      }
    }
  },
  {
    id: 'response',
    type: 'response',
    position: { x: 700, y: 250 },
    data: {
      label: 'Final Response',
      config: {
        platforms: agentConfig.integrations || [],
        voice: agentConfig.voice
      }
    }
  }
];

// Initial edges connecting the nodes
const createInitialEdges = (): Edge[] => [
  {
    id: 'e1',
    source: 'start',
    target: 'identity',
    animated: true,
  },
  {
    id: 'e2',
    source: 'identity',
    target: 'memory',
    animated: true,
  },
  {
    id: 'e3',
    source: 'memory',
    target: 'knowledge',
    animated: true,
  },
  {
    id: 'e4',
    source: 'knowledge',
    target: 'response',
    animated: true,
  }
];

export function VisualAgentBuilder({ agentConfig, onConfigChange }: VisualAgentBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes(agentConfig));
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Node palette items
  const nodeCategories = [
    {
      title: "Triggers",
      icon: <Zap className="h-4 w-4" />,
      nodes: [
        { type: 'trigger', label: 'User Input', icon: <MessageSquare className="h-3 w-3" /> },
        { type: 'trigger', label: 'Webhook', icon: <Zap className="h-3 w-3" /> },
        { type: 'trigger', label: 'Schedule', icon: <Settings className="h-3 w-3" /> }
      ]
    },
    {
      title: "AI Processing",
      icon: <Brain className="h-4 w-4" />,
      nodes: [
        { type: 'prompt', label: 'Prompt', icon: <Bot className="h-3 w-3" /> },
        { type: 'memory', label: 'Memory', icon: <Database className="h-3 w-3" /> },
        { type: 'condition', label: 'Condition', icon: <Workflow className="h-3 w-3" /> }
      ]
    },
    {
      title: "Tools & Actions",
      icon: <Settings className="h-4 w-4" />,
      nodes: [
        { type: 'tool', label: 'Web Search', icon: <Zap className="h-3 w-3" /> },
        { type: 'tool', label: 'Knowledge', icon: <Database className="h-3 w-3" /> },
        { type: 'response', label: 'Response', icon: <MessageSquare className="h-3 w-3" /> }
      ]
    }
  ];

  const handleTestWorkflow = async () => {
    setIsExecuting(true);
    // Simulate workflow execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExecuting(false);
  };

  const handleSaveWorkflow = () => {
    // Convert visual workflow back to agent config
    const workflowConfig = {
      nodes,
      edges,
      lastModified: new Date().toISOString()
    };
    
    onConfigChange({
      visualWorkflow: workflowConfig
    });
  };

  return (
    <div className="h-[800px] w-full flex bg-background">
      {/* Node Palette */}
      <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          Node Palette
        </h3>
        
        {nodeCategories.map((category) => (
          <div key={category.title} className="mb-4">
            <h4 className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-1">
              {category.icon}
              {category.title}
            </h4>
            <div className="space-y-1">
              {category.nodes.map((node, index) => (
                <div
                  key={`${node.type}-${index}`}
                  className="p-2 rounded border border-border bg-background hover:bg-accent cursor-grab text-xs flex items-center gap-2"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', node.type);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  {node.icon}
                  {node.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            className="opacity-50"
          />
          <Controls className="bg-card border border-border" />
          <MiniMap 
            className="bg-card border border-border"
            nodeColor="#8b5cf6"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>

        {/* Canvas Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestWorkflow}
            disabled={isExecuting}
            className="bg-card"
          >
            {isExecuting ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Testing...
              </div>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Test Flow
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveWorkflow}
            className="bg-primary"
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-card border-l border-border p-4">
          <h3 className="font-semibold mb-4">Node Properties</h3>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Badge variant="secondary">{selectedNode.type}</Badge>
                  <h4 className="font-medium mt-2">{selectedNode.data.label}</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Node ID</label>
                    <p className="text-sm font-mono">{selectedNode.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Position</label>
                    <p className="text-sm font-mono">
                      x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}
                    </p>
                  </div>
                  
                  {selectedNode.data.config && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Configuration</label>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(selectedNode.data.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Status */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Execution Status</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  Ready
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Last executed: Never
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}