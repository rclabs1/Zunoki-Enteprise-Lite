/**
 * Unified Chart Intelligence Service
 * Replaces the existing maya-chart-intelligence-service.ts with multi-platform support
 * Integrates with your existing platform connections and voice synthesis
 */

import { unifiedDataService } from './unified-data-service';
import { platformRegistry } from '@/lib/platforms/core/platform-registry';
import { 
  ChartGenerationRequest, 
  UnifiedChartConfig, 
  PlatformMetrics,
  Insight,
  Correlation,
  VoiceNarrationOptions
} from '@/lib/platforms/core/types';
import { voiceIntegrationBridge } from './voice-integration-bridge';

// Import existing platform connectors
import { GoogleAdsPlatform } from '@/lib/platforms/google-ads/connector';
import { GoogleAnalyticsPlatform } from '@/lib/platforms/google-analytics/connector';
import { MixpanelPlatform } from '@/lib/platforms/mixpanel/connector';

export class UnifiedChartIntelligenceService {
  private static instance: UnifiedChartIntelligenceService | null = null;
  private initialized = false;

  static getInstance(): UnifiedChartIntelligenceService {
    if (!this.instance) {
      this.instance = new UnifiedChartIntelligenceService();
    }
    return this.instance;
  }

  private constructor() {
    this.initializePlatforms();
  }

  /**
   * Initialize platform connectors in the registry
   */
  private initializePlatforms(): void {
    if (this.initialized) return;

    console.log('🧠 Initializing Unified Chart Intelligence with platform connectors...');

    // Register existing platform connectors
    platformRegistry.register(new GoogleAdsPlatform());
    platformRegistry.register(new GoogleAnalyticsPlatform());
    platformRegistry.register(new MixpanelPlatform());

    this.initialized = true;
    console.log('🧠 Platform connectors registered:', platformRegistry.getStats());
  }

  /**
   * Generate unified multi-platform chart
   * This is the main method that replaces your existing chart generation
   */
  async generateChart(request: ChartGenerationRequest): Promise<UnifiedChartConfig> {
    console.log('🧠 Generating unified chart for query:', request.query);

    try {
      // Get relevant platform data based on query
      const relevantPlatforms = await unifiedDataService.getRelevantPlatformData(
        request.userId, 
        request.query
      );

      if (relevantPlatforms.length === 0) {
        console.log('🧠 No connected platforms found, returning fallback chart');
        return this.generateFallbackChart(request);
      }

      // Determine primary platform for chart generation
      const primaryPlatform = this.selectPrimaryPlatform(relevantPlatforms, request.query);
      const primaryConnector = platformRegistry.get(primaryPlatform.platform);

      if (!primaryConnector) {
        console.error('🧠 No connector found for primary platform:', primaryPlatform.platform);
        return this.generateFallbackChart(request);
      }

      // Generate base chart using primary platform
      const baseChart = primaryConnector.generateChartConfig(primaryPlatform.metrics, request.query);
      
      // Enhance with multi-platform insights
      const multiPlatformInsights = await this.generateMultiPlatformInsights(relevantPlatforms, request.query);
      
      // Generate cross-platform correlations
      const correlations = await this.findCrossPlatformCorrelations(relevantPlatforms);
      
      // Create conversational voice narration
      const voiceNarration = await this.generateConversationalNarration(
        relevantPlatforms, 
        multiPlatformInsights, 
        request.query,
        request.voiceOptions
      );

      // Use the voice integration bridge to handle narration with coordination
      if (request.userId) {
        await voiceIntegrationBridge.speakChartData(
          {
            ...chartConfig,
            platformCount: relevantPlatforms.length,
            metrics: relevantPlatforms.reduce((acc, p) => ({ ...acc, ...p.metrics }), {})
          },
          multiPlatformInsights,
          request.userId,
          {
            chartId: `unified_chart_${Date.now()}`,
            priority: 'normal',
            waitForQuiet: true,
            useNaturalLanguage: true
          }
        );
      }

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(relevantPlatforms);

      // Build unified chart config
      const unifiedChart: UnifiedChartConfig = {
        ...baseChart,
        insights: [...baseChart.insights, ...multiPlatformInsights],
        voiceNarration,
        platformsUsed: relevantPlatforms.map(p => p.platform),
        dataQuality: relevantPlatforms.reduce((sum, p) => sum + p.quality, 0) / relevantPlatforms.length,
        crossPlatformCorrelations: correlations,
        queryIntent: this.classifyQueryIntent(request.query),
        confidenceScore
      };

      console.log('🧠 Chart generation complete:', {
        platformsUsed: unifiedChart.platformsUsed,
        insightCount: unifiedChart.insights.length,
        dataQuality: (unifiedChart.dataQuality * 100).toFixed(1) + '%',
        confidence: (confidenceScore * 100).toFixed(1) + '%'
      });

      return unifiedChart;

    } catch (error) {
      console.error('🧠 Error in chart generation:', error);
      return this.generateFallbackChart(request);
    }
  }

