'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '@/contexts/dashboard-context';
import { useAuth } from '@/contexts/auth-context';

export interface DashboardWidgetData {
  // Quick Stats
  totalRevenue: number;
  activeCampaigns: number;
  conversionRate: number;
  audienceReach: number;
  
  // Performance Metrics
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  averageCpc: number;
  roas: number;
  
  // Platform specific data
  googleAdsData: {
    connected: boolean;
    campaigns: any[];
    summary: any;
    performanceData: any[];
  };
  
  metaAdsData: {
    connected: boolean;
    campaigns: any[];
    summary: any;
    performanceData: any[];
  };
  
  youtubeData: {
    connected: boolean;
    videos: any[];
    channelMetrics: any;
  };
  
  mixpanelData: {
    connected: boolean;
    eventInsights: any[];
    funnelData: any[];
  };
  
  // Maya & Insights
  mayaRecommendations: any[];
  audienceInsights: any[];
  recentActivity: any[];
  
  // Credits & Usage
  creditsUsage: {
    used: number;
    limit: number;
    remaining: number;
    plan: string;
  };
  
  // Meta info
  connectedPlatforms: string[];
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const { data, loading, error, refreshData, refreshPlatform, isRefreshing } = useDashboard();
  const { user, userProfile } = useAuth();
  const [widgetData, setWidgetData] = useState<DashboardWidgetData | null>(null);

  // Transform dashboard data into widget-friendly format
  useEffect(() => {
    if (data) {
      const transformedData: DashboardWidgetData = {
        // Quick Stats
        totalRevenue: data.metrics.totalRevenue || 0,
        activeCampaigns: data.metrics.activeCampaigns || 0,
        conversionRate: data.metrics.conversionRate || 0,
        audienceReach: data.metrics.audienceReach || 0,
        
        // Performance Metrics
        totalImpressions: data.metrics.totalImpressions || 0,
        totalClicks: data.metrics.totalClicks || 0,
        averageCtr: data.metrics.averageCtr || 0,
        averageCpc: data.metrics.averageCpc || 0,
        roas: data.metrics.roas || 0,
        
        // Platform Data
        googleAdsData: data.platforms.google_ads || {
          connected: false,
          campaigns: [],
          summary: {},
          performanceData: [],
        },
        
        metaAdsData: data.platforms.meta_ads || {
          connected: false,
          campaigns: [],
          summary: {},
          performanceData: [],
        },
        
        youtubeData: data.platforms.youtube || {
          connected: false,
          videos: [],
          channelMetrics: {},
        },
        
        mixpanelData: data.platforms.mixpanel || {
          connected: false,
          eventInsights: [],
          funnelData: [],
        },
        
        // Maya & Insights
        mayaRecommendations: data.mayaRecommendations || [],
        audienceInsights: data.audienceInsights || [],
        recentActivity: data.recentActivity || [],
        
        // Credits & Usage
        creditsUsage: data.creditsUsage || {
          used: 0,
          limit: 25,
          remaining: 25,
          plan: 'free',
        },
        
        // Meta info
        connectedPlatforms: data.connectedPlatforms || [],
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        isLoading: loading || isRefreshing,
        error,
      };
      
      setWidgetData(transformedData);
    }
  }, [data, loading, error, isRefreshing]);

  // Widget-specific data getters
  const getQuickStats = useCallback(() => {
    if (!widgetData) return null;
    
    return {
      totalRevenue: widgetData.totalRevenue,
      activeCampaigns: widgetData.activeCampaigns,
      conversionRate: widgetData.conversionRate,
      audienceReach: widgetData.audienceReach,
    };
  }, [widgetData]);

  const getPerformanceData = useCallback(() => {
    if (!widgetData) return null;
    
    return {
      totalImpressions: widgetData.totalImpressions,
      totalClicks: widgetData.totalClicks,
      averageCtr: widgetData.averageCtr,
      averageCpc: widgetData.averageCpc,
      roas: widgetData.roas,
    };
  }, [widgetData]);

  const getPlatformData = useCallback((platform: 'google_ads' | 'meta_ads' | 'youtube' | 'mixpanel') => {
    if (!widgetData) return null;
    
    switch (platform) {
      case 'google_ads':
        return widgetData.googleAdsData;
      case 'meta_ads':
        return widgetData.metaAdsData;
      case 'youtube':
        return widgetData.youtubeData;
      case 'mixpanel':
        return widgetData.mixpanelData;
      default:
        return null;
    }
  }, [widgetData]);

  const getMayaInsights = useCallback(() => {
    if (!widgetData) return null;
    
    return {
      recommendations: widgetData.mayaRecommendations,
      recentActivity: widgetData.recentActivity,
      audienceInsights: widgetData.audienceInsights,
    };
  }, [widgetData]);

