"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Zap } from "lucide-react";

interface TriggerNodeData {
  label: string;
  config: {
    platforms?: string[];
    filters?: string[];
  };
}

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded">
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">Entry Point</p>
          </div>
        </div>
        
        {data.config.platforms && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.config.platforms.map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500"
        />
      </CardContent>
    </Card>
  );
});

TriggerNode.displayName = 'TriggerNode';