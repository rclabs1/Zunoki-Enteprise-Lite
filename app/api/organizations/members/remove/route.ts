import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenResult = await verifyFirebaseToken(token);

    if (!tokenResult.success) {
      return NextResponse.json({ error: tokenResult.error }, { status: 401 });
    }

    const currentUserId = tokenResult.uid;

    // Get the request body
    const body = await request.json();
    const { organizationId, userId } = body;

    // Basic validation
    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient();

    console.log('🗑️ Remove user request:', { organizationId, userId, currentUserId });

    // Verify current user is the owner or admin of this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUserId)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      console.error('❌ Current user not found in organization:', membershipError);
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      console.error('❌ Insufficient permissions:', membership.role);
      return NextResponse.json({ error: 'Only organization owners and admins can remove users' }, { status: 403 });
    }

    // Get target user's current role
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Target user not found in organization' }, { status: 404 });
    }

    // Prevent removing owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 403 });
    }

    console.log('✅ Permissions verified, removing user');

    // Remove the user (set status to removed)
    const { error: removeError } = await supabase
      .from('organization_memberships')
      .update({
        status: 'removed',
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (removeError) {
      console.error('❌ Error removing user:', removeError);
      return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
    }

    console.log('✅ User removed successfully');

    return NextResponse.json({
      success: true,
      message: 'User removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove user error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}