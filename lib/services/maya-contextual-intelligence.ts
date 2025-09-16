import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { backendIntegrationService } from './backend-integration-service';

export interface UserContext {
  communicationStyle: 'detailed' | 'concise' | 'data-heavy';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  preferredMetrics: string[];
  voiceInteractionFrequency: 'high' | 'medium' | 'low';
}

export interface BusinessContext {
  industry: string;
  seasonalPatterns: Pattern[];
  competitivePosition: 'leader' | 'challenger' | 'niche';
  growthStage: 'startup' | 'scaling' | 'enterprise';
}

export interface PerformanceContext {
  bestPerformingChannels: string[];
  optimizationHistory: OptimizationResult[];
  alertSensitivity: 'high' | 'medium' | 'low';
  approvalPatterns: UserBehavior;
}

export interface Pattern {
  type: 'seasonal' | 'weekly' | 'daily';
  pattern: number[];
  confidence: number;
}

export interface OptimizationResult {
  action: string;
  platform: string;
  impact: number;
  timestamp: string;
  success: boolean;
}

export interface UserBehavior {
  averageResponseTime: number;
  approvalRate: number;
  preferredActions: string[];
  rejectedActions: string[];
}

export interface ContextualGreeting {
  type: 'urgent_alerts' | 'performance_spike' | 'long_absence' | 'new_recommendations' | 'returning_user' | 'normal';
  message: string;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  businessImpact: string;
}

export interface MayaMemory {
  userPreferences: UserContext;
  businessContext: BusinessContext;
  performanceContext: PerformanceContext;
  conversationHistory: ConversationContext[];
  learningPatterns: LearningPattern[];
}

export interface ConversationContext {
  timestamp: string;
  intent: string;
  entities: string[];
  outcome: string;
  userSatisfaction?: number;
}

export interface LearningPattern {
  pattern: string;
  confidence: number;
  frequency: number;
  lastSeen: string;
}

export interface MarketIntelligence {
  trends: MarketTrend[];
  competitorActivity: CompetitorInsight[];
  seasonalFactors: SeasonalFactor[];
  riskFactors: RiskFactor[];
}

export interface MarketTrend {
  metric: string;
  trend: 'up' | 'down' | 'stable';
  magnitude: number;
  timeframe: string;
  confidence: number;
}

export interface CompetitorInsight {
  competitor: string;
  activity: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface SeasonalFactor {
  period: string;
  expectedChange: number;
  confidence: number;
  recommendedActions: string[];
}

export interface RiskFactor {
  type: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export class MayaContextualIntelligence {
  private static instance: MayaContextualIntelligence;
  private memory: MayaMemory | null = null;
  private marketIntelligence: MarketIntelligence | null = null;

  public static getInstance(): MayaContextualIntelligence {
    if (!MayaContextualIntelligence.instance) {
      MayaContextualIntelligence.instance = new MayaContextualIntelligence();
    }
    return MayaContextualIntelligence.instance;
  }

  async initializeContext(): Promise<void> {
    try {
      const [userMemory, marketData] = await Promise.all([
        this.loadUserMemory(),
        this.loadMarketIntelligence()
      ]);

      this.memory = userMemory;
      this.marketIntelligence = marketData;
    } catch (error) {
      console.error('Failed to initialize Maya context:', error);
    }
  }

  async generateContextualGreeting(userName?: string): Promise<ContextualGreeting> {
    try {
      await this.initializeContext();

      // Analyze current context to determine greeting type
      const contextAnalysis = await this.analyzeCurrentContext();
      
      return this.createGreeting(contextAnalysis, userName);
    } catch (error) {
      console.error('Failed to generate contextual greeting:', error);
      return this.getDefaultGreeting(userName);
    }
  }

  private async analyzeCurrentContext(): Promise<any> {
    const [campaigns, activities, alerts] = await Promise.all([
      supabaseMultiUserService.getCampaignMetrics(),
      supabaseMultiUserService.getUserActivities(10),
      this.detectUrgentAlerts()
    ]);

    const lastActivity = activities[0]?.created_at;
    const timeSinceLastActivity = lastActivity ? 
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60) : 72;

    const performanceChanges = this.analyzePerformanceChanges(campaigns);
    
    return {
      urgentAlerts: alerts,
      timeSinceLastActivity,
      performanceChanges,
      campaigns,
      activities
    };
  }

