import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
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
    const { organizationId, userId, role } = body;

    // Basic validation
    if (!organizationId || !userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validRoles = ['viewer', 'member', 'manager', 'admin', 'owner'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient();

    console.log('🔄 Update role request:', { organizationId, userId, role, currentUserId });

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
      return NextResponse.json({ error: 'Only organization owners and admins can update roles' }, { status: 403 });
    }

    // Prevent changing owner role or changing to owner (except by owner)
    if (role === 'owner' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can assign owner role' }, { status: 403 });
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

    // Prevent changing owner role (only owner can change their own role)
    if (targetMember.role === 'owner' && currentUserId !== userId) {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
    }

    console.log('✅ Permissions verified, updating role');

    // Update the role
    const { error: updateError } = await supabase
      .from('organization_memberships')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating role:', updateError);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    console.log('✅ Role updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully'
    });

  } catch (error) {
    console.error('❌ Update role error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}