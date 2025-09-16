/**
 * Platform Integration Bridge
 * Connects new unified chart system with existing platform-connection-service
 */

import { platformConnectionService, ConnectedPlatform } from '@/lib/services/platform-connection-service';
import { supabase } from '@/lib/supabase-campaign-service';
import { PlatformConnector, StandardMetrics, UnifiedMetrics, PlatformMetrics, DateRange } from './types';
import { platformRegistry } from './platform-registry';

export class PlatformIntegrationBridge {
  private static instance: PlatformIntegrationBridge | null = null;
  
  static getInstance(): PlatformIntegrationBridge {
    if (!this.instance) {
      this.instance = new PlatformIntegrationBridge();
    }
    return this.instance;
  }

  private constructor() {
    console.log('🌉 Platform Integration Bridge initialized');
  }

  /**
   * Get unified data leveraging existing platform connections
   */
  async getUnifiedPlatformData(userId: string): Promise<UnifiedMetrics> {
    console.log('🌉 Fetching unified data for user:', userId);

    try {
      // Use existing platform connection service
      const connectedPlatforms = await platformConnectionService.getConnectedPlatforms(userId);
      console.log('🌉 Found connected platforms:', connectedPlatforms.map(p => p.name));

      // Filter to advertising platforms (where we have chart data)
      const adPlatforms = connectedPlatforms.filter(p => p.type === 'advertising');
      console.log('🌉 Advertising platforms:', adPlatforms.map(p => p.name));

      // Fetch data from existing campaign_metrics table for each platform
      const platformDataPromises = adPlatforms.map(async (platform): Promise<PlatformMetrics> => {
        try {
          // Use your existing campaign_metrics table structure
          const { data: campaignData, error } = await supabase
            .from('campaign_metrics')
            .select('metrics_data, created_at, data_quality_score, freshness_hours')
            .eq('user_id', userId)
            .eq('platform', this.mapPlatformName(platform.platform))
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('🌉 Database error for platform', platform.platform, error);
            throw error;
          }

          const latestData = campaignData?.[0];
          
          if (!latestData) {
            console.log('🌉 No data found for platform', platform.platform, '- using fallback');
            return this.createFallbackPlatformMetrics(platform);
          }

          // Transform existing data to unified format
          const standardMetrics = this.transformExistingDataToStandard(
            latestData.metrics_data, 
            platform.platform
          );

          // Calculate freshness
          const freshness = this.calculateDataFreshness(latestData.created_at);

          return {
            platform: platform.platform,
            platformName: platform.name,
            platformType: this.mapPlatformType(platform.platform),
            metrics: standardMetrics,
            quality: latestData.data_quality_score || 1.0,
            freshness,
            lastSync: new Date(latestData.created_at)
          };

        } catch (error) {
          console.error('🌉 Error fetching data for platform', platform.platform, error);
          return this.createFallbackPlatformMetrics(platform);
        }
      });

      const platformResults = await Promise.all(platformDataPromises);

      // Calculate overall quality
      const overallQuality = platformResults.reduce((sum, result) => sum + result.quality, 0) / platformResults.length;
      
      // Create data freshness map
      const dataFreshness = platformResults.reduce((acc, result) => {
        acc[result.platform] = result.freshness;
        return acc;
      }, {} as Record<string, string>);

      // Generate cross-platform insights
      const crossPlatformInsights = await this.generateCrossPlatformInsights(platformResults);

      return {
        platforms: platformResults,
        crossPlatformInsights,
        overallQuality,
        lastUpdated: new Date(),
        dataFreshness
      };

    } catch (error) {
      console.error('🌉 Error in getUnifiedPlatformData:', error);
      
      // Return fallback data
      return {
        platforms: [],
        crossPlatformInsights: [],
        overallQuality: 0.5,
        lastUpdated: new Date(),
        dataFreshness: {}
      };
    }
  }

  /**
   * Map platform names between existing system and new system
   */
  private mapPlatformName(platformId: string): string {
    const mapping = {
      'google_ads': 'google_ads',
      'meta_ads': 'facebook_ads', 
      'google_analytics': 'google_analytics',
      'mixpanel': 'mixpanel',
      'tiktok_ads': 'tiktok_ads',
      'linkedin_ads': 'linkedin_ads',
      'twitter_ads': 'twitter_ads',
      'snapchat_ads': 'snapchat_ads',
      'pinterest_ads': 'pinterest_ads'
    };
    
    return mapping[platformId] || platformId;
  }

  /**
   * Map platform type from existing system
   */
  private mapPlatformType(platformId: string): 'advertising' | 'analytics' | 'social' | 'ecommerce' | 'crm' {
    const typeMapping = {
      'google_ads': 'advertising',
      'meta_ads': 'advertising',
      'google_analytics': 'analytics',
      'mixpanel': 'analytics',
      'tiktok_ads': 'social',
      'linkedin_ads': 'advertising',
      'twitter_ads': 'social',
      'snapchat_ads': 'social',
      'pinterest_ads': 'social',
      'shopify': 'ecommerce',
      'salesforce': 'crm'
    } as const;
    
    return typeMapping[platformId] || 'advertising';
  }

  /**
   * Transform existing campaign_metrics data to unified StandardMetrics format
   */
  private transformExistingDataToStandard(metricsData: any, platformId: string): StandardMetrics {
    console.log('🌉 Transforming data for platform:', platformId, 'Data keys:', Object.keys(metricsData || {}));

    // Handle different platform data structures
    switch (platformId) {
      case 'google_ads':
        return {
          impressions: metricsData.impressions || 0,
          clicks: metricsData.clicks || 0,
          spend: metricsData.spend || metricsData.cost || 0,
          conversions: metricsData.conversions || 0,
          costPerClick: metricsData.avg_cpc || metricsData.costPerClick || 0,
          clickThroughRate: metricsData.ctr || metricsData.clickThroughRate || 0,
          conversionRate: metricsData.conversion_rate || metricsData.conversionRate || 0,
          platform: platformId,
          dataType: 'advertising',
          timestamp: new Date(),
          currency: metricsData.currency || 'USD',
          platformSpecific: metricsData
        };

      case 'google_analytics':
        return {
          users: metricsData.users || metricsData.totalUsers || 0,
          sessions: metricsData.sessions || 0,
          pageViews: metricsData.pageViews || metricsData.screenPageViews || 0,
          engagementRate: metricsData.engagementRate || 0,
          conversionRate: metricsData.conversionRate || 0,
          conversions: metricsData.conversions || 0,
          platform: platformId,
          dataType: 'analytics',
          timestamp: new Date(),
          platformSpecific: metricsData
        };

      case 'mixpanel':
        return {
          users: metricsData.totalUsers || metricsData.users || 0,
          engagementRate: metricsData.engagementScore || metricsData.engagementRate || 0,
          conversions: metricsData.conversions || 0,
          conversionRate: metricsData.conversionRate || 0,
          platform: platformId,
          dataType: 'analytics',
          timestamp: new Date(),
          platformSpecific: metricsData
        };

      default:
        // Generic transformation for unknown platforms
        return {
          impressions: metricsData.impressions || metricsData.reach || 0,
          clicks: metricsData.clicks || metricsData.link_clicks || 0,
          users: metricsData.users || metricsData.unique_users || 0,
          spend: metricsData.spend || metricsData.amount_spent || 0,
          conversions: metricsData.conversions || metricsData.actions || 0,
          platform: platformId,
          dataType: 'mixed',
          timestamp: new Date(),
          platformSpecific: metricsData
        };
    }
  }

  /**
   * Calculate data freshness from timestamp
   */
  private calculateDataFreshness(timestamp: string): string {
    const now = new Date();
    const dataTime = new Date(timestamp);
    const diffMs = now.getTime() - dataTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  }

  /**
   * Create fallback metrics when data is missing
   */
  private createFallbackPlatformMetrics(platform: ConnectedPlatform): PlatformMetrics {
    const fallbackData = this.getFallbackData(platform.platform);
    
    return {
      platform: platform.platform,
      platformName: platform.name,
      platformType: this.mapPlatformType(platform.platform),
      metrics: {
        ...fallbackData,
        platform: platform.platform,
        dataType: 'fallback',
        timestamp: new Date(),
        platformSpecific: { isFallback: true }
      },
      quality: 0.5,
      freshness: 'Using demo data',
      error: 'No recent data available'
    };
  }

  /**
   * Get fallback demo data for different platforms
   */
  private getFallbackData(platformId: string): Partial<StandardMetrics> {
    const fallbackDataSets = {
      google_ads: {
        impressions: 48200,
        clicks: 1910,
        spend: 4500,
        conversions: 78,
        costPerClick: 2.35,
        clickThroughRate: 3.96,
        conversionRate: 4.08
      },
      google_analytics: {
        users: 12350,
        sessions: 15420,
        pageViews: 45680,
        engagementRate: 67.8,
        conversions: 156,
        conversionRate: 1.01
      },
      mixpanel: {
        users: 15420,
        engagementRate: 78.5,
        conversions: 245,
        conversionRate: 45.0
      },
      meta_ads: {
        impressions: 35600,
        clicks: 1240,
        spend: 2800,
        conversions: 42,
        costPerClick: 2.26,
        clickThroughRate: 3.48
      }
    };

    return fallbackDataSets[platformId] || {
      users: 1000,
      sessions: 1200,
      conversions: 50,
      conversionRate: 4.2
    };
  }

  /**
   * Generate cross-platform insights
   */
  private async generateCrossPlatformInsights(platformResults: PlatformMetrics[]) {
    const insights = [];

    // Multi-platform performance insight
    if (platformResults.length > 1) {
      const totalSpend = platformResults.reduce((sum, p) => sum + (p.metrics.spend || 0), 0);
      const totalConversions = platformResults.reduce((sum, p) => sum + (p.metrics.conversions || 0), 0);
      const avgQuality = platformResults.reduce((sum, p) => sum + p.quality, 0) / platformResults.length;

      insights.push({
        type: 'correlation' as const,
        title: 'Multi-Platform Performance',
        description: `Your ${platformResults.length} connected platforms generated ${totalConversions} conversions from $${totalSpend.toLocaleString()} total spend.`,
        confidence: avgQuality,
        platforms: platformResults.map(p => p.platform),
        value: totalConversions,
        metadata: {
          totalSpend,
          platformCount: platformResults.length,
          averageQuality: avgQuality
        }
      });
    }

    // Platform comparison insight
    if (platformResults.length >= 2) {
      const bestPlatform = platformResults.reduce((best, current) => 
        (current.metrics.conversions || 0) > (best.metrics.conversions || 0) ? current : best
      );

      insights.push({
        type: 'benchmark' as const,
        title: 'Top Performing Platform',
        description: `${bestPlatform.platformName} is your best performing platform with ${bestPlatform.metrics.conversions} conversions.`,
        confidence: bestPlatform.quality,
        platforms: [bestPlatform.platform],
        value: bestPlatform.metrics.conversions || 0,
        metadata: {
          platformName: bestPlatform.platformName,
          quality: bestPlatform.quality
        }
      });
    }

    return insights;
  }

  /**
   * Check if platform is connected using existing service
   */
  async isPlatformConnected(userId: string, platformId: string): Promise<boolean> {
    return await platformConnectionService.isPlatformConnected(userId, platformId);
  }

  /**
   * Get connection counts using existing service
   */
  async getConnectionCounts(userId: string) {
    return await platformConnectionService.getConnectionCounts(userId);
  }

  /**
   * Clear cache when platforms are connected/disconnected
   */
  clearCache(userId: string): void {
    platformConnectionService.clearUserCache(userId);
  }
}

// Export singleton instance
export const platformIntegrationBridge = PlatformIntegrationBridge.getInstance();