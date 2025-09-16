import OpenAI from 'openai';

interface ChartRequest {
  userQuery: string;
  dataContext: any;
  platformData: {
    googleAds?: any[];
    metaAds?: any[];
    linkedin?: any[];
    messaging?: any[];
  };
  timeframe?: string;
  previousCharts?: any[];
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'funnel';
  data: any;
  options: any;
  insights: {
    diagnostic: Array<{
      finding: string;
      explanation: string;
      impact: 'high' | 'medium' | 'low';
      metrics: { [key: string]: string | number };
    }>;
    prescriptive: Array<{
      action: string;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      estimatedImpact: string;
      timeline: string;
      difficulty: 'easy' | 'medium' | 'complex';
      roi: string;
    }>;
    predictive: Array<{
      forecast: string;
      confidence: number;
      timeframe: string;
      scenario: 'optimistic' | 'realistic' | 'pessimistic';
      keyDrivers: string[];
    }>;
  };
  voiceNarration: string;
  quickActions: Array<{
    label: string;
    action: string;
    data?: any;
    type: 'diagnostic' | 'prescriptive' | 'predictive';
  }>;
}

interface ModelProvider {
  name: 'openai-gpt4' | 'groq-120b' | 'groq-20b';
  apiKey?: string;
  model: string;
  available: boolean;
  cost: number;
  endpoint?: string;
}

class MayaChartIntelligenceService {
  private models: ModelProvider[];
  private currentModel: ModelProvider | null = null;
  private fallbackEnabled: boolean = true;
  private chartCache: Map<string, { config: ChartConfig; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.models = [
      {
        name: 'openai-gpt4',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        available: !!process.env.OPENAI_API_KEY,
        cost: 0.03
      },
      {
        name: 'groq-120b',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.1-405b-reasoning',
        available: !!process.env.GROQ_API_KEY,
        cost: 0.001,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions'
      },
      {
        name: 'groq-20b',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.1-70b-versatile',
        available: !!process.env.GROQ_API_KEY,
        cost: 0.0005,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions'
      }
    ];

    // Select best available model
    this.currentModel = this.selectBestModel();
  }

  private selectBestModel(): ModelProvider | null {
    // Priority: OpenAI GPT-4 > Groq 120B > Groq 20B
    const availableModels = this.models.filter(m => m.available);
    return availableModels[0] || null;
  }

