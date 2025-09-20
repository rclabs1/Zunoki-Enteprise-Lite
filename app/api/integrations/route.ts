import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

// GET /api/integrations - Get user's messaging integrations
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract Firebase ID token
    const idToken = authHeader.replace('Bearer ', '');

    // Verify Firebase token
    const authResult = await verifyFirebaseToken(idToken);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('🔍 Loading integrations for user:', authResult.uid);

    // Create Supabase client
    const supabase = createClient();

    // Get user's messaging integrations
    const { data: integrations, error } = await supabase
      .from('messaging_integrations')
      .select(`
        id,
        platform,
        provider,
        name,
        status,
        config,
        last_sync_at,
        error_message,
        created_at,
        updated_at,
        display_order,
        is_primary,
        metadata
      `)
      .eq('user_id', authResult.uid)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: integrations?.length || 0,
      connected: integrations?.filter(i => i.status === 'active').length || 0,
      error: integrations?.filter(i => i.status === 'error').length || 0,
      pending: integrations?.filter(i => i.status === 'pending').length || 0,
    };

    console.log('📊 Integration stats:', stats);

    return NextResponse.json({
      success: true,
      integrations: integrations || [],
      stats
    });

  } catch (error: any) {
    console.error('💥 Error in GET /api/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create new messaging integration
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract Firebase ID token
    const idToken = authHeader.replace('Bearer ', '');

    // Verify Firebase token
    const authResult = await verifyFirebaseToken(idToken);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { platform, provider, name, config } = body;

    // Validate required fields
    if (!platform || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, name' },
        { status: 400 }
      );
    }

    console.log('🔗 Creating integration:', { platform, provider, name, userId: authResult.uid });

    // Create Supabase client
    const supabase = createClient();

    // Insert new integration (organization_id will be auto-populated by trigger)
    const { data: integration, error } = await supabase
      .from('messaging_integrations')
      .insert({
        user_id: authResult.uid,
        platform,
        provider: provider || 'default',
        name,
        config: config || {},
        status: 'pending',
        created_by: authResult.uid,
        display_order: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      return NextResponse.json(
        { error: 'Failed to create integration' },
        { status: 500 }
      );
    }

    console.log('✅ Integration created:', integration);

    return NextResponse.json({
      success: true,
      integration
    });

  } catch (error: any) {
    console.error('💥 Error in POST /api/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}