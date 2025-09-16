"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Database, Search, Upload, CheckCircle, MessageSquare, Settings } from "lucide-react";

interface KnowledgeNodeData {
  label: string;
  config: {
    sources?: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      vectorCount: number;
    }>;
    totalVectors?: number;
    searchType?: 'semantic' | 'keyword' | 'hybrid';
    maxResults?: number;
    threshold?: number;
  };
}

const getSourceTypeIcon = (type: string | undefined) => {
  if (!type) return <Database className="h-3 w-3 text-purple-600" />;
  
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-3 w-3 text-red-600" />;
    case 'website':
      return <Search className="h-3 w-3 text-blue-600" />;
    case 'upload':
      return <Upload className="h-3 w-3 text-green-600" />;
    case 'faq':
      return <MessageSquare className="h-3 w-3 text-blue-600" />;
    case 'documentation':
      return <FileText className="h-3 w-3 text-indigo-600" />;
    case 'troubleshooting':
      return <Settings className="h-3 w-3 text-orange-600" />;
    default:
      return <Database className="h-3 w-3 text-purple-600" />;
  }
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'text-gray-600';
  
  switch (status.toLowerCase()) {
    case 'processed':
    case 'ready':
      return 'text-green-600';
    case 'processing':
      return 'text-yellow-600';
    case 'failed':
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const KnowledgeNode = memo(({ data, selected }: NodeProps<KnowledgeNodeData>) => {
  const totalVectors = data.config.totalVectors || 0;
  const sources = data.config.sources || [];
  const activeSources = sources.filter(s => s.status === 'processed' || s.status === 'ready');

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-orange-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <Database className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-orange-900">{data.label}</h4>
            <p className="text-xs text-orange-600">Knowledge Search</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-orange-800 font-mono">
              {totalVectors.toLocaleString()}
            </div>
            <div className="text-xs text-orange-600">vectors</div>
          </div>
        </div>

        {/* Knowledge Sources */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-600">Sources:</span>
            <span className="text-xs text-orange-800 font-mono">
              {activeSources.length}/{sources.length}
            </span>
          </div>
          
          {sources.length > 0 ? (
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {sources.slice(0, 3).map((source) => (
                <div key={source.id} className="flex items-center gap-2 text-xs">
                  {getSourceTypeIcon(source.type)}
                  <span className="flex-1 truncate text-orange-800">
                    {source.name}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    source.status === 'processed' ? 'bg-green-500' : 
                    source.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
              {sources.length > 3 && (
                <div className="text-xs text-orange-600 italic">
                  +{sources.length - 3} more sources
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-orange-500 italic p-2 bg-white/50 rounded">
              No knowledge sources configured
            </div>
          )}
        </div>

        {/* Search Configuration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-600">Search:</span>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              {data.config.searchType || 'semantic'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-orange-600">Max Results:</span>
              <span className="font-mono text-orange-800">{data.config.maxResults || 5}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">Threshold:</span>
              <span className="font-mono text-orange-800">{data.config.threshold || 0.8}</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-orange-200">
          <div className="flex items-center gap-1">
            {totalVectors > 0 ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Ready</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 border border-orange-400 rounded-full" />
                <span className="text-xs text-orange-600">Empty</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Search className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-orange-600">KB</span>
          </div>
        </div>
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 bg-orange-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
});

KnowledgeNode.displayName = 'KnowledgeNode';