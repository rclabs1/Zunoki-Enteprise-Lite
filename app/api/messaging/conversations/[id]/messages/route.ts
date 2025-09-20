import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', messages: [] },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', messages: [] },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.uid)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No organization found', messages: [] },
        { status: 403 }
      );
    }

    // Verify conversation belongs to user's organization
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found', messages: [] },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch messages',
          messages: []
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      conversationId
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch messages',
        messages: []
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const conversationId = params.id;
    const body = await request.json();
    const { content, role = 'user', message_type = 'text', agent_id } = body;

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.uid)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 403 }
      );
    }

    // Verify conversation belongs to user's organization
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, organization_id')
      .eq('id', conversationId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        organization_id: membership.organization_id,
        conversation_id: conversationId,
        content,
        role,
        message_type,
        agent_id,
        user_id: role === 'user' ? null : user.uid,
        metadata: {
          created_by: user.uid,
          platform: 'web'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating message:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create message'
      },
      { status: 500 }
    );
  }
}