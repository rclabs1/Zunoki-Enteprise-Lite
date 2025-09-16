/**
 * Agent Auto-Reply Service
 * Works WITH existing webhook system without breaking it
 * Provides optional AI agent responses to incoming messages
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { ragService } from './rag-service';

export interface IncomingMessage {
  conversationId: string;
  userId: string;
  messageContent: string;
  platform: string;
  senderId: string;
  customerInfo?: any;
}

export interface AutoReplyResult {
  shouldReply: boolean;
  response?: string;
  agentName?: string;
  escalated?: boolean;
  escalationReason?: string;
}

export class AgentAutoReplyService {
  
  /**
   * Check if message should get auto-reply and generate response
   * This is called AFTER existing webhook processing is complete
   */
  async processIncomingMessage(message: IncomingMessage): Promise<AutoReplyResult> {
    try {
      console.log(`🤖 Checking for auto-reply: conversation ${message.conversationId}`);

      // 1. Check if conversation has an active AI agent assignment
      const assignment = await this.getActiveAgentAssignment(
        message.conversationId, 
        message.userId
      );

      if (!assignment || assignment.agent_type !== 'ai_agent' || !assignment.auto_response_enabled) {
        console.log('No auto-reply needed: no active AI agent or auto-response disabled');
        return { shouldReply: false };
      }

      // 2. Get recent conversation history (for context)
      const conversationHistory = await this.getRecentHistory(
        message.conversationId, 
        message.userId
      );

      // 3. Generate AI response using RAG
      const ragResponse = await ragService.generateResponse({
        agentId: assignment.agent_id,
        userId: message.userId,
        conversationId: message.conversationId,
        customerMessage: message.messageContent,
        conversationHistory,
        customerInfo: message.customerInfo
      });

      // 4. Check if response should trigger escalation
      if (ragResponse.shouldEscalate) {
        console.log(`⚠️ Escalation recommended: ${ragResponse.escalationReason}`);
        
        // 🚨 Phase 3.2: Trigger escalation workflow
        try {
          const { escalationWorkflowService } = await import('./escalation-workflow-service');
          await escalationWorkflowService.initiateEscalation({
            conversationId: message.conversationId,
            userId: message.userId,
            fromAgentId: assignment.agent_id,
            fromAgentType: 'ai_agent',
            reason: ragResponse.escalationReason || 'AI agent requested escalation',
            urgency: 'medium',
            customerMessage: message.messageContent,
            requestedByCustomer: false
          });
        } catch (escalationError) {
          console.error('Failed to initiate escalation workflow:', escalationError);
          // Fallback to simple disabling
          await this.disableAutoResponse(assignment.id, ragResponse.escalationReason);
        }
        
        return {
          shouldReply: false,
          escalated: true,
          escalationReason: ragResponse.escalationReason
        };
      }

      console.log(`✅ Auto-reply generated: ${ragResponse.response.substring(0, 50)}...`);

      return {
        shouldReply: true,
        response: ragResponse.response,
        agentName: assignment.agent_name
      };

    } catch (error) {
      console.error('❌ Error in auto-reply processing:', error);
      return { shouldReply: false };
    }
  }

  /**
   * Send auto-reply through existing messaging service directly
   * Uses the same send APIs as manual messages
   */
  async sendAutoReply(
    conversationId: string, 
    userId: string, 
    response: string, 
    platform: string,
    recipientId: string
  ): Promise<boolean> {
    try {
      console.log(`📤 Sending auto-reply via ${platform} to ${recipientId}`);

      // Use messaging service directly (more reliable than API calls)
      const { messagingService } = await import('@/lib/messaging-service');
      
      const result = await messagingService.sendMessage(userId, {
        conversationId,
        senderType: 'ai_agent',
        content: response,
        messageType: 'text',
        to: recipientId,
        from: userId,
        platform: platform as any,
        metadata: { 
          isAutoReply: true,
          generatedAt: new Date().toISOString()
        }
      });

      if (result.success) {
        console.log(`✅ Auto-reply sent successfully via ${platform}`);
        
        // 📊 Phase 3.3: Track performance analytics
        try {
          const { performanceAnalyticsService } = await import('./performance-analytics-service');
          await performanceAnalyticsService.trackAgentInteraction(
            'ai_agent', // Will be updated with actual agent ID
            conversationId,
            userId,
            'message_sent',
            {
              responseTime: 1, // AI response is typically instant
              messageLength: response.length,
              sentiment: 'neutral' // Default, could be analyzed
            }
          );
        } catch (analyticsError) {
          console.error('Failed to track analytics:', analyticsError);
        }
      } else {
        console.error(`❌ Failed to send auto-reply: ${result.error}`);
      }

      return result.success;
      
    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return false;
    }
  }

  /**
   * Get active agent assignment for conversation
   */
  private async getActiveAgentAssignment(conversationId: string, userId: string) {
    const { data } = await supabase
      .from('conversation_agent_assignments')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return data;
  }

  /**
   * Get recent conversation history for context
   */
  private async getRecentHistory(conversationId: string, userId: string) {
    // Get last 10 messages from any platform
    const platforms = ['whatsapp', 'telegram', 'gmail', 'sms'];
    const allMessages: any[] = [];

    for (const platform of platforms) {
      const { data } = await supabase
        .from(`${platform}_messages`)
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const platformMessages = data.map(msg => ({
          role: msg.direction === 'inbound' ? 'customer' : 'agent',
          content: msg.message_text || msg.content,
          timestamp: new Date(msg.created_at),
          platform
        }));
        allMessages.push(...platformMessages);
      }
    }

    // Sort by timestamp and return last 10
    return allMessages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .reverse(); // Return in chronological order
  }

  /**
   * Disable auto-response when escalation is needed
   */
  private async disableAutoResponse(assignmentId: string, reason: string) {
    await supabase
      .from('conversation_agent_assignments')
      .update({ 
        auto_response_enabled: false,
        escalation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);
  }

  /**
   * Integration hook for existing webhook system
   * Call this AFTER your existing webhook processing
   */
  static async handleWebhookMessage(
    platform: string,
    conversationId: string,
    userId: string,
    messageContent: string,
    senderId: string,
    customerInfo?: any
  ) {
    const autoReplyService = new AgentAutoReplyService();
    
    try {
      // Process for potential auto-reply
      const result = await autoReplyService.processIncomingMessage({
        conversationId,
        userId,
        messageContent,
        platform,
        senderId,
        customerInfo
      });

      // Send auto-reply if needed
      if (result.shouldReply && result.response) {
        const sent = await autoReplyService.sendAutoReply(
          conversationId,
          userId,
          result.response,
          platform,
          senderId
        );

        if (sent) {
          console.log(`✅ Auto-reply sent successfully by ${result.agentName}`);
        }
      }

      // Handle escalations
      if (result.escalated) {
        console.log(`⚠️ Conversation escalated: ${result.escalationReason}`);
        // Could trigger notification to human agents here
      }

    } catch (error) {
      console.error('Error in webhook auto-reply handler:', error);
      // Don't let auto-reply errors break the main webhook flow
    }
  }
}

// Export singleton instance
export const agentAutoReplyService = new AgentAutoReplyService();
export default agentAutoReplyService;