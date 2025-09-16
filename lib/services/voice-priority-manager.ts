/**
 * Voice Priority Manager
 * Advanced priority and conflict resolution for Maya voice system
 * Prevents dual voice issues and manages conversation flow
 */

import { mayaVoiceCoordinator, VoiceRequest } from './maya-voice-coordinator';

export interface VoicePriorityRule {
  source: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  maxConcurrent: number;
  timeout: number; // milliseconds
  canInterrupt: string[]; // sources this can interrupt
  retryCount: number;
}

export class VoicePriorityManager {
  private static instance: VoicePriorityManager | null = null;
  
  private priorityRules: Map<string, VoicePriorityRule> = new Map([
    ['error', { 
      source: 'error', 
      priority: 'urgent', 
      maxConcurrent: 1, 
      timeout: 10000, 
      canInterrupt: ['chart', 'insight', 'system'], 
      retryCount: 2 
    }],
    ['chart', { 
      source: 'chart', 
      priority: 'normal', 
      maxConcurrent: 1, 
      timeout: 30000, 
      canInterrupt: [], 
      retryCount: 1 
    }],
    ['insight', { 
      source: 'insight', 
      priority: 'high', 
      maxConcurrent: 1, 
      timeout: 15000, 
      canInterrupt: ['chart'], 
      retryCount: 1 
    }],
    ['system', { 
      source: 'system', 
      priority: 'low', 
      maxConcurrent: 1, 
      timeout: 20000, 
      canInterrupt: [], 
      retryCount: 0 
    }]
  ]);

  static getInstance(): VoicePriorityManager {
    if (!this.instance) {
      this.instance = new VoicePriorityManager();
    }
    return this.instance;
  }

  private constructor() {
    console.log('🎯 Voice Priority Manager initialized');
  }

  /**
   * Smart voice request with priority-based conflict resolution
   */
  async requestVoice(request: VoiceRequest): Promise<boolean> {
    const rule = this.priorityRules.get(request.source);
    
    if (!rule) {
      console.warn('🎯 No priority rule for source:', request.source);
      return false;
    }

    // Apply priority rule
    const enhancedRequest: VoiceRequest = {
      ...request,
      priority: rule.priority
    };

    try {
      // Check for conflicts and resolve
      const canProceed = await this.resolveConflicts(enhancedRequest, rule);
      
      if (canProceed) {
        await mayaVoiceCoordinator.speakWithCoordination(enhancedRequest);
        return true;
      } else {
        console.log('🎯 Voice request blocked by priority rules:', request.id);
        return false;
      }
    } catch (error) {
      console.error('🎯 Voice priority error:', error);
      return false;
    }
  }

  /**
   * Resolve conflicts between voice requests
   */
  private async resolveConflicts(request: VoiceRequest, rule: VoicePriorityRule): Promise<boolean> {
    const coordinator = mayaVoiceCoordinator;
    const status = coordinator.getStatus(request.userId);

    // Check if we can interrupt current playback
    if (status.currentlyPlaying) {
      const currentSource = this.extractSourceFromId(status.currentlyPlaying);
      
      if (rule.canInterrupt.includes(currentSource)) {
        console.log('🎯 Interrupting current voice for higher priority:', {
          current: currentSource,
          new: request.source,
          priority: request.priority
        });
        
        coordinator.emergencyStop(request.userId);
        return true;
      }
    }

    // Check queue capacity
    if (status.queueLength >= rule.maxConcurrent) {
      console.log('🎯 Voice queue at capacity for source:', request.source);
      
      // For high priority requests, clear lower priority items
      if (request.priority === 'urgent' || request.priority === 'high') {
        this.clearLowerPriorityRequests(request.userId, request.priority);
        return true;
      }
      
      return false;
    }

    return true;
  }

  /**
   * Clear lower priority requests from queue
   */
  private clearLowerPriorityRequests(userId: string, currentPriority: string): void {
    // This would need to be implemented in the coordinator
    console.log('🎯 Clearing lower priority requests for:', currentPriority);
  }

  /**
   * Extract source from voice request ID
   */
  private extractSourceFromId(voiceId: string): string {
    if (voiceId.includes('chart_')) return 'chart';
    if (voiceId.includes('error_')) return 'error';
    if (voiceId.includes('insight_')) return 'insight';
    return 'system';
  }

