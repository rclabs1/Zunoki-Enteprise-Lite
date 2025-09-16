"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Eye, MessageSquare, Zap } from 'lucide-react';

interface KPIMetric {
  id: string;
  name: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  priority: number;
  alert?: {
    type: 'warning' | 'error' | 'success';
    message: string;
  };
  miniChart?: number[]; // Sparkline data
  // Enhanced properties (building on existing)
  section?: 'acquisition' | 'engagement' | 'retention' | 'business';
  dataSource?: string; // 'google_ads', 'ga4', 'mixpanel', 'calculated'
  category?: string; // For backward compatibility
  description?: string;
  benchmark?: number;
  target?: number;
}

interface MayaKPIBarProps {
  metrics: KPIMetric[];
  onMetricClick?: (metricId: string, section?: string) => void;
  onAnalyseClick?: (metricId: string, section?: string) => void;
  onAddMetric?: () => void;
  onAddSectionKPI?: (section: string) => void;
  isCollapsible?: boolean;
  className?: string;
  // Enhanced properties (backward compatible - all optional)
  displayMode?: 'flat' | 'sectioned' | 'sectioned-full' | 'tabbed';
  showDataSources?: boolean;
  enableTemplates?: boolean;
  onMetricChange?: (section: string, metricId: string) => void;
}


