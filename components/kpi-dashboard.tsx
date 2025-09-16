"use client";

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Download, Share2, Calendar, TrendingUp } from 'lucide-react';
import MayaKPIBar, { KPIMetric } from './maya/maya-kpi-bar';
import KPITemplateSelector from './kpi-template-selector';
import CustomKPIBuilder from './kpi-builder';
import { useAuth } from '@/lib/auth';

type DashboardMode = 'view' | 'template-select' | 'customize';

interface KPIDashboardProps {
  initialMode?: DashboardMode;
  className?: string;
}

interface DashboardConfig {
  templateId?: string;
  selectedKPIs: string[];
  customKPIs: any[];
  dateRange: string;
  displayMode: 'flat' | 'sectioned' | 'tabbed';
  showDataSources: boolean;
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({
  initialMode = 'view',
  className = ''
}) => {
  const [mode, setMode] = useState<DashboardMode>(initialMode);
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [dataQuality, setDataQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const { user } = useAuth();

  const [config, setConfig] = useState<DashboardConfig>({
    templateId: undefined,
    selectedKPIs: [],
    customKPIs: [],
    dateRange: '30d',
    displayMode: 'sectioned',
    showDataSources: true
  });

  useEffect(() => {
    loadDashboardConfig();
  }, [user]);

  useEffect(() => {
    if (config.templateId || config.selectedKPIs.length > 0) {
      fetchKPIData();
    }
  }, [config.templateId, config.selectedKPIs, config.dateRange]);

  const loadDashboardConfig = async () => {
    if (!user) return;

    try {
      // Load user's saved dashboard configuration
      const response = await fetch('/api/user/dashboard-config', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(prev => ({ ...prev, ...savedConfig }));
      } else {
        // No saved config, show template selector for new users
        if (mode === 'view') {
          setMode('template-select');
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
      // Default to template selection for new users
      if (mode === 'view') {
        setMode('template-select');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIData = async (forceRefresh = false) => {
    if (!user || (!config.templateId && config.selectedKPIs.length === 0)) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/kpis/template-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: config.templateId,
          selectedKPIs: config.selectedKPIs,
          dateRange: config.dateRange,
          forceRefresh
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setDataQuality(data.dataQuality || 'medium');
        setLastRefresh(new Date());
        console.log(`✅ Loaded ${data.metrics?.length || 0} KPI metrics`);
      } else {
        console.error('Failed to fetch KPI data');
        // Set mock data as fallback
        setMetrics(generateFallbackMetrics());
        setDataQuality('low');
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setMetrics(generateFallbackMetrics());
      setDataQuality('low');
    } finally {
      setLoading(false);
    }
  };

  const saveDashboardConfig = async (newConfig: Partial<DashboardConfig>) => {
    if (!user) return;

    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    try {
      const idToken = await user.getIdToken();
      await fetch('/api/user/dashboard-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });
    } catch (error) {
      console.error('Failed to save dashboard config:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string, template: any) => {
    console.log(`🎯 Selected template: ${templateId}`);
    
    const newConfig = {
      templateId,
      selectedKPIs: [], // Will use template defaults
      customKPIs: [],
      displayMode: 'sectioned' as const
    };

    await saveDashboardConfig(newConfig);
    setMode('view');
  };

  const handleCustomizeComplete = async (selectedKPIs: string[], customKPIs: any[]) => {
    console.log(`🎨 Customization complete: ${selectedKPIs.length} selected, ${customKPIs.length} custom`);
    
    const newConfig = {
      selectedKPIs,
      customKPIs
    };

    await saveDashboardConfig(newConfig);
    setMode('view');
  };

  const handleRefresh = () => {
    fetchKPIData(true);
  };

  const handleMetricClick = (metricId: string, section?: string) => {
    console.log(`📊 Metric clicked: ${metricId} in ${section}`);
    // Could open detailed view, drill-down, or configuration
  };

  const handleAddMetric = () => {
    setMode('customize');
  };

  const generateFallbackMetrics = (): KPIMetric[] => [
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
      dataSource: 'google_ads'
    },
    {
      id: 'sessions',
      name: 'Sessions',
      value: '12.5K',
      change: 22.1,
      trend: 'up',
      icon: '🌐',
      color: '#10B981',
      priority: 2,
      section: 'acquisition',
      dataSource: 'ga4'
    },
    {
      id: 'session_duration',
      name: 'Session Duration',
      value: '2:34',
      change: 8.7,
      trend: 'up',
      icon: '⏱️',
      color: '#F59E0B',
      priority: 3,
      section: 'engagement',
      dataSource: 'ga4'
    },
    {
      id: 'retention_rate',
      name: 'Retention Rate',
      value: '68%',
      change: 3.2,
      trend: 'up',
      icon: '🔄',
      color: '#3B82F6',
      priority: 4,
      section: 'retention',
      dataSource: 'mixpanel'
    },
    {
      id: 'revenue',
      name: 'Revenue',
      value: '$45,200',
      change: 12.3,
      trend: 'up',
      icon: '💰',
      color: '#10B981',
      priority: 5,
      section: 'business',
      dataSource: 'calculated'
    }
  ];

  const getDataQualityColor = () => {
    switch (dataQuality) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDataQualityText = () => {
    switch (dataQuality) {
      case 'high': return 'All sources connected';
      case 'medium': return 'Some sources connected';
      case 'low': return 'Limited data sources';
      default: return 'Unknown';
    }
  };

  if (mode === 'template-select') {
    return (
      <div className={`kpi-dashboard ${className}`}>
        <KPITemplateSelector
          selectedTemplate={config.templateId}
          onTemplateSelect={handleTemplateSelect}
          onCustomize={() => setMode('customize')}
        />
      </div>
    );
  }

  if (mode === 'customize') {
    return (
      <div className={`kpi-dashboard ${className}`}>
        <CustomKPIBuilder
          selectedTemplate={config.templateId}
          onSave={handleCustomizeComplete}
          onBack={() => setMode('view')}
        />
      </div>
    );
  }

  return (
    <div className={`kpi-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
          <div className="flex items-center space-x-4 mt-1">
            <span className={`text-sm ${getDataQualityColor()}`}>
              {getDataQualityText()}
            </span>
            {lastRefresh && (
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={config.dateRange}
            onChange={(e) => saveDashboardConfig({ dateRange: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setMode('customize')}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Customize dashboard"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => setMode('template-select')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Change Template
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading KPI data...</span>
        </div>
      )}

      {/* KPI Display */}
      {!loading && (
        <MayaKPIBar
          metrics={metrics}
          displayMode={config.displayMode}
          showDataSources={config.showDataSources}
          onMetricClick={handleMetricClick}
          onAddMetric={handleAddMetric}
          className="mb-6"
        />
      )}

      {/* Empty State */}
      {!loading && metrics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Configured</h3>
          <p className="text-gray-600 mb-6">
            Select a template or create custom KPIs to get started with your dashboard.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setMode('template-select')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Choose Template
            </button>
            <button
              onClick={() => setMode('customize')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Create Custom KPIs
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Footer */}
      {!loading && metrics.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-6">
              <span>Showing {metrics.length} KPIs</span>
              <span>
                Data quality: 
                <span className={`ml-1 font-medium ${getDataQualityColor()}`}>
                  {dataQuality.charAt(0).toUpperCase() + dataQuality.slice(1)}
                </span>
              </span>
              {config.templateId && (
                <span>Template: {config.templateId.charAt(0).toUpperCase() + config.templateId.slice(1)}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 hover:text-gray-700">
                <Download size={14} />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-gray-700">
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIDashboard;