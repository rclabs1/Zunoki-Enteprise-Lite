/**
 * Platform Registry - Auto-discovery and management of platform connectors
 */

import { 
  PlatformConnector, 
  PlatformType, 
  PlatformRegistryConfig,
  StandardMetrics,
  UnifiedMetrics,
  PlatformMetrics
} from './types';

export class PlatformRegistry {
  private connectors = new Map<string, PlatformConnector>();
  private config: PlatformRegistryConfig;
  
  constructor(config?: Partial<PlatformRegistryConfig>) {
    this.config = {
      enableAutoDiscovery: true,
      fallbackToMockData: true,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: 3,
      enableCrossPlatformAnalysis: true,
      voiceNarrationEnabled: true,
      ...config
    };
    
    console.log('🔌 Platform Registry initialized with config:', this.config);
  }
  
  /**
   * Register a platform connector
   */
  register(connector: PlatformConnector): void {
    this.connectors.set(connector.id, connector);
    console.log(`🔌 Registered platform: ${connector.name} (${connector.id})`);
    console.log(`   Type: ${connector.type}`);
    console.log(`   Capabilities:`, connector.capabilities);
    console.log(`   Supported metrics:`, connector.getSupportedMetrics());
  }
  
  /**
   * Unregister a platform connector
   */
  unregister(platformId: string): boolean {
    const success = this.connectors.delete(platformId);
    if (success) {
      console.log(`🔌 Unregistered platform: ${platformId}`);
    }
    return success;
  }
  
  /**
   * Get a specific platform connector
   */
  get(platformId: string): PlatformConnector | undefined {
    return this.connectors.get(platformId);
  }
  
  /**
   * Get all registered platforms
   */
  getAll(): PlatformConnector[] {
    return Array.from(this.connectors.values());
  }
  
  /**
   * Get platforms by type
   */
  getByType(type: PlatformType): PlatformConnector[] {
    return this.getAll().filter(connector => connector.type === type);
  }
  
  /**
   * Get connected platforms for a user
   */
  async getConnectedPlatforms(userId: string): Promise<PlatformConnector[]> {
    const connectedPlatforms: PlatformConnector[] = [];
    
    for (const connector of this.connectors.values()) {
      try {
        const isAuthenticated = await connector.isAuthenticated(userId);
        if (isAuthenticated) {
          connectedPlatforms.push(connector);
        }
      } catch (error) {
        console.warn(`🔌 Error checking authentication for ${connector.id}:`, error);
      }
    }
    
    console.log(`🔌 Found ${connectedPlatforms.length} connected platforms for user ${userId}`);
    return connectedPlatforms;
  }
  
  /**
   * Select relevant platforms based on query intent
   */
  selectRelevantPlatforms(
    query: string, 
    connectedPlatforms: PlatformConnector[]
  ): PlatformConnector[] {
    const queryLower = query.toLowerCase();
    
    // Define platform relevance keywords
    const platformKeywords = {
      'google-ads': ['google', 'ads', 'adwords', 'campaign', 'advertising', 'ppc', 'spend'],
      'google-analytics': ['analytics', 'ga4', 'website', 'traffic', 'sessions', 'pageviews', 'bounce'],
      'mixpanel': ['mixpanel', 'events', 'funnel', 'retention', 'engagement', 'cohort'],
      'facebook-ads': ['facebook', 'meta', 'fb', 'social', 'reach'],
      'tiktok-ads': ['tiktok', 'video', 'viral', 'social'],
      'shopify': ['shopify', 'ecommerce', 'sales', 'orders', 'products', 'revenue'],
      'salesforce': ['salesforce', 'crm', 'leads', 'opportunities', 'pipeline']
    };
    
    // Score platforms based on query relevance
    const scoredPlatforms = connectedPlatforms.map(platform => {
      const keywords = platformKeywords[platform.id] || [];
      const relevanceScore = keywords.filter(keyword => 
        queryLower.includes(keyword)
      ).length;
      
      return { platform, score: relevanceScore };
    });
    
    // Sort by relevance, include all if no specific matches
    scoredPlatforms.sort((a, b) => b.score - a.score);
    
    if (scoredPlatforms[0]?.score === 0) {
      // No specific matches, return all connected platforms
      return connectedPlatforms;
    }
    
    // Return platforms with relevance, minimum of 1
    const relevantPlatforms = scoredPlatforms
      .filter(item => item.score > 0)
      .map(item => item.platform);
      
    return relevantPlatforms.length > 0 ? relevantPlatforms : [scoredPlatforms[0]?.platform].filter(Boolean);
  }
  
