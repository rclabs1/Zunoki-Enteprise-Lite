import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', conversations: [] },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', conversations: [] },
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
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0
      });
    }

    // Fetch conversations with contacts and latest message
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
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
          created_at,
          metadata
        )
      `)
      .eq('organization_id', membership.organization_id)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch conversations',
          conversations: []
        },
        { status: 500 }
      );
    }

    // Process conversations to include latest message and format properly
    const processedConversations = conversations?.map(conv => {
      const latestMessage = conv.messages?.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...conv,
        contact: conv.contacts,
        lastMessage: latestMessage ? {
          content: latestMessage.content,
          role: latestMessage.role,
          created_at: latestMessage.created_at,
          platform: latestMessage.metadata?.platform || conv.channel
        } : null,
        messageCount: conv.messages?.length || 0,
        // Don't include the full messages array in the list response
        messages: undefined,
        contacts: undefined
      };
    }) || [];

    return NextResponse.json({
      success: true,
      conversations: processedConversations,
      total: processedConversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversations',
        conversations: []
      },
      { status: 500 }
    );
  }
}