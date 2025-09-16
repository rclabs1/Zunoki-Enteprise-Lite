/**
 * Global Voice Coordinator - Ensures only one voice speaks at a time
 * Solves: Dual voice conflicts, component re-mount voice spam, USP preservation
 */

import { mayaVoiceService } from '@/lib/voice-recognition';

export interface VoiceSpeaker {
  id: string;
  name: string;
  priority: number; // Higher = more important
  stop: () => void;
}

class VoiceCoordinator {
  private currentSpeaker: VoiceSpeaker | null = null;
  private registeredSpeakers: Map<string, VoiceSpeaker> = new Map();
  private speakingQueue: Array<{speaker: VoiceSpeaker, text: string, callback?: () => void}> = [];
  private isProcessingQueue: boolean = false;
  private recentMessages: Map<string, number> = new Map(); // Rate limiting
  private readonly RATE_LIMIT_WINDOW = 5000; // 5 seconds
  
  constructor() {
    console.log('🎭 Voice Coordinator - Initialized');
    
    // Clean up old rate limit entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [message, timestamp] of this.recentMessages.entries()) {
        if (now - timestamp > this.RATE_LIMIT_WINDOW) {
          this.recentMessages.delete(message);
        }
      }
    }, 10000); // Clean every 10 seconds
  }

  /**
   * Register a voice service with the coordinator
   */
  registerSpeaker(speaker: VoiceSpeaker): void {
    console.log(`🎭 Voice Coordinator - Registering speaker: ${speaker.name} (priority: ${speaker.priority})`);
    this.registeredSpeakers.set(speaker.id, speaker);
  }

  /**
   * Request permission to speak - handles coordination
   */
  async requestSpeech(
    speakerId: string, 
    text: string, 
    options: { 
      priority?: number; 
      immediate?: boolean;
      callback?: () => void;
    } = {}
  ): Promise<boolean> {
    const speaker = this.registeredSpeakers.get(speakerId);
    if (!speaker) {
      console.warn(`🎭 Voice Coordinator - Unknown speaker: ${speakerId}`);
      return false;
    }

    // Override priority if specified
    const effectivePriority = options.priority || speaker.priority;
    const speakerWithPriority = { ...speaker, priority: effectivePriority };

    console.log(`🎭 Voice Coordinator - Speech request from ${speaker.name} (priority: ${effectivePriority})`);

    // IMMEDIATE SCENARIOS (Zero delay):
    // 1. Explicitly marked immediate
    // 2. No current speaker
    // 3. Higher priority than current speaker  
    // 4. User interaction priority (90+) - always immediate
    const shouldPlayImmediately = options.immediate || 
                                  !this.currentSpeaker || 
                                  (this.currentSpeaker && effectivePriority > this.currentSpeaker.priority) ||
                                  effectivePriority >= VoiceCoordinator.PRIORITY.USER_INTERACTION;

    if (shouldPlayImmediately) {
      return this.speakImmediately(speakerWithPriority, text, options.callback);
    } else {
      // Only queue low-priority background requests
      console.log(`🎭 Voice Coordinator - Queuing low priority request: ${speaker.name}`);
      this.speakingQueue.push({ 
        speaker: speakerWithPriority, 
        text, 
        callback: options.callback 
      });
      this.processQueue();
      return true;
    }
  }

  /**
   * Stop current speaker and speak immediately
   */
  private async speakImmediately(
    speaker: VoiceSpeaker, 
    text: string, 
    callback?: () => void
  ): Promise<boolean> {
    // Stop current speaker if exists and lower priority
    if (this.currentSpeaker) {
      if (this.currentSpeaker.priority >= speaker.priority) {
        console.log(`🎭 Voice Coordinator - Ignoring lower priority request from ${speaker.name}`);
        return false;
      }
      
      console.log(`🎭 Voice Coordinator - Stopping ${this.currentSpeaker.name} for higher priority ${speaker.name}`);
      this.stopCurrentSpeaker();
    }

    this.currentSpeaker = speaker;
    console.log(`🎭 Voice Coordinator - ${speaker.name} is now speaking`);

    try {
      // Use the main voice service for actual TTS
      const success = await mayaVoiceService.speakResponse(text);
      
      if (callback) callback();
      return success;
    } catch (error) {
      console.error(`🎭 Voice Coordinator - Speech failed for ${speaker.name}:`, error);
      return false;
    } finally {
      // Clear current speaker when done
      if (this.currentSpeaker === speaker) {
        this.currentSpeaker = null;
        console.log(`🎭 Voice Coordinator - ${speaker.name} finished speaking`);
        
        // Process next in queue
        this.processQueue();
      }
    }
  }

  /**
   * Process queued speech requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.speakingQueue.length === 0 || this.currentSpeaker) {
      return;
    }

    this.isProcessingQueue = true;

    // Sort by priority (highest first)
    this.speakingQueue.sort((a, b) => b.speaker.priority - a.speaker.priority);
    
    const nextRequest = this.speakingQueue.shift();
    if (nextRequest) {
      await this.speakImmediately(
        nextRequest.speaker, 
        nextRequest.text, 
        nextRequest.callback
      );
    }

    this.isProcessingQueue = false;

    // Continue processing if more requests
    if (this.speakingQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Stop current speaker
   */
  private stopCurrentSpeaker(): void {
    if (this.currentSpeaker) {
      console.log(`🎭 Voice Coordinator - Stopping ${this.currentSpeaker.name}`);
      this.currentSpeaker.stop();
      
      // Also stop the main voice service
      mayaVoiceService.stop();
      
      this.currentSpeaker = null;
    }
  }

  /**
   * Stop all speech activity
   */
  stopAll(): void {
    console.log('🎭 Voice Coordinator - Stopping all speech activity');
    
    this.stopCurrentSpeaker();
    this.speakingQueue.length = 0; // Clear queue
    
    // Stop all registered speakers
    for (const speaker of this.registeredSpeakers.values()) {
      speaker.stop();
    }
    
    // Ensure main voice service is stopped
    mayaVoiceService.stop();
  }

  /**
   * Get current speaking status
   */
  getStatus(): { 
    currentSpeaker: string | null; 
    queueLength: number; 
    isActive: boolean;
  } {
    return {
      currentSpeaker: this.currentSpeaker?.name || null,
      queueLength: this.speakingQueue.length,
      isActive: this.currentSpeaker !== null
    };
  }

  /**
   * Priority levels for different voice sources
   */
  static PRIORITY = {
    SYSTEM_ERROR: 100,    // Critical errors (highest)
    USER_INTERACTION: 90,  // Direct user actions (KPI clicks, chat)
    GREETING: 70,         // Welcome messages
    CHART_NARRATION: 60,  // Chart insights (USP feature)
    BACKGROUND: 30,       // Background notifications
    FALLBACK: 10          // Fallback messages (lowest)
  };
}

