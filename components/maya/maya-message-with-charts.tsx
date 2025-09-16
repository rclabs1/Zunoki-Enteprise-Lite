"use client";

import React from 'react';
import { MayaMessage } from '@/contexts/maya-context';
import MayaChartRenderer from './maya-chart-renderer';
import { Bot, User, Volume2 } from 'lucide-react';

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area';
  data: any;
  options: any;
  insights: string[];
  voiceNarration: string;
  quickActions: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface MayaMessageWithChartsProps {
  message: MayaMessage;
  onActionClick?: (action: string, data?: any) => void;
  onChartActionClick?: (action: string, data?: any) => void;
  className?: string;
  chartData?: ChartData; // Optional chart data for Maya messages
}

const MayaMessageWithCharts: React.FC<MayaMessageWithChartsProps> = ({
  message,
  onActionClick,
  onChartActionClick,
  className = '',
  chartData
}) => {
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const renderMessageContent = () => {
    // Split content by potential chart markers or keep as is
    const content = message.content;
    
    // Look for chart indicators in the message
    const hasChartIndicator = content.includes('[CHART]') || 
                              content.includes('chart') || 
                              content.includes('graph') ||
                              content.includes('trend') ||
                              content.includes('analysis');

    return (
      <div className="message-content">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {/* Render chart if provided */}
        {chartData && (
          <div className="mt-4">
            <MayaChartRenderer 
              chartData={chartData}
              onActionClick={onChartActionClick}
              autoNarrate={true}
            />
          </div>
        )}

        {/* Tools Used Indicator */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {message.toolsUsed.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                🛠️ {tool}
              </span>
            ))}
          </div>
        )}

        {/* Confidence Indicator */}
        {message.confidence && message.confidence < 0.8 && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-amber-600">
            <span>⚠️</span>
            <span>Lower confidence response - please verify results</span>
          </div>
        )}

        {/* Action Buttons */}
        {message.actionButtons && message.actionButtons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => onActionClick?.(button.action, { callbackId: button.callbackId })}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  button.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${message.requiresApproval ? 'ring-2 ring-amber-400' : ''}`}
              >
                {button.label}
                {message.requiresApproval && button.variant === 'primary' && (
                  <span className="ml-1 text-xs">⚡</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Approval Required Notice */}
        {message.requiresApproval && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="text-amber-600">⚠️</span>
              <span className="text-sm text-amber-800 font-medium">
                This action requires your approval before execution
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`maya-message flex space-x-3 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'maya' 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {message.type === 'maya' ? (
            <Bot size={16} />
          ) : (
            <User size={16} />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className={`text-sm font-medium ${
            message.type === 'maya' ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {message.type === 'maya' ? 'Zunoki.' : 'You'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
          
          {/* Voice indicator for Maya messages with narration */}
          {message.type === 'maya' && chartData?.voiceNarration && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Volume2 size={12} />
              <span>Voice enabled</span>
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className={`message-bubble p-4 rounded-lg ${
          message.type === 'maya'
            ? 'bg-blue-50 border border-blue-100'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          {renderMessageContent()}
        </div>

        {/* Suggested Module */}
        {message.suggestedModule && (
          <div className="mt-2 text-xs text-gray-500">
            💡 Suggested module: <span className="font-medium">{message.suggestedModule}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MayaMessageWithCharts;