import { mayaChartIntelligenceService } from './maya-chart-intelligence-service';
import { mayaVoiceNarrationService } from './maya-voice-narration-service';

interface ConversationalChartRequest {
  userQuery: string;
  conversationContext: Array<{
    type: 'user' | 'maya';
    content: string;
    timestamp: string;
  }>;
  availablePlatforms: {
    googleAds?: boolean;
    metaAds?: boolean;
    linkedin?: boolean;
    messaging?: boolean;
  };
  userPreferences?: {
    preferredChartTypes?: string[];
    voiceEnabled?: boolean;
    autoNarrate?: boolean;
  };
}

interface ConversationalChartResponse {
  hasChart: boolean;
  chartData?: {
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
  };
  enhancedResponse: string;
  suggestedFollowUps: string[];
  analyticsMode: boolean;
}

class MayaConversationalChartPipeline {
  // Keywords that trigger chart generation
  private readonly CHART_TRIGGERS = [
    // Direct chart requests
    'show', 'display', 'chart', 'graph', 'plot', 'visualize', 'draw',
    
    // Analytics keywords
    'trend', 'trends', 'analysis', 'analyze', 'performance', 'metrics',
    'data', 'report', 'dashboard', 'insights', 'breakdown', 'overview',
    
    // Comparison keywords
    'compare', 'comparison', 'versus', 'vs', 'against', 'between',
    
    // Marketing-specific terms
    'roas', 'roi', 'revenue', 'spend', 'budget', 'conversion', 'ctr', 'cpc',
    'campaign', 'campaigns', 'ads', 'advertising', 'platform', 'platforms',
    
    // Time-based analysis
    'yesterday', 'today', 'week', 'month', 'quarter', 'year', 'period',
    'last', 'this', 'past', 'recent', 'historical', 'over time'
  ];

  // Marketing-specific data simulation (replace with real API calls)
  private generateSimulatedData(query: string): any {
    const queryLower = query.toLowerCase();
    
    // ROAS trend data
    if (queryLower.includes('roas') && queryLower.includes('trend')) {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        datasets: [{
          label: 'Google Ads ROAS',
          data: [3.2, 3.8, 4.1, 4.2, 4.5],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          tension: 0.4
        }, {
          label: 'Meta Ads ROAS',
          data: [2.8, 3.1, 2.9, 3.4, 3.6],
          borderColor: '#1877f2',
          backgroundColor: 'rgba(24, 119, 242, 0.1)',
          tension: 0.4
        }]
      };
    }

    // Platform comparison
    if (queryLower.includes('compare') && queryLower.includes('platform')) {
      return {
        labels: ['Google Ads', 'Meta Ads', 'LinkedIn', 'TikTok'],
        datasets: [{
          label: 'ROAS',
          data: [4.2, 3.6, 5.1, 2.8],
          backgroundColor: ['#4285f4', '#1877f2', '#0077b5', '#000000']
        }]
      };
    }

