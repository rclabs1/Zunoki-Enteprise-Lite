import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', integrations: [] },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', integrations: [] },
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
        integrations: []
      });
    }

    // Fetch integrations from database
    const { data: integrations, error } = await supabase
      .from('messaging_integrations')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch integrations',
          integrations: []
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integrations: integrations || []
    });

  } catch (error) {
    console.error('Error fetching messaging integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch integrations',
        integrations: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { type, name, configuration, status } = body;

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyFirebaseToken(token);

    if (!user) {
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
        { status: 400 }
      );
    }

    // Create webhook URL for this integration
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${type}`;

    // Save integration to database
    const { data: integration, error } = await supabase
      .from('messaging_integrations')
      .insert({
        organization_id: membership.organization_id,
        name,
        platform: type,
        config: configuration,
        status: status || 'active',
        webhook_url: webhookUrl,
        created_by: user.uid
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating integration:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create integration'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integration
    });

  } catch (error) {
    console.error('Error creating messaging integration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create integration'
      },
      { status: 500 }
    );
  }
}