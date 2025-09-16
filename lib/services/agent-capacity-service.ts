/**
 * Agent Capacity Management Service
 * Tracks agent availability, workload, and capacity limits
 * Ensures proper load distribution across human and AI agents
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface AgentCapacity {
  agentId: string;
  agentType: 'ai_agent' | 'human';
  agentName: string;
  isAvailable: boolean;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number; // percentage
  avgResponseTime: number; // in minutes
  status: 'available' | 'busy' | 'offline' | 'overloaded';
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface CapacityCheckResult {
  isAvailable: boolean;
  canTakeNewConversation: boolean;
  waitTimeEstimate?: number; // in minutes
  reason?: string;
  alternativeAgents?: AgentCapacity[];
}

export class AgentCapacityService {

  /**
   * Check if an agent can handle a new conversation
   */
  async checkAgentCapacity(agentId: string, userIdentifier: string): Promise<CapacityCheckResult> {
    try {
      console.log(`📊 Checking capacity for agent ${agentId}`);

      // Get agent details
      const agent = await this.getAgentDetails(agentId, userIdentifier);
      if (!agent) {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: 'Agent not found'
        };
      }

      // Check if agent is active
      if (agent.status !== 'active') {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: `Agent is ${agent.status}`
        };
      }

      // For AI agents, check system capacity
      if (agent.type === 'ai_agent') {
        return await this.checkAIAgentCapacity(agent, userIdentifier);
      }

      // For human agents, check availability and workload
      if (agent.type === 'human') {
        return await this.checkHumanAgentCapacity(agent, userIdentifier);
      }

      return {
        isAvailable: true,
        canTakeNewConversation: true
      };

    } catch (error) {
      console.error('Error checking agent capacity:', error);
      return {
        isAvailable: false,
        canTakeNewConversation: false,
        reason: 'Capacity check failed'
      };
    }
  }

  /**
   * Check AI agent capacity (mostly unlimited but respect rate limits)
   */
  private async checkAIAgentCapacity(agent: any, userIdentifier: string): Promise<CapacityCheckResult> {
    try {
      // Check if agent has reached conversation limits for the period
      const currentConversations = await this.getCurrentConversationCount(agent.id, userIdentifier);
      const maxConversations = agent.max_concurrent_conversations || 100; // Default high limit for AI

      if (currentConversations >= maxConversations) {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: `AI agent has reached maximum concurrent conversations (${maxConversations})`,
          waitTimeEstimate: 5 // AI agents typically resolve quickly
        };
      }

      // Check monthly usage limits (if applicable)
      const monthlyUsage = agent.monthly_usage_count || 0;
      const usageLimit = agent.usage_limit || 1000; // Default high limit

      if (monthlyUsage >= usageLimit) {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: `AI agent has reached monthly usage limit (${usageLimit})`
        };
      }

      return {
        isAvailable: true,
        canTakeNewConversation: true,
        reason: `AI agent available (${currentConversations}/${maxConversations} conversations)`
      };

    } catch (error) {
      console.error('Error checking AI agent capacity:', error);
      return {
        isAvailable: false,
        canTakeNewConversation: false,
        reason: 'Failed to check AI agent capacity'
      };
    }
  }

  /**
   * Check human agent capacity (consider working hours, current load, etc.)
   */
  private async checkHumanAgentCapacity(agent: any, userIdentifier: string): Promise<CapacityCheckResult> {
    try {
      // Check working hours
      const workingHoursResult = this.checkWorkingHours(agent);
      if (!workingHoursResult.isInWorkingHours) {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: workingHoursResult.reason,
          waitTimeEstimate: workingHoursResult.nextAvailableIn
        };
      }

      // Check current workload
      const currentConversations = await this.getCurrentConversationCount(agent.id, userIdentifier);
      const maxConcurrent = agent.max_concurrent_chats || 5; // Default reasonable limit

      if (currentConversations >= maxConcurrent) {
        // Get average response time to estimate wait
        const avgResponseTime = agent.avg_response_time_minutes || 15;
        
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: `Human agent at capacity (${currentConversations}/${maxConcurrent} conversations)`,
          waitTimeEstimate: avgResponseTime
        };
      }

      // Check agent status
      const teamMemberStatus = await this.getTeamMemberStatus(agent.id);
      if (teamMemberStatus && teamMemberStatus.status === 'offline') {
        return {
          isAvailable: false,
          canTakeNewConversation: false,
          reason: 'Human agent is offline'
        };
      }

      const utilizationRate = (currentConversations / maxConcurrent) * 100;
      
      return {
        isAvailable: true,
        canTakeNewConversation: true,
        reason: `Human agent available (${currentConversations}/${maxConcurrent} conversations, ${utilizationRate.toFixed(0)}% utilized)`
      };

    } catch (error) {
      console.error('Error checking human agent capacity:', error);
      return {
        isAvailable: false,
        canTakeNewConversation: false,
        reason: 'Failed to check human agent capacity'
      };
    }
  }

  /**
   * Check if agent is within working hours
   */
  private checkWorkingHours(agent: any): { isInWorkingHours: boolean; reason?: string; nextAvailableIn?: number } {
    try {
      // If no working hours specified, assume 24/7 availability
      if (!agent.working_hours) {
        return { isInWorkingHours: true };
      }

      const now = new Date();
      const workingHours = typeof agent.working_hours === 'string' 
        ? JSON.parse(agent.working_hours) 
        : agent.working_hours;

      // Simple working hours check (can be enhanced with timezone support)
      const currentHour = now.getHours();
      const startHour = parseInt(workingHours.start?.split(':')[0] || '9');
      const endHour = parseInt(workingHours.end?.split(':')[0] || '17');

      if (currentHour >= startHour && currentHour < endHour) {
        return { isInWorkingHours: true };
      }

      // Calculate next available time
      let nextAvailableHour = startHour;
      if (currentHour >= endHour) {
        nextAvailableHour = startHour + 24; // Next day
      }
      
      const hoursUntilAvailable = nextAvailableHour - currentHour;
      const minutesUntilAvailable = hoursUntilAvailable * 60;

      return {
        isInWorkingHours: false,
        reason: `Outside working hours (${workingHours.start || '9:00'} - ${workingHours.end || '17:00'})`,
        nextAvailableIn: minutesUntilAvailable
      };

    } catch (error) {
      console.error('Error checking working hours:', error);
      return { isInWorkingHours: true }; // Default to available on error
    }
  }

  /**
   * Get current active conversation count for agent
   */
  private async getCurrentConversationCount(agentId: string, userIdentifier: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('conversation_agent_assignments')
        .select('id')
        .eq('agent_id', agentId)
        .eq('user_id', userIdentifier)
        .eq('status', 'active');

      if (error) {
        console.error('Error getting conversation count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting current conversation count:', error);
      return 0;
    }
  }

  /**
   * Get agent details
   */
  private async getAgentDetails(agentId: string, userIdentifier: string) {
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userIdentifier)
      .single();

    return data;
  }

  /**
   * Get team member status for human agents
   */
  private async getTeamMemberStatus(agentId: string) {
    const { data } = await supabase
      .from('team_members')
      .select('status, max_concurrent_chats, avg_response_time_minutes')
      .eq('agent_id', agentId)
      .single();

    return data;
  }

  /**
   * Get available agents for assignment with capacity information
   */
  async getAvailableAgents(
    userIdentifier: string, 
    agentType?: 'ai_agent' | 'human',
    specialization?: string[]
  ): Promise<AgentCapacity[]> {
    try {
      console.log(`📋 Getting available agents for user ${userIdentifier}`);

      // Get all active agents
      let query = supabase
        .from('agents')
        .select('*')
        .eq('user_id', userIdentifier)
        .eq('status', 'active');

      if (agentType) {
        query = query.eq('type', agentType);
      }

      const { data: agents, error } = await query;

      if (error || !agents) {
        console.error('Error getting agents:', error);
        return [];
      }

      // Check capacity for each agent
      const capacityPromises = agents.map(async (agent): Promise<AgentCapacity> => {
        const capacityCheck = await this.checkAgentCapacity(agent.id, userIdentifier);
        const currentLoad = await this.getCurrentConversationCount(agent.id, userIdentifier);
        const maxCapacity = agent.type === 'ai_agent' 
          ? (agent.max_concurrent_conversations || 100)
          : (agent.max_concurrent_chats || 5);

        return {
          agentId: agent.id,
          agentType: agent.type,
          agentName: agent.name,
          isAvailable: capacityCheck.isAvailable,
          currentLoad,
          maxCapacity,
          utilizationRate: (currentLoad / maxCapacity) * 100,
          avgResponseTime: agent.avg_response_time_minutes || 0,
          status: capacityCheck.canTakeNewConversation ? 'available' : 'busy',
          workingHours: agent.working_hours ? {
            start: agent.working_hours.start || '9:00',
            end: agent.working_hours.end || '17:00',
            timezone: agent.working_hours.timezone || 'UTC'
          } : undefined
        };
      });

      const capacities = await Promise.all(capacityPromises);

      // Sort by availability and utilization
      return capacities.sort((a, b) => {
        // Available agents first
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        
        // Among available agents, prefer lower utilization
        return a.utilizationRate - b.utilizationRate;
      });

    } catch (error) {
      console.error('Error getting available agents:', error);
      return [];
    }
  }

  /**
   * Find best available agent based on capacity and specialization
   */
  async findBestAvailableAgent(
    userIdentifier: string,
    intentCategory?: string,
    platform?: string
  ): Promise<AgentCapacity | null> {
    try {
      const availableAgents = await this.getAvailableAgents(userIdentifier);
      
      // Filter only available agents
      const available = availableAgents.filter(agent => 
        agent.isAvailable && agent.status === 'available'
      );

      if (available.length === 0) {
        console.log('No available agents found');
        return null;
      }

      // Simple selection: prefer AI agents for general queries, humans for complex issues
      const preferHuman = intentCategory === 'support' && 
        available.some(agent => agent.agentType === 'human');

      if (preferHuman) {
        const humanAgent = available.find(agent => agent.agentType === 'human');
        if (humanAgent) return humanAgent;
      }

      // Return agent with lowest utilization
      return available[0];

    } catch (error) {
      console.error('Error finding best available agent:', error);
      return null;
    }
  }

  /**
   * Update agent utilization metrics
   */
  async updateAgentMetrics(agentId: string, userIdentifier: string): Promise<void> {
    try {
      const currentLoad = await this.getCurrentConversationCount(agentId, userIdentifier);
      
      // Update agent utilization in database
      await supabase
        .from('agents')
        .update({
          conversations_handled: currentLoad,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .eq('user_id', userIdentifier);

    } catch (error) {
      console.error('Error updating agent metrics:', error);
    }
  }
}

// Export singleton instance
export const agentCapacityService = new AgentCapacityService();
export default agentCapacityService;