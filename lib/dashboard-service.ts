import { GoogleAdsService } from './google-ads-service';
import { MetaAdsService } from './meta-ads-service';
import { MixpanelService } from './mixpanel-service';
import { SupabaseService } from './supabase-campaign-service';
import { YouTubeClientService } from './youtube-client-service';
import { GoogleAnalyticsClientService } from './google-analytics-client-service';
import { GoogleShoppingClientService } from './google-shopping-client-service';
import { GoogleSearchConsoleClientService } from './google-search-console-client-service';
import { GoogleMyBusinessClientService } from './google-my-business-client-service';
import { supabase } from './supabase/client';
import { DashboardData, DashboardMetrics, PlatformData } from '@/contexts/dashboard-context';

export class DashboardService {
  private userId: string;
  private googleAdsService: GoogleAdsService;
  private metaAdsService: MetaAdsService;
  private mixpanelService: MixpanelService;
  private supabaseService: SupabaseService;
  private youtubeService: YouTubeClientService;
  private googleAnalyticsService: GoogleAnalyticsClientService;
  private googleShoppingService: GoogleShoppingClientService;
  private googleSearchConsoleService: GoogleSearchConsoleClientService;
  private googleMyBusinessService: GoogleMyBusinessClientService;

  constructor(userId: string) {
    this.userId = userId;
    this.googleAdsService = new GoogleAdsService(userId);
    this.metaAdsService = new MetaAdsService(userId);
    this.mixpanelService = new MixpanelService(userId);
    this.supabaseService = new SupabaseService(userId);
    this.youtubeService = new YouTubeClientService(userId);
    this.googleAnalyticsService = new GoogleAnalyticsClientService(userId);
    this.googleShoppingService = new GoogleShoppingClientService(userId);
    this.googleSearchConsoleService = new GoogleSearchConsoleClientService(userId);
    this.googleMyBusinessService = new GoogleMyBusinessClientService(userId);
  }