const MayaKPIBar: React.FC<MayaKPIBarProps> = ({
  metrics,
  onMetricClick,
  onAnalyseClick,
  onAddMetric,
  onAddSectionKPI,
  isCollapsible = false,
  className = '',
  displayMode = 'flat',
  showDataSources = false,
  enableTemplates = false,
  onMetricChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<KPIMetric[]>([]);

  useEffect(() => {
    if (displayMode === 'flat') {
      // Original behavior: Sort by priority and show top 6
      const sortedMetrics = [...metrics]
        .sort((a, b) => a.priority - b.priority)
        .slice(0, isCollapsed ? 3 : 6);
      
      setVisibleMetrics(sortedMetrics);
    } else {
      // Enhanced: Show all metrics for sectioned display
      setVisibleMetrics(metrics);
    }
  }, [metrics, isCollapsed, displayMode]);

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={12} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={12} className="text-red-500" />;
      case 'stable':
        return <Minus size={12} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
  };

  const formatChange = (change?: number) => {
    if (!change) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const renderMiniChart = (data: number[]) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 40;
      const y = 16 - ((value - min) / range) * 12;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="40" height="16" className="ml-2">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          points={points}
          className="opacity-60"
        />
      </svg>
    );
  };

  // Group metrics by section
  const getMetricsBySection = () => {
    const sections = {
      acquisition: visibleMetrics.filter(m => m.section === 'acquisition'),
      engagement: visibleMetrics.filter(m => m.section === 'engagement'),
      retention: visibleMetrics.filter(m => m.section === 'retention'),
      business: visibleMetrics.filter(m => m.section === 'business'),
      other: visibleMetrics.filter(m => !m.section)
    };
    return sections;
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'acquisition': return '📢';
      case 'engagement': return '💡';
      case 'retention': return '🔄';
      case 'business': return '💰';
      default: return '📊';
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'acquisition': return 'ACQUISITION';
      case 'engagement': return 'ENGAGEMENT';
      case 'retention': return 'RETENTION';
      case 'business': return 'BUSINESS IMPACT';
      default: return 'OTHER METRICS';
    }
  };

  if (visibleMetrics.length === 0) {
    return null;
  }

  const renderMetricCard = (metric: KPIMetric, section?: string) => (
    <div
      key={metric.id}
      onClick={() => onMetricClick?.(metric.id, section)}
      className={`kpi-metric p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
        metric.alert 
          ? metric.alert.type === 'error' 
            ? 'bg-red-50 border-red-400'
            : metric.alert.type === 'warning'
            ? 'bg-yellow-50 border-yellow-400'
            : 'bg-green-50 border-green-400'
          : 'bg-gray-50 border-gray-300 hover:border-blue-400'
      }`}
      style={{ borderLeftColor: metric.color }}
    >
      {/* Metric Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1">
          <span className="text-lg">{metric.icon}</span>
          {metric.alert && (
            <AlertCircle 
              size={12} 
              className={
                metric.alert.type === 'error' ? 'text-red-500' :
                metric.alert.type === 'warning' ? 'text-yellow-500' :
                'text-green-500'
              } 
            />
          )}
        </div>
        {getTrendIcon(metric.trend)}
      </div>

      {/* Metric Value */}
      <div className="mb-1">
        <div className="text-lg font-bold text-gray-900">
          {typeof metric.value === 'number' 
            ? metric.value.toLocaleString() 
            : metric.value
          }
        </div>
        <div className="text-xs text-gray-600 truncate">
          {metric.name}
        </div>
      </div>

      {/* Change & Mini Chart */}
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
          {formatChange(metric.change)}
        </div>
        {metric.miniChart && renderMiniChart(metric.miniChart)}
      </div>

      {/* Data Source (Enhanced) */}
      {showDataSources && metric.dataSource && (
        <div className="mt-1 text-xs text-gray-500">
          [{metric.dataSource}]
        </div>
      )}

      {/* Alert Message */}
      {metric.alert && !isCollapsed && (
        <div className="mt-2 text-xs text-gray-700 bg-white bg-opacity-50 rounded px-2 py-1">
          {metric.alert.message}
        </div>
      )}

      {/* Analysis Button */}
      {onAnalyseClick && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onAnalyseClick(metric.id, section);
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
            title="Analyse with Zunoki. Intelligence"
          >
            <span className="text-sm">🤖</span>
            <span>Zunoki.</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`maya-kpi-bar bg-white border-b shadow-sm ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">
              {displayMode === 'sectioned' ? 'Performance Analytics' : 'Performance Overview'}
            </h3>
            {isCollapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            {onAddMetric && (
              <button
                onClick={onAddMetric}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add KPI
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics Display */}
        {displayMode === 'sectioned' ? (
          /* Clean Sectioned Display - Acquisition, Engagement, Retention Only */
          <div className="space-y-6">
            {Object.entries(getMetricsBySection()).map(([section, sectionMetrics]) => {
              // Skip Business Impact section
              if (section === 'business' || section === 'other') return null;
              if (sectionMetrics.length === 0) return null;
              
              return (
                <div key={section} className="section-group">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">{getSectionIcon(section)}</span>
                    <h4 className="text-sm font-semibold text-gray-800">{getSectionTitle(section)}</h4>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    {onAddSectionKPI && (
                      <button
                        onClick={() => onAddSectionKPI(section)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                        title={`Add KPI to ${getSectionTitle(section)}`}
                      >
                        <span>+</span>
                        <span>Add KPI</span>
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {sectionMetrics.map((metric) => renderMetricCard(metric, section))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Display (Original) */
          <div className={`grid gap-4 ${
            isCollapsed 
              ? 'grid-cols-1 md:grid-cols-3' 
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
          }`}>
            {visibleMetrics.map((metric) => renderMetricCard(metric))}

            {/* Add More Metrics Button */}
            {onAddMetric && visibleMetrics.length < 6 && (
              <div
                onClick={onAddMetric}
                className="kpi-metric p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600"
              >
                <div className="text-2xl mb-1">+</div>
                <div className="text-xs text-center">Add Metric</div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats Summary */}
        {!isCollapsed && metrics.length > 6 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
            <span>Showing {visibleMetrics.length} of {metrics.length} metrics</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <TrendingUp size={12} className="mr-1 text-green-500" />
                {metrics.filter(m => m.trend === 'up').length} improving
              </span>
              <span className="flex items-center">
                <TrendingDown size={12} className="mr-1 text-red-500" />
                {metrics.filter(m => m.trend === 'down').length} declining
              </span>
              <span className="flex items-center">
                <AlertCircle size={12} className="mr-1 text-yellow-500" />
                {metrics.filter(m => m.alert).length} alerts
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Default KPI metrics for marketing
export const createDefaultMarketingKPIs = (): KPIMetric[] => [
  // ACQUISITION METRICS
  {
    id: 'impressions',
    name: 'Impressions',
    value: '2.1M',
    change: -2.4,
    trend: 'down',
    icon: '👁️',
    color: '#8B5CF6',
    priority: 1,
    section: 'acquisition',
    dataSource: 'google_ads',
    miniChart: [2300000, 2200000, 2150000, 2100000, 2100000]
  },
  {
    id: 'clicks',
    name: 'Clicks',
    value: '45.2K',
    change: 15.3,
    trend: 'up',
    icon: '🎯',
    color: '#3B82F6',
    priority: 2,
    section: 'acquisition',
    dataSource: 'google_ads',
    miniChart: [38000, 41000, 39000, 44000, 45200]
  },
  {
    id: 'spend',
    name: 'Ad Spend',
    value: '$8,450',
    change: -8.2,
    trend: 'down',
    icon: '💸',
    color: '#06B6D4',
    priority: 3,
    section: 'acquisition',
    dataSource: 'google_ads',
    miniChart: [9200, 8800, 8600, 8400, 8450]
  },
  {
    id: 'sessions',
    name: 'Sessions',
    value: '12.5K',
    change: 22.1,
    trend: 'up',
    icon: '🌐',
    color: '#10B981',
    priority: 4,
    section: 'acquisition',
    dataSource: 'ga4',
    miniChart: [10200, 11800, 11200, 12100, 12500]
  },
  
  // ENGAGEMENT METRICS  
  {
    id: 'session_duration',
    name: 'Avg Session',
    value: '2:34',
    change: 8.7,
    trend: 'up',
    icon: '⏱️',
    color: '#F59E0B',
    priority: 5,
    section: 'engagement',
    dataSource: 'ga4'
  },
  {
    id: 'page_views',
    name: 'Page Views',
    value: '45.2K',
    change: 12.3,
    trend: 'up',
    icon: '📄',
    color: '#8B5CF6',
    priority: 6,
    section: 'engagement',
    dataSource: 'ga4'
  },
  {
    id: 'bounce_rate',
    name: 'Bounce Rate',
    value: '42%',
    change: -5.1,
    trend: 'up', // Lower bounce rate is good
    icon: '📉',
    color: '#10B981',
    priority: 7,
    section: 'engagement',
    dataSource: 'ga4'
  },
  
  // RETENTION METRICS
  {
    id: 'returning_users',
    name: 'Returning Users',
    value: '3.2K',
    change: 18.5,
    trend: 'up',
    icon: '🔄',
    color: '#3B82F6',
    priority: 8,
    section: 'retention',
    dataSource: 'mixpanel'
  },
  {
    id: 'user_retention',
    name: '7-Day Retention',
    value: '68%',
    change: 3.2,
    trend: 'up',
    icon: '📈',
    color: '#10B981',
    priority: 9,
    section: 'retention',
    dataSource: 'mixpanel'
  },
  
  // BUSINESS METRICS
  {
    id: 'revenue',
    name: 'Revenue',
    value: '$45,200',
    change: 12.3,
    trend: 'up',
    icon: '💰',
    color: '#10B981',
    priority: 10,
    section: 'business',
    dataSource: 'calculated',
    miniChart: [38000, 41000, 39000, 44000, 45200]
  },
  {
    id: 'roas',
    name: 'ROAS',
    value: '4.2x',
    change: 8.1,
    trend: 'up',
    icon: '📈',
    color: '#3B82F6',
    priority: 11,
    section: 'business',
    dataSource: 'calculated',
    miniChart: [3.8, 4.0, 3.9, 4.1, 4.2]
  },
  {
    id: 'cac',
    name: 'CAC',
    value: '$68',
    change: -12.4,
    trend: 'up', // Lower CAC is better
    icon: '💎',
    color: '#8B5CF6',
    priority: 12,
    section: 'business',
    dataSource: 'calculated'
  },
  
  // LEGACY METRICS (for backward compatibility)
  {
    id: 'messages',
    name: 'New Messages',
    value: 15,
    change: 25,
    trend: 'up',
    icon: '💬',
    color: '#F59E0B',
    priority: 13,
    alert: {
      type: 'success',
      message: '3 high-priority leads'
    }
  },
  {
    id: 'alerts',
    name: 'Active Alerts',
    value: 3,
    change: 0,
    trend: 'stable',
    icon: '⚡',
    color: '#EF4444',
    priority: 14,
    alert: {
      type: 'warning',
      message: '2 budget alerts, 1 performance alert'
    }
  }
];

// Template-based KPI creation
export const createTemplateKPIs = (template: 'ecommerce' | 'saas' | 'media' | 'adtech' | 'edutech' | 'fintech' | 'supply-chain'): KPIMetric[] => {
  const baseKPIs = createDefaultMarketingKPIs();
  
  // Template-specific KPI configurations would go here
  // For now, return the default set with template context
  return baseKPIs.map(kpi => ({
    ...kpi,
    description: `${kpi.name} for ${template} business`
  }));
};

export default MayaKPIBar;