  /**
   * Select the primary platform for chart generation based on query intent
   */
  private selectPrimaryPlatform(platforms: PlatformMetrics[], query: string): PlatformMetrics {
    const queryLower = query.toLowerCase();
    
    // Platform priority based on query keywords
    const platformPriority = {
      'google-ads': ['campaign', 'ad', 'spend', 'cpc', 'impression', 'click'],
      'google-analytics': ['website', 'traffic', 'session', 'user', 'page', 'bounce'],
      'mixpanel': ['event', 'funnel', 'retention', 'engagement', 'cohort', 'product']
    };

    // Score platforms based on query relevance
    const scoredPlatforms = platforms.map(platform => {
      const keywords = platformPriority[platform.platform] || [];
      const relevanceScore = keywords.filter(keyword => queryLower.includes(keyword)).length;
      return { platform, score: relevanceScore + platform.quality }; // Factor in data quality
    });

    // Sort by score and return the highest
    scoredPlatforms.sort((a, b) => b.score - a.score);
    return scoredPlatforms[0]?.platform || platforms[0];
  }

  /**
   * Generate insights that span multiple platforms
   */
  private async generateMultiPlatformInsights(
    platforms: PlatformMetrics[], 
    query: string
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    if (platforms.length < 2) return insights;

    // Cross-platform performance insight
    const totalSpend = platforms.reduce((sum, p) => sum + (p.metrics.spend || 0), 0);
    const totalConversions = platforms.reduce((sum, p) => sum + (p.metrics.conversions || 0), 0);
    const totalUsers = platforms.reduce((sum, p) => sum + (p.metrics.users || 0), 0);

    if (totalSpend > 0 && totalConversions > 0) {
      insights.push({
        type: 'correlation',
        title: 'Multi-Platform ROI',
        description: `Your ${platforms.length} connected platforms generated ${totalConversions} conversions from $${totalSpend.toLocaleString()} total investment.`,
        confidence: 0.85,
        platforms: platforms.map(p => p.platform),
        value: totalConversions,
        metadata: {
          totalSpend,
          costPerConversion: totalSpend / totalConversions,
          platformBreakdown: platforms.map(p => ({
            platform: p.platformName,
            spend: p.metrics.spend || 0,
            conversions: p.metrics.conversions || 0
          }))
        }
      });
    }

    // Platform efficiency comparison
    const platformsWithSpend = platforms.filter(p => (p.metrics.spend || 0) > 0 && (p.metrics.conversions || 0) > 0);
    if (platformsWithSpend.length >= 2) {
      const efficiencyScores = platformsWithSpend.map(p => ({
        platform: p,
        efficiency: (p.metrics.conversions || 0) / (p.metrics.spend || 1)
      }));
      
      const bestPlatform = efficiencyScores.reduce((best, current) => 
        current.efficiency > best.efficiency ? current : best
      );

      insights.push({
        type: 'benchmark',
        title: 'Most Efficient Platform',
        description: `${bestPlatform.platform.platformName} has the best conversion efficiency at ${bestPlatform.efficiency.toFixed(2)} conversions per dollar spent.`,
        confidence: 0.8,
        platforms: [bestPlatform.platform.platform],
        value: bestPlatform.efficiency,
        metadata: {
          platformName: bestPlatform.platform.platformName,
          efficiency: bestPlatform.efficiency
        }
      });
    }

    // Data freshness alert
    const staleData = platforms.filter(p => p.quality < 0.7);
    if (staleData.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Data Sync Recommended',
        description: `${staleData.length} platform${staleData.length > 1 ? 's' : ''} have outdated data. Refresh connections for accurate insights.`,
        confidence: 1.0,
        platforms: staleData.map(p => p.platform),
        metadata: {
          stalePlatforms: staleData.map(p => p.platformName),
          lastSync: staleData.map(p => p.freshness)
        }
      });
    }

    return insights;
  }

  /**
   * Find correlations between platform metrics
   */
  private async findCrossPlatformCorrelations(platforms: PlatformMetrics[]): Promise<Correlation[]> {
    const correlations: Correlation[] = [];

    if (platforms.length < 2) return correlations;

    // Example: Google Ads spend vs GA4 conversions correlation
    const googleAds = platforms.find(p => p.platform === 'google-ads');
    const ga4 = platforms.find(p => p.platform === 'google-analytics');

    if (googleAds && ga4) {
      const adSpend = googleAds.metrics.spend || 0;
      const ga4Conversions = ga4.metrics.conversions || 0;
      
      if (adSpend > 0 && ga4Conversions > 0) {
        // Simple correlation heuristic (could be enhanced with proper statistical analysis)
        const correlation = Math.min(0.9, (ga4Conversions / adSpend) * 100); // Simplified calculation
        
        correlations.push({
          platforms: ['google-ads', 'google-analytics'],
          metric: 'spend_to_conversions',
          coefficient: correlation,
          strength: correlation > 0.7 ? 'strong' : correlation > 0.4 ? 'moderate' : 'weak',
          description: `Google Ads spending shows a ${correlation > 0.7 ? 'strong' : 'moderate'} correlation with GA4 conversions.`
        });
      }
    }

    // Mixpanel engagement vs other platform conversions
    const mixpanel = platforms.find(p => p.platform === 'mixpanel');
    if (mixpanel) {
      const engagementRate = mixpanel.metrics.engagementRate || 0;
      const otherPlatformConversions = platforms
        .filter(p => p.platform !== 'mixpanel')
        .reduce((sum, p) => sum + (p.metrics.conversions || 0), 0);
      
      if (engagementRate > 0 && otherPlatformConversions > 0) {
        const correlation = Math.min(0.8, engagementRate / 100); // Normalize engagement rate
        
        correlations.push({
          platforms: ['mixpanel', 'multi-platform'],
          metric: 'engagement_to_conversions',
          coefficient: correlation,
          strength: correlation > 0.6 ? 'strong' : correlation > 0.3 ? 'moderate' : 'weak',
          description: `Higher Mixpanel engagement correlates with increased conversions across advertising platforms.`
        });
      }
    }

    return correlations;
  }

  /**
   * Generate conversational voice narration (fixes the robotic markdown reading issue)
   */
  private async generateConversationalNarration(
    platforms: PlatformMetrics[],
    insights: Insight[],
    query: string,
    options?: VoiceNarrationOptions
  ): Promise<string> {
    const opts = {
      length: 'medium' as const,
      style: 'conversational' as const,
      includeNumbers: true,
      includeRecommendations: true,
      skipTechnicalTerms: true,
      ...options
    };

    // Use the voice coordinator for natural conversation
    return await this.buildNaturalNarration(platforms, insights, query, opts);
  }

  /**
   * Build natural conversation instead of reading markdown
   */
  private async buildNaturalNarration(
    platforms: PlatformMetrics[],
    insights: Insight[],
    query: string,
    options: any
  ): Promise<string> {
    let narration = '';

    // Opening based on platforms
    if (platforms.length === 1) {
      const platform = platforms[0];
      narration = `Based on your ${platform.platformName} data, `;
    } else {
      narration = `Looking across your ${platforms.length} connected platforms, `;
    }

    // Main insight
    if (insights.length > 0) {
      const primaryInsight = insights[0];
      
      // Convert technical descriptions to conversational language
      let conversationalInsight = primaryInsight.description
        .replace(/Your \d+ connected platforms/g, 'your marketing efforts')
        .replace(/\$[\d,]+/g, (match) => `${match.replace('$', 'about $')}`)
        .replace(/\d+\.\d+%/g, (match) => `${match} percent`)
        .replace(/campaign_metrics|oauth_tokens|supabase/gi, ''); // Remove technical terms

      narration += conversationalInsight;
    }

    // Add specific metrics in conversational way
    const totalConversions = platforms.reduce((sum, p) => sum + (p.metrics.conversions || 0), 0);
    const totalSpend = platforms.reduce((sum, p) => sum + (p.metrics.spend || 0), 0);
    const totalUsers = platforms.reduce((sum, p) => sum + (p.metrics.users || 0), 0);

    if (totalConversions > 0) {
      if (totalSpend > 0) {
        narration += ` This resulted in ${totalConversions} conversions from your investment of about $${Math.round(totalSpend).toLocaleString()}.`;
      } else if (totalUsers > 0) {
        narration += ` This engaged ${totalUsers.toLocaleString()} users and generated ${totalConversions} conversions.`;
      }
    }

    // Add recommendation if available
    const recommendationInsight = insights.find(i => i.type === 'recommendation');
    if (recommendationInsight && opts.includeRecommendations) {
      narration += ` My recommendation: ${recommendationInsight.description.replace(/platform\s*data/gi, 'your data').toLowerCase()}`;
    }

    // Quality check and length adjustment
    if (opts.length === 'short') {
      narration = narration.split('.')[0] + '.'; // First sentence only
    } else if (opts.length === 'long') {
      // Add more detail for long narration
      if (platforms.length > 1) {
        const bestPlatform = platforms.reduce((best, current) => 
          (current.metrics.conversions || 0) > (best.metrics.conversions || 0) ? current : best
        );
        narration += ` ${bestPlatform.platformName} is currently your top performer.`;
      }
    }

    // Clean up any remaining technical language
    narration = narration
      .replace(/API|OAuth|JSON|HTTP/gi, '')
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();

    return narration;
  }

  /**
   * Calculate overall confidence score for the chart
   */
  private calculateConfidenceScore(platforms: PlatformMetrics[]): number {
    if (platforms.length === 0) return 0.3;

    const avgQuality = platforms.reduce((sum, p) => sum + p.quality, 0) / platforms.length;
    const platformDiversityBonus = Math.min(0.2, platforms.length * 0.05);
    const recentDataBonus = platforms.filter(p => p.freshness.includes('hour') || p.freshness.includes('now')).length * 0.1;

    return Math.min(1.0, avgQuality + platformDiversityBonus + recentDataBonus);
  }

  /**
   * Classify the query intent for better chart selection
   */
  private classifyQueryIntent(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('trend') || queryLower.includes('time') || queryLower.includes('over')) {
      return 'trend_analysis';
    } else if (queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('between')) {
      return 'comparison';
    } else if (queryLower.includes('performance') || queryLower.includes('how')) {
      return 'performance_overview';
    } else if (queryLower.includes('optimize') || queryLower.includes('improve') || queryLower.includes('better')) {
      return 'optimization';
    } else if (queryLower.includes('spend') || queryLower.includes('cost') || queryLower.includes('budget')) {
      return 'financial_analysis';
    }
    
    return 'general_inquiry';
  }

  /**
   * Generate fallback chart when no platforms are connected
   */
  private generateFallbackChart(request: ChartGenerationRequest): UnifiedChartConfig {
    return {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Sample Performance',
          data: [100, 120, 110, 140],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      },
      insights: [{
        type: 'recommendation',
        title: 'Connect Your Platforms',
        description: 'Connect your advertising and analytics platforms to unlock AI-powered insights and dynamic charts.',
        confidence: 1.0,
        platforms: []
      }],
      voiceNarration: 'To get personalized insights, please connect your marketing platforms through the Ad Hub. Once connected, I can provide detailed analysis of your campaign performance.',
      quickActions: [
        { label: 'Connect Platforms', action: 'connect_platforms', type: 'prescriptive' },
        { label: 'View Ad Hub', action: 'view_ad_hub', type: 'diagnostic' }
      ],
      platformsUsed: [],
      dataQuality: 0.5,
      crossPlatformCorrelations: [],
      queryIntent: 'onboarding',
      confidenceScore: 0.3
    };
  }

  /**
   * Clear cache and refresh connections
   */
  clearCache(userId: string): void {
    unifiedDataService.clearUserCache(userId);
    console.log('🧠 Chart intelligence cache cleared for user:', userId);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      platformConnectors: platformRegistry.getStats(),
      dataService: unifiedDataService.getCacheStats(),
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const unifiedChartIntelligence = UnifiedChartIntelligenceService.getInstance();