/**
 * Maya Voice Coordinator
 * Advanced voice coordination system for unified chart intelligence
 * Prevents dual voice issues and manages natural conversation flow
 */

import { mayaVoiceNarrationService } from './maya-voice-narration-service';
import { naturalLanguageProcessor } from './natural-language-processor';

export interface VoiceRequest {
  id: string;
  text: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  source: 'chart' | 'insight' | 'error' | 'system';
  userId: string;
  metadata?: Record<string, any>;
}

export interface VoiceQueueItem extends VoiceRequest {
  timestamp: number;
  retries: number;
}

export class MayaVoiceCoordinator {
  private static instance: MayaVoiceCoordinator | null = null;
  private voiceQueue: VoiceQueueItem[] = [];
  private currentlyPlaying: VoiceQueueItem | null = null;
  private isProcessing = false;

  static getInstance(): MayaVoiceCoordinator {
    if (!this.instance) {
      this.instance = new MayaVoiceCoordinator();
    }
    return this.instance;
  }

  private constructor() {
    console.log('🎤 Maya Voice Coordinator initialized');
    this.startQueueProcessor();
  }

  /**
   * Add voice request to coordinated queue
   */
  async speakWithCoordination(request: VoiceRequest): Promise<void> {
    // Prevent duplicate requests
    const existingIndex = this.voiceQueue.findIndex(item => 
      item.id === request.id && item.userId === request.userId
    );

    if (existingIndex !== -1) {
      console.log('🎤 Duplicate voice request ignored:', request.id);
      return;
    }

    const queueItem: VoiceQueueItem = {
      ...request,
      timestamp: Date.now(),
      retries: 0
    };

    // Priority-based insertion
    this.insertByPriority(queueItem);
    
    console.log('🎤 Voice request queued:', {
      id: request.id,
      priority: request.priority,
      source: request.source,
      queueLength: this.voiceQueue.length
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Generate and speak chart narration with natural conversation flow
   */
  async speakChartNarration(
    chartData: any, 
    insights: any[], 
    userId: string, 
    chartId: string
  ): Promise<void> {
    const narration = this.generateConversationalNarration(chartData, insights);
    
    await this.speakWithCoordination({
      id: `chart_${chartId}`,
      text: narration,
      priority: 'normal',
      source: 'chart',
      userId,
      metadata: {
        chartId,
        insightCount: insights.length,
        dataPoints: chartData?.data?.datasets?.[0]?.data?.length || 0
      }
    });
  }

  /**
   * Generate conversational narration using natural language processor
   */
  private generateConversationalNarration(chartData: any, insights: any[]): string {
    // Create context for natural language processing
    const context = naturalLanguageProcessor.createContext(
      chartData.platformCount || 1,
      { expertiseLevel: 'intermediate', narrationLength: 'medium' },
      []
    );

    // Process using the natural language processor
    return naturalLanguageProcessor.processChartNarration(
      chartData,
      insights,
      context,
      {
        avoidTechnicalTerms: true,
        useMetaphors: false,
        includeRecommendations: true,
        personalizeForUser: true,
        conversationalTone: true
      }
    );
  }

  /**
   * Convert technical insights to natural conversation
   */
  private makeInsightConversational(insight: any): string {
    const { title, description, value, confidence } = insight;
    
    let conversational = '';
    
    if (confidence > 0.8) {
      conversational += "I'm quite confident that ";
    } else if (confidence > 0.6) {
      conversational += "It looks like ";
    } else {
      conversational += "There are signs that ";
    }

    // Simplify technical language
    let simpleDescription = description
      .replace(/conversion rate/gi, 'how many people take action')
      .replace(/click-through rate/gi, 'engagement level')
      .replace(/cost per click/gi, 'what you pay per visitor')
      .replace(/return on ad spend/gi, 'profit from your ads')
      .replace(/engagement rate/gi, 'how much people interact');

    conversational += simpleDescription.toLowerCase();

    if (value !== undefined) {
      conversational += ` The key number here is ${this.formatNumber(value)}.`;
    }

    return conversational + ' ';
  }

  /**
   * Make recommendations sound natural and actionable
   */
  private makeRecommendationConversational(description: string): string {
    return description
      .replace(/^You should/, 'you might want to')
      .replace(/^Consider/, 'consider')
      .replace(/^Try to/, 'try')
      .replace(/optimization/gi, 'improving')
      .replace(/implementation/gi, 'setting up')
      .toLowerCase();
  }

  /**
   * Analyze trend from data values
   */
  private analyzeTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'strong upward';
    if (change > 5) return 'upward';
    if (change < -10) return 'declining';
    if (change < -5) return 'downward';
    return 'steady';
  }

  /**
   * Format numbers for natural speech
   */
  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} million`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} thousand`;
    } else if (value % 1 === 0) {
      return value.toString();
    } else {
      return value.toFixed(2);
    }
  }

  /**
   * Get time-based greeting for natural conversation
   */
  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Hey there';
  }

  /**
   * Clean up narration for natural speech
   */
  private cleanupNarration(narration: string): string {
    return narration
      .replace(/\s+/g, ' ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_{2,}([^_]+)_{2,}/g, '$1')
      .replace(/#+ /g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Insert item into queue by priority
   */
  private insertByPriority(item: VoiceQueueItem): void {
    const priorities = { urgent: 0, high: 1, normal: 2, low: 3 };
    const itemPriority = priorities[item.priority];

    let insertIndex = this.voiceQueue.length;
    
    for (let i = 0; i < this.voiceQueue.length; i++) {
      if (priorities[this.voiceQueue[i].priority] > itemPriority) {
        insertIndex = i;
        break;
      }
    }

    this.voiceQueue.splice(insertIndex, 0, item);
  }

  /**
   * Process voice queue with coordination
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.voiceQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.voiceQueue.length > 0) {
      const item = this.voiceQueue.shift()!;
      this.currentlyPlaying = item;

      try {
        console.log('🎤 Playing voice:', {
          id: item.id,
          source: item.source,
          priority: item.priority,
          textLength: item.text.length
        });

        await mayaVoiceNarrationService.speakText(
          item.text,
          item.userId,
          {
            priority: item.priority,
            source: item.source,
            requestId: item.id
          }
        );

        console.log('🎤 Voice completed:', item.id);
        
      } catch (error) {
        console.error('🎤 Voice playback failed:', error);
        
        // Retry logic for important messages
        if (item.retries < 2 && (item.priority === 'urgent' || item.priority === 'high')) {
          item.retries++;
          this.voiceQueue.unshift(item);
          console.log('🎤 Retrying voice request:', item.id);
        }
      }

      this.currentlyPlaying = null;
      
      // Brief pause between voice messages to prevent overlap
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  /**
   * Start background queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.voiceQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Clear all pending voice requests for user
   */
  clearUserRequests(userId: string): void {
    const beforeCount = this.voiceQueue.length;
    this.voiceQueue = this.voiceQueue.filter(item => item.userId !== userId);
    const cleared = beforeCount - this.voiceQueue.length;
    
    if (cleared > 0) {
      console.log(`🎤 Cleared ${cleared} voice requests for user:`, userId);
    }
  }

  /**
   * Emergency stop all voice
   */
  emergencyStop(userId: string): void {
    this.clearUserRequests(userId);
    
    if (this.currentlyPlaying?.userId === userId) {
      console.log('🎤 Emergency stop triggered for user:', userId);
    }
  }

  /**
   * Get voice queue status
   */
  getStatus(userId?: string) {
    const userQueue = userId ? 
      this.voiceQueue.filter(item => item.userId === userId) : 
      this.voiceQueue;

    return {
      queueLength: userQueue.length,
      currentlyPlaying: this.currentlyPlaying?.id || null,
      isProcessing: this.isProcessing,
      upcomingRequests: userQueue.slice(0, 3).map(item => ({
        id: item.id,
        priority: item.priority,
        source: item.source
      }))
    };
  }
}

// Export singleton instance
export const mayaVoiceCoordinator = MayaVoiceCoordinator.getInstance();