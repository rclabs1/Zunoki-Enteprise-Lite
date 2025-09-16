"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Check, X, Code } from "lucide-react";

interface EnhancedConditionNodeData {
  label: string;
  config: {
    condition?: string;
    operator?: string;
    value?: string;
    description?: string;
  };
}

const getOperatorColor = (operator: string) => {
  switch (operator?.toLowerCase()) {
    case 'equals':
    case '==':
      return 'bg-blue-100 text-blue-700';
    case 'contains':
      return 'bg-green-100 text-green-700';
    case 'greater':
    case '>':
      return 'bg-purple-100 text-purple-700';
    case 'less':
    case '<':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const EnhancedConditionNode = memo(({ data, selected }: NodeProps<EnhancedConditionNodeData>) => {
  return (
    <Card className={`min-w-[240px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-yellow-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <GitBranch className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-yellow-900">{data.label}</h4>
            <p className="text-xs text-yellow-600">Logic Branch</p>
          </div>
          <Code className="h-3 w-3 text-yellow-400" />
        </div>

        {/* Condition Display */}
        {data.config.condition && (
          <div className="mb-3 p-2 bg-white/50 rounded">
            <p className="text-xs text-yellow-600 mb-1">Condition:</p>
            <code className="text-xs text-yellow-800 font-mono">
              {data.config.condition.length > 40 
                ? `${data.config.condition.substring(0, 40)}...`
                : data.config.condition
              }
            </code>
          </div>
        )}

        {/* Operator and Value */}
        <div className="space-y-2 mb-3">
          {data.config.operator && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-600">Operator:</span>
              <Badge variant="secondary" className={`text-xs ${getOperatorColor(data.config.operator)}`}>
                {data.config.operator}
              </Badge>
            </div>
          )}

          {data.config.value && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-600">Value:</span>
              <span className="text-xs font-mono text-yellow-800 truncate max-w-20">
                {data.config.value}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {data.config.description && (
          <div className="mb-3 text-xs text-yellow-700 italic">
            {data.config.description}
          </div>
        )}

        {/* Branch Labels */}
        <div className="flex justify-between items-center mb-2 text-xs">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600 font-medium">True</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-3 w-3 text-red-600" />
            <span className="text-red-600 font-medium">False</span>
          </div>
        </div>

        {/* Execution Status */}
        <div className="flex items-center justify-center mt-3 pt-2 border-t border-yellow-200">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-yellow-600">Logic</span>
          </div>
        </div>
        
        {/* Output handles - true and false paths */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-4 h-4 bg-green-500 border-2 border-white"
          style={{ left: '25%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-4 h-4 bg-red-500 border-2 border-white"
          style={{ left: '75%' }}
        />
      </CardContent>
    </Card>
  );
});

EnhancedConditionNode.displayName = 'EnhancedConditionNode';