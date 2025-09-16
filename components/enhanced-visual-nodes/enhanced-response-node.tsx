"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Volume2, Smartphone, Mail, MessageCircle } from "lucide-react";

interface EnhancedResponseNodeData {
  label: string;
  config: {
    platforms?: string[];
    voice?: {
      enabled: boolean;
      voice: string;
      language: string;
      speed: number;
    };
    formatting?: {
      markdown: boolean;
      emojis: boolean;
      maxLength: number;
    };
  };
}

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'whatsapp':
      return <MessageCircle className="h-3 w-3 text-green-600" />;
    case 'sms':
      return <Smartphone className="h-3 w-3 text-blue-600" />;
    case 'email':
      return <Mail className="h-3 w-3 text-red-600" />;
    case 'slack':
      return <MessageSquare className="h-3 w-3 text-purple-600" />;
    default:
      return <MessageSquare className="h-3 w-3 text-gray-600" />;
  }
};

export const EnhancedResponseNode = memo(({ data, selected }: NodeProps<EnhancedResponseNodeData>) => {
  const platforms = data.config.platforms || [];
  const voice = data.config.voice;
  const formatting = data.config.formatting;

  return (
    <Card className={`min-w-[240px] ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'} bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200`}>
      <CardContent className="p-4">
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 bg-indigo-500 border-2 border-white"
        />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-indigo-900">{data.label}</h4>
            <p className="text-xs text-indigo-600">Multi-Platform Output</p>
          </div>
        </div>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-indigo-600 mb-2">Active Channels:</p>
            <div className="grid grid-cols-2 gap-1">
              {platforms.slice(0, 4).map((platform) => (
                <div key={platform} className="flex items-center gap-1 text-xs bg-white/50 p-1 rounded">
                  {getPlatformIcon(platform)}
                  <span className="text-indigo-800 capitalize">{platform}</span>
                </div>
              ))}
              {platforms.length > 4 && (
                <div className="flex items-center gap-1 text-xs bg-white/50 p-1 rounded">
                  <span className="text-indigo-600">+{platforms.length - 4} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice Configuration */}
        {voice?.enabled && (
          <div className="mb-3 p-2 bg-white/50 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">Voice Enabled</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-indigo-600">Voice:</span>
                <span className="ml-1 text-indigo-800">{voice.voice}</span>
              </div>
              <div>
                <span className="text-indigo-600">Speed:</span>
                <span className="ml-1 text-indigo-800">{voice.speed}x</span>
              </div>
            </div>
          </div>
        )}

        {/* Formatting Options */}
        {formatting && (
          <div className="space-y-2">
            <p className="text-xs text-indigo-600">Format Options:</p>
            <div className="flex flex-wrap gap-1">
              {formatting.markdown && (
                <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                  Markdown
                </Badge>
              )}
              {formatting.emojis && (
                <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                  Emojis
                </Badge>
              )}
              {formatting.maxLength && (
                <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                  Max: {formatting.maxLength}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-indigo-200">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-xs text-indigo-600">
              {platforms.length > 0 ? 'Connected' : 'No channels'}
            </span>
          </div>
          <span className="text-xs text-indigo-600">Output</span>
        </div>

        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="w-4 h-4 bg-indigo-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
});

EnhancedResponseNode.displayName = 'EnhancedResponseNode';