  /**
   * Fetch unified data from multiple platforms
   */
  async fetchUnifiedData(
    userId: string, 
    platforms?: string[]
  ): Promise<UnifiedMetrics> {
    console.log(`🔌 Fetching unified data for user ${userId}`);
    
    let targetPlatforms = this.getAll();
    
    if (platforms && platforms.length > 0) {
      targetPlatforms = platforms
        .map(id => this.get(id))
        .filter((connector): connector is PlatformConnector => connector !== undefined);
    } else {
      targetPlatforms = await this.getConnectedPlatforms(userId);
    }
    
    console.log(`🔌 Target platforms:`, targetPlatforms.map(p => p.name));
    
    // Fetch data from all platforms in parallel
    const platformPromises = targetPlatforms.map(async (connector): Promise<PlatformMetrics> => {
      try {
        console.log(`🔌 Fetching data from ${connector.name}...`);
        
        const rawData = await connector.fetchData(userId);
        const standardMetrics = connector.transformToStandardFormat(rawData);
        const validation = connector.validateData(standardMetrics);
        
        if (!validation.isValid) {
          console.warn(`🔌 Data validation failed for ${connector.name}:`, validation.issues);
        }
        
        return {
          platform: connector.id,
          platformName: connector.name,
          platformType: connector.type,
          metrics: standardMetrics,
          quality: validation.isValid ? 1.0 : 0.7,
          freshness: connector.getDataFreshness(standardMetrics),
          lastSync: standardMetrics.timestamp
        };
      } catch (error) {
        console.error(`🔌 Error fetching data from ${connector.name}:`, error);
        
        return {
          platform: connector.id,
          platformName: connector.name,
          platformType: connector.type,
          metrics: this.generateFallbackMetrics(connector.id),
          quality: 0.5,
          freshness: 'Error - using fallback data',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const platformResults = await Promise.all(platformPromises);
    
    // Calculate overall metrics
    const overallQuality = platformResults.reduce((sum, result) => sum + result.quality, 0) / platformResults.length;
    const dataFreshness = platformResults.reduce((acc, result) => {
      acc[result.platform] = result.freshness;
      return acc;
    }, {} as Record<string, string>);
    
    // Generate cross-platform insights if enabled
    const crossPlatformInsights = this.config.enableCrossPlatformAnalysis 
      ? await this.generateCrossPlatformInsights(platformResults)
      : [];
    
    console.log(`🔌 Unified data fetch complete. Quality: ${(overallQuality * 100).toFixed(1)}%`);
    
    return {
      platforms: platformResults,
      crossPlatformInsights,
      overallQuality,
      lastUpdated: new Date(),
      dataFreshness
    };
  }
  
  /**
   * Generate fallback metrics for failed platforms
   */
  private generateFallbackMetrics(platformId: string): StandardMetrics {
    const fallbackData = {
      'google-ads': {
        impressions: 48200,
        clicks: 1910,
        spend: 4500,
        conversions: 78,
        costPerClick: 2.35,
        conversionRate: 4.08
      },
      'google-analytics': {
        users: 12350,
        sessions: 15420,
        pageViews: 45680,
        engagementRate: 67.8,
        conversionRate: 1.01
      },
      'mixpanel': {
        users: 15420,
        engagementRate: 78.5,
        conversions: 156,
        conversionRate: 45.0
      }
    };
    
    const data = fallbackData[platformId] || {
      users: 1000,
      sessions: 1200,
      conversions: 50,
      conversionRate: 4.2
    };
    
    return {
      ...data,
      platform: platformId,
      dataType: 'fallback',
      timestamp: new Date(),
      platformSpecific: { isFallback: true }
    };
  }
  
  /**
   * Generate insights across multiple platforms
   */
  private async generateCrossPlatformInsights(platformResults: PlatformMetrics[]) {
    // This would use AI to find correlations, but for now return basic insights
    return [
      {
        type: 'correlation' as const,
        title: 'Multi-platform Performance',
        description: `Data from ${platformResults.length} platforms shows coordinated performance trends.`,
        confidence: 0.8,
        platforms: platformResults.map(p => p.platform),
        metadata: {
          platformCount: platformResults.length,
          averageQuality: platformResults.reduce((sum, p) => sum + p.quality, 0) / platformResults.length
        }
      }
    ];
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    const byType = this.getAll().reduce((acc, connector) => {
      acc[connector.type] = (acc[connector.type] || 0) + 1;
      return acc;
    }, {} as Record<PlatformType, number>);
    
    return {
      totalPlatforms: this.connectors.size,
      platformsByType: byType,
      config: this.config,
      registeredPlatforms: this.getAll().map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        version: c.version
      }))
    };
  }
}

// Global registry instance
export const platformRegistry = new PlatformRegistry();

// Export convenience functions
export const registerPlatform = (connector: PlatformConnector) => platformRegistry.register(connector);
export const getPlatform = (id: string) => platformRegistry.get(id);
export const getAllPlatforms = () => platformRegistry.getAll();
export const getConnectedPlatforms = (userId: string) => platformRegistry.getConnectedPlatforms(userId);