import { supabase } from '@/lib/supabase/client';

export interface Team {
  id: string;
  userId: string;
  name: string;
  description?: string;
  specialization: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  members?: TeamMember[];
  performance?: TeamPerformance;
}

export interface TeamMember {
  id: string;
  teamId: string;
  agentId: string;
  role: 'member' | 'lead' | 'supervisor';
  joinedAt: Date;
  agent?: {
    id: string;
    name: string;
    type: 'human' | 'ai_agent';
    status: 'active' | 'inactive' | 'busy' | 'offline';
    specialization: string[];
    performance?: AgentPerformance;
  };
}

export interface AgentPerformance {
  conversationsHandled: number;
  avgResponseTime: number; // in seconds
  customerSatisfactionScore: number; // 0-5
  resolutionRate: number; // 0-1
  lastActiveAt: Date;
  thisMonth: {
    conversationsHandled: number;
    avgResponseTime: number;
    customerSatisfactionScore: number;
    resolutionRate: number;
  };
}

export interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  conversationsHandled: number;
  avgResponseTime: number;
  customerSatisfactionScore: number;
  resolutionRate: number;
  workload: 'low' | 'medium' | 'high' | 'overloaded';
  thisMonth: {
    conversationsHandled: number;
    avgResponseTime: number;
    customerSatisfactionScore: number;
    resolutionRate: number;
  };
}

export interface WorkloadDistribution {
  agentId: string;
  agentName: string;
  agentType: 'human' | 'ai_agent';
  currentLoad: number; // number of active conversations
  capacity: number; // max conversations they can handle
  utilizationRate: number; // 0-1
  status: 'available' | 'busy' | 'overloaded' | 'offline';
}

class TeamManagementService {
  private static instance: TeamManagementService;

  static getInstance(): TeamManagementService {
    if (!TeamManagementService.instance) {
      TeamManagementService.instance = new TeamManagementService();
    }
    return TeamManagementService.instance;
  }

  // Create team
  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          user_id: team.userId,
          name: team.name,
          description: team.description,
          specialization: team.specialization,
          status: team.status,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  // Get teams for user
  async getTeams(userId: string, includeMembers: boolean = false): Promise<Team[]> {
    try {
      let query = supabase
        .from('teams')
        .select(`
          *,
          ${includeMembers ? `
          team_members (
            *,
            agent:agents (
              id, name, type, status, specialization,
              conversations_handled, avg_response_time_seconds,
              customer_satisfaction_score
            )
          )
          ` : ''}
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        userId: team.user_id,
        createdAt: new Date(team.created_at),
        updatedAt: new Date(team.updated_at),
        members: includeMembers ? (team.team_members || []).map((member: any) => ({
          ...member,
          teamId: member.team_id,
          agentId: member.agent_id,
          joinedAt: new Date(member.created_at),
          agent: member.agent ? {
            ...member.agent,
            performance: {
              conversationsHandled: member.agent.conversations_handled || 0,
              avgResponseTime: member.agent.avg_response_time_seconds || 0,
              customerSatisfactionScore: member.agent.customer_satisfaction_score || 0,
              resolutionRate: 0.8, // Would calculate from actual data
              lastActiveAt: new Date(),
              thisMonth: {
                conversationsHandled: 0,
                avgResponseTime: 0,
                customerSatisfactionScore: 0,
                resolutionRate: 0,
              }
            }
          } : undefined
        })) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  // Get team by ID
  async getTeam(teamId: string, userId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            *,
            agent:agents (
              id, name, type, status, specialization,
              conversations_handled, avg_response_time_seconds,
              customer_satisfaction_score
            )
          )
        `)
        .eq('id', teamId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        ...data,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        members: (data.team_members || []).map((member: any) => ({
          ...member,
          teamId: member.team_id,
          agentId: member.agent_id,
          joinedAt: new Date(member.created_at),
          agent: member.agent ? {
            ...member.agent,
            performance: {
              conversationsHandled: member.agent.conversations_handled || 0,
              avgResponseTime: member.agent.avg_response_time_seconds || 0,
              customerSatisfactionScore: member.agent.customer_satisfaction_score || 0,
              resolutionRate: 0.8,
              lastActiveAt: new Date(),
              thisMonth: {
                conversationsHandled: 0,
                avgResponseTime: 0,
                customerSatisfactionScore: 0,
                resolutionRate: 0,
              }
            }
          } : undefined
        })),
      };
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  // Add agent to team
  async addAgentToTeam(
    teamId: string,
    agentId: string,
    role: TeamMember['role'] = 'member'
  ): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          agent_id: agentId,
          role,
        })
        .select(`
          *,
          agent:agents (
            id, name, type, status, specialization
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        teamId: data.team_id,
        agentId: data.agent_id,
        joinedAt: new Date(data.created_at),
        agent: data.agent,
      };
    } catch (error) {
      console.error('Error adding agent to team:', error);
      return null;
    }
  }

  // Remove agent from team
  async removeAgentFromTeam(teamId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('agent_id', agentId);

      return !error;
    } catch (error) {
      console.error('Error removing agent from team:', error);
      return false;
    }
  }

  // Update team member role
  async updateTeamMemberRole(
    teamId: string,
    agentId: string,
    role: TeamMember['role']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('agent_id', agentId);

      return !error;
    } catch (error) {
      console.error('Error updating team member role:', error);
      return false;
    }
  }

  // Get team performance
  async getTeamPerformance(teamId: string): Promise<TeamPerformance | null> {
    try {
      // Get team members with their performance data
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          agent:agents (
            id, name, type, status,
            conversations_handled, avg_response_time_seconds,
            customer_satisfaction_score
          )
        `)
        .eq('team_id', teamId);