  private generateFallbackChart(request: ChartRequest): ChartConfig {
    // Generate a fallback chart when no API keys are available
    return {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Sample ROAS',
          data: [3.2, 3.5, 3.1, 3.8, 4.2, 3.9],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sample Marketing Performance'
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      },
      insights: {
        diagnostic: [{
          finding: "Demo Mode - No API keys configured",
          explanation: "Zunoki. Intelligence is running in demonstration mode. Configure OpenAI or Groq API keys for full functionality.",
          impact: 'high' as const,
          metrics: {
            'status': 'Demo Mode',
            'functionality': 'Limited'
          }
        }],
        prescriptive: [{
          action: "Configure API keys for OpenAI GPT-4 or Groq models to enable full Zunoki. Intelligence",
          priority: 'high' as const,
          estimatedImpact: "100% improvement in insights quality",
          timeline: "5 minutes",
          difficulty: 'easy' as const,
          roi: "Immediate access to AI-powered insights"
        }],
        predictive: [{
          forecast: "With proper API configuration, Maya can provide sophisticated business intelligence",
          confidence: 95,
          timeframe: "Immediate",
          scenario: 'optimistic' as const,
          keyDrivers: ["API Configuration", "Data Integration", "User Training"]
        }]
      },
      voiceNarration: "Zunoki. Intelligence is currently in demo mode. This is sample data showing what's possible. To unlock Zunoki.'s full potential with real AI insights, please configure your OpenAI or Groq API keys.",
      quickActions: [
        {label: "Configure API Keys", action: "setup_api_keys", data: {}, type: 'prescriptive' as const},
        {label: "View Demo Charts", action: "show_demo", data: {}, type: 'diagnostic' as const}
      ]
    };
  }

  private getMarketingChartPrompt(request: ChartRequest): string {
    return `You are Maya, an expert marketing analytics AI specializing in conversational chart generation for advertising and messaging platforms.

USER QUERY: "${request.userQuery}"

AVAILABLE DATA CONTEXT:
${JSON.stringify(request.dataContext, null, 2)}

PLATFORM DATA AVAILABILITY:
- Google Ads: ${request.platformData.googleAds ? 'Available' : 'Not connected'}
- Meta Ads: ${request.platformData.metaAds ? 'Available' : 'Not connected'}
- LinkedIn: ${request.platformData.linkedin ? 'Available' : 'Not connected'}
- Messaging: ${request.platformData.messaging ? 'Available' : 'Not connected'}

MARKETING VISUALIZATION RULES:
1. ROAS/ROI Trends: Use line charts with gradient fills and trend indicators
2. Platform Comparisons: Use grouped bar charts with distinct colors per platform
3. Campaign Performance: Use combination charts (bar for spend, line for ROAS)
4. Conversion Funnels: Use custom funnel visualization or stacked bars
5. Spend Analysis: Use pie/doughnut charts with percentage labels
6. Time Series: Always use line charts with proper time scaling
7. CTR/CVR Metrics: Use area charts to show performance zones
8. Geographic Data: Suggest map visualizations when location data exists
9. Creative Performance: Use scatter plots (impressions vs engagement)
10. Budget Allocation: Use treemap or nested doughnut charts

CHART CONFIGURATION REQUIREMENTS:
- Colors: Use marketing-friendly color scheme (#4285f4 for Google, #1877f2 for Meta, #0077b5 for LinkedIn)
- Responsive: All charts must be mobile-friendly
- Interactive: Include hover tooltips with contextual information
- Accessibility: Ensure proper contrast and screen reader support

ANALYTICS FRAMEWORK - PROVIDE 3 TYPES OF INSIGHTS:

1. DIAGNOSTIC INSIGHTS (What happened & Why):
- Identify trends, patterns, anomalies in the data
- Root cause analysis for performance changes
- Impact assessment (high/medium/low)
- Supporting metrics and evidence

2. PRESCRIPTIVE INSIGHTS (What to do):
- Specific actionable recommendations
- Priority levels (urgent/high/medium/low)
- Estimated impact and timeline
- Implementation difficulty and ROI expectations

3. PREDICTIVE INSIGHTS (What might happen):
- Forecasts based on current trends
- Scenario planning (optimistic/realistic/pessimistic)
- Confidence levels for predictions
- Key drivers and risk factors

VOICE NARRATION GUIDELINES:
- Start with key diagnostic finding: "I've identified [specific issue/opportunity]"
- Provide prescriptive recommendation: "To improve this, I recommend [specific action]"
- Share predictive insight: "Based on current trends, you can expect [forecast]"
- Use marketing terminology: ROAS, CPC, CTR, CVR, LTV, CAC, etc.
- Keep it conversational but professional

RESPONSE FORMAT (JSON):
{
  "chartType": "line|bar|pie|doughnut|scatter|area",
  "chartConfig": {
    "type": "...",
    "data": {
      "labels": [...],
      "datasets": [...]
    },
    "options": {
      "responsive": true,
      "plugins": {...},
      "scales": {...}
    }
  },
  "insights": {
    "diagnostic": [
      {
        "finding": "ROAS declined 15% in the last 7 days",
        "explanation": "Decreased performance correlates with increased competition and higher CPCs in Google Ads",
        "impact": "high",
        "metrics": {
          "current_roas": "3.2x",
          "previous_roas": "3.8x",
          "change_percent": "-15.8%",
          "affected_spend": "$12,500"
        }
      }
    ],
    "prescriptive": [
      {
        "action": "Pause underperforming ad sets with ROAS below 2.5x and reallocate budget to top performers",
        "priority": "urgent",
        "estimatedImpact": "12-18% ROAS improvement",
        "timeline": "24-48 hours",
        "difficulty": "easy",
        "roi": "Positive within 3 days"
      }
    ],
    "predictive": [
      {
        "forecast": "ROAS will likely stabilize at 3.5x within 2 weeks if recommendations are implemented",
        "confidence": 78,
        "timeframe": "14 days",
        "scenario": "realistic",
        "keyDrivers": ["Budget reallocation", "Seasonal trends", "Competitor activity"]
      }
    ]
  },
  "voiceNarration": "I've identified a 15% ROAS decline in your recent campaigns. The main cause is increased competition driving up your cost-per-click. To fix this, I recommend immediately pausing ad sets with ROAS below 2.5x and reallocating that budget to your top performers. This should improve your overall ROAS by 12-18% within 2 days. Based on current trends, I predict your ROAS will stabilize at 3.5x within two weeks.",
  "quickActions": [
    {"label": "Pause Low ROAS Ads", "action": "pause_underperforming", "data": {"threshold": "2.5"}, "type": "prescriptive"},
    {"label": "Reallocate Budget", "action": "optimize_budget", "data": {"strategy": "top_performers"}, "type": "prescriptive"},
    {"label": "Analyze Competitors", "action": "competitor_analysis", "data": {"timeframe": "7d"}, "type": "diagnostic"}
  ],
  "reasoning": "Explanation of why this chart type and configuration was selected"
}

Generate the perfect marketing analytics visualization for this query.`;
  }

  private getCacheKey(request: ChartRequest): string {
    return `${request.userQuery}-${JSON.stringify(request.platformData)}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async generateChart(request: ChartRequest): Promise<ChartConfig> {
    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.chartCache.get(cacheKey);
    if (cached && this.isValidCache(cached.timestamp)) {
      console.log('Using cached chart configuration');
      return cached.config;
    }

    // Check if we have any available models
    if (!this.currentModel && this.fallbackEnabled) {
      console.warn('No API keys configured, using fallback mode');
      return this.generateFallbackChart(request);
    }
    
    if (!this.currentModel) {
      throw new Error('No AI models available for chart generation and fallback is disabled');
    }

    try {
      const prompt = this.getMarketingChartPrompt(request);
      let response: string | null = null;

      if (this.currentModel.name === 'openai-gpt4') {
        // OpenAI API call
        const openai = new OpenAI({ apiKey: this.currentModel.apiKey });
        const completion = await openai.chat.completions.create({
          model: this.currentModel.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        response = completion.choices[0]?.message?.content;
      } else {
        // Groq API call
        const groqResponse = await fetch(this.currentModel.endpoint!, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentModel.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.currentModel.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          })
        });

        if (!groqResponse.ok) {
          throw new Error(`Groq API error: ${groqResponse.statusText}`);
        }

        const data = await groqResponse.json();
        response = data.choices[0]?.message?.content;
      }

      if (!response) {
        throw new Error('No response from AI model');
      }

      const chartResponse = JSON.parse(response);
      
      const chartConfig: ChartConfig = {
        type: chartResponse.chartType,
        data: chartResponse.chartConfig.data,
        options: this.enhanceMarketingChartOptions(chartResponse.chartConfig.options),
        insights: chartResponse.insights || [],
        voiceNarration: chartResponse.voiceNarration || '',
        quickActions: chartResponse.quickActions || []
      };

      // Cache the result
      this.chartCache.set(cacheKey, {
        config: chartConfig,
        timestamp: Date.now()
      });

      // Clean old cache entries periodically
      this.cleanCache();

      return chartConfig;

    } catch (error) {
      console.error(`Chart generation failed with ${this.currentModel.name}:`, error);
      
      // Try fallback model
      await this.fallbackToNextModel();
      if (this.currentModel) {
        return this.generateChart(request);
      }
      
      // Final fallback - return simple chart
      return this.generateFallbackChart(request);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.chartCache.entries()) {
      if (!this.isValidCache(value.timestamp)) {
        this.chartCache.delete(key);
      }
    }
  }

  private async fallbackToNextModel(): Promise<void> {
    const currentIndex = this.models.findIndex(m => m.name === this.currentModel?.name);
    const nextModels = this.models.slice(currentIndex + 1).filter(m => m.available);
    
    this.currentModel = nextModels[0] || null;
    
    if (this.currentModel) {
      console.log(`Falling back to model: ${this.currentModel.name}`);
    }
  }

  private generateFallbackChart(request: ChartRequest): ChartConfig {
    // Simple fallback chart when AI fails
    return {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Performance Trend',
          data: [100, 120, 110, 140],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          tension: 0.4
        }]
      },
      options: this.enhanceMarketingChartOptions({}),
      insights: ['Data analysis in progress', 'Try asking a more specific question'],
      voiceNarration: 'I\'m having trouble analyzing this data right now. Please try a more specific question.',
      quickActions: [
        { label: 'Try Again', action: 'retry_analysis', data: {} }
      ]
    };
  }

  private enhanceMarketingChartOptions(baseOptions: any): any {
    return {
      ...baseOptions,
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins?.legend,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            color: '#333',
            font: {
              family: 'Inter, sans-serif',
              size: 12
            }
          }
        },
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#333',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            family: 'Inter, sans-serif',
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      scales: baseOptions.scales ? {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            color: '#666',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          }
        },
        x: {
          ...baseOptions.scales.x,
          grid: {
            display: false
          },
          ticks: {
            padding: 10,
            color: '#666',
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          }
        }
      } : undefined
    };
  }

  // Marketing-specific chart generators
  async generateROASTrend(platforms: string[], timeframe: string = '30d'): Promise<ChartConfig> {
    return this.generateChart({
      userQuery: `Show ROAS trends for ${platforms.join(', ')} over the last ${timeframe}`,
      dataContext: { 
        platforms, 
        timeframe, 
        metric: 'roas',
        chartType: 'trend'
      },
      platformData: {}
    });
  }

  async generatePlatformComparison(metric: string, platforms: string[]): Promise<ChartConfig> {
    return this.generateChart({
      userQuery: `Compare ${metric} across ${platforms.join(', ')} platforms`,
      dataContext: { 
        metric, 
        platforms, 
        type: 'comparison',
        chartType: 'bar'
      },
      platformData: {}
    });
  }

  async generateConversionFunnel(platform: string): Promise<ChartConfig> {
    return this.generateChart({
      userQuery: `Show conversion funnel analysis for ${platform}`,
      dataContext: { 
        platform, 
        type: 'funnel',
        chartType: 'funnel'
      },
      platformData: {}
    });
  }

  async generateSpendAnalysis(timeframe: string = '7d'): Promise<ChartConfig> {
    return this.generateChart({
      userQuery: `Analyze ad spend distribution across platforms for the last ${timeframe}`,
      dataContext: { 
        timeframe, 
        type: 'spend_analysis',
        chartType: 'pie'
      },
      platformData: {}
    });
  }

  // Model management
  getCurrentModel(): { name: string; cost: number } | null {
    return this.currentModel ? {
      name: this.currentModel.name,
      cost: this.currentModel.cost
    } : null;
  }

  async switchModel(modelName: 'openai-gpt4' | 'groq-120b' | 'groq-20b'): Promise<boolean> {
    const model = this.models.find(m => m.name === modelName && m.available);
    if (model) {
      this.currentModel = model;
      return true;
    }
    return false;
  }

  getAvailableModels(): Array<{ name: string; cost: number; available: boolean }> {
    return this.models.map(m => ({
      name: m.name,
      cost: m.cost,
      available: m.available
    }));
  }
}

export const mayaChartIntelligenceService = new MayaChartIntelligenceService();