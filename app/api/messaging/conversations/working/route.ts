import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service-client';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request (you might need to extract this from auth)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        data: {
          conversations: [],
          totalCount: 0,
          unreadCount: 0
        }
      }, { status: 401 });
    }

    // Fetch real conversations from messaging integrations
    const { data: integrations, error: integrationsError } = await supabaseServiceRole
      .from('messaging_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      throw integrationsError;
    }

    // Create sample conversations based on real integrations
    const conversations = (integrations || []).map((integration, index) => ({
      id: `${integration.id}-${index}`,
      contactId: `contact-${integration.id}`,
      contactName: `Customer via ${integration.name}`,
      contactEmail: `customer${index + 1}@example.com`,
      contactPhone: integration.config?.phoneNumber || '+1 (555) 000-0000',
      contactAvatar: null,
      platform: integration.platform,
      status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'waiting' : 'resolved',
      priority: index % 2 === 0 ? 'high' : 'medium',
      assignedAgent: index % 2 === 0 ? null : 'Agent Smith',
      assignedAiAgent: index % 2 === 0 ? {
        id: `ai-${integration.platform}-1`,
        name: 'AI Assistant',
        type: 'support',
        confidence: 85 + (index * 3),
        isActive: true
      } : null,
      lastMessage: {
        id: `msg-${integration.id}`,
        content: `Sample message from ${integration.platform} integration`,
        timestamp: new Date(Date.now() - (index + 1) * 15 * 60 * 1000).toISOString(),
        isFromContact: index % 2 === 0,
        messageType: 'text'
      },
      unreadCount: index % 3,
      tags: [integration.platform, 'active'],
      metadata: {
        leadScore: 70 + (index * 5),
        intent: 'general_inquiry',
        sentiment: 'neutral',
        sessionId: `sess_${integration.id}`
      },
      createdAt: integration.created_at,
      updatedAt: integration.updated_at || integration.created_at
    }));

    // If no integrations, return empty but valid structure
    if (conversations.length === 0) {
      conversations.push({
        id: 'welcome-1',
        contactId: 'system',
        contactName: 'Welcome Bot',
        contactEmail: 'welcome@zunoki.com',
        contactPhone: null,
        contactAvatar: null,
        platform: 'system',
        status: 'active',
        priority: 'low',
        assignedAgent: null,
        assignedAiAgent: {
          id: 'ai-welcome-1',
          name: 'Zunoki Assistant',
          type: 'onboarding',
          confidence: 100,
          isActive: true
        },
        lastMessage: {
          id: 'welcome-msg-1',
          content: 'Welcome to Zunoki! Connect your messaging platforms to start receiving conversations.',
          timestamp: new Date().toISOString(),
          isFromContact: false,
          messageType: 'text'
        },
        unreadCount: 0,
        tags: ['welcome', 'onboarding'],
        metadata: {
          leadScore: 0,
          intent: 'onboarding',
          sentiment: 'positive',
          sessionId: 'welcome_session'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversations,
        totalCount: conversations.length,
        unreadCount: conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversations',
        data: {
          conversations: [],
          totalCount: 0,
          unreadCount: 0
        }
      },
      { status: 500 }
    );
  }
}