  private createGreeting(context: any, userName?: string): ContextualGreeting {
    const nameGreeting = userName ? `${userName}! ` : '';
    
    // Urgent alerts take priority
    if (context.urgentAlerts.length > 0) {
      const alert = context.urgentAlerts[0];
      return {
        type: 'urgent_alerts',
        message: `🚨 ${nameGreeting}${alert.message} - ${alert.actions.length} actions ready`,
        priority: 'high',
        actions: alert.actions,
        businessImpact: alert.businessImpact
      };
    }

    // Performance spike detection
    if (context.performanceChanges.significantImprovement) {
      return {
        type: 'performance_spike',
        message: `📈 Great news ${nameGreeting}Your ROAS improved to ${context.performanceChanges.newRoas}x overnight. Should we scale this campaign?`,
        priority: 'high',
        actions: ['Scale successful campaigns', 'Apply winning strategies', 'Increase budgets'],
        businessImpact: 'Captures growth opportunities'
      };
    }

    // Long absence (>48 hours)
    if (context.timeSinceLastActivity > 48) {
      const changeCount = context.activities.length;
      return {
        type: 'long_absence',
        message: `Welcome back ${nameGreeting}${changeCount} campaign changes to review - here's what matters most.`,
        priority: 'medium',
        actions: ['Review changes', 'Check performance', 'Update strategies'],
        businessImpact: 'Efficient catch-up'
      };
    }

    // New recommendations available
    const recommendations = this.getPendingRecommendations();
    if (recommendations.length > 0) {
      return {
        type: 'new_recommendations',
        message: `🎯 ${nameGreeting}${recommendations.length} high-priority optimizations ready - ${recommendations[0].predictedImpact}% ROAS boost predicted`,
        priority: 'high',
        actions: recommendations.map(r => r.action),
        businessImpact: 'Proactive improvements'
      };
    }

    // Returning user with insights
    if (context.timeSinceLastActivity > 1 && context.timeSinceLastActivity < 48) {
      const insight = this.getLatestInsight(context);
      return {
        type: 'returning_user',
        message: `🔄 Welcome back ${nameGreeting}${insight.message} - apply to other platforms?`,
        priority: 'medium',
        actions: ['Apply insights', 'Cross-platform optimization', 'Review performance'],
        businessImpact: 'Cross-platform insights'
      };
    }

    // Normal greeting
    return this.getDefaultGreeting(userName);
  }

  private async detectUrgentAlerts(): Promise<any[]> {
    const campaigns = await supabaseMultiUserService.getCampaignMetrics();
    const alerts = [];

    for (const campaign of campaigns) {
      // Budget overspend detection
      if (campaign.spend > (campaign.budget || 0) * 0.9) {
        alerts.push({
          type: 'budget_overspend',
          message: `Budget overspend detected on ${campaign.platform}`,
          actions: ['Pause campaign', 'Adjust budget', 'Optimize bids'],
          businessImpact: 'Prevents wasted spend',
          campaign: campaign.campaign_name
        });
      }

      // Performance drop detection
      if (campaign.roas < 2.0 && campaign.spend > 1000) {
        alerts.push({
          type: 'performance_drop',
          message: `Low ROAS (${campaign.roas}x) detected on ${campaign.campaign_name}`,
          actions: ['Optimize targeting', 'Refresh creatives', 'Adjust bids'],
          businessImpact: 'Prevents revenue loss',
          campaign: campaign.campaign_name
        });
      }
    }

    return alerts.slice(0, 3); // Top 3 most urgent
  }

  private analyzePerformanceChanges(campaigns: any[]): any {
    // Simulate performance analysis - in production, this would compare historical data
    const avgRoas = campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / campaigns.length;
    
    return {
      significantImprovement: avgRoas > 4.0,
      significantDecline: avgRoas < 2.0,
      newRoas: avgRoas.toFixed(1),
      trendDirection: avgRoas > 3.5 ? 'up' : avgRoas < 2.5 ? 'down' : 'stable'
    };
  }

  private getPendingRecommendations(): any[] {
    // Simulate AI-generated recommendations
    return [
      {
        action: 'Increase Google Ads budget by 20%',
        predictedImpact: 23,
        confidence: 94,
        platform: 'google_ads'
      },
      {
        action: 'Test new creative variants on Meta',
        predictedImpact: 15,
        confidence: 78,
        platform: 'meta_ads'
      }
    ];
  }

  private getLatestInsight(context: any): any {
    // Simulate cross-platform insights
    return {
      message: 'LinkedIn CPC dropped 15% since yesterday',
      platform: 'linkedin_ads',
      metric: 'CPC',
      change: -15,
      suggestion: 'Apply similar targeting to Meta Ads'
    };
  }

