"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap, Webhook, Calendar, Globe } from "lucide-react";

interface EnhancedTriggerNodeData {
  label: string;
  config: {
    type?: 'chat_input' | 'webhook' | 'schedule' | 'api';
    platforms?: string[];
    filters?: string[];
    autoReply?: boolean;
    schedule?: string;
  };
}

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'chat_input':
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    case 'webhook':
      return <Webhook className="h-4 w-4 text-blue-600" />;
    case 'schedule':
      return <Calendar className="h-4 w-4 text-blue-600" />;
    case 'api':
      return <Globe className="h-4 w-4 text-blue-600" />;
    default:
      return <Zap className="h-4 w-4 text-blue-600" />;
  }
};

const getTriggerColor = (type: string) => {
  switch (type) {
    case 'chat_input':
      return 'from-blue-50 to-cyan-50 border-blue-200';
    case 'webhook':
      return 'from-green-50 to-teal-50 border-green-200';
    case 'schedule':
      return 'from-orange-50 to-yellow-50 border-orange-200';
    case 'api':
      return 'from-indigo-50 to-purple-50 border-indigo-200';
    default:
      return 'from-blue-50 to-cyan-50 border-blue-200';
  }
};

export const EnhancedTriggerNode = memo(({ data, selected }: NodeProps<EnhancedTriggerNodeData>) => {
  const triggerType = data.config.type || 'chat_input';
  const colorClass = getTriggerColor(triggerType);

  return (
    <Card className={`min-w-[240px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br ${colorClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            {getTriggerIcon(triggerType)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-blue-900">{data.label}</h4>
            <p className="text-xs text-blue-600 capitalize">{triggerType.replace('_', ' ')}</p>
          </div>
          <div className="flex items-center gap-1">
            {data.config.autoReply && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Auto Reply Enabled" />
            )}
          </div>
        </div>
        
        {data.config.platforms && data.config.platforms.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-blue-600 mb-1">Channels:</p>
            <div className="flex flex-wrap gap-1">
              {data.config.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.config.filters && data.config.filters.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-blue-600 mb-1">Filters:</p>
            <div className="flex flex-wrap gap-1">
              {data.config.filters.map((filter, index) => (
                <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-600">
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.config.schedule && (
          <div className="text-xs text-blue-700 font-mono bg-white/50 p-2 rounded">
            {data.config.schedule}
          </div>
        )}
        
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-blue-500 border-2 border-white"
        />
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-blue-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
});

EnhancedTriggerNode.displayName = 'EnhancedTriggerNode';