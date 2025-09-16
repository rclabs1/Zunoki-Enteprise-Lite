"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, Settings, Thermometer } from "lucide-react";

interface EnhancedPromptNodeData {
  label: string;
  config: {
    role?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    capabilities?: string[];
  };
}

const getModelBadgeColor = (model: string) => {
  if (model?.includes('120b')) return 'bg-purple-100 text-purple-700';
  if (model?.includes('20b')) return 'bg-blue-100 text-blue-700';
  if (model?.includes('gpt-4')) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
};

const getTemperatureColor = (temp: number) => {
  if (temp <= 0.3) return 'text-blue-600';
  if (temp <= 0.7) return 'text-green-600';
  if (temp <= 1.2) return 'text-orange-600';
  return 'text-red-600';
};

export const EnhancedPromptNode = memo(({ data, selected }: NodeProps<EnhancedPromptNodeData>) => {
  return (
    <Card className={`min-w-[260px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-purple-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-purple-900">{data.label}</h4>
            <p className="text-xs text-purple-600">AI Processing</p>
          </div>
          <Settings className="h-3 w-3 text-purple-400" />
        </div>
        
        {/* Model and Settings */}
        <div className="space-y-2 mb-3">
          {data.config.model && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600">Model:</span>
              <Badge variant="secondary" className={`text-xs ${getModelBadgeColor(data.config.model)}`}>
                {data.config.model.replace('gpt-oss-', '').replace('gpt-', '')}
              </Badge>
            </div>
          )}
          
          {data.config.temperature !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600 flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                Temp:
              </span>
              <span className={`text-xs font-mono ${getTemperatureColor(data.config.temperature)}`}>
                {data.config.temperature.toFixed(1)}
              </span>
            </div>
          )}
          
          {data.config.maxTokens && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600">Tokens:</span>
              <span className="text-xs font-mono text-purple-800">
                {data.config.maxTokens.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* System Prompt Preview */}
        {data.config.systemPrompt && (
          <div className="mb-3 p-2 bg-white/50 rounded text-xs">
            <p className="text-purple-600 font-medium mb-1">System Prompt:</p>
            <p className="text-purple-800 line-clamp-2">
              {data.config.systemPrompt.length > 60 
                ? `${data.config.systemPrompt.substring(0, 60)}...`
                : data.config.systemPrompt
              }
            </p>
          </div>
        )}
        
        {/* Capabilities */}
        {data.config.capabilities && data.config.capabilities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-purple-600 mb-1">Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {data.config.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-600">
                  {capability}
                </Badge>
              ))}
              {data.config.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                  +{data.config.capabilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600">Ready</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span className="text-purple-600">AI</span>
          </div>
        </div>
        
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

EnhancedPromptNode.displayName = 'EnhancedPromptNode';