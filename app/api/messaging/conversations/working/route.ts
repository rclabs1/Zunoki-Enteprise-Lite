import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service-client';
import { adminAuth } from '@/lib/firebase-admin';

// Helper function to verify Firebase token and get user info
async function verifyFirebaseToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('🔍 Auth header received:', authHeader ? 'Bearer token present' : 'No auth header');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const idToken = authHeader.substring(7);
    console.log('🔍 Token length:', idToken.length);
    console.log('🔍 Token start:', idToken.substring(0, 50) + '...');

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
}

// Helper function to get user's organization
async function getUserOrganization(supabase: any, userId: string) {
  try {
    // Get user's organization from organization_memberships
    const { data: memberships, error } = await supabase
      .from('organization_memberships')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          subscription_status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !memberships) {
      console.error('❌ Error getting user organization:', error);
      return null;
    }

    return memberships.organizations;
  } catch (error) {
    console.error('❌ Error in getUserOrganization:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await verifyFirebaseToken(request);

    // Get user's organization
    const userOrg = await getUserOrganization(supabaseServiceRole, firebaseUser.uid);
    if (!userOrg) {
      return NextResponse.json({
        success: false,
        error: 'No active organization found for user',
        data: {
          conversations: [],
          totalCount: 0,
          unreadCount: 0
        }
      }, { status: 403 });
    }

    console.log('🏢 Loading conversations for organization:', userOrg.id, userOrg.name);
    console.log('🚀 DEBUG: Starting conversation queries...');

    // First, let's do a simple test query to check if conversations exist
    const { data: testConversations, error: testError } = await supabaseServiceRole
      .from('conversations')
      .select('*')
      .eq('organization_id', userOrg.id);

    console.log('🔍 Test query result:', {
      count: testConversations?.length || 0,
      conversations: testConversations,
      error: testError
    });

    // Now try the full query with relationships
    const { data: conversations, error: conversationsError } = await supabaseServiceRole
      .from('conversations')
      .select(`
        *,
        contacts!contact_id (
          id,
          name,
          email,
          phone,
          metadata
        ),
        messages!conversation_id (
          id,
          content,
          created_at,
          role,
          metadata
        )
      `)
      .eq('organization_id', userOrg.id)
      .order('last_message_at', { ascending: false });

    console.log('🔍 Full query result:', {
      count: conversations?.length || 0,
      conversations: conversations,
      error: conversationsError
    });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      throw conversationsError;
    }

    // Platform-agnostic conversation formatter
    // Handles chat widget perfectly, auto-adapts to any future platform
    const formattedConversations = (conversations || []).map((conv) => {
      const contact = conv.contacts;
      const messages = conv.messages || [];
      const lastMessage = messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      // Get platform info (schema-based: channel, contact.platform)
      const platform = conv.channel || contact?.platform || 'unknown';
      const contactMeta = contact?.metadata || {};
      const convMeta = conv.metadata || {};

      // Smart contact display (works for any platform, optimized for chat widget)
      const getContactInfo = () => {
        // Priority 1: Use existing structured contact data
        if (contact?.name && contact.name !== '') {
          return {
            name: contact.name,
            email: contact.email || 'No email',
            phone: contact.phone || 'No phone',
            displayId: contact.platform_id || contact.platform_username || contact.id
          };
        }

        // Priority 2: Extract from metadata based on platform patterns
        // This handles chat widget (visitor_id) and auto-adapts to other platforms
        const allMeta = { ...contactMeta, ...convMeta };

        // Find primary identifier (visitor_id, user_id, phone_number, etc.)
        const identifierKeys = Object.keys(allMeta).filter(key =>
          key.includes('id') || key.includes('username') || key.includes('number')
        );
        const primaryId = identifierKeys[0] ? allMeta[identifierKeys[0]] : null;

        // Generate display name based on platform
        let displayName = 'Unknown Contact';
        if (platform === 'chat-widget' || platform === 'website-chat') {
          // Chat widget: show visitor info with session tracking
          const visitorId = allMeta.visitor_id;
          const isReturning = allMeta.returning_visitor;
          const sessionCount = allMeta.session_count || 1;

          if (visitorId) {
            const visitorNumber = visitorId.split('_').pop() || visitorId;
            if (isReturning && sessionCount > 1) {
              displayName = `Returning Visitor ${visitorNumber} (${sessionCount} visits)`;
            } else {
              displayName = `Visitor ${visitorNumber}`;
            }
          }
        } else if (primaryId) {
          // Other platforms: use primary identifier
          displayName = typeof primaryId === 'string' ?
            primaryId.split('_').pop() || primaryId :
            String(primaryId);
        }

        return {
          name: allMeta.name || allMeta.display_name || displayName,
          email: contact?.email || allMeta.email ||
                 (platform.includes('email') ? primaryId : 'No email'),
          phone: contact?.phone || allMeta.phone || allMeta.phone_number ||
                 allMeta.whatsapp_number || 'No phone',
          displayId: primaryId || contact?.id
        };
      };

      const contactInfo = getContactInfo();

      // Preserve all metadata for complete platform information
      const fullMetadata = {
        ...convMeta,
        ...contactMeta,
        platform: platform,
        integration_id: conv.integration_id,
        // Ensure chat widget fields are always preserved
        ...(platform === 'chat-widget' || platform === 'website-chat') && {
          visitor_id: contactMeta.visitor_id || convMeta.visitor_id,
          widget_id: contactMeta.widget_id || convMeta.widget_id,
          page_url: contactMeta.page_url || convMeta.page_url,
          user_agent: contactMeta.user_agent,
          ip_address: contactMeta.ip_address,
          referrer: contactMeta.referrer
        }
      };

      return {
        id: conv.id,
        contactId: contact?.id || 'unknown',
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone,
        contactAvatar: contactMeta.avatar_url || contactMeta.profile_picture_url || null,
        platform: platform,
        status: conv.status || 'active',
        priority: conv.priority || 'medium',
        assignedAgent: conv.assigned_user_id || null,
        assignedAiAgent: conv.assigned_agent_id ? {
          id: conv.assigned_agent_id,
          name: conv.assigned_agent_name || 'AI Assistant',
          type: 'support',
          confidence: 85,
          isActive: true
        } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          timestamp: lastMessage.created_at,
          isFromContact: lastMessage.role === 'user',
          messageType: lastMessage.message_type || 'text'
        } : null,
        unreadCount: conv.unread_count || 0,
        tags: [platform, conv.status],
        metadata: fullMetadata,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at || conv.created_at
      };
    });

    // If no conversations, return empty but valid structure
    if (formattedConversations.length === 0) {
      formattedConversations.push({
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

    console.log('🎯 Final API response:', {
      success: true,
      totalCount: formattedConversations.length,
      firstConversation: formattedConversations[0],
      allConversations: formattedConversations
    });

    return NextResponse.json({
      success: true,
      data: {
        conversations: formattedConversations,
        totalCount: formattedConversations.length,
        unreadCount: formattedConversations.reduce((acc, conv) => acc + conv.unreadCount, 0)
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