    // Revenue analysis
    if (queryLower.includes('revenue')) {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue ($)',
          data: [42000, 45000, 38000, 52000, 48000, 55000],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }]
      };
    }

    // Default performance data
    return {
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
      datasets: [{
        label: 'Performance Metric',
        data: [100, 120, 110, 140, 130],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      }]
    };
  }

  public shouldGenerateChart(query: string, conversationContext?: any[]): boolean {
    const queryLower = query.toLowerCase();
    
    // Check for direct chart triggers
    const hasTrigger = this.CHART_TRIGGERS.some(trigger => 
      queryLower.includes(trigger)
    );

    // Enhanced detection based on conversation context
    if (conversationContext && conversationContext.length > 0) {
      const recentContext = conversationContext.slice(-3).map(msg => msg.content.toLowerCase()).join(' ');
      const hasContextualTrigger = this.CHART_TRIGGERS.some(trigger => 
        recentContext.includes(trigger)
      );
      
      return hasTrigger || hasContextualTrigger;
    }

    return hasTrigger;
  }

  public async processConversationalRequest(
    request: ConversationalChartRequest
  ): Promise<ConversationalChartResponse> {
    const shouldChart = this.shouldGenerateChart(
      request.userQuery, 
      request.conversationContext
    );

    if (!shouldChart) {
      return {
        hasChart: false,
        enhancedResponse: '', // Let Maya handle regular responses
        suggestedFollowUps: [],
        analyticsMode: false
      };
    }

    try {
      // Generate chart using Maya's intelligence
      const chartConfig = await mayaChartIntelligenceService.generateChart({
        userQuery: request.userQuery,
        dataContext: {
          query: request.userQuery,
          context: request.conversationContext,
          timestamp: new Date().toISOString()
        },
        platformData: {
          googleAds: request.availablePlatforms.googleAds ? this.generateSimulatedData(request.userQuery) : undefined,
          metaAds: request.availablePlatforms.metaAds ? this.generateSimulatedData(request.userQuery) : undefined,
          linkedin: request.availablePlatforms.linkedin ? this.generateSimulatedData(request.userQuery) : undefined,
          messaging: request.availablePlatforms.messaging ? [] : undefined
        }
      });

      // If chart generation fails, provide fallback
      if (!chartConfig) {
        return {
          hasChart: false,
          enhancedResponse: "I'm analyzing your data but having trouble creating a visualization. Let me provide you with the insights instead.",
          suggestedFollowUps: [
            "Try asking for a specific metric",
            "Check your platform connections",
            "Ask for a different time period"
          ],
          analyticsMode: true
        };
      }

      // Enhance response with chart context
      const enhancedResponse = this.generateEnhancedResponse(
        request.userQuery,
        chartConfig.insights
      );

      // Generate follow-up suggestions
      const suggestedFollowUps = this.generateFollowUpSuggestions(
        request.userQuery,
        chartConfig.type
      );

      // Auto-narrate if enabled
      if (request.userPreferences?.voiceEnabled && request.userPreferences?.autoNarrate) {
        try {
          await mayaVoiceNarrationService.narrateChart({
            chartType: chartConfig.type,
            insights: chartConfig.insights,
            metrics: this.extractMetricsFromChart(chartConfig)
          });
        } catch (error) {
          console.warn('Voice narration failed:', error);
        }
      }

      return {
        hasChart: true,
        chartData: chartConfig,
        enhancedResponse,
        suggestedFollowUps,
        analyticsMode: true
      };

    } catch (error) {
      console.error('Conversational chart pipeline failed:', error);
      
      return {
        hasChart: false,
        enhancedResponse: "I encountered an issue analyzing your data. Please try rephrasing your question or check your platform connections.",
        suggestedFollowUps: [
          "Try a simpler query",
          "Check platform status",
          "Ask for help with data connections"
        ],
        analyticsMode: true
      };
    }
  }

  private generateEnhancedResponse(query: string, insights: string[]): string {
    const primaryInsight = insights[0] || "Here's your data visualization.";
    
    // Add contextual introduction based on query type
    const queryLower = query.toLowerCase();
    let intro = "Here's your analysis:";
    
    if (queryLower.includes('trend')) {
      intro = "I've analyzed your performance trends:";
    } else if (queryLower.includes('compare')) {
      intro = "Here's your platform comparison:";
    } else if (queryLower.includes('revenue')) {
      intro = "Your revenue analysis shows:";
    } else if (queryLower.includes('roas')) {
      intro = "Your ROAS performance indicates:";
    }

    return `${intro} ${primaryInsight}`;
  }

  private generateFollowUpSuggestions(query: string, chartType: string): string[] {
    const queryLower = query.toLowerCase();
    const suggestions: string[] = [];

    // Base suggestions based on chart type
    if (chartType === 'line') {
      suggestions.push("Show me the breakdown by platform");
      suggestions.push("What's driving this trend?");
    } else if (chartType === 'bar') {
      suggestions.push("Show trends over time");
      suggestions.push("Which campaigns are performing best?");
    } else if (chartType === 'pie') {
      suggestions.push("Compare with last month");
      suggestions.push("Show detailed breakdown");
    }

    // Query-specific suggestions
    if (queryLower.includes('roas')) {
      suggestions.push("How can I improve ROAS?");
      suggestions.push("Show conversion funnel analysis");
    } else if (queryLower.includes('revenue')) {
      suggestions.push("What's the revenue forecast?");
      suggestions.push("Show cost breakdown");
    } else if (queryLower.includes('campaign')) {
      suggestions.push("Which creatives are working best?");
      suggestions.push("Show audience performance");
    }

    // Add optimization suggestion
    suggestions.push("Optimize based on this data");

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private extractMetricsFromChart(chartConfig: any): Array<{
    name: string;
    value: number | string;
    trend?: 'up' | 'down' | 'stable';
    change?: number;
  }> {
    // Extract key metrics from chart data for voice narration
    const metrics: Array<{
      name: string;
      value: number | string;
      trend?: 'up' | 'down' | 'stable';
      change?: number;
    }> = [];

    try {
      if (chartConfig.data && chartConfig.data.datasets) {
        chartConfig.data.datasets.forEach((dataset: any) => {
          if (dataset.data && dataset.data.length > 0) {
            const latestValue = dataset.data[dataset.data.length - 1];
            const previousValue = dataset.data.length > 1 ? dataset.data[dataset.data.length - 2] : null;
            
            let trend: 'up' | 'down' | 'stable' = 'stable';
            let change: number = 0;
            
            if (previousValue !== null && typeof latestValue === 'number' && typeof previousValue === 'number') {
              change = ((latestValue - previousValue) / previousValue) * 100;
              trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';
            }

            metrics.push({
              name: dataset.label || 'Metric',
              value: latestValue,
              trend,
              change: Math.abs(change)
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to extract metrics from chart:', error);
    }

    return metrics;
  }

  // Get available chart intelligence models
  public getAvailableModels() {
    return mayaChartIntelligenceService.getAvailableModels();
  }

  // Get available voice providers
  public getAvailableVoiceProviders() {
    return mayaVoiceNarrationService.getAvailableProviders();
  }

  // Switch chart intelligence model
  public async switchChartModel(modelName: 'openai-gpt4' | 'groq-120b' | 'groq-20b') {
    return await mayaChartIntelligenceService.switchModel(modelName);
  }

  // Switch voice provider
  public async switchVoiceProvider(providerName: 'elevenlabs' | 'sarvam' | 'web-tts') {
    return await mayaVoiceNarrationService.switchProvider(providerName);
  }
}

export const mayaConversationalChartPipeline = new MayaConversationalChartPipeline();