"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Brain } from "lucide-react";

interface MemoryNodeData {
  label: string;
  config: {
    type?: string;
    scope?: string;
    maxEntries?: number;
  };
}

export const MemoryNode = memo(({ data, selected }: NodeProps<MemoryNodeData>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-green-500"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-green-100 rounded">
            <Database className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">Memory Store</p>
          </div>
        </div>
        
        <div className="space-y-1">
          {data.config.type && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="secondary" className="text-xs">
                {data.config.type}
              </Badge>
            </div>
          )}
          
          {data.config.scope && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scope:</span>
              <Badge variant="outline" className="text-xs">
                {data.config.scope}
              </Badge>
            </div>
          )}
          
          {data.config.maxEntries && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Max:</span>
              <span className="text-xs font-mono">{data.config.maxEntries}</span>
            </div>
          )}
        </div>
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-green-500"
        />
      </CardContent>
    </Card>
  );
});

MemoryNode.displayName = 'MemoryNode';