      if (!members) return null;

      const activeMembers = members.filter(m => m.agent?.status === 'active').length;
      const totalMembers = members.length;

      let totalConversations = 0;
      let totalResponseTime = 0;
      let totalSatisfaction = 0;
      let memberCount = 0;

      members.forEach(member => {
        if (member.agent) {
          totalConversations += member.agent.conversations_handled || 0;
          totalResponseTime += member.agent.avg_response_time_seconds || 0;
          totalSatisfaction += member.agent.customer_satisfaction_score || 0;
          memberCount++;
        }
      });

      const avgResponseTime = memberCount > 0 ? totalResponseTime / memberCount : 0;
      const avgSatisfaction = memberCount > 0 ? totalSatisfaction / memberCount : 0;

      // Determine workload
      let workload: TeamPerformance['workload'] = 'low';
      const utilizationRate = activeMembers > 0 ? totalConversations / (activeMembers * 10) : 0; // Assuming 10 conversations per agent is normal
      
      if (utilizationRate > 1.2) workload = 'overloaded';
      else if (utilizationRate > 0.8) workload = 'high';
      else if (utilizationRate > 0.4) workload = 'medium';

      return {
        totalMembers,
        activeMembers,
        conversationsHandled: totalConversations,
        avgResponseTime,
        customerSatisfactionScore: avgSatisfaction,
        resolutionRate: 0.85, // Would calculate from actual resolution data
        workload,
        thisMonth: {
          conversationsHandled: Math.floor(totalConversations * 0.3), // Approximate
          avgResponseTime,
          customerSatisfactionScore: avgSatisfaction,
          resolutionRate: 0.85,
        },
      };
    } catch (error) {
      console.error('Error fetching team performance:', error);
      return null;
    }
  }

  // Get workload distribution across teams
  async getWorkloadDistribution(userId: string): Promise<WorkloadDistribution[]> {
    try {
      const { data: agents } = await supabase
        .from('agents')
        .select(`
          id, name, type, status,
          conversations_handled, avg_response_time_seconds,
          team_members!inner (
            team_id,
            team:teams!inner (
              user_id
            )
          )
        `)
        .eq('team_members.team.user_id', userId);

      if (!agents) return [];

      // Get current active conversations per agent
      const agentWorkloads = await Promise.all(
        agents.map(async (agent) => {
          // Get current active conversations for this agent
          const { count: activeConversations } = await supabase
            .from('conversations')
            .select('*', { count: 'exact' })
            .eq('assigned_agent_id', agent.id)
            .in('status', ['open', 'pending']);

          // Determine capacity based on agent type
          const capacity = agent.type === 'ai_agent' ? 50 : 10; // AI agents can handle more
          const currentLoad = activeConversations || 0;
          const utilizationRate = currentLoad / capacity;

          let status: WorkloadDistribution['status'] = 'available';
          if (agent.status === 'offline') status = 'offline';
          else if (utilizationRate > 1) status = 'overloaded';
          else if (utilizationRate > 0.8) status = 'busy';

          return {
            agentId: agent.id,
            agentName: agent.name,
            agentType: agent.type,
            currentLoad,
            capacity,
            utilizationRate: Math.min(utilizationRate, 1),
            status,
          };
        })
      );

      return agentWorkloads;
    } catch (error) {
      console.error('Error fetching workload distribution:', error);
      return [];
    }
  }

  // Auto-assign conversation to best available agent in team
  async autoAssignConversation(
    conversationId: string,
    teamId?: string,
    preferredSpecialization?: string[]
  ): Promise<{ success: boolean; agentId?: string; agentName?: string; error?: string }> {
    try {
      // Get available agents (from team if specified, or all available agents)
      let query = supabase
        .from('agents')
        .select(`
          id, name, type, status, specialization,
          conversations_handled, avg_response_time_seconds,
          ${teamId ? 'team_members!inner (team_id)' : ''}
        `)
        .in('status', ['active', 'online']);

      if (teamId) {
        query = query.eq('team_members.team_id', teamId);
      }

      const { data: agents } = await query;

      if (!agents || agents.length === 0) {
        return { success: false, error: 'No available agents found' };
      }

      // Score agents based on availability, specialization, and performance
      const agentScores = await Promise.all(
        agents.map(async (agent) => {
          let score = 0;

          // Get current workload
          const { count: activeConversations } = await supabase
            .from('conversations')
            .select('*', { count: 'exact' })
            .eq('assigned_agent_id', agent.id)
            .in('status', ['open', 'pending']);

          const capacity = agent.type === 'ai_agent' ? 50 : 10;
          const utilizationRate = (activeConversations || 0) / capacity;

          // Availability score (higher is better)
          score += (1 - utilizationRate) * 50;

          // Specialization match
          if (preferredSpecialization) {
            const matchingSpecs = agent.specialization.filter(spec =>
              preferredSpecialization.some(pref =>
                spec.toLowerCase().includes(pref.toLowerCase())
              )
            );
            score += matchingSpecs.length * 20;
          }

          // Performance score (response time and satisfaction)
          const responseTimeScore = Math.max(0, 300 - (agent.avg_response_time_seconds || 300)) / 300 * 20;
          score += responseTimeScore;

          // Prefer human agents for complex issues, AI for simple ones
          if (preferredSpecialization?.includes('technical') && agent.type === 'human') {
            score += 10;
          }

          return {
            agent,
            score,
            utilizationRate,
          };
        })
      );

      // Filter out overloaded agents and sort by score
      const availableAgents = agentScores
        .filter(a => a.utilizationRate < 1 && a.agent.status !== 'offline')
        .sort((a, b) => b.score - a.score);

      if (availableAgents.length === 0) {
        return { success: false, error: 'All agents are currently overloaded' };
      }

      const bestAgent = availableAgents[0].agent;

      // Assign conversation to the best agent
      const { error } = await supabase
        .from('conversations')
        .update({
          assigned_agent_id: bestAgent.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        return { success: false, error: 'Failed to assign conversation' };
      }

      return {
        success: true,
        agentId: bestAgent.id,
        agentName: bestAgent.name,
      };
    } catch (error) {
      console.error('Error auto-assigning conversation:', error);
      return { success: false, error: 'Internal error during assignment' };
    }
  }

  // Get team analytics
  async getTeamAnalytics(userId: string): Promise<{
    totalTeams: number;
    totalAgents: number;
    activeAgents: number;
    avgTeamSize: number;
    topPerformingTeam?: {
      id: string;
      name: string;
      performance: TeamPerformance;
    };
    workloadDistribution: {
      available: number;
      busy: number;
      overloaded: number;
      offline: number;
    };
  }> {
    try {
      // Get total teams
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Get all agents in user's teams
      const { data: agents } = await supabase
        .from('agents')
        .select(`
          id, name, type, status,
          team_members!inner (
            team:teams!inner (
              user_id
            )
          )
        `)
        .eq('team_members.team.user_id', userId);

      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.status === 'active').length || 0;

      // Get workload distribution
      const workloadData = await this.getWorkloadDistribution(userId);
      const workloadDistribution = {
        available: workloadData.filter(w => w.status === 'available').length,
        busy: workloadData.filter(w => w.status === 'busy').length,
        overloaded: workloadData.filter(w => w.status === 'overloaded').length,
        offline: workloadData.filter(w => w.status === 'offline').length,
      };

      // Get teams with performance data to find top performer
      const teams = await this.getTeams(userId, true);
      let topPerformingTeam;

      if (teams.length > 0) {
        const teamsWithPerformance = await Promise.all(
          teams.map(async (team) => {
            const performance = await this.getTeamPerformance(team.id);
            return { team, performance };
          })
        );

        const bestTeam = teamsWithPerformance
          .filter(t => t.performance)
          .sort((a, b) => 
            (b.performance!.customerSatisfactionScore * b.performance!.resolutionRate) -
            (a.performance!.customerSatisfactionScore * a.performance!.resolutionRate)
          )[0];

        if (bestTeam) {
          topPerformingTeam = {
            id: bestTeam.team.id,
            name: bestTeam.team.name,
            performance: bestTeam.performance!,
          };
        }
      }

      return {
        totalTeams: totalTeams || 0,
        totalAgents,
        activeAgents,
        avgTeamSize: totalTeams ? totalAgents / totalTeams : 0,
        topPerformingTeam,
        workloadDistribution,
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return {
        totalTeams: 0,
        totalAgents: 0,
        activeAgents: 0,
        avgTeamSize: 0,
        workloadDistribution: {
          available: 0,
          busy: 0,
          overloaded: 0,
          offline: 0,
        },
      };
    }
  }

  // Update team
  async updateTeam(
    teamId: string,
    userId: string,
    updates: Partial<Pick<Team, 'name' | 'description' | 'specialization' | 'status'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating team:', error);
      return false;
    }
  }

  // Delete team
  async deleteTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      // First remove all team members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }
}

export const teamManagementService = TeamManagementService.getInstance();
export default teamManagementService;