// Global singleton instance
export const voiceCoordinator = new VoiceCoordinator();

// Register main voice service
voiceCoordinator.registerSpeaker({
  id: 'maya-voice-service',
  name: 'Maya Voice Service',
  priority: VoiceCoordinator.PRIORITY.USER_INTERACTION,
  stop: () => {
    try {
      if (mayaVoiceService && typeof mayaVoiceService.stop === 'function') {
        mayaVoiceService.stop();
      } else if (mayaVoiceService && typeof mayaVoiceService.stopSpeaking === 'function') {
        mayaVoiceService.stopSpeaking();
      } else {
        console.warn('🎭 Voice Coordinator - No stop method available on mayaVoiceService');
      }
    } catch (error) {
      console.error('🎭 Voice Coordinator - Error stopping voice service:', error);
    }
  }
});

// Initialize voice coordinator on module load
if (typeof window !== 'undefined') {
  console.log('🎭 Voice Coordinator - Auto-initialized for browser environment');
}

// Convenience functions for common usage patterns
export const speakWithCoordination = {
  greeting: (text: string) => voiceCoordinator.requestSpeech(
    'maya-voice-service', 
    text, 
    { priority: VoiceCoordinator.PRIORITY.GREETING }
  ),
  
  userInteraction: (text: string) => voiceCoordinator.requestSpeech(
    'maya-voice-service', 
    text, 
    { priority: VoiceCoordinator.PRIORITY.USER_INTERACTION, immediate: true }
  ),
  
  chartNarration: (text: string) => voiceCoordinator.requestSpeech(
    'maya-voice-service', 
    text, 
    { priority: VoiceCoordinator.PRIORITY.CHART_NARRATION }
  ),
  
  error: (text: string) => voiceCoordinator.requestSpeech(
    'maya-voice-service', 
    text, 
    { priority: VoiceCoordinator.PRIORITY.SYSTEM_ERROR, immediate: true }
  )
};

export default voiceCoordinator;