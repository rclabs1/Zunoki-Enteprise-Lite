"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Settings } from "lucide-react";

interface PromptNodeData {
  label: string;
  config: {
    role?: string;
    template?: string;
    model?: string;
    temperature?: number;
  };
}

export const PromptNode = memo(({ data, selected }: NodeProps<PromptNodeData>) => {
  return (
    <Card className={`min-w-[220px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-purple-500"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-purple-100 rounded">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">AI Processing</p>
          </div>
          <Settings className="h-3 w-3 text-muted-foreground cursor-pointer" />
        </div>
        
        {data.config.template && (
          <div className="bg-muted p-2 rounded text-xs mb-2">
            <p className="truncate" title={data.config.template}>
              {data.config.template.substring(0, 50)}...
            </p>
          </div>
        )}
        
        <div className="flex gap-1 flex-wrap">
          {data.config.model && (
            <Badge variant="outline" className="text-xs">
              {data.config.model}
            </Badge>
          )}
          {data.config.temperature !== undefined && (
            <Badge variant="outline" className="text-xs">
              temp: {data.config.temperature}
            </Badge>
          )}
        </div>
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-purple-500"
        />
      </CardContent>
    </Card>
  );
});

PromptNode.displayName = 'PromptNode';