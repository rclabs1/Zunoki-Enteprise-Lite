import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0]
    });
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
      .eq('status', 'active');

    // Use the first active membership (usually there's only one)
    const membership = memberships && memberships.length > 0 ? memberships[0] : null;

    if (error) {
      console.error('Database error fetching organization membership:', error);
      return null;
    }

    if (!membership) {
      console.error('No active organization membership found for user:', userId);
      console.log('Debug - memberships query result:', { memberships, error });
      return null;
    }

    return {
      id: membership.organization_id,
      name: membership.organizations.name,
      status: membership.organizations.subscription_status,
      userRole: membership.role
    };
  } catch (error) {
    console.error('Error fetching user organization:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await verifyFirebaseToken(request);

    const supabase = createClient();
    const body = await request.json();

    console.log('Creating messaging integration for user:', firebaseUser.uid);

    // Get request data
    const { platform, name, config, status = 'active' } = body;

    if (!platform || !name) {
      return NextResponse.json(
        { error: 'Platform and name are required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const userOrg = await getUserOrganization(supabase, firebaseUser.uid);
    if (!userOrg) {
      return NextResponse.json(
        { error: 'No active organization found for user' },
        { status: 403 }
      );
    }

    // Ensure user profile exists in Supabase
    await supabase.from('user_profiles').upsert({
      user_id: firebaseUser.uid,
      email: firebaseUser.email,
      full_name: firebaseUser.name,
      updated_at: new Date().toISOString()
    });

    // Generate widget-specific config for chat widgets
    if (platform === 'website-chat') {
      config.widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      config.webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/webhooks/chat-widget`;
    }

    // Create the integration record
    const { data: integration, error } = await supabase
      .from('messaging_integrations')
      .insert({
        organization_id: userOrg.id,
        user_id: firebaseUser.uid,
        platform,
        name,
        config,
        status,
        webhook_url: platform === 'website-chat' ? '/api/webhooks/chat-widget' : null,
        created_by: firebaseUser.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      return NextResponse.json(
        { error: 'Failed to create integration', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Integration created successfully:', integration.id);

    return NextResponse.json({
      success: true,
      integration,
      message: `${platform} integration created successfully`,
      organization: userOrg.name
    });

  } catch (error) {
    console.error('Error in messaging integrations API:', error);

    if (error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await verifyFirebaseToken(request);

    const supabase = createClient();

    // Get user's organization
    const userOrg = await getUserOrganization(supabase, firebaseUser.uid);
    if (!userOrg) {
      return NextResponse.json(
        { error: 'No active organization found for user' },
        { status: 403 }
      );
    }

    // Get integrations for user's organization
    const { data: integrations, error } = await supabase
      .from('messaging_integrations')
      .select('*')
      .eq('organization_id', userOrg.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integrations: integrations || [],
      organization: userOrg.name
    });

  } catch (error) {
    console.error('Error in messaging integrations GET:', error);

    if (error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}