  const getCreditsInfo = useCallback(() => {
    if (!widgetData) return null;
    
    return widgetData.creditsUsage;
  }, [widgetData]);

  const getConnectionStatus = useCallback(() => {
    if (!widgetData) return null;
    
    return {
      connectedPlatforms: widgetData.connectedPlatforms,
      googleAdsConnected: widgetData.googleAdsData.connected,
      metaAdsConnected: widgetData.metaAdsData.connected,
      youtubeConnected: widgetData.youtubeData.connected,
      mixpanelConnected: widgetData.mixpanelData.connected,
    };
  }, [widgetData]);

  // Performance panel data formatter
  const getPerformancePanelData = useCallback(() => {
    if (!widgetData) return null;
    
    return {
      googleAds: {
        ...widgetData.googleAdsData,
        label: 'Google Ads',
        icon: 'google',
        color: '#4285f4',
        metrics: {
          impressions: widgetData.googleAdsData.summary?.totalImpressions || 0,
          clicks: widgetData.googleAdsData.summary?.totalClicks || 0,
          spend: widgetData.googleAdsData.summary?.totalSpend || 0,
          ctr: widgetData.googleAdsData.summary?.averageCtr || 0,
          cpc: widgetData.googleAdsData.summary?.averageCpc || 0,
          conversions: widgetData.googleAdsData.summary?.totalConversions || 0,
        },
      },
      metaAds: {
        ...widgetData.metaAdsData,
        label: 'Meta Ads',
        icon: 'meta',
        color: '#1877f2',
        metrics: {
          impressions: widgetData.metaAdsData.summary?.totalImpressions || 0,
          clicks: widgetData.metaAdsData.summary?.totalClicks || 0,
          spend: widgetData.metaAdsData.summary?.totalSpend || 0,
          ctr: widgetData.metaAdsData.summary?.averageCtr || 0,
          cpc: widgetData.metaAdsData.summary?.averageCpc || 0,
          conversions: widgetData.metaAdsData.summary?.totalConversions || 0,
        },
      },
      youtube: {
        ...widgetData.youtubeData,
        label: 'YouTube',
        icon: 'youtube',
        color: '#ff0000',
        metrics: {
          views: widgetData.youtubeData.channelMetrics?.totalViews || 0,
          subscribers: widgetData.youtubeData.channelMetrics?.totalSubscribers || 0,
          watchTime: widgetData.youtubeData.channelMetrics?.totalWatchTime || 0,
          videos: widgetData.youtubeData.videos?.length || 0,
        },
      },
      mixpanel: {
        ...widgetData.mixpanelData,
        label: 'Mixpanel',
        icon: 'mixpanel',
        color: '#9333ea',
        metrics: {
          events: widgetData.mixpanelData.eventInsights?.length || 0,
          funnels: widgetData.mixpanelData.funnelData?.length || 0,
        },
      },
    };
  }, [widgetData]);

  return {
    // Main data
    data: widgetData,
    isLoading: loading || isRefreshing,
    error,
    
    // Actions
    refreshData,
    refreshPlatform,
    
    // Getters for specific widgets
    getQuickStats,
    getPerformanceData,
    getPlatformData,
    getMayaInsights,
    getCreditsInfo,
    getConnectionStatus,
    getPerformancePanelData,
    
    // Utilities
    lastUpdated: widgetData?.lastUpdated,
    canRefresh: !loading && !isRefreshing,
    hasData: !!widgetData,
    
    // User info
    user,
    userProfile,
    isAuthenticated: !!user,
  };
}

// Specialized hooks for individual widgets
export function useQuickStats() {
  const { getQuickStats, isLoading, error } = useDashboardData();
  return { data: getQuickStats(), isLoading, error };
}

export function usePerformanceMetrics() {
  const { getPerformanceData, isLoading, error } = useDashboardData();
  return { data: getPerformanceData(), isLoading, error };
}

export function usePlatformMetrics(platform: 'google_ads' | 'meta_ads' | 'youtube' | 'mixpanel') {
  const { getPlatformData, refreshPlatform, isLoading, error } = useDashboardData();
  return { 
    data: getPlatformData(platform), 
    refresh: () => refreshPlatform(platform),
    isLoading, 
    error 
  };
}

export function useMayaInsights() {
  const { getMayaInsights, isLoading, error } = useDashboardData();
  return { data: getMayaInsights(), isLoading, error };
}

export function useCreditsStatus() {
  const { getCreditsInfo, isLoading, error } = useDashboardData();
  return { data: getCreditsInfo(), isLoading, error };
}