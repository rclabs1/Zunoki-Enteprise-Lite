import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      // Return all test conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          status,
          channel,
          assigned_agent_id,
          assigned_user_id,
          created_at,
          last_message_at,
          contacts (
            id,
            name,
            email,
            metadata
          ),
          messages (
            id,
            content,
            role,
            agent_id,
            created_at
          )
        `)
        .eq('channel', 'chat-widget')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        conversations: conversations || [],
        total: conversations?.length || 0
      });
    }

    // Get specific conversation details
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        status,
        channel,
        assigned_agent_id,
        assigned_user_id,
        metadata,
        created_at,
        last_message_at,
        contacts (
          id,
          name,
          email,
          phone,
          metadata
        ),
        messages (
          id,
          content,
          role,
          message_type,
          agent_id,
          user_id,
          metadata,
          created_at
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get agent info if assigned
    let agentInfo = null;
    if (conversation.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id, name, status, settings')
        .eq('id', conversation.assigned_agent_id)
        .single();
      agentInfo = agent;
    }

    // Get user info if assigned
    let userInfo = null;
    if (conversation.assigned_user_id) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('user_id', conversation.assigned_user_id)
        .single();
      userInfo = user;
    }

    return NextResponse.json({
      success: true,
      conversation,
      assignment: {
        agent: agentInfo,
        user: userInfo,
        type: conversation.assigned_agent_id ? 'ai_agent' :
              conversation.assigned_user_id ? 'human_agent' : 'unassigned'
      }
    });

  } catch (error) {
    console.error('Error in chat assignment test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { conversation_id, assignment_type, assignment_id } = body;

    if (!conversation_id || !assignment_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updateData: any = {};

    if (assignment_type === 'ai_agent' && assignment_id) {
      // Assign to AI agent
      updateData.assigned_agent_id = assignment_id;
      updateData.assigned_user_id = null;
    } else if (assignment_type === 'human_agent' && assignment_id) {
      // Assign to human agent
      updateData.assigned_user_id = assignment_id;
      updateData.assigned_agent_id = null;
    } else if (assignment_type === 'unassign') {
      // Unassign
      updateData.assigned_agent_id = null;
      updateData.assigned_user_id = null;
    } else {
      return NextResponse.json({ error: 'Invalid assignment type' }, { status: 400 });
    }

    const { data: updatedConversation, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversation_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation assignment:', error);
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }

    // Log the assignment change
    await supabase
      .from('messages')
      .insert({
        organization_id: updatedConversation.organization_id,
        conversation_id: conversation_id,
        content: `Conversation ${assignment_type === 'unassign' ? 'unassigned' : 'assigned to ' + assignment_type}`,
        role: 'system',
        message_type: 'assignment_change',
        metadata: {
          assignment_type,
          assignment_id,
          previous_assignment: {
            agent_id: updateData.assigned_agent_id,
            user_id: updateData.assigned_user_id
          }
        }
      });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
      message: `Conversation ${assignment_type === 'unassign' ? 'unassigned' : 'assigned to ' + assignment_type} successfully`
    });

  } catch (error) {
    console.error('Error assigning conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}