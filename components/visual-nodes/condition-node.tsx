"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Check, X } from "lucide-react";

interface ConditionNodeData {
  label: string;
  config: {
    condition?: string;
    operator?: string;
    value?: string;
  };
}

export const ConditionNode = memo(({ data, selected }: NodeProps<ConditionNodeData>) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-yellow-500"
        />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-yellow-100 rounded">
            <GitBranch className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{data.label}</h4>
            <p className="text-xs text-muted-foreground">Logic Branch</p>
          </div>
        </div>
        
        {data.config.condition && (
          <div className="bg-muted p-2 rounded text-xs mb-2">
            <code className="text-xs">
              {data.config.condition.length > 30 
                ? `${data.config.condition.substring(0, 30)}...`
                : data.config.condition
              }
            </code>
          </div>
        )}
        
        {data.config.operator && (
          <Badge variant="outline" className="text-xs">
            {data.config.operator}
          </Badge>
        )}
        
        {/* Output handles - true and false paths */}
        <div className="flex justify-between items-center mt-3 text-xs">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600">True</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-600" />
            <span className="text-red-600">False</span>
          </div>
        </div>
        
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3 bg-green-500"
          style={{ left: '25%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3 bg-red-500"
          style={{ left: '75%' }}
        />
      </CardContent>
    </Card>
  );
});

ConditionNode.displayName = 'ConditionNode';