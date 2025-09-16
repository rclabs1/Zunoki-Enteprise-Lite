"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, Globe, Calculator, Mail, CheckCircle, AlertCircle } from "lucide-react";

interface EnhancedToolNodeData {
  label: string;
  config: {
    tool?: string;
    parameters?: Record<string, any>;
    apiKey?: string;
    timeout?: number;
    retries?: number;
  };
}

const getToolIcon = (toolType: string) => {
  switch (toolType?.toLowerCase()) {
    case 'web_search':
    case 'search':
      return <Search className="h-4 w-4 text-orange-600" />;
    case 'calculator':
    case 'math':
      return <Calculator className="h-4 w-4 text-orange-600" />;
    case 'email':
    case 'send_email':
      return <Mail className="h-4 w-4 text-orange-600" />;
    case 'api_call':
    case 'webhook':
      return <Globe className="h-4 w-4 text-orange-600" />;
    default:
      return <Zap className="h-4 w-4 text-orange-600" />;
  }
};

const getToolDisplayName = (tool: string) => {
  const names: Record<string, string> = {
    'web_search': 'Web Search',
    'calculator': 'Calculator',
    'send_email': 'Send Email',
    'api_call': 'API Call',
    'webhook': 'Webhook',
  };
  return names[tool] || tool.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const EnhancedToolNode = memo(({ data, selected }: NodeProps<EnhancedToolNodeData>) => {
  const tool = data.config.tool || 'unknown';
  const hasApiKey = !!data.config.apiKey;
  const parameters = data.config.parameters || {};

  return (
    <Card className={`min-w-[220px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-orange-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            {getToolIcon(tool)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-orange-900">{data.label}</h4>
            <p className="text-xs text-orange-600">{getToolDisplayName(tool)}</p>
          </div>
          <div className="flex items-center gap-1">
            {hasApiKey ? (
              <CheckCircle className="h-3 w-3 text-green-500" title="API Key Configured" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-500" title="No API Key" />
            )}
          </div>
        </div>

        {/* Tool Configuration */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-600">Tool:</span>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              {tool}
            </Badge>
          </div>
          
          {data.config.timeout && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-600">Timeout:</span>
              <span className="text-xs font-mono text-orange-800">{data.config.timeout}ms</span>
            </div>
          )}

          {data.config.retries && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-600">Retries:</span>
              <span className="text-xs font-mono text-orange-800">{data.config.retries}</span>
            </div>
          )}
        </div>

        {/* Parameters Preview */}
        {Object.keys(parameters).length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-orange-600 mb-1">Parameters:</p>
            <div className="bg-white/50 p-2 rounded text-xs max-h-16 overflow-y-auto">
              {Object.entries(parameters).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-orange-600">{key}:</span>
                  <span className="text-orange-800 truncate ml-2">
                    {typeof value === 'string' && value.length > 10 
                      ? `${value.substring(0, 10)}...` 
                      : String(value)
                    }
                  </span>
                </div>
              ))}
              {Object.keys(parameters).length > 2 && (
                <div className="text-orange-500 italic">
                  +{Object.keys(parameters).length - 2} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-orange-200">
          <div className="flex items-center gap-1">
            {hasApiKey ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-yellow-600">No Auth</span>
              </>
            )}
          </div>
          <span className="text-xs text-orange-600">Tool</span>
        </div>
        
        {/* Output handles - success and error */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="success"
          className="w-4 h-4 bg-green-500 border-2 border-white"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="error"
          className="w-4 h-4 bg-red-500 border-2 border-white"
          style={{ left: '70%' }}
        />
      </CardContent>
    </Card>
  );
});

EnhancedToolNode.displayName = 'EnhancedToolNode';