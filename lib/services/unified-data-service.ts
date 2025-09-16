/**
 * Unified Data Service
 * Enhanced service that works with existing campaign_metrics and platform connections
 */

import { platformIntegrationBridge } from '@/lib/platforms/core/platform-integration-bridge';
import { platformRegistry } from '@/lib/platforms/core/platform-registry';
import { 
  UnifiedMetrics, 
  PlatformMetrics, 
  StandardMetrics, 
  DateRange, 
  ChartGenerationRequest,
  Insight,
  Correlation
} from '@/lib/platforms/core/types';

export class UnifiedDataService {
  private static instance: UnifiedDataService | null = null;
  private dataCache: Map<string, { data: UnifiedMetrics; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UnifiedDataService {
    if (!this.instance) {
      this.instance = new UnifiedDataService();
    }
    return this.instance;
  }

  private constructor() {
    console.log('📊 Unified Data Service initialized');
  }

  /**
   * Get unified data from all connected platforms (leverages existing connections)
   */
  async getUnifiedData(userId: string, useCache: boolean = true): Promise<UnifiedMetrics> {
    const cacheKey = `unified_${userId}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.dataCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('📊 Returning cached unified data');
        return cached.data;
      }
    }

    console.log('📊 Fetching fresh unified data for user:', userId);

    try {
      // Use the integration bridge to get data from existing platform connections
      const unifiedData = await platformIntegrationBridge.getUnifiedPlatformData(userId);
      
      // Enhance with additional analysis
      const enhancedData = await this.enhanceUnifiedData(unifiedData);

      // Cache the result
      this.dataCache.set(cacheKey, {
        data: enhancedData,
        timestamp: Date.now()
      });

      console.log('📊 Unified data fetch complete:', {
        platformCount: enhancedData.platforms.length,
        quality: (enhancedData.overallQuality * 100).toFixed(1) + '%',
        insightCount: enhancedData.crossPlatformInsights.length
      });

      return enhancedData;

    } catch (error) {
      console.error('📊 Error in getUnifiedData:', error);
      
      // Return empty but valid structure
      return {
        platforms: [],
        crossPlatformInsights: [],
        overallQuality: 0,
        lastUpdated: new Date(),
        dataFreshness: {}
      };
    }
  }

  /**
   * Get data for specific platforms only
   */
  async getPlatformData(userId: string, platformIds: string[]): Promise<PlatformMetrics[]> {
    const unifiedData = await this.getUnifiedData(userId);
    return unifiedData.platforms.filter(p => platformIds.includes(p.platform));
  }

  /**
   * Get platform data with smart filtering based on query intent
   */
  async getRelevantPlatformData(userId: string, query: string): Promise<PlatformMetrics[]> {
    const unifiedData = await this.getUnifiedData(userId);
    
    // Use platform registry to select relevant platforms
    const connectedPlatformConnectors = platformRegistry.getAll().filter(connector =>
      unifiedData.platforms.some(p => p.platform === connector.id)
    );
    
    const relevantConnectors = platformRegistry.selectRelevantPlatforms(query, connectedPlatformConnectors);
    const relevantPlatformIds = relevantConnectors.map(c => c.id);

    if (relevantPlatformIds.length === 0) {
      // If no specific relevance, return all platforms
      return unifiedData.platforms;
    }

    return unifiedData.platforms.filter(p => relevantPlatformIds.includes(p.platform));
  }

  /**
   * Calculate cross-platform metrics
   */
  async getCrossPlatformMetrics(userId: string): Promise<{
    totalSpend: number;
    totalConversions: number;
    totalImpressions: number;
    totalClicks: number;
    totalUsers: number;
    totalSessions: number;
    averageConversionRate: number;
    averageCostPerClick: number;
    platformBreakdown: Record<string, any>;
  }> {
    const unifiedData = await this.getUnifiedData(userId);
    
    const totals = unifiedData.platforms.reduce((acc, platform) => {
      const metrics = platform.metrics;
      
      return {
        totalSpend: acc.totalSpend + (metrics.spend || 0),
        totalConversions: acc.totalConversions + (metrics.conversions || 0),
        totalImpressions: acc.totalImpressions + (metrics.impressions || 0),
        totalClicks: acc.totalClicks + (metrics.clicks || 0),
        totalUsers: acc.totalUsers + (metrics.users || 0),
        totalSessions: acc.totalSessions + (metrics.sessions || 0),
        platformCount: acc.platformCount + 1,
        conversionRateSum: acc.conversionRateSum + (metrics.conversionRate || 0),
        costPerClickSum: acc.costPerClickSum + (metrics.costPerClick || 0),
        platformBreakdown: {
          ...acc.platformBreakdown,
          [platform.platformName]: {
            spend: metrics.spend || 0,
            conversions: metrics.conversions || 0,
            conversionRate: metrics.conversionRate || 0,
            quality: platform.quality
          }
        }
      };
    }, {
      totalSpend: 0,
      totalConversions: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalUsers: 0,
      totalSessions: 0,
      platformCount: 0,
      conversionRateSum: 0,
      costPerClickSum: 0,
      platformBreakdown: {} as Record<string, any>
    });

    return {
      ...totals,
      averageConversionRate: totals.platformCount > 0 ? totals.conversionRateSum / totals.platformCount : 0,
      averageCostPerClick: totals.platformCount > 0 ? totals.costPerClickSum / totals.platformCount : 0
    };
  }

  /**
   * Generate insights for specific query
   */
  async generateQueryInsights(userId: string, query: string): Promise<Insight[]> {
    const relevantPlatforms = await this.getRelevantPlatformData(userId, query);
    
    if (relevantPlatforms.length === 0) {
      return [{
        type: 'recommendation',
        title: 'No Platform Data',
        description: 'Connect your advertising and analytics platforms to get AI-powered insights.',
        confidence: 1.0,
        platforms: []
      }];
    }

    const insights: Insight[] = [];

    // Performance insight
    const totalConversions = relevantPlatforms.reduce((sum, p) => sum + (p.metrics.conversions || 0), 0);
    const totalSpend = relevantPlatforms.reduce((sum, p) => sum + (p.metrics.spend || 0), 0);
    
    if (totalConversions > 0 && totalSpend > 0) {
      const costPerConversion = totalSpend / totalConversions;
      insights.push({
        type: 'trend',
        title: 'Campaign Performance',
        description: `Your campaigns generated ${totalConversions} conversions at $${costPerConversion.toFixed(2)} per conversion.`,
        value: totalConversions,
        confidence: relevantPlatforms.reduce((sum, p) => sum + p.quality, 0) / relevantPlatforms.length,
        platforms: relevantPlatforms.map(p => p.platform),
        metadata: {
          totalSpend,
          costPerConversion,
          platformCount: relevantPlatforms.length
        }
      });
    }

    // Platform comparison insight
    if (relevantPlatforms.length > 1) {
      const bestPlatform = relevantPlatforms.reduce((best, current) => 
        (current.metrics.conversions || 0) > (best.metrics.conversions || 0) ? current : best
      );

      insights.push({
        type: 'benchmark',
        title: 'Top Performer',
        description: `${bestPlatform.platformName} is driving the most conversions with ${bestPlatform.metrics.conversions} conversions.`,
        value: bestPlatform.metrics.conversions || 0,
        confidence: bestPlatform.quality,
        platforms: [bestPlatform.platform],
        metadata: {
          platformName: bestPlatform.platformName,
          advantage: ((bestPlatform.metrics.conversions || 0) / totalConversions * 100).toFixed(1) + '%'
        }
      });
    }

    // Data quality insight
    const avgQuality = relevantPlatforms.reduce((sum, p) => sum + p.quality, 0) / relevantPlatforms.length;
    if (avgQuality < 0.8) {
      insights.push({
        type: 'recommendation',
        title: 'Data Quality Alert',
        description: `Some platform data may be outdated. Consider refreshing your connections for more accurate insights.`,
        confidence: 1.0,
        platforms: relevantPlatforms.filter(p => p.quality < 0.8).map(p => p.platform),
        metadata: {
          averageQuality: avgQuality,
          affectedPlatforms: relevantPlatforms.filter(p => p.quality < 0.8).map(p => p.platformName)
        }
      });
    }

    return insights;
  }

  /**
   * Find correlations between platforms
   */
  async findPlatformCorrelations(userId: string): Promise<Correlation[]> {
    const unifiedData = await this.getUnifiedData(userId);
    const correlations: Correlation[] = [];

    // Simple correlation analysis (could be enhanced with ML)
    if (unifiedData.platforms.length >= 2) {
      for (let i = 0; i < unifiedData.platforms.length - 1; i++) {
        for (let j = i + 1; j < unifiedData.platforms.length; j++) {
          const platform1 = unifiedData.platforms[i];
          const platform2 = unifiedData.platforms[j];
          
          // Simple correlation based on conversion rates
          const conv1 = platform1.metrics.conversionRate || 0;
          const conv2 = platform2.metrics.conversionRate || 0;
          
          if (conv1 > 0 && conv2 > 0) {
            const correlation = Math.abs(conv1 - conv2) < 1.0 ? 0.7 : 0.3; // Simple heuristic
            
            correlations.push({
              platforms: [platform1.platform, platform2.platform],
              metric: 'conversion_rate',
              coefficient: correlation,
              strength: correlation > 0.6 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak',
              description: `${platform1.platformName} and ${platform2.platformName} show ${correlation > 0.6 ? 'similar' : 'different'} conversion patterns.`
            });
          }
        }
      }
    }

    return correlations;
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: string): void {
    const cacheKey = `unified_${userId}`;
    this.dataCache.delete(cacheKey);
    platformIntegrationBridge.clearCache(userId);
    console.log('📊 Cleared cache for user:', userId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.dataCache.size,
      cacheDuration: this.CACHE_DURATION,
      cachedUsers: Array.from(this.dataCache.keys()).map(key => key.replace('unified_', ''))
    };
  }

  /**
   * Enhance unified data with additional analysis
   */
  private async enhanceUnifiedData(data: UnifiedMetrics): Promise<UnifiedMetrics> {
    // Add platform correlations
    const correlations = await this.findPlatformCorrelations(''); // Will be called with actual userId
    
    // Enhance insights with more sophisticated analysis
    const enhancedInsights = [
      ...data.crossPlatformInsights,
      // Could add ML-based insights here
    ];

    return {
      ...data,
      crossPlatformInsights: enhancedInsights
    };
  }
}

// Export singleton instance
export const unifiedDataService = UnifiedDataService.getInstance();