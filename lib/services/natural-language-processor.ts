/**
 * Natural Language Processor
 * Converts technical data into natural conversational language
 * Fixes the robotic markdown reading issue
 */

export interface ConversationContext {
  platformCount: number;
  userType: 'beginner' | 'intermediate' | 'expert';
  previousInsights: string[];
  timeOfDay: string;
  preferredLength: 'short' | 'medium' | 'long';
}

export interface NaturalLanguageOptions {
  avoidTechnicalTerms: boolean;
  useMetaphors: boolean;
  includeRecommendations: boolean;
  personalizeForUser: boolean;
  conversationalTone: boolean;
}

export class NaturalLanguageProcessor {
  private static instance: NaturalLanguageProcessor | null = null;
  
  // Technical terms and their natural alternatives
  private readonly technicalTerms = new Map([
    ['conversion rate', 'how often people take action'],
    ['click-through rate', 'engagement level'],
    ['cost per click', 'what you pay per visitor'],
    ['return on ad spend', 'profit from your ads'],
    ['engagement rate', 'how much people interact'],
    ['impressions', 'times your content was seen'],
    ['cost per conversion', 'what you pay for each customer action'],
    ['bounce rate', 'people who left quickly'],
    ['session duration', 'time spent on your site'],
    ['organic traffic', 'visitors who found you naturally'],
    ['paid traffic', 'visitors from your ads'],
    ['acquisition cost', 'what it costs to get new customers'],
    ['lifetime value', 'total value of a customer'],
    ['churn rate', 'how often customers leave']
  ]);

  // Conversation starters based on context
  private readonly conversationStarters = [
    "Here's what your data is telling us",
    "Looking at your performance",
    "Based on what I'm seeing",
    "Your numbers show",
    "The data reveals",
    "Here's the story behind your metrics"
  ];

  // Positive performance indicators
  private readonly positiveIndicators = [
    'performing well', 'looking strong', 'trending upward', 
    'exceeding expectations', 'showing growth', 'delivering results',
    'on the right track', 'making progress', 'improving steadily'
  ];

  // Improvement suggestions (natural language)
  private readonly naturalSuggestions = [
    'you might want to consider',
    'it could be worth trying',
    'I\'d suggest looking into',
    'perhaps focus on',
    'consider optimizing',
    'think about improving'
  ];

  static getInstance(): NaturalLanguageProcessor {
    if (!this.instance) {
      this.instance = new NaturalLanguageProcessor();
    }
    return this.instance;
  }

  private constructor() {
    console.log('💬 Natural Language Processor initialized');
  }

  /**
   * Convert technical chart data into natural conversation
   */
  processChartNarration(
    data: any,
    insights: any[],
    context: ConversationContext,
    options: NaturalLanguageOptions = {
      avoidTechnicalTerms: true,
      useMetaphors: false,
      includeRecommendations: true,
      personalizeForUser: true,
      conversationalTone: true
    }
  ): string {
    let narration = '';

    // Start with context-appropriate greeting
    narration += this.getContextualOpening(context) + '. ';

    // Add main performance summary
    narration += this.summarizePerformance(data, context, options) + ' ';

    // Include key insights in natural language
    if (insights.length > 0) {
      narration += this.naturalizeInsights(insights, options) + ' ';
    }

    // Add recommendations if requested
    if (options.includeRecommendations) {
      narration += this.generateNaturalRecommendations(insights, context) + ' ';
    }

    // Clean up and finalize
    return this.finalizeNarration(narration, context, options);
  }

  /**
   * Get contextual opening based on time and user type
   */
  private getContextualOpening(context: ConversationContext): string {
    const timeGreeting = this.getTimeBasedGreeting(context.timeOfDay);
    const starters = this.conversationStarters;
    const randomStarter = starters[Math.floor(Math.random() * starters.length)];

    if (context.platformCount > 1) {
      return `${timeGreeting}, looking across your ${context.platformCount} connected platforms, ${randomStarter.toLowerCase()}`;
    } else {
      return `${timeGreeting}, ${randomStarter.toLowerCase()}`;
    }
  }

  /**
   * Summarize performance in natural language
   */
  private summarizePerformance(data: any, context: ConversationContext, options: NaturalLanguageOptions): string {
    const metrics = this.extractKeyMetrics(data);
    let summary = '';

    if (metrics.trend === 'positive') {
      const indicator = this.positiveIndicators[Math.floor(Math.random() * this.positiveIndicators.length)];
      summary = `your campaigns are ${indicator}`;
    } else if (metrics.trend === 'stable') {
      summary = 'your performance is holding steady';
    } else {
      summary = 'there\'s room for improvement in your performance';
    }

    // Add specific numbers in natural way
    if (metrics.conversions > 0) {
      summary += `. You've generated ${this.naturalizeNumber(metrics.conversions)} ${metrics.conversions === 1 ? 'conversion' : 'conversions'}`;
      
      if (metrics.spend > 0) {
        summary += ` from about ${this.naturalizeNumber(metrics.spend, 'currency')} in ad spend`;
      }
    }

    return summary;
  }

  /**
   * Convert insights to natural conversation
   */
  private naturalizeInsights(insights: any[], options: NaturalLanguageOptions): string {
    if (insights.length === 0) return '';

    const mainInsight = insights[0];
    let natural = '';

    // Add confidence-based intro
    if (mainInsight.confidence > 0.8) {
      natural += "I'm confident that ";
    } else if (mainInsight.confidence > 0.6) {
      natural += "It looks like ";
    } else {
      natural += "There are signs that ";
    }

    // Convert technical description
    let description = mainInsight.description;
    
    if (options.avoidTechnicalTerms) {
      description = this.replaceTechnicalTerms(description);
    }

    natural += description.toLowerCase();

    // Add additional insights if available
    if (insights.length > 1 && mainInsight.type !== 'error') {
      const secondInsight = insights[1];
      natural += `. Additionally, ${this.replaceTechnicalTerms(secondInsight.description).toLowerCase()}`;
    }

    return natural;
  }