  private getDefaultGreeting(userName?: string): ContextualGreeting {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const nameGreeting = userName ? ` ${userName}` : '';

    return {
      type: 'normal',
      message: `${timeGreeting}${nameGreeting}! I'm Zunoki., your AI marketing intelligence. How can I help optimize your campaigns today?`,
      priority: 'low',
      actions: ['View performance', 'Create campaign', 'Optimize existing'],
      businessImpact: 'Ready to assist'
    };
  }

  async updateContextualMemory(interaction: ConversationContext): Promise<void> {
    try {
      if (!this.memory) await this.initializeContext();

      this.memory!.conversationHistory.push(interaction);

      // Update learning patterns
      this.updateLearningPatterns(interaction);

      // Store updated memory
      await this.saveUserMemory(this.memory!);
    } catch (error) {
      console.error('Failed to update contextual memory:', error);
    }
  }

  private updateLearningPatterns(interaction: ConversationContext): void {
    if (!this.memory) return;

    const existingPattern = this.memory.learningPatterns.find(p => p.pattern === interaction.intent);
    
    if (existingPattern) {
      existingPattern.frequency += 1;
      existingPattern.lastSeen = interaction.timestamp;
      existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
    } else {
      this.memory.learningPatterns.push({
        pattern: interaction.intent,
        confidence: 0.5,
        frequency: 1,
        lastSeen: interaction.timestamp
      });
    }
  }

  private async loadUserMemory(): Promise<MayaMemory> {
    try {
      // In production, this would load from vector database (Pinecone)
      // For now, we'll simulate with default values
      return {
        userPreferences: {
          communicationStyle: 'detailed',
          riskTolerance: 'moderate',
          preferredMetrics: ['ROAS', 'CPC', 'CTR', 'Conversions'],
          voiceInteractionFrequency: 'medium'
        },
        businessContext: {
          industry: 'E-commerce',
          seasonalPatterns: [],
          competitivePosition: 'challenger',
          growthStage: 'scaling'
        },
        performanceContext: {
          bestPerformingChannels: ['google_ads', 'meta_ads'],
          optimizationHistory: [],
          alertSensitivity: 'medium',
          approvalPatterns: {
            averageResponseTime: 300, // 5 minutes
            approvalRate: 0.8,
            preferredActions: ['budget_optimization', 'bid_adjustment'],
            rejectedActions: ['creative_changes']
          }
        },
        conversationHistory: [],
        learningPatterns: []
      };
    } catch (error) {
      console.error('Failed to load user memory:', error);
      throw error;
    }
  }

  private async loadMarketIntelligence(): Promise<MarketIntelligence> {
    try {
      // In production, this would fetch real market data
      return {
        trends: [
          {
            metric: 'CPC',
            trend: 'up',
            magnitude: 12,
            timeframe: 'last_7_days',
            confidence: 0.85
          }
        ],
        competitorActivity: [],
        seasonalFactors: [],
        riskFactors: []
      };
    } catch (error) {
      console.error('Failed to load market intelligence:', error);
      throw error;
    }
  }

  private async saveUserMemory(memory: MayaMemory): Promise<void> {
    try {
      // In production, this would save to vector database
      // For now, we'll store key insights in Supabase
      await supabaseMultiUserService.trackActivity('maya_memory_update', {
        conversationCount: memory.conversationHistory.length,
        learningPatterns: memory.learningPatterns.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save user memory:', error);
    }
  }

  async predictUserNeeds(): Promise<string[]> {
    if (!this.memory) await this.initializeContext();

    const predictions = [];
    
    // Analyze patterns and predict needs
    const frequentIntents = this.memory!.learningPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    for (const pattern of frequentIntents) {
      if (pattern.pattern === 'performance_check') {
        predictions.push('You might want to check campaign performance');
      } else if (pattern.pattern === 'budget_optimization') {
        predictions.push('Budget optimization might be needed');
      } else if (pattern.pattern === 'creative_analysis') {
        predictions.push('Consider analyzing creative performance');
      }
    }

    return predictions;
  }

  getContextualResponse(message: string): Promise<any> {
    // This would integrate with the enhanced backend to provide contextual responses
    return backendIntegrationService.queryMaya({
      message,
      conversationId: 'contextual-' + Date.now(),
      context: {
        memory: this.memory,
        marketIntelligence: this.marketIntelligence,
        predictiveContext: true
      }
    });
  }
}

export const mayaContextualIntelligence = MayaContextualIntelligence.getInstance();