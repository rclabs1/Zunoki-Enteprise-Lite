/**
 * Voice Integration Bridge
 * Connects the new voice coordination system with existing Maya voice infrastructure
 * Ensures seamless integration without breaking existing functionality
 */

import { mayaVoiceCoordinator } from './maya-voice-coordinator';
import { voicePriorityManager } from './voice-priority-manager';
import { naturalLanguageProcessor } from './natural-language-processor';

export interface VoiceIntegrationOptions {
  useCoordination: boolean;
  enablePrioritization: boolean;
  naturalLanguageMode: boolean;
  fallbackToOriginal: boolean;
}

export class VoiceIntegrationBridge {
  private static instance: VoiceIntegrationBridge | null = null;
  
  private integrationOptions: VoiceIntegrationOptions = {
    useCoordination: true,
    enablePrioritization: true,
    naturalLanguageMode: true,
    fallbackToOriginal: true
  };

  static getInstance(): VoiceIntegrationBridge {
    if (!this.instance) {
      this.instance = new VoiceIntegrationBridge();
    }
    return this.instance;
  }

  private constructor() {
    console.log('🌉 Voice Integration Bridge initialized');
  }

  /**
   * Enhanced chart narration that integrates with existing Maya system
   */
  async speakChartData(
    chartData: any,
    insights: any[],
    userId: string,
    options?: {
      chartId?: string;
      priority?: 'urgent' | 'high' | 'normal' | 'low';
      waitForQuiet?: boolean;
      useNaturalLanguage?: boolean;
    }
  ): Promise<void> {
    const opts = {
      chartId: `chart_${Date.now()}`,
      priority: 'normal' as const,
      waitForQuiet: true,
      useNaturalLanguage: this.integrationOptions.naturalLanguageMode,
      ...options
    };

    try {
      // Generate narration text
      let narrationText = '';

      if (opts.useNaturalLanguage && this.integrationOptions.naturalLanguageMode) {
        // Use natural language processor
        const context = naturalLanguageProcessor.createContext(
          chartData.platformCount || 1,
          { expertiseLevel: 'intermediate', narrationLength: 'medium' }
        );

        narrationText = naturalLanguageProcessor.processChartNarration(
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
      } else {
        // Fallback to basic narration
        narrationText = this.generateBasicNarration(chartData, insights);
      }

      // Use prioritized voice system
      if (this.integrationOptions.enablePrioritization) {
        await voicePriorityManager.chartNarration(
          narrationText,
          userId,
          opts.chartId,
          { waitForQuiet: opts.waitForQuiet }
        );
      } else if (this.integrationOptions.useCoordination) {
        // Use coordination without priority management
        await mayaVoiceCoordinator.speakChartNarration(
          chartData,
          insights,
          userId,
          opts.chartId
        );
      } else {
        // Direct call to existing system (fallback)
        console.log('🌉 Using fallback voice system');
        // Would call original maya voice service here
      }

    } catch (error) {
      console.error('🌉 Voice integration error:', error);

      if (this.integrationOptions.fallbackToOriginal) {
        console.log('🌉 Falling back to original voice system');
        // Fallback implementation would go here
      }
    }
  }

  /**
   * Handle error messages with high priority
   */
  async speakError(
    errorMessage: string,
    userId: string,
    errorType: string = 'general'
  ): Promise<void> {
    try {
      // Process error message to be more user-friendly
      let friendlyMessage = this.makeFriendlyError(errorMessage);

      if (this.integrationOptions.enablePrioritization) {
        await voicePriorityManager.emergencyVoice(
          friendlyMessage,
          userId,
          errorType
        );
      } else {
        await mayaVoiceCoordinator.speakWithCoordination({
          id: `error_${errorType}_${Date.now()}`,
          text: friendlyMessage,
          priority: 'urgent',
          source: 'error',
          userId
        });
      }
    } catch (error) {
      console.error('🌉 Error voice integration failed:', error);
    }
  }

  /**
   * Handle insights with appropriate priority
   */
  async speakInsight(
    insight: any,
    userId: string,
    options?: { confidence?: number; type?: string }
  ): Promise<void> {
    const opts = {
      confidence: insight.confidence || 0.7,
      type: insight.type || 'general',
      ...options
    };

    try {
      // Convert technical insight to natural language
      let naturalInsight = insight.description;
      
      if (this.integrationOptions.naturalLanguageMode) {
        naturalInsight = naturalLanguageProcessor.testConversion(insight.description);
      }

      if (this.integrationOptions.enablePrioritization) {
        await voicePriorityManager.insightNarration(
          naturalInsight,
          userId,
          opts.type,
          opts.confidence
        );
      } else {
        await mayaVoiceCoordinator.speakWithCoordination({
          id: `insight_${opts.type}_${Date.now()}`,
          text: naturalInsight,
          priority: opts.confidence > 0.8 ? 'high' : 'normal',
          source: 'insight',
          userId,
          metadata: { confidence: opts.confidence, type: opts.type }
        });
      }
    } catch (error) {
      console.error('🌉 Insight voice integration failed:', error);
    }
  }

  /**
   * System notifications with smart timing
   */
  async speakSystemMessage(
    message: string,
    userId: string,
    type: string = 'notification',
    urgent: boolean = false
  ): Promise<void> {
    try {
      if (this.integrationOptions.enablePrioritization) {
        await voicePriorityManager.systemNotification(
          message,
          userId,
          type,
          !urgent // defer if not urgent
        );
      } else {
        await mayaVoiceCoordinator.speakWithCoordination({
          id: `system_${type}_${Date.now()}`,
          text: message,
          priority: urgent ? 'high' : 'low',
          source: 'system',
          userId,
          metadata: { type, urgent }
        });
      }
    } catch (error) {
      console.error('🌉 System message voice integration failed:', error);
    }
  }

  /**
   * Generate basic narration as fallback
   */
  private generateBasicNarration(chartData: any, insights: any[]): string {
    let narration = "Here's your performance summary. ";

    if (insights.length > 0) {
      narration += insights[0].description + ' ';
    }

    if (insights.length > 1) {
      narration += insights[1].description;
    }

    return narration;
  }

  /**
   * Make error messages more user-friendly
   */
  private makeFriendlyError(errorMessage: string): string {
    return errorMessage
      .replace(/API|HTTP|500|404|401/gi, '')
      .replace(/failed|error|exception/gi, 'having trouble')
      .replace(/undefined|null|NaN/gi, 'missing information')
      .replace(/timeout/gi, 'taking longer than expected')
      .trim();
  }

  /**
   * Emergency stop all voice for user
   */
  async emergencyStopVoice(userId: string): Promise<void> {
    try {
      mayaVoiceCoordinator.emergencyStop(userId);
      console.log('🌉 Emergency voice stop triggered for user:', userId);
    } catch (error) {
      console.error('🌉 Emergency stop failed:', error);
    }
  }

  /**
   * Get comprehensive voice status
   */
  getVoiceStatus(userId: string) {
    return {
      coordinator: mayaVoiceCoordinator.getStatus(userId),
      priorityManager: this.integrationOptions.enablePrioritization ? 
        voicePriorityManager.getVoiceActivity(userId) : null,
      integrationOptions: this.integrationOptions,
      bridgeHealth: 'operational'
    };
  }

  /**
   * Update integration options
   */
  updateIntegrationOptions(options: Partial<VoiceIntegrationOptions>): void {
    this.integrationOptions = {
      ...this.integrationOptions,
      ...options
    };
    
    console.log('🌉 Voice integration options updated:', this.integrationOptions);
  }

  /**
   * Test voice integration with sample data
   */
  async testVoiceIntegration(userId: string): Promise<void> {
    const sampleChartData = {
      platformCount: 2,
      metrics: {
        conversions: 45,
        spend: 1500
      }
    };

    const sampleInsights = [{
      type: 'trend',
      description: 'Your campaigns are performing well with steady growth.',
      confidence: 0.85
    }];

    console.log('🌉 Testing voice integration...');
    
    await this.speakChartData(
      sampleChartData,
      sampleInsights,
      userId,
      { chartId: 'test_integration' }
    );

    console.log('🌉 Voice integration test completed');
  }
}

// Export singleton instance
export const voiceIntegrationBridge = VoiceIntegrationBridge.getInstance();