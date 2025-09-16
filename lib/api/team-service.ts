import { auth } from '@/lib/firebase';

interface Team {
  id: string;
  userId: string;
  name: string;
  description?: string;
  specialization: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  members?: TeamMember[];
}

interface TeamMember {
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
  };
}

interface CreateTeamData {
  name: string;
  description?: string;
  specialization?: string[];
  status?: 'active' | 'inactive';
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  specialization?: string[];
  status?: 'active' | 'inactive';
}

class TeamService {
  private static instance: TeamService;

  static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getUserTeams(includeMembers: boolean = false): Promise<Team[]> {
    try {
      console.log('🔍 getUserTeams: Starting request, includeMembers:', includeMembers);
      const headers = await this.getAuthHeaders();
      console.log('🔍 getUserTeams: Got headers');
      const url = `/api/user/teams${includeMembers ? '?includeMembers=true' : ''}`;
      console.log('🔍 getUserTeams: Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      console.log('🔍 getUserTeams: Response received, status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch teams');
      }

      if (result.warning) {
        console.warn('Team service warning:', result.warning);
      }

      return result.teams || [];
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  async getTeam(teamId: string): Promise<Team> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch team');
      }

      return result.team;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  async createTeam(teamData: CreateTeamData): Promise<Team> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch('/api/user/teams', {
        method: 'POST',
        headers,
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create team');
      }

      return result.team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async updateTeam(teamId: string, updates: UpdateTeamData): Promise<Team> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update team');
      }

      return result.team;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`/api/user/teams/${teamId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  // Helper method to get team agents (flattened from team members)
  async getTeamAgents(userId?: string): Promise<any[]> {
    try {
      const teams = await this.getUserTeams(true);
      
      // Flatten all team agents into a single array
      const allTeamAgents = teams.flatMap(team => 
        (team.members || [])
          .filter(member => member.agent)
          .map(member => ({
            ...member.agent,
            teamName: team.name,
            teamId: team.id,
            role: member.role,
            joinedAt: member.joinedAt,
            isTeamMember: true,
            connectionStatus: 'connected',
            lastSync: new Date().toISOString()
          }))
      ).filter(agent => agent.id);

      console.log(`🔄 ${allTeamAgents.length} team agents loaded successfully`);
      return allTeamAgents;
    } catch (error) {
      console.error('Error fetching team agents:', error);
      return [];
    }
  }
}

export const teamService = TeamService.getInstance();
export type { Team, TeamMember, CreateTeamData, UpdateTeamData };