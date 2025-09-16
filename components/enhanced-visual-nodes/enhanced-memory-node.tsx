"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Brain, Clock, User } from "lucide-react";

interface EnhancedMemoryNodeData {
  label: string;
  config: {
    type?: 'conversation' | 'short_term' | 'long_term' | 'semantic';
    scope?: 'user_session' | 'global' | 'user_permanent';
    maxEntries?: number;
    retention?: string;
  };
}

const getMemoryTypeIcon = (type: string) => {
  switch (type) {
    case 'conversation':
      return <Brain className="h-4 w-4 text-green-600" />;
    case 'semantic':
      return <Database className="h-4 w-4 text-green-600" />;
    default:
      return <Database className="h-4 w-4 text-green-600" />;
  }
};

const getScopeIcon = (scope: string) => {
  switch (scope) {
    case 'user_session':
      return <User className="h-3 w-3 text-green-600" />;
    case 'user_permanent':
      return <User className="h-3 w-3 text-blue-600" />;
    case 'global':
      return <Database className="h-3 w-3 text-purple-600" />;
    default:
      return <User className="h-3 w-3 text-green-600" />;
  }
};

export const EnhancedMemoryNode = memo(({ data, selected }: NodeProps<EnhancedMemoryNodeData>) => {
  return (
    <Card className={`min-w-[220px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-green-50 to-emerald-50 border-green-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-green-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            {getMemoryTypeIcon(data.config.type || 'conversation')}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-green-900">{data.label}</h4>
            <p className="text-xs text-green-600 capitalize">
              {(data.config.type || 'conversation').replace('_', ' ')} Memory
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-600 flex items-center gap-1">
              {getScopeIcon(data.config.scope || 'user_session')}
              Scope:
            </span>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              {(data.config.scope || 'user_session').replace('_', ' ')}
            </Badge>
          </div>

          {data.config.maxEntries && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">Max Entries:</span>
              <span className="text-xs font-mono text-green-800">{data.config.maxEntries}</span>
            </div>
          )}

          {data.config.retention && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Retention:
              </span>
              <span className="text-xs font-mono text-green-800">
                {data.config.retention.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-green-200">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Active</span>
          </div>
          <span className="text-xs text-green-600">Memory</span>
        </div>
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-green-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
});

EnhancedMemoryNode.displayName = 'EnhancedMemoryNode';