  /**
   * Generate natural recommendations
   */
  private generateNaturalRecommendations(insights: any[], context: ConversationContext): string {
    const recommendations = insights.filter(i => i.type === 'recommendation');
    
    if (recommendations.length === 0) {
      return this.getGenericPositiveClose(context);
    }

    const rec = recommendations[0];
    const suggestion = this.naturalSuggestions[Math.floor(Math.random() * this.naturalSuggestions.length)];
    
    let natural = `Based on this, ${suggestion} ${this.replaceTechnicalTerms(rec.description).toLowerCase()}`;
    
    // Remove redundant phrases
    natural = natural.replace(/\s*\.\s*$/, ''); // Remove trailing period
    natural = natural.replace(/^based on this,\s*/i, 'My recommendation: ');
    
    return natural;
  }

  /**
   * Replace technical terms with natural alternatives
   */
  private replaceTechnicalTerms(text: string): string {
    let natural = text;
    
    for (const [technical, alternative] of this.technicalTerms) {
      const regex = new RegExp(technical, 'gi');
      natural = natural.replace(regex, alternative);
    }

    // Remove other technical jargon
    natural = natural
      .replace(/API|OAuth|JSON|HTTP|SQL/gi, '')
      .replace(/campaign_metrics|oauth_tokens/gi, 'your data')
      .replace(/supabase|database/gi, 'system')
      .replace(/\b(avg|ctr|cpc|cpa|roas)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return natural;
  }

  /**
   * Convert numbers to natural speech
   */
  private naturalizeNumber(value: number, type?: 'currency' | 'percentage'): string {
    if (type === 'currency') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)} million`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}k`;
      } else {
        return `$${Math.round(value)}`;
      }
    }

    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} million`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} thousand`;
    } else if (value % 1 === 0) {
      return value.toString();
    } else {
      return value.toFixed(1);
    }
  }

  /**
   * Extract key metrics from chart data
   */
  private extractKeyMetrics(data: any): {
    conversions: number;
    spend: number;
    trend: 'positive' | 'stable' | 'negative';
    engagementLevel: 'high' | 'medium' | 'low';
  } {
    // This would analyze the actual chart data structure
    // For now, providing a basic implementation
    
    const datasets = data?.data?.datasets || [];
    const firstDataset = datasets[0]?.data || [];
    
    let trend: 'positive' | 'stable' | 'negative' = 'stable';
    if (firstDataset.length >= 2) {
      const first = firstDataset[0] || 0;
      const last = firstDataset[firstDataset.length - 1] || 0;
      const change = ((last - first) / (first || 1)) * 100;
      
      if (change > 5) trend = 'positive';
      else if (change < -5) trend = 'negative';
    }

    return {
      conversions: data.metrics?.conversions || 0,
      spend: data.metrics?.spend || 0,
      trend,
      engagementLevel: 'medium' // Would be calculated from actual data
    };
  }

  /**
   * Get time-based greeting
   */
  private getTimeBasedGreeting(timeOfDay: string): string {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Hey there';
  }

  /**
   * Get generic positive close
   */
  private getGenericPositiveClose(context: ConversationContext): string {
    const closes = [
      "Keep up the great work!",
      "Things are looking solid.",
      "You're on the right track.",
      "Your efforts are paying off.",
      "Stay the course - it's working."
    ];

    return closes[Math.floor(Math.random() * closes.length)];
  }

  /**
   * Finalize narration with cleanup and personalization
   */
  private finalizeNarration(
    narration: string, 
    context: ConversationContext, 
    options: NaturalLanguageOptions
  ): string {
    let final = narration;

    // Length adjustment
    if (context.preferredLength === 'short') {
      final = final.split('.')[0] + '.';
    } else if (context.preferredLength === 'long') {
      final += ' ' + this.addContextualDetails(context);
    }

    // Clean up formatting
    final = final
      .replace(/\s+/g, ' ')
      .replace(/\.\s*\./g, '.')
      .replace(/,\s*,/g, ',')
      .replace(/\s+([.!?])/g, '$1')
      .trim();

    // Ensure it ends properly
    if (!/[.!?]$/.test(final)) {
      final += '.';
    }

    return final;
  }

  /**
   * Add contextual details for long narrations
   */
  private addContextualDetails(context: ConversationContext): string {
    if (context.platformCount > 2) {
      return "Having multiple platforms gives you a comprehensive view of your performance across channels.";
    } else if (context.userType === 'beginner') {
      return "Remember, consistent small improvements lead to significant growth over time.";
    } else {
      return "Continue monitoring these trends for optimization opportunities.";
    }
  }

  /**
   * Create conversation context from user data
   */
  createContext(
    platformCount: number,
    userPreferences?: any,
    previousInsights?: string[]
  ): ConversationContext {
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';

    return {
      platformCount,
      userType: userPreferences?.expertiseLevel || 'intermediate',
      previousInsights: previousInsights || [],
      timeOfDay,
      preferredLength: userPreferences?.narrationLength || 'medium'
    };
  }

  /**
   * Test natural language conversion
   */
  testConversion(technicalText: string): string {
    return this.replaceTechnicalTerms(technicalText);
  }
}

// Export singleton instance
export const naturalLanguageProcessor = NaturalLanguageProcessor.getInstance();