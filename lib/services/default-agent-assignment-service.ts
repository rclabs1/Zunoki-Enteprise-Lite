/**
 * Default Agent Assignment Service
 * Automatically assigns AI agents to new conversations based on:
 * - Platform (WhatsApp, Telegram, etc.)
 * - Message category/intent (sales, support, general)
 * - Agent availability and specialization
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface AssignmentRule {
  id: string;
  user_id: string;
  name: string;
  trigger_conditions: {
    platform?: string;
    category?: string;
    keywords?: string[];
    timeOfDay?: { start: string; end: string };
    dayOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  };
  target_type: string;
  target_agent_id: string;
  priority: number; // Lower number = higher priority
  is_active: boolean;
}

export interface ConversationAssignmentRequest {
  conversationId: string;
  userId: string;
  platform: string;
  messageContent?: string;
  customerInfo?: any;
  category?: string;
}

export class DefaultAgentAssignmentService {
  
  /**
   * Auto-assign agent to new conversation
   * This is called when a new conversation is created
   */
  async assignDefaultAgent(request: ConversationAssignmentRequest): Promise<boolean> {
    try {
      console.log(`🎯 Auto-assigning agent for conversation ${request.conversationId} on ${request.platform}`);

      // Check if conversation already has an agent assigned
      const existingAssignment = await this.getExistingAssignment(request.conversationId, request.userId);
      if (existingAssignment) {
        console.log('Conversation already has agent assigned, skipping');
        return true;
      }

      // 🕐 Phase 2.3: Check business hours and queue if needed
      try {
        const { businessHoursQueueService } = await import('./business-hours-queue-service');
        const businessHoursStatus = await businessHoursQueueService.checkBusinessHours(request.userId);
        
        if (!businessHoursStatus.isInBusinessHours) {
          console.log(`Outside business hours: ${businessHoursStatus.reason}`);
          
          // Queue the message for later processing
          await businessHoursQueueService.queueMessage(
            request.conversationId,
            request.userId,
            request.platform,
            request.messageContent || 'New conversation',
            request.customerInfo,
            request.category,
            'medium' // Default priority
          );
          
          return true; // Successfully queued
        }
      } catch (queueError) {
        console.error('Business hours check failed:', queueError);
        // Continue with normal assignment if queue service fails
      }

      // 🧠 Phase 2.1: Classify intent for smart routing
      let intentClassification = null;
      try {
        const { intentClassificationService } = await import('./intent-classification-service');
        intentClassification = await intentClassificationService.classifyIntent(
          request.messageContent || '',
          request.userId
        );
        console.log(`🎯 Intent detected: ${intentClassification.intent} (${intentClassification.confidence}% confidence)`);
      } catch (intentError) {
        console.error('Intent classification failed:', intentError);
      }

      // Get assignment rules for this user, ordered by priority
      const rules = await this.getAssignmentRules(request.userId);
      if (!rules.length) {
        console.log('No assignment rules found, creating default AI agent assignment');
        return await this.createDefaultAssignment(request);
      }

      // Find best matching rule (now enhanced with intent)
      const matchingRule = this.findBestMatchingRule(rules, {
        ...request,
        category: intentClassification?.category || request.category
      });
      
      if (!matchingRule) {
        console.log('No matching rule found, creating default assignment');
        return await this.createDefaultAssignment(request);
      }

      // Verify agent is available and active
      const agent = await this.getAgent(matchingRule.target_agent_id, request.userId);
      if (!agent || agent.status !== 'active') {
        console.log('Selected agent is not available, creating default assignment');
        return await this.createDefaultAssignment(request);
      }

      // 📊 Phase 2.2: Check agent capacity before assignment
      try {
        const { agentCapacityService } = await import('./agent-capacity-service');
        const capacityCheck = await agentCapacityService.checkAgentCapacity(agent.id, request.userId);
        
        if (!capacityCheck.canTakeNewConversation) {
          console.log(`Agent ${agent.name} cannot take new conversation: ${capacityCheck.reason}`);
          
          // Try to find alternative available agent
          const alternativeAgent = await agentCapacityService.findBestAvailableAgent(
            request.userId,
            intentClassification?.category,
            request.platform
          );
          
          if (alternativeAgent) {
            console.log(`🔄 Using alternative agent: ${alternativeAgent.agentName}`);
            const altAgent = await this.getAgent(alternativeAgent.agentId, request.userId);
            if (altAgent) {
              await this.createAssignment(request.conversationId, request.userId, {
                agentType: altAgent.type,
                agentId: altAgent.id,
                agentName: altAgent.name,
                assignmentReason: `Auto-assigned to available agent (original agent at capacity)`,
                autoResponseEnabled: true
              });
              return true;
            }
          }
          
          // Fallback to default assignment if no alternatives
          console.log('No alternative agents available, creating default assignment');
          return await this.createDefaultAssignment(request);
        }
      } catch (capacityError) {
        console.error('Capacity check failed:', capacityError);
        // Continue with assignment if capacity check fails
      }

      // Create assignment with intent information
      await this.createAssignment(request.conversationId, request.userId, {
        agentType: agent.type,
        agentId: agent.id,
        agentName: agent.name,
        assignmentReason: `Auto-assigned via rule: ${matchingRule.name}${intentClassification ? ` (Intent: ${intentClassification.intent})` : ''}`,
        autoResponseEnabled: true
      });

      console.log(`✅ Agent ${agent.name} auto-assigned to conversation ${request.conversationId}`);
      return true;

    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return false;
    }
  }

  /**
   * Get existing assignment for conversation
   */
  private async getExistingAssignment(conversationId: string, userId: string) {
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
   * Get assignment rules for user (handles user_identifier -> UUID conversion)
   */
  private async getAssignmentRules(userIdentifier: string): Promise<AssignmentRule[]> {
    try {
      // First get the UUID from user_identifier
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .single();

      if (userError || !userData) {
        console.error('Error finding user by identifier:', userError);
        return [];
      }

      // Now get assignment rules using the UUID
      const { data, error } = await supabase
        .from('assignment_rules')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching assignment rules:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAssignmentRules:', error);
      return [];
    }
  }

  /**
   * Find best matching rule based on platform, category, keywords, etc.
   */
  private findBestMatchingRule(rules: AssignmentRule[], request: ConversationAssignmentRequest): AssignmentRule | null {
    for (const rule of rules) {
      let matches = true;

      // Check platform match
      if (rule.trigger_conditions?.platform && rule.trigger_conditions.platform !== request.platform) {
        matches = false;
      }

      // Check category match
      if (rule.trigger_conditions?.category && rule.trigger_conditions.category !== request.category) {
        matches = false;
      }

      // Check keyword conditions
      if (rule.trigger_conditions?.keywords && request.messageContent) {
        const hasKeyword = rule.trigger_conditions.keywords.some(keyword => 
          request.messageContent!.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {
          matches = false;
        }
      }

      // Check time conditions
      if (rule.trigger_conditions?.timeOfDay) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(rule.trigger_conditions.timeOfDay.start);
        const endHour = parseInt(rule.trigger_conditions.timeOfDay.end);
        
        if (currentHour < startHour || currentHour > endHour) {
          matches = false;
        }
      }

      // Check day of week conditions
      if (rule.trigger_conditions?.dayOfWeek) {
        const today = new Date().getDay();
        if (!rule.trigger_conditions.dayOfWeek.includes(today)) {
          matches = false;
        }
      }

      if (matches) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Get agent details (handles user_identifier properly)
   */
  private async getAgent(agentId: string, userIdentifier: string) {
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userIdentifier) // agents table uses user_identifier (text)
      .single();

    return data;
  }

  /**
   * Create default assignment using first available AI agent
   */
  private async createDefaultAssignment(request: ConversationAssignmentRequest): Promise<boolean> {
    try {
      // Find first active AI agent for user
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', request.userId)
        .eq('type', 'ai_agent')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1);

      if (!agents || agents.length === 0) {
        console.log('No active AI agents found for default assignment');
        return false;
      }

      const defaultAgent = agents[0];
      
      await this.createAssignment(request.conversationId, request.userId, {
        agentType: 'ai_agent',
        agentId: defaultAgent.id,
        agentName: defaultAgent.name,
        assignmentReason: 'Default auto-assignment - first available AI agent',
        autoResponseEnabled: true
      });

      console.log(`✅ Default agent ${defaultAgent.name} assigned to conversation ${request.conversationId}`);
      return true;

    } catch (error) {
      console.error('Error creating default assignment:', error);
      return false;
    }
  }

  /**
   * Create agent assignment record and ensure conversation exists
   */
  private async createAssignment(
    conversationId: string, 
    userId: string, 
    assignment: {
      agentType: string;
      agentId: string;
      agentName: string;
      assignmentReason: string;
      autoResponseEnabled: boolean;
    }
  ) {
    // Set user context for RLS
    try {
      await supabase.rpc('set_current_user_id', { user_id: userId });
    } catch (contextError) {
      console.error('Failed to set user context:', contextError);
    }

    // Ensure conversation exists in CRM (needed for auto-replies)
    await this.ensureConversationExists(conversationId, userId);

    // Deactivate any existing assignments
    await supabase
      .from('conversation_agent_assignments')
      .update({ status: 'inactive' })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    // Create new assignment
    const { error } = await supabase
      .from('conversation_agent_assignments')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        agent_type: assignment.agentType,
        agent_id: assignment.agentId,
        agent_name: assignment.agentName,
        assigned_by: userId,
        assignment_reason: assignment.assignmentReason,
        status: 'active',
        auto_response_enabled: assignment.autoResponseEnabled
      });

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }

    console.log(`🎯 Assignment created: ${assignment.agentName} assigned to conversation ${conversationId}`);

    // 📊 Phase 3.3: Track assignment analytics
    try {
      const { performanceAnalyticsService } = await import('./performance-analytics-service');
      await performanceAnalyticsService.trackAgentInteraction(
        assignment.agentId,
        conversationId,
        userId,
        'conversation_assigned'
      );
      
      await performanceAnalyticsService.trackSystemEvent(userId, 'assignment', {
        agentId: assignment.agentId,
        agentType: assignment.agentType,
        reason: assignment.assignmentReason
      });
    } catch (analyticsError) {
      console.error('Failed to track assignment analytics:', analyticsError);
    }

    // Update conversation with assigned agent info
    await supabase
      .from('crm_conversations')
      .update({
        assigned_agent_id: assignment.agentId,
        assigned_agent_name: assignment.agentName,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', userId);
  }

  /**
   * Ensure conversation exists in CRM system
   */
  private async ensureConversationExists(conversationId: string, userId: string) {
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from('crm_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (existing) return; // Conversation already exists

      // Create conversation if it doesn't exist
      const { error } = await supabase
        .from('crm_conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          status: 'active',
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating conversation:', error);
      } else {
        console.log(`📝 Created conversation ${conversationId} for user ${userId}`);
      }
    } catch (error) {
      console.error('Error ensuring conversation exists:', error);
    }
  }

  /**
   * Create or update assignment rule (handles user_identifier -> UUID conversion)
   */
  async createAssignmentRule(rule: Partial<AssignmentRule> & { userIdentifier?: string }): Promise<AssignmentRule | null> {
    try {
      let userUuid = rule.user_id;
      
      // Convert user_identifier to UUID if provided
      if (rule.userIdentifier) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('user_identifier', rule.userIdentifier)
          .single();
        
        if (userData) {
          userUuid = userData.id;
        }
      }

      if (!userUuid || !rule.target_agent_id) {
        throw new Error('user_id and target_agent_id are required');
      }

      const { data, error } = await supabase
        .from('assignment_rules')
        .insert({
          user_id: userUuid,
          name: rule.name || 'Auto Assignment Rule',
          trigger_conditions: rule.trigger_conditions || {},
          target_type: rule.target_type || 'agent',
          target_agent_id: rule.target_agent_id,
          priority: rule.priority || 100,
          is_active: rule.is_active !== false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment rule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createAssignmentRule:', error);
      return null;
    }
  }

  /**
   * Get assignment rules for user (public method - handles user_identifier)
   */
  async getUserAssignmentRules(userIdentifier: string): Promise<AssignmentRule[]> {
    return await this.getAssignmentRules(userIdentifier);
  }

  /**
   * Integration hook - call this when new conversations are created
   */
  static async handleNewConversation(
    conversationId: string,
    userId: string,
    platform: string,
    messageContent?: string,
    customerInfo?: any,
    category?: string
  ) {
    const service = new DefaultAgentAssignmentService();
    
    try {
      await service.assignDefaultAgent({
        conversationId,
        userId,
        platform,
        messageContent,
        customerInfo,
        category
      });
    } catch (error) {
      console.error('Error in handleNewConversation:', error);
      // Don't let assignment errors break conversation creation
    }
  }
}

// Export singleton instance
export const defaultAgentAssignmentService = new DefaultAgentAssignmentService();
export default defaultAgentAssignmentService;