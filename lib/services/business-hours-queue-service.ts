/**
 * Business Hours and Queue Management Service
 * Handles message queuing during off-hours and manages conversation priority
 * Ensures customer messages are processed when agents become available
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface BusinessHours {
  start: string; // "09:00"
  end: string;   // "17:00"
  timezone: string; // "UTC", "America/New_York", etc.
  days: number[]; // 0=Sunday, 1=Monday, etc. [1,2,3,4,5] for weekdays
}

export interface QueuedMessage {
  id: string;
  conversationId: string;
  userId: string;
  platform: string;
  messageContent: string;
  senderInfo: any;
  priority: 'high' | 'medium' | 'low';
  intentCategory?: string;
  queuedAt: Date;
  estimatedProcessTime?: Date;
  attempts: number;
  status: 'queued' | 'processing' | 'processed' | 'failed';
}

export interface BusinessHoursStatus {
  isInBusinessHours: boolean;
  nextBusinessHoursStart?: Date;
  hoursUntilOpen?: number;
  reason?: string;
}

export class BusinessHoursQueueService {

  /**
   * Check if current time is within business hours
   */
  async checkBusinessHours(userIdentifier: string): Promise<BusinessHoursStatus> {
    try {
      // Get user's business hours configuration
      const businessHours = await this.getBusinessHoursConfig(userIdentifier);
      if (!businessHours) {
        // No configuration = 24/7 availability
        return { isInBusinessHours: true };
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      // Check if today is a business day
      if (!businessHours.days.includes(currentDay)) {
        const nextBusinessDay = this.getNextBusinessDay(currentDay, businessHours.days);
        const hoursUntilOpen = this.calculateHoursUntil(now, nextBusinessDay, businessHours.start);
        
        return {
          isInBusinessHours: false,
          hoursUntilOpen,
          reason: 'Outside business days'
        };
      }

      // Check if current time is within business hours
      if (currentTime >= businessHours.start && currentTime <= businessHours.end) {
        return { isInBusinessHours: true };
      }

      // Calculate when business hours start again
      let nextStart: Date;
      if (currentTime < businessHours.start) {
        // Later today
        nextStart = new Date(now);
        nextStart.setHours(parseInt(businessHours.start.split(':')[0]), parseInt(businessHours.start.split(':')[1]), 0, 0);
      } else {
        // Tomorrow (or next business day)
        const nextBusinessDay = this.getNextBusinessDay(currentDay, businessHours.days);
        nextStart = new Date(now);
        nextStart.setDate(now.getDate() + (nextBusinessDay - currentDay));
        nextStart.setHours(parseInt(businessHours.start.split(':')[0]), parseInt(businessHours.start.split(':')[1]), 0, 0);
      }

      const hoursUntilOpen = (nextStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      return {
        isInBusinessHours: false,
        nextBusinessHoursStart: nextStart,
        hoursUntilOpen: Math.ceil(hoursUntilOpen),
        reason: `Outside business hours (${businessHours.start} - ${businessHours.end})`
      };

    } catch (error) {
      console.error('Error checking business hours:', error);
      // Default to open on error
      return { isInBusinessHours: true };
    }
  }

  /**
   * Queue message for processing during business hours
   */
  async queueMessage(
    conversationId: string,
    userId: string,
    platform: string,
    messageContent: string,
    senderInfo: any,
    intentCategory?: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<QueuedMessage> {
    try {
      console.log(`📥 Queuing message for conversation ${conversationId}`);

      // Determine estimated processing time
      const businessHoursStatus = await this.checkBusinessHours(userId);
      const estimatedProcessTime = businessHoursStatus.nextBusinessHoursStart || new Date();

      const queuedMessage: QueuedMessage = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        userId,
        platform,
        messageContent,
        senderInfo,
        priority,
        intentCategory,
        queuedAt: new Date(),
        estimatedProcessTime,
        attempts: 0,
        status: 'queued'
      };

      // Store in database (using tasks table as a queue)
      await supabase
        .from('tasks')
        .insert({
          title: 'Queued Message Processing',
          description: `Process queued message: ${messageContent.substring(0, 100)}...`,
          task_type: 'queued_message',
          priority: priority,
          status: 'pending',
          metadata: {
            queuedMessage,
            platform,
            estimatedProcessTime: estimatedProcessTime.toISOString()
          },
          due_date: estimatedProcessTime.toISOString()
        });

      console.log(`✅ Message queued successfully, estimated processing: ${estimatedProcessTime.toLocaleString()}`);
      
      // Send auto-response about queuing
      await this.sendQueuedAutoResponse(conversationId, userId, platform, senderInfo, businessHoursStatus);

      return queuedMessage;

    } catch (error) {
      console.error('Error queuing message:', error);
      throw error;
    }
  }

  /**
   * Process queued messages when business hours resume
   */
  async processQueuedMessages(userIdentifier: string): Promise<void> {
    try {
      console.log(`🔄 Processing queued messages for user ${userIdentifier}`);

      // Check if we're in business hours
      const businessHoursStatus = await this.checkBusinessHours(userIdentifier);
      if (!businessHoursStatus.isInBusinessHours) {
        console.log('Not in business hours, skipping queue processing');
        return;
      }

      // Get queued messages (pending tasks)
      const { data: queuedTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('task_type', 'queued_message')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true }); // FIFO within same priority

      if (error || !queuedTasks) {
        console.log('No queued messages found');
        return;
      }

      console.log(`Found ${queuedTasks.length} queued messages to process`);

      // Process each queued message
      for (const task of queuedTasks) {
        try {
          const queuedMessage: QueuedMessage = task.metadata.queuedMessage;
          
          // Mark as processing
          await supabase
            .from('tasks')
            .update({ status: 'in_progress' })
            .eq('id', task.id);

          // Trigger agent assignment for the queued conversation
          const { DefaultAgentAssignmentService } = await import('./default-agent-assignment-service');
          const success = await DefaultAgentAssignmentService.handleNewConversation(
            queuedMessage.conversationId,
            queuedMessage.userId,
            queuedMessage.platform,
            queuedMessage.messageContent,
            queuedMessage.senderInfo,
            queuedMessage.intentCategory
          );

          if (success) {
            // Mark as completed
            await supabase
              .from('tasks')
              .update({ 
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', task.id);

            console.log(`✅ Processed queued message for conversation ${queuedMessage.conversationId}`);
          } else {
            // Mark as failed, will retry later
            await supabase
              .from('tasks')
              .update({ status: 'pending' }) // Reset to pending for retry
              .eq('id', task.id);

            console.error(`❌ Failed to process queued message for conversation ${queuedMessage.conversationId}`);
          }

        } catch (error) {
          console.error('Error processing individual queued message:', error);
          
          // Mark task as failed
          await supabase
            .from('tasks')
            .update({ status: 'pending' }) // Reset for retry
            .eq('id', task.id);
        }
      }

    } catch (error) {
      console.error('Error processing queued messages:', error);
    }
  }

  /**
   * Send auto-response informing customer about queuing
   */
  private async sendQueuedAutoResponse(
    conversationId: string,
    userId: string,
    platform: string,
    senderInfo: any,
    businessHoursStatus: BusinessHoursStatus
  ): Promise<void> {
    try {
      let message = "Thank you for your message! ";
      
      if (businessHoursStatus.nextBusinessHoursStart) {
        const timeString = businessHoursStatus.nextBusinessHoursStart.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        message += `We're currently outside business hours. We'll respond when we're back at ${timeString}.`;
      } else {
        message += "We'll get back to you as soon as possible.";
      }

      // Use messaging service to send auto-response
      const { messagingService } = await import('@/lib/messaging-service');
      
      await messagingService.sendMessage(userId, {
        conversationId,
        senderType: 'system',
        content: message,
        messageType: 'text',
        to: senderInfo.senderId || senderInfo.phone || senderInfo.from,
        from: userId,
        platform: platform as any,
        metadata: { 
          isQueuedAutoResponse: true,
          queuedAt: new Date().toISOString()
        }
      });

      console.log(`📤 Sent queued auto-response to ${platform}`);

    } catch (error) {
      console.error('Error sending queued auto-response:', error);
    }
  }

  /**
   * Get business hours configuration for user
   */
  private async getBusinessHoursConfig(userIdentifier: string): Promise<BusinessHours | null> {
    try {
      // For now, use a simple default configuration
      // This could be stored in a business_hours_config table
      return {
        start: "09:00",
        end: "17:00", 
        timezone: "UTC",
        days: [1, 2, 3, 4, 5] // Monday to Friday
      };
    } catch (error) {
      console.error('Error getting business hours config:', error);
      return null;
    }
  }

  /**
   * Calculate next business day
   */
  private getNextBusinessDay(currentDay: number, businessDays: number[]): number {
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      if (businessDays.includes(nextDay)) {
        return nextDay;
      }
    }
    return businessDays[0]; // Fallback to first business day
  }

  /**
   * Calculate hours until a specific time
   */
  private calculateHoursUntil(now: Date, dayOfWeek: number, timeString: string): number {
    const target = new Date(now);
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    
    target.setDate(now.getDate() + daysUntil);
    target.setHours(
      parseInt(timeString.split(':')[0]), 
      parseInt(timeString.split(':')[1]), 
      0, 
      0
    );

    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Get queue status for a user
   */
  async getQueueStatus(userIdentifier: string): Promise<{
    queueLength: number;
    oldestMessage?: Date;
    estimatedWaitTime?: number;
  }> {
    try {
      const { data: queuedTasks, error } = await supabase
        .from('tasks')
        .select('created_at, metadata')
        .eq('task_type', 'queued_message')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error || !queuedTasks) {
        return { queueLength: 0 };
      }

      const queueLength = queuedTasks.length;
      const oldestMessage = queueLength > 0 ? new Date(queuedTasks[0].created_at) : undefined;

      // Simple wait time estimation (could be more sophisticated)
      const estimatedWaitTime = queueLength * 5; // 5 minutes per message average

      return {
        queueLength,
        oldestMessage,
        estimatedWaitTime
      };

    } catch (error) {
      console.error('Error getting queue status:', error);
      return { queueLength: 0 };
    }
  }

  /**
   * Start queue processor (should be called periodically)
   */
  static async startQueueProcessor(): Promise<void> {
    const service = new BusinessHoursQueueService();
    
    // This would typically be run as a cron job or scheduled task
    console.log('🚀 Starting queue processor...');
    
    // Get all users with queued messages
    try {
      const { data: users, error } = await supabase
        .from('tasks')
        .select('metadata')
        .eq('task_type', 'queued_message')
        .eq('status', 'pending');

      if (error || !users) return;

      const uniqueUsers = [...new Set(users.map(task => task.metadata?.queuedMessage?.userId))];
      
      for (const userId of uniqueUsers) {
        if (userId) {
          await service.processQueuedMessages(userId);
        }
      }

    } catch (error) {
      console.error('Error in queue processor:', error);
    }
  }
}

// Export singleton instance
export const businessHoursQueueService = new BusinessHoursQueueService();
export default businessHoursQueueService;