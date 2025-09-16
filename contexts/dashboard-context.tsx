'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { DashboardService } from '@/lib/dashboard-service';
import { supabase } from '@/lib/supabase/client';

export interface DashboardMetrics {
  totalRevenue: number;
  activeCampaigns: number;
  conversionRate: number;
  audienceReach: number;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  roas: number;
}

export interface PlatformData {
  google_ads: {
    campaigns: any[];
    summary: any;
    performanceData: any[];
    connected: boolean;
  };
  meta_ads: {
    campaigns: any[];
    summary: any;
    performanceData: any[];
    connected: boolean;
  };
  youtube: {
    videos: any[];
    channelMetrics: any;
    connected: boolean;
  };
  mixpanel: {
    eventInsights: any[];
    funnelData: any[];
    connected: boolean;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  platforms: PlatformData;
  audienceInsights: any[];
  mayaRecommendations: any[];
  recentActivity: any[];
  creditsUsage: {
    used: number;
    limit: number;
    remaining: number;
    plan: string;
  };
  connectedPlatforms: string[];
  lastUpdated: string;
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshPlatform: (platform: string) => Promise<void>;
  isRefreshing: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardService, setDashboardService] = useState<DashboardService | null>(null);

  // Initialize dashboard service when user is available
  useEffect(() => {
    if (user?.uid) {
      const service = new DashboardService(user.uid);
      setDashboardService(service);
    }
  }, [user?.uid]);

  // Initial data load
  useEffect(() => {
    if (dashboardService && user?.uid) {
      loadDashboardData();
    }
  }, [dashboardService, user?.uid]);

  // Real-time subscription to Supabase changes
  useEffect(() => {
    if (!user?.uid) return;

    const subscription = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_metrics',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          console.log('Campaign metrics updated:', payload);
          // Refresh data in background without showing loading state
          refreshDataSilently();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_logs',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          console.log('Automation logs updated:', payload);
          // Refresh recent activity
          refreshDataSilently();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.uid]);

  const loadDashboardData = async () => {
    if (!dashboardService) return;

    try {
      setLoading(true);
      setError(null);

      const dashboardData = await dashboardService.getAllDashboardData();
      setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard data load error:', err);
      
      // Set fallback data to prevent UI breakage
      setData({
        metrics: {
          totalRevenue: 0,
          activeCampaigns: 0,
          conversionRate: 0,
          audienceReach: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalSpend: 0,
          totalConversions: 0,
          averageCtr: 0,
          averageCpc: 0,
          roas: 0,
        },
        platforms: {
          google_ads: { campaigns: [], summary: {}, performanceData: [], connected: false },
          meta_ads: { campaigns: [], summary: {}, performanceData: [], connected: false },
          youtube: { videos: [], channelMetrics: {}, connected: false },
          mixpanel: { eventInsights: [], funnelData: [], connected: false },
        },
        audienceInsights: [],
        mayaRecommendations: [],
        recentActivity: [],
        creditsUsage: { used: 0, limit: 25, remaining: 25, plan: 'free' },
        connectedPlatforms: [],
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshDataSilently = useCallback(async () => {
    if (!dashboardService || isRefreshing) return;

    try {
      const dashboardData = await dashboardService.getAllDashboardData();
      setData(dashboardData);
    } catch (err) {
      console.error('Silent refresh error:', err);
      // Don't update error state for silent refresh
    }
  }, [dashboardService, isRefreshing]);

  const refreshData = useCallback(async () => {
    if (!dashboardService) return;

    try {
      setIsRefreshing(true);
      setError(null);

      const dashboardData = await dashboardService.getAllDashboardData();
      setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh dashboard data';
      setError(errorMessage);
      console.error('Dashboard refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboardService]);

  const refreshPlatform = useCallback(async (platform: string) => {
    if (!dashboardService || !data) return;

    try {
      setIsRefreshing(true);
      
      let updatedPlatformData;
      switch (platform) {
        case 'google_ads':
          updatedPlatformData = await dashboardService.getGoogleAdsData();
          break;
        case 'meta_ads':
          updatedPlatformData = await dashboardService.getMetaAdsData();
          break;
        case 'youtube':
          updatedPlatformData = await dashboardService.getYouTubeData();
          break;
        case 'mixpanel':
          updatedPlatformData = await dashboardService.getMixpanelData();
          break;
        default:
          return;
      }

      setData(prev => prev ? {
        ...prev,
        platforms: {
          ...prev.platforms,
          [platform]: updatedPlatformData,
        },
        lastUpdated: new Date().toISOString(),
      } : null);
    } catch (err) {
      console.error(`Error refreshing ${platform}:`, err);
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboardService, data]);

  const value: DashboardContextType = {
    data,
    loading,
    error,
    refreshData,
    refreshPlatform,
    isRefreshing,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Individual platform hooks for granular control
export function usePlatformData(platform: keyof PlatformData) {
  const { data, loading, error, refreshPlatform, isRefreshing } = useDashboard();
  
  return {
    platformData: data?.platforms[platform] || null,
    loading,
    error,
    refresh: () => refreshPlatform(platform),
    isRefreshing,
  };
}

export function useDashboardMetrics() {
  const { data, loading, error, refreshData, isRefreshing } = useDashboard();
  
  return {
    metrics: data?.metrics || null,
    loading,
    error,
    refresh: refreshData,
    isRefreshing,
  };
}

export function useCreditsUsage() {
  const { data, loading, error } = useDashboard();
  
  return {
    creditsUsage: data?.creditsUsage || null,
    loading,
    error,
  };
}