import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

// PUT /api/integrations/[id] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updates: any = {};

    // Allow updating specific fields
    if (body.status !== undefined) updates.status = body.status;
    if (body.name !== undefined) updates.name = body.name;
    if (body.config !== undefined) updates.config = body.config;
    if (body.error_message !== undefined) updates.error_message = body.error_message;
    if (body.is_primary !== undefined) updates.is_primary = body.is_primary;
    if (body.display_order !== undefined) updates.display_order = body.display_order;

    // Always update the timestamp
    updates.updated_at = new Date().toISOString();

    console.log('🔄 Updating integration:', { id: params.id, updates, userId: authResult.uid });

    // Create Supabase client
    const supabase = createClient();

    // Update integration (RLS will ensure user can only update their own)
    const { data: integration, error } = await supabase
      .from('messaging_integrations')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', authResult.uid) // Extra security check
      .select()
      .single();

    if (error) {
      console.error('Error updating integration:', error);
      return NextResponse.json(
        { error: 'Failed to update integration' },
        { status: 500 }
      );
    }

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Integration updated:', integration);

    return NextResponse.json({
      success: true,
      integration
    });

  } catch (error: any) {
    console.error('💥 Error in PUT /api/integrations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    console.log('🗑️ Deleting integration:', { id: params.id, userId: authResult.uid });

    // Create Supabase client
    const supabase = createClient();

    // Delete integration (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from('messaging_integrations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', authResult.uid); // Extra security check

    if (error) {
      console.error('Error deleting integration:', error);
      return NextResponse.json(
        { error: 'Failed to delete integration' },
        { status: 500 }
      );
    }

    console.log('✅ Integration deleted');

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully'
    });

  } catch (error: any) {
    console.error('💥 Error in DELETE /api/integrations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}