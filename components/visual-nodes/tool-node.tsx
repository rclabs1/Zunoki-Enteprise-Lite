"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, Database, Globe } from "lucide-react";

interface ToolNodeData {
  label: string;
  config: {
    tool?: string;
    apiKey?: string;
    vectorCount?: number;
  };
}

const getToolIcon = (toolType: string) => {
  switch (toolType) {
    case 'web_search':
      return <Search className="h-4 w-4 text-orange-600" />;
    case 'rag_search':
      return <Database className="h-4 w-4 text-orange-600" />;
    case 'api_call':
      return <Globe className="h-4 w-4 text-orange-600" />;
    default:
      return <Zap className="h-4 w-4 text-orange-600" />;
  }
};

export const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-orange-500"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-orange-100 rounded">
            {getToolIcon(data.config.tool || 'default')}
          </div>
          <div>
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">Tool Execution</p>
          </div>
        </div>
        
        {data.config.tool && (
          <Badge variant="secondary" className="text-xs mb-2">
            {data.config.tool.replace('_', ' ')}
          </Badge>
        )}
        
        {data.config.vectorCount !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Vectors:</span>
            <span className="text-xs font-mono text-primary">
              {data.config.vectorCount.toLocaleString()}
            </span>
          </div>
        )}
        
        {data.config.apiKey && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600">Connected</span>
          </div>
        )}
        
        {/* Output handles - success and error */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="success"
          className="w-3 h-3 bg-orange-500"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="error"
          className="w-3 h-3 bg-red-500"
          style={{ left: '70%' }}
        />
      </CardContent>
    </Card>
  );
});

ToolNode.displayName = 'ToolNode';