  async getAllDashboardData(): Promise<DashboardData> {
    try {
      // Fetch all data in parallel for better performance
      const [
        platformsData,
        audienceInsights,
        mayaRecommendations,
        recentActivity,
        creditsUsage,
        connectedPlatforms,
      ] = await Promise.all([
        this.getAllPlatformData(),
        this.getAudienceInsights(),
        this.getMayaRecommendations(),
        this.getRecentActivity(),
        this.getCreditsUsage(),
        this.getConnectedPlatforms(),
      ]);

      // Calculate overall metrics from platform data
      const metrics = this.calculateOverallMetrics(platformsData);

      return {
        metrics,
        platforms: platformsData,
        audienceInsights,
        mayaRecommendations,
        recentActivity,
        creditsUsage,
        connectedPlatforms,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  async getAllPlatformData(): Promise<PlatformData> {
    // Fetch platform data in parallel with graceful fallbacks
    const [
      googleAdsData, 
      metaAdsData, 
      youtubeData, 
      mixpanelData,
      googleAnalyticsData,
      googleShoppingData,
      googleSearchConsoleData,
      googleMyBusinessData
    ] = await Promise.allSettled([
      this.getGoogleAdsData(),
      this.getMetaAdsData(),
      this.getYouTubeData(),
      this.getMixpanelData(),
      this.getGoogleAnalyticsData(),
      this.getGoogleShoppingData(),
      this.getGoogleSearchConsoleData(),
      this.getGoogleMyBusinessData(),
    ]);

    return {
      google_ads: googleAdsData.status === 'fulfilled' ? googleAdsData.value : {
        campaigns: [],
        summary: {},
        performanceData: [],
        connected: false,
      },
      meta_ads: metaAdsData.status === 'fulfilled' ? metaAdsData.value : {
        campaigns: [],
        summary: {},
        performanceData: [],
        connected: false,
      },
      youtube: youtubeData.status === 'fulfilled' ? youtubeData.value : {
        videos: [],
        channelMetrics: {},
        connected: false,
      },
      mixpanel: mixpanelData.status === 'fulfilled' ? mixpanelData.value : {
        eventInsights: [],
        funnelData: [],
        connected: false,
      },
      google_analytics: googleAnalyticsData.status === 'fulfilled' ? googleAnalyticsData.value : {
        metrics: {},
        trafficSources: [],
        topPages: [],
        connected: false,
      },
      google_shopping: googleShoppingData.status === 'fulfilled' ? googleShoppingData.value : {
        products: [],
        metrics: {},
        connected: false,
      },
      google_search_console: googleSearchConsoleData.status === 'fulfilled' ? googleSearchConsoleData.value : {
        metrics: {},
        indexing: {},
        connected: false,
      },
      google_my_business: googleMyBusinessData.status === 'fulfilled' ? googleMyBusinessData.value : {
        metrics: {},
        reviews: [],
        connected: false,
      },
    };
  }

  async getGoogleAdsData() {
    try {
      // First try to get cached data from Supabase
      const cachedData = await this.getCachedCampaignData('google_ads');
      
      if (cachedData && cachedData.length > 0 && this.isCacheValid(cachedData[0].created_at)) {
        return this.formatGoogleAdsData(cachedData);
      }

      // If cache is stale or empty, try to fetch fresh data (credit-aware)
      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        try {
          const freshData = await this.googleAdsService.fetchGoogleAdsData();
          
          // Cache the fresh data if it's valid
          if (freshData && freshData.connected) {
            // Cache in background - don't await to avoid blocking
            this.cacheCampaignData('google_ads', freshData).catch(err => 
              console.warn('Background cache failed for google_ads:', err)
            );
          }
          
          return freshData;
        } catch (fetchError) {
          console.error('Error fetching fresh Google Ads data:', fetchError);
          // Fall back to cached data even if stale
          return cachedData && cachedData.length > 0 ? this.formatGoogleAdsData(cachedData) : {
            campaigns: [],
            summary: {},
            performanceData: [],
            connected: false,
          };
        }
      } else {
        // Use cached data even if stale, or return minimal structure
        return cachedData && cachedData.length > 0 ? this.formatGoogleAdsData(cachedData) : {
          campaigns: [],
          summary: {},
          performanceData: [],
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
      return {
        campaigns: [],
        summary: {},
        performanceData: [],
        connected: false,
      };
    }
  }

  async getMetaAdsData() {
    try {
      const cachedData = await this.getCachedCampaignData('meta_ads');
      
      if (cachedData && this.isCacheValid(cachedData.lastUpdated)) {
        return this.formatMetaAdsData(cachedData);
      }

      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const freshData = await this.metaAdsService.fetchMetaAdsData();
        // Cache in background - don't await to avoid blocking
        this.cacheCampaignData('meta_ads', freshData).catch(err => 
          console.warn('Background cache failed for meta_ads:', err)
        );
        return freshData;
      } else {
        return cachedData ? this.formatMetaAdsData(cachedData) : {
          campaigns: [],
          summary: {},
          performanceData: [],
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Meta Ads data:', error);
      return {
        campaigns: [],
        summary: {},
        performanceData: [],
        connected: false,
      };
    }
  }

  async getYouTubeData() {
    try {
      const cachedData = await this.getCachedVideoData();
      
      if (cachedData && this.isCacheValid(cachedData.lastUpdated)) {
        return this.formatYouTubeData(cachedData);
      }

      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const [channelPerformance, topVideos] = await Promise.all([
          this.youtubeService.fetchChannelPerformance(),
          this.youtubeService.listTopVideos(),
        ]);

        const freshData = {
          videos: topVideos,
          channelMetrics: channelPerformance.channelMetrics || {},
          connected: channelPerformance.connected,
        };

        await this.cacheVideoData(freshData);
        return freshData;
      } else {
        return cachedData ? this.formatYouTubeData(cachedData) : {
          videos: [],
          channelMetrics: {},
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      return {
        videos: [],
        channelMetrics: {},
        connected: false,
      };
    }
  }

  async getMixpanelData() {
    try {
      const cachedData = await this.getCachedEventData();
      
      if (cachedData && this.isCacheValid(cachedData.lastUpdated)) {
        return this.formatMixpanelData(cachedData);
      }

      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const [eventInsights, funnelData] = await Promise.all([
          this.mixpanelService.getEventInsights(),
          this.mixpanelService.funnelDropoffs(),
        ]);

        const freshData = {
          eventInsights,
          funnelData,
          connected: true,
        };

        await this.cacheEventData(freshData);
        return freshData;
      } else {
        return cachedData ? this.formatMixpanelData(cachedData) : {
          eventInsights: [],
          funnelData: [],
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Mixpanel data:', error);
      return {
        eventInsights: [],
        funnelData: [],
        connected: false,
      };
    }
  }

  async getGoogleAnalyticsData() {
    try {
      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const analyticsData = await this.googleAnalyticsService.fetchTrafficMetrics();
        return analyticsData;
      } else {
        return {
          metrics: {},
          trafficSources: [],
          topPages: [],
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Google Analytics data:', error);
      return {
        metrics: {},
        trafficSources: [],
        topPages: [],
        connected: false,
      };
    }
  }

  async getGoogleShoppingData() {
    try {
      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const shoppingData = await this.googleShoppingService.fetchProducts();
        return shoppingData;
      } else {
        return {
          products: [],
          metrics: {},
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Google Shopping data:', error);
      return {
        products: [],
        metrics: {},
        connected: false,
      };
    }
  }

  async getGoogleSearchConsoleData() {
    try {
      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const searchConsoleData = await this.googleSearchConsoleService.getSearchPerformance();
        return searchConsoleData;
      } else {
        return {
          metrics: {},
          indexing: {},
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Google Search Console data:', error);
      return {
        metrics: {},
        indexing: {},
        connected: false,
      };
    }
  }

  async getGoogleMyBusinessData() {
    try {
      const canFetchFresh = await this.canMakeApiCall();
      
      if (canFetchFresh) {
        const myBusinessData = await this.googleMyBusinessService.getBusinessMetrics();
        return myBusinessData;
      } else {
        return {
          metrics: {},
          reviews: [],
          connected: false,
        };
      }
    } catch (error) {
      console.error('Error fetching Google My Business data:', error);
      return {
        metrics: {},
        reviews: [],
        connected: false,
      };
    }
  }

  async getAudienceInsights() {
    try {
      const { data, error } = await supabase
        .from('user_audience_insights')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audience insights:', error);
      return [];
    }
  }

  async getMayaRecommendations() {
    try {
      // Call Maya recommendations API without auth header since it uses NextAuth
      const response = await fetch('/api/maya-recommendations');

      if (!response.ok) {
        console.warn('Maya recommendations API not available, returning mock data');
        // Return mock recommendations for demo purposes
        return [
          {
            id: 'rec-1',
            type: 'agent_assignment',
            title: 'Optimize Agent Assignments',
            description: 'Consider assigning high-priority support cases to Sarah Wilson (94% success rate)',
            urgency: 'medium',
            impact: 'Improve response efficiency'
          },
          {
            id: 'rec-2', 
            type: 'automation',
            title: 'Enable AI for FAQ Queries',
            description: '78% of incoming messages are FAQ-related and could be handled by Maya AI',
            urgency: 'low',
            impact: 'Save 4.2 hours/day'
          }
        ];
      }
      
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching Maya recommendations:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async getRecentActivity() {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getCreditsUsage() {
    try {
      // Try backend first
      const response = await fetch('/api/metrics/credits', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data.credits : this.getDefaultCredits();
      }
      
      // Fallback to direct Supabase query
      return await this.getCreditsFromSupabase();
    } catch (error) {
      console.error('Error fetching credits usage:', error);
      return this.getDefaultCredits();
    }
  }

  private async getCreditsFromSupabase() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayUsage, error } = await supabase
        .from('agentic_usage_logs')
        .select('credits_used')
        .eq('user_id', this.userId)
        .eq('date', today);
      
      if (error) throw error;
      
      const totalUsed = todayUsage?.reduce((sum, log) => sum + log.credits_used, 0) || 0;
      const dailyLimit = 25; // Default to free plan
      
      return {
        used: totalUsed,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - totalUsed),
        plan: 'free',
      };
    } catch (error) {
      console.error('Error fetching credits from Supabase:', error);
      return this.getDefaultCredits();
    }
  }

  private getDefaultCredits() {
    return {
      used: 0,
      limit: 25,
      remaining: 25,
      plan: 'free',
    };
  }

  async getConnectedPlatforms() {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('platform')
        .eq('user_id', this.userId);

      if (error) throw error;
      return data?.map(token => token.platform) || [];
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
      return [];
    }
  }

  private calculateOverallMetrics(platformData: PlatformData): DashboardMetrics {
    const googleSummary = platformData.google_ads.summary || {};
    const metaSummary = platformData.meta_ads.summary || {};
    
    const totalImpressions = (googleSummary.totalImpressions || 0) + (metaSummary.totalImpressions || 0);
    const totalClicks = (googleSummary.totalClicks || 0) + (metaSummary.totalClicks || 0);
    const totalSpend = (googleSummary.totalSpend || 0) + (metaSummary.totalSpend || 0);
    const totalConversions = (googleSummary.totalConversions || 0) + (metaSummary.totalConversions || 0);

    return {
      totalRevenue: totalSpend,
      activeCampaigns: (platformData.google_ads.campaigns?.length || 0) + (platformData.meta_ads.campaigns?.length || 0),
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      audienceReach: totalImpressions,
      totalImpressions,
      totalClicks,
      totalSpend,
      totalConversions,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      roas: totalSpend > 0 ? (totalConversions * 50) / totalSpend : 0, // Assuming $50 average order value
    };
  }

  private async canMakeApiCall(): Promise<boolean> {
    const creditsUsage = await this.getCreditsUsage();
    return creditsUsage.remaining > 0;
  }

  private isCacheValid(lastUpdated: string): boolean {
    const cacheMaxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - new Date(lastUpdated).getTime() < cacheMaxAge;
  }

  private async getCachedCampaignData(platform: string) {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('user_id', this.userId)
      .eq('platform', platform)
      .order('created_at', { ascending: false });

    if (error) return null;
    return data;
  }

  private async getCachedVideoData() {
    // Similar implementation for video data cache
    return null; // Placeholder
  }

  private async getCachedEventData() {
    // Similar implementation for event data cache
    return null; // Placeholder
  }

  private async cacheCampaignData(platform: string, data: any) {
    // Cache implementation using Supabase
    try {
      if (!data) {
        console.warn(`No data provided for caching ${platform} campaigns`);
        return;
      }
      
      const result = await this.supabaseService.saveCampaignSnapshot(platform, data);
      if (result) {
        console.log(`Successfully cached ${platform} campaign data`);
      } else {
        console.log(`No campaigns cached for ${platform} (data structure not supported)`);
      }
    } catch (error) {
      console.error(`Error caching ${platform} campaign data:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        platform,
        dataKeys: data ? Object.keys(data) : 'no data'
      });
      // Don't re-throw - let the dashboard continue working even if caching fails
    }
  }

  private async cacheVideoData(data: any) {
    // Cache implementation for video data
  }

  private async cacheEventData(data: any) {
    // Cache implementation for event data
  }

  private formatGoogleAdsData(cachedData: any) {
    // Format cached data to match expected structure
    return {
      campaigns: cachedData || [],
      summary: {},
      performanceData: [],
      connected: true,
    };
  }

  private formatMetaAdsData(cachedData: any) {
    // Format cached data to match expected structure
    return {
      campaigns: cachedData || [],
      summary: {},
      performanceData: [],
      connected: true,
    };
  }

  private formatYouTubeData(cachedData: any) {
    // Format cached data to match expected structure
    return {
      videos: cachedData || [],
      channelMetrics: {},
      connected: true,
    };
  }

  private formatMixpanelData(cachedData: any) {
    // Format cached data to match expected structure
    return {
      eventInsights: cachedData || [],
      funnelData: [],
      connected: true,
    };
  }

  private async getAuthToken(): Promise<string> {
    try {
      // Client-side: get from Firebase Auth
      if (typeof window !== 'undefined') {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          return await auth.currentUser.getIdToken();
        }
      }
      
      // Server-side or fallback: get from NextAuth session
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      return session?.accessToken as string || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }
}