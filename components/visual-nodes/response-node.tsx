"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Volume2 } from "lucide-react";

interface ResponseNodeData {
  label: string;
  config: {
    platforms?: string[];
    voice?: {
      enabled: boolean;
      language: string;
      speed: number;
    };
  };
}

export const ResponseNode = memo(({ data, selected }: NodeProps<ResponseNodeData>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-indigo-500"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-indigo-100 rounded">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">Output Response</p>
          </div>
        </div>
        
        {data.config.platforms && data.config.platforms.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1">Channels:</p>
            <div className="flex flex-wrap gap-1">
              {data.config.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {data.config.voice?.enabled && (
          <div className="flex items-center gap-1 mt-2">
            <Volume2 className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">Voice enabled</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {data.config.voice.language}
            </Badge>
          </div>
        )}
        
        {(!data.config.platforms || data.config.platforms.length === 0) && (
          <div className="text-xs text-muted-foreground italic">
            No channels configured
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ResponseNode.displayName = 'ResponseNode';