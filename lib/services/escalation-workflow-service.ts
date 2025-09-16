/**
 * Escalation Workflow Service
 * Manages smooth transitions from AI agents to human agents
 * Handles escalation triggers, notifications, and context transfer
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface EscalationRequest {
  conversationId: string;
  userId: string;
  fromAgentId: string;
  fromAgentType: 'ai_agent' | 'human';
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  customerMessage?: string;
  contextSummary?: string;
  preferredSkills?: string[];
  requestedByCustomer: boolean;
}

export interface EscalationWorkflow {
  id: string;
  escalationRequest: EscalationRequest;
  status: 'pending' | 'assigned' | 'completed' | 'failed';
  targetAgentId?: string;
  targetAgentType?: 'human' | 'ai_agent';
  assignedAt?: Date;
  completedAt?: Date;
  handoffSummary?: string;
  customerNotified: boolean;
  createdAt: Date;
}

export interface HandoffContext {
  conversationSummary: string;
  customerProfile: any;
  previousInteractions: any[];
  currentIssue: string;
  attemptedSolutions: string[];
  customerSentiment: 'positive' | 'neutral' | 'negative';
  urgencyLevel: string;
  specialNotes: string;
}

export class EscalationWorkflowService {

  /**
   * Initiate escalation workflow
   */
  async initiateEscalation(request: EscalationRequest): Promise<EscalationWorkflow> {
    try {
      console.log(`🚨 Initiating escalation for conversation ${request.conversationId}: ${request.reason}`);

      // Create escalation workflow record
      const workflow: EscalationWorkflow = {
        id: `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        escalationRequest: request,
        status: 'pending',
        customerNotified: false,
        createdAt: new Date()
      };

      // Store escalation in database
      await this.saveEscalationWorkflow(workflow);

      // Prepare handoff context
      const handoffContext = await this.prepareHandoffContext(request);

      // Find best human agent for escalation
      const targetAgent = await this.findBestHumanAgent(request);

      if (targetAgent) {
        // Assign to human agent
        workflow.targetAgentId = targetAgent.agentId;
        workflow.targetAgentType = 'human';
        workflow.status = 'assigned';
        workflow.assignedAt = new Date();

        // Perform the handoff
        await this.performHandoff(workflow, handoffContext, targetAgent);

        console.log(`✅ Escalation assigned to human agent ${targetAgent.agentName}`);
      } else {
        // No human agents available, queue the escalation
        await this.queueEscalation(workflow);
        console.log(`⏳ Escalation queued - no human agents available`);
      }

      // Notify customer about escalation
      await this.notifyCustomerOfEscalation(workflow);

      // Update workflow status
      await this.updateEscalationWorkflow(workflow);

      return workflow;

    } catch (error) {
      console.error('Error initiating escalation:', error);
      throw error;
    }
  }

  /**
   * Prepare comprehensive handoff context
   */
  private async prepareHandoffContext(request: EscalationRequest): Promise<HandoffContext> {
    try {
      console.log(`📋 Preparing handoff context for conversation ${request.conversationId}`);

      // Get conversation history
      const conversationHistory = await this.getConversationHistory(request.conversationId, request.userId);

      // Get customer information
      const customer = await this.getCustomerProfile(request.conversationId, request.userId);

      // Get conversation state
      const { conversationStateService } = await import('./conversation-state-service');
      const conversationState = await conversationStateService.getConversationState(request.conversationId, request.userId);

      // Summarize conversation
      const conversationSummary = await this.generateConversationSummary(conversationHistory);

      // Extract attempted solutions
      const attemptedSolutions = this.extractAttemptedSolutions(conversationHistory);

      return {
        conversationSummary,
        customerProfile: customer,
        previousInteractions: conversationHistory.slice(-10), // Last 10 messages
        currentIssue: request.reason,
        attemptedSolutions,
        customerSentiment: conversationState?.sentiment || 'neutral',
        urgencyLevel: request.urgency,
        specialNotes: request.contextSummary || 'No additional notes'
      };

    } catch (error) {
      console.error('Error preparing handoff context:', error);
      return {
        conversationSummary: 'Unable to prepare conversation summary',
        customerProfile: null,
        previousInteractions: [],
        currentIssue: request.reason,
        attemptedSolutions: [],
        customerSentiment: 'neutral',
        urgencyLevel: request.urgency,
        specialNotes: 'Error preparing context'
      };
    }
  }

  /**
   * Find best available human agent for escalation
   */
  private async findBestHumanAgent(request: EscalationRequest): Promise<{agentId: string; agentName: string} | null> {
    try {
      // Use capacity service to find available human agents
      const { agentCapacityService } = await import('./agent-capacity-service');
      const availableAgents = await agentCapacityService.getAvailableAgents(request.userId, 'human');

      // Filter by availability and specialization
      const suitableAgents = availableAgents.filter(agent => 
        agent.isAvailable && 
        agent.status === 'available' &&
        agent.agentType === 'human'
      );

      if (suitableAgents.length === 0) return null;

      // Simple selection: prefer agent with lowest utilization
      const bestAgent = suitableAgents.sort((a, b) => a.utilizationRate - b.utilizationRate)[0];
      
      return {
        agentId: bestAgent.agentId,
        agentName: bestAgent.agentName
      };

    } catch (error) {
      console.error('Error finding human agent:', error);
      return null;
    }
  }

  /**
   * Perform the actual handoff
   */
  private async performHandoff(
    workflow: EscalationWorkflow,
    context: HandoffContext,
    targetAgent: {agentId: string; agentName: string}
  ): Promise<void> {
    try {
      // 1. Disable auto-response for current AI agent
      await supabase
        .from('conversation_agent_assignments')
        .update({ 
          status: 'inactive',
          auto_response_enabled: false 
        })
        .eq('conversation_id', workflow.escalationRequest.conversationId)
        .eq('user_id', workflow.escalationRequest.userId)
        .eq('status', 'active');

      // 2. Create new assignment for human agent
      await supabase
        .from('conversation_agent_assignments')
        .insert({
          conversation_id: workflow.escalationRequest.conversationId,
          user_id: workflow.escalationRequest.userId,
          agent_type: 'human',
          agent_id: targetAgent.agentId,
          agent_name: targetAgent.agentName,
          assigned_by: 'system',
          assignment_reason: `Escalated: ${workflow.escalationRequest.reason}`,
          status: 'active',
          auto_response_enabled: false // Human agents don't auto-respond
        });

      // 3. Update conversation with new agent
      await supabase
        .from('crm_conversations')
        .update({
          assigned_agent_id: targetAgent.agentId,
          assigned_agent_name: targetAgent.agentName,
          priority: workflow.escalationRequest.urgency === 'critical' ? 'high' : 'medium',
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.escalationRequest.conversationId)
        .eq('user_id', workflow.escalationRequest.userId);

      // 4. Create handoff summary for human agent
      const handoffSummary = this.createHandoffSummary(context, workflow);
      workflow.handoffSummary = handoffSummary;

      // 5. Notify human agent (create task)
      await this.notifyHumanAgent(workflow, context, targetAgent);

      console.log(`🤝 Handoff completed to ${targetAgent.agentName}`);

    } catch (error) {
      console.error('Error performing handoff:', error);
      throw error;
    }
  }

  /**
   * Queue escalation when no agents are available
   */
  private async queueEscalation(workflow: EscalationWorkflow): Promise<void> {
    try {
      // Use existing task system as escalation queue
      await supabase
        .from('tasks')
        .insert({
          title: `Escalation: ${workflow.escalationRequest.reason}`,
          description: `Customer escalation from conversation ${workflow.escalationRequest.conversationId}`,
          task_type: 'escalation',
          priority: workflow.escalationRequest.urgency,
          status: 'pending',
          assigned_to_type: 'human',
          metadata: {
            escalationWorkflow: workflow,
            urgency: workflow.escalationRequest.urgency,
            customerMessage: workflow.escalationRequest.customerMessage
          }
        });

    } catch (error) {
      console.error('Error queuing escalation:', error);
      throw error;
    }
  }

  /**
   * Notify customer about escalation
   */
  private async notifyCustomerOfEscalation(workflow: EscalationWorkflow): Promise<void> {
    try {
      let message = "I'm connecting you with one of our human agents who can better assist you. ";
      
      if (workflow.status === 'assigned') {
        message += "They'll be with you shortly.";
      } else {
        message += "You're in the queue and will be helped as soon as an agent becomes available.";
      }

      // Get conversation details for sending message
      const { data: conversation } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('id', workflow.escalationRequest.conversationId)
        .single();

      if (conversation) {
        const { messagingService } = await import('@/lib/messaging-service');
        
        await messagingService.sendMessage(workflow.escalationRequest.userId, {
          conversationId: workflow.escalationRequest.conversationId,
          senderType: 'system',
          content: message,
          messageType: 'text',
          to: conversation.contact_id, // This might need adjustment based on your schema
          from: workflow.escalationRequest.userId,
          platform: conversation.platform as any,
          metadata: {
            isEscalationNotification: true,
            escalationId: workflow.id
          }
        });

        workflow.customerNotified = true;
      }

    } catch (error) {
      console.error('Error notifying customer of escalation:', error);
      // Don't fail the escalation if notification fails
    }
  }

  /**
   * Notify human agent of new escalation
   */
  private async notifyHumanAgent(
    workflow: EscalationWorkflow,
    context: HandoffContext,
    targetAgent: {agentId: string; agentName: string}
  ): Promise<void> {
    try {
      // Create task for human agent
      await supabase
        .from('tasks')
        .insert({
          title: `New Escalation: ${workflow.escalationRequest.reason}`,
          description: context.conversationSummary,
          task_type: 'escalation',
          priority: workflow.escalationRequest.urgency,
          status: 'pending',
          assigned_to_type: 'human',
          agent_id: targetAgent.agentId,
          metadata: {
            escalationWorkflow: workflow,
            handoffContext: context,
            conversationId: workflow.escalationRequest.conversationId
          }
        });

    } catch (error) {
      console.error('Error notifying human agent:', error);
    }
  }

  /**
   * Generate conversation summary
   */
  private async generateConversationSummary(conversationHistory: any[]): Promise<string> {
    try {
      if (conversationHistory.length === 0) {
        return "New conversation - no previous messages";
      }

      const recentMessages = conversationHistory.slice(-5);
      const customerMessages = recentMessages.filter(msg => msg.direction === 'inbound');
      
      if (customerMessages.length === 0) {
        return "Customer has not sent any messages yet";
      }

      const lastCustomerMessage = customerMessages[customerMessages.length - 1];
      const messageCount = conversationHistory.length;

      return `Conversation with ${messageCount} messages. Customer's latest concern: "${lastCustomerMessage.content || lastCustomerMessage.message_text || 'No content available'}"`;

    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return "Unable to generate conversation summary";
    }
  }

  /**
   * Extract attempted solutions from conversation history
   */
  private extractAttemptedSolutions(conversationHistory: any[]): string[] {
    try {
      const botMessages = conversationHistory
        .filter(msg => msg.direction === 'outbound' && (msg.is_from_bot || msg.agent_type === 'ai_agent'))
        .map(msg => msg.content || msg.message_text || '')
        .filter(content => content.length > 10); // Filter out very short messages

      return botMessages.slice(-3); // Last 3 bot responses as attempted solutions

    } catch (error) {
      console.error('Error extracting attempted solutions:', error);
      return [];
    }
  }

  /**
   * Create handoff summary for human agent
   */
  private createHandoffSummary(context: HandoffContext, workflow: EscalationWorkflow): string {
    const summary = `
🚨 ESCALATION HANDOFF SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 Conversation: ${workflow.escalationRequest.conversationId}
🔥 Urgency: ${workflow.escalationRequest.urgency.toUpperCase()}
💭 Reason: ${workflow.escalationRequest.reason}

👤 CUSTOMER PROFILE
• Sentiment: ${context.customerSentiment}
• Current Issue: ${context.currentIssue}

💬 CONVERSATION SUMMARY
${context.conversationSummary}

🤖 ATTEMPTED SOLUTIONS
${context.attemptedSolutions.length > 0 
  ? context.attemptedSolutions.map((solution, i) => `${i + 1}. ${solution}`).join('\n')
  : 'No solutions attempted by AI agent'}

📝 SPECIAL NOTES
${context.specialNotes}

✨ Ready to take over this conversation!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return summary;
  }

  /**
   * Get conversation history
   */
  private async getConversationHistory(conversationId: string, userId: string) {
    // Get messages from all platforms
    const platforms = ['whatsapp', 'telegram', 'gmail', 'sms'];
    const allMessages: any[] = [];

    for (const platform of platforms) {
      try {
        const { data } = await supabase
          .from(`${platform}_messages`)
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (data) {
          allMessages.push(...data.map(msg => ({
            ...msg,
            platform,
            content: msg.message_text || msg.content
          })));
        }
      } catch (error) {
        // Platform table might not exist, continue
      }
    }

    return allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  /**
   * Get customer profile
   */
  private async getCustomerProfile(conversationId: string, userId: string) {
    try {
      const { data } = await supabase
        .from('crm_conversations')
        .select(`
          *,
          crm_contacts (*)
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      return data?.crm_contacts || null;

    } catch (error) {
      console.error('Error getting customer profile:', error);
      return null;
    }
  }

  /**
   * Save escalation workflow
   */
  private async saveEscalationWorkflow(workflow: EscalationWorkflow): Promise<void> {
    // Store in tasks table with escalation type
    await supabase
      .from('tasks')
      .insert({
        title: `Escalation: ${workflow.escalationRequest.reason}`,
        description: `Escalation workflow for conversation ${workflow.escalationRequest.conversationId}`,
        task_type: 'escalation_workflow',
        priority: workflow.escalationRequest.urgency,
        status: workflow.status,
        metadata: {
          escalationWorkflow: workflow
        }
      });
  }

  /**
   * Update escalation workflow
   */
  private async updateEscalationWorkflow(workflow: EscalationWorkflow): Promise<void> {
    await supabase
      .from('tasks')
      .update({
        status: workflow.status,
        metadata: {
          escalationWorkflow: workflow
        }
      })
      .eq('task_type', 'escalation_workflow')
      .contains('metadata', { escalationWorkflow: { id: workflow.id } });
  }

  /**
   * Complete escalation workflow
   */
  async completeEscalation(escalationId: string, resolution: string): Promise<void> {
    try {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          description: resolution
        })
        .eq('task_type', 'escalation_workflow')
        .contains('metadata', { escalationWorkflow: { id: escalationId } });

      console.log(`✅ Escalation ${escalationId} completed`);

    } catch (error) {
      console.error('Error completing escalation:', error);
    }
  }

  /**
   * Get active escalations for user
   */
  async getActiveEscalations(userId: string): Promise<EscalationWorkflow[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('task_type', 'escalation_workflow')
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: false });

      if (error || !tasks) return [];

      return tasks
        .map(task => task.metadata?.escalationWorkflow)
        .filter(workflow => workflow && workflow.escalationRequest.userId === userId);

    } catch (error) {
      console.error('Error getting active escalations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const escalationWorkflowService = new EscalationWorkflowService();
export default escalationWorkflowService;