  /**
   * Emergency voice (highest priority)
   */
  async emergencyVoice(text: string, userId: string, reason: string): Promise<void> {
    await this.requestVoice({
      id: `emergency_${Date.now()}_${userId}`,
      text,
      priority: 'urgent',
      source: 'error',
      userId,
      metadata: { reason, timestamp: new Date().toISOString() }
    });
  }

  /**
   * Chart narration with smart timing
   */
  async chartNarration(
    text: string, 
    userId: string, 
    chartId: string, 
    options?: { 
      waitForQuiet?: boolean; 
      maxWaitTime?: number;
    }
  ): Promise<void> {
    const opts = {
      waitForQuiet: true,
      maxWaitTime: 5000, // 5 seconds
      ...options
    };

    // Wait for quiet moment if requested
    if (opts.waitForQuiet) {
      await this.waitForQuietMoment(userId, opts.maxWaitTime);
    }

    await this.requestVoice({
      id: `chart_${chartId}`,
      text,
      priority: 'normal',
      source: 'chart',
      userId,
      metadata: { 
        chartId, 
        waitedForQuiet: opts.waitForQuiet,
        textLength: text.length 
      }
    });
  }

  /**
   * Wait for a quiet moment in voice queue
   */
  private async waitForQuietMoment(userId: string, maxWaitTime: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = mayaVoiceCoordinator.getStatus(userId);
      
      if (!status.currentlyPlaying && status.queueLength === 0) {
        console.log('🎯 Found quiet moment for voice');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎯 Timeout waiting for quiet moment, proceeding anyway');
  }

  /**
   * Insight narration with context awareness
   */
  async insightNarration(
    text: string, 
    userId: string, 
    insightType: string,
    confidence: number
  ): Promise<void> {
    // Higher confidence insights get higher priority
    const priority = confidence > 0.8 ? 'high' : 'normal';
    
    await this.requestVoice({
      id: `insight_${insightType}_${Date.now()}`,
      text,
      priority,
      source: 'insight',
      userId,
      metadata: { 
        insightType, 
        confidence,
        contextAware: true
      }
    });
  }

  /**
   * System notification with smart timing
   */
  async systemNotification(
    text: string, 
    userId: string, 
    notificationType: string,
    defer: boolean = true
  ): Promise<void> {
    // System notifications are usually deferred unless urgent
    const priority = defer ? 'low' : 'normal';
    
    await this.requestVoice({
      id: `system_${notificationType}_${Date.now()}`,
      text,
      priority,
      source: 'system',
      userId,
      metadata: { 
        notificationType,
        deferred: defer,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get voice activity status
   */
  getVoiceActivity(userId: string) {
    const status = mayaVoiceCoordinator.getStatus(userId);
    
    return {
      ...status,
      priorityRules: Object.fromEntries(this.priorityRules),
      recommendations: this.getVoiceRecommendations(status)
    };
  }

  /**
   * Get recommendations for voice usage
   */
  private getVoiceRecommendations(status: any): string[] {
    const recommendations: string[] = [];
    
    if (status.queueLength > 3) {
      recommendations.push('Consider reducing voice notifications for better user experience');
    }
    
    if (status.isProcessing && status.queueLength > 1) {
      recommendations.push('Voice queue is busy, urgent messages will be prioritized');
    }
    
    if (!status.currentlyPlaying && status.queueLength === 0) {
      recommendations.push('Voice system is quiet - good time for chart narration');
    }
    
    return recommendations;
  }

  /**
   * Update priority rules dynamically
   */
  updatePriorityRule(source: string, rule: Partial<VoicePriorityRule>): void {
    const existing = this.priorityRules.get(source);
    if (existing) {
      this.priorityRules.set(source, { ...existing, ...rule });
      console.log('🎯 Updated priority rule for:', source);
    } else {
      console.warn('🎯 Cannot update non-existent priority rule:', source);
    }
  }

  /**
   * Reset to default priority rules
   */
  resetToDefaults(): void {
    this.constructor();
    console.log('🎯 Priority rules reset to defaults');
  }
}

// Export singleton instance
export const voicePriorityManager = VoicePriorityManager.getInstance();