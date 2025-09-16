"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Settings } from "lucide-react";

interface AgentIdentityNodeData {
  label: string;
  config: {
    name?: string;
    description?: string;
    category?: string;
    personality?: {
      tone: string;
      style: string;
      empathy: number;
      formality: number;
    };
    tags?: string[];
  };
}

export const AgentIdentityNode = memo(({ data, selected }: NodeProps<AgentIdentityNodeData>) => {
  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-purple-900">
              {data.config.name || 'New Agent'}
            </h4>
            <p className="text-sm text-purple-600">{data.label}</p>
          </div>
          <Settings className="h-4 w-4 text-purple-400" />
        </div>
        
        {data.config.description && (
          <div className="mb-3 p-2 bg-white/50 rounded text-sm text-purple-800">
            {data.config.description.length > 80 
              ? `${data.config.description.substring(0, 80)}...`
              : data.config.description
            }
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mb-3">
          {data.config.category && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              {data.config.category}
            </Badge>
          )}
          {data.config.personality?.tone && (
            <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
              {data.config.personality.tone}
            </Badge>
          )}
        </div>

        {data.config.personality && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-600">Empathy:</span>
              <span className="font-mono text-purple-800">{data.config.personality.empathy}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Formality:</span>
              <span className="font-mono text-purple-800">{data.config.personality.formality}/10</span>
            </div>
          </div>
        )}
        
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-purple-500 border-2 border-white"
        />
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-purple-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
});

AgentIdentityNode.displayName = 'AgentIdentityNode';