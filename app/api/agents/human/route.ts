import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service-client';

function getDepartmentFromRole(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'Administration',
    'owner': 'Leadership',
    'manager': 'Management',
    'support': 'Customer Support',
    'sales': 'Sales',
    'developer': 'Engineering',
    'member': 'General'
  };
  return roleMap[role?.toLowerCase()] || 'General';
}

function getSkillsFromRole(role: string): string[] {
  const skillsMap: Record<string, string[]> = {
    'admin': ['administration', 'user_management', 'system_config'],
    'owner': ['leadership', 'strategy', 'decision_making'],
    'manager': ['team_management', 'project_coordination', 'reporting'],
    'support': ['customer_support', 'troubleshooting', 'communication'],
    'sales': ['sales', 'lead_qualification', 'negotiation'],
    'developer': ['technical_support', 'api_integration', 'troubleshooting'],
    'member': ['general_assistance', 'communication']
  };
  return skillsMap[role?.toLowerCase()] || ['general_assistance'];
}

function getRandomStatus(): string {
  const statuses = ['online', 'away', 'busy'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        data: {
          agents: [],
          totalCount: 0,
          onlineCount: 0,
          availableCount: 0
        }
      }, { status: 401 });
    }

    // Fetch team members from the correct table name
    const { data: teamMembers, error } = await supabaseServiceRole
      .from('team_members')
      .select(`
        id,
        user_id,
        organization_id,
        role,
        status,
        created_at,
        updated_at,
        user_profiles (
          id,
          email,
          display_name,
          avatar_url
        )
      `)
      .eq('organization_id', userId) // Assuming userId is organization ID for now
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }

    // Transform team members into human agents format
    const humanAgents = (teamMembers || []).map((member, index) => ({
      id: member.id,
      name: member.user_profiles?.display_name || member.user_profiles?.email || 'Unknown Agent',
      email: member.user_profiles?.email || '',
      avatar: member.user_profiles?.avatar_url,
      role: member.role || 'Team Member',
      department: getDepartmentFromRole(member.role),
      status: getRandomStatus(),
      lastActive: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
      activeConversations: Math.floor(Math.random() * 5),
      maxConversations: Math.floor(Math.random() * 5) + 8,
      skills: getSkillsFromRole(member.role),
      languages: ['en'],
      timezone: 'America/New_York',
      workingHours: {
        start: '09:00',
        end: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      metrics: {
        totalConversations: Math.floor(Math.random() * 300) + 100,
        averageResponseTime: Math.random() * 3 + 1,
        customerSatisfaction: Math.random() * 1 + 4,
        resolutionRate: Math.random() * 10 + 85
      },
      createdAt: member.created_at,
      updatedAt: member.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        agents: humanAgents,
        totalCount: humanAgents.length,
        onlineCount: humanAgents.filter(agent => agent.status === 'online').length,
        availableCount: humanAgents.filter(agent =>
          agent.status === 'online' && agent.activeConversations < agent.maxConversations
        ).length
      }
    });

  } catch (error) {
    console.error('Error fetching human agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch human agents',
        data: {
          agents: [],
          totalCount: 0,
          onlineCount: 0,
          availableCount: 0
        }
      },
      { status: 500 }
    );
  }
}