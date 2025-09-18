import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const userId = tokenResult.uid;

    // Await params for Next.js 15
    const { id: organizationId } = await params;

    // Get the request body
    const body = await request.json();
    const { name, domain } = body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient();

    console.log('🔄 PATCH Organization Request:', { organizationId, userId, name, domain });

    // Verify user is the owner or admin of this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      console.error('❌ User not found in organization:', membershipError);
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      console.error('❌ Insufficient permissions:', membership.role);
      return NextResponse.json({ error: 'Only organization owners and admins can edit organizations' }, { status: 403 });
    }

    console.log('✅ User has permission to edit, proceeding with update');

    // Update the organization
    const updateData: any = {
      name: name.trim(),
      updated_at: new Date().toISOString()
    };

    if (domain !== undefined) {
      updateData.domain = domain && domain.trim() ? domain.trim() : null;
    }

    console.log('🔄 Updating organization with data:', updateData);

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating organization:', updateError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    console.log('✅ Organization updated successfully:', updatedOrg);

    return NextResponse.json(updatedOrg);

  } catch (error) {
    console.error('❌ Update organization error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const userId = tokenResult.uid;

    // Await params for Next.js 15
    const { id: organizationId } = await params;

    // Create Supabase client
    const supabase = createClient();

    console.log('🗑️ DELETE Organization Request:', { organizationId, userId });

    // Verify user is the owner of this organization
    console.log('🔍 Checking user membership for org:', organizationId, 'user:', userId);
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    console.log('🔍 Membership query result:', { membership, membershipError });

    if (membershipError || !membership) {
      console.error('❌ User not found in organization:', membershipError);
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });
    }

    if (membership.role !== 'owner') {
      console.error('❌ User is not owner:', membership.role);
      return NextResponse.json({ error: 'Only organization owners can delete organizations' }, { status: 403 });
    }

    console.log('✅ User is owner, proceeding with deletion');

    // Check if there are other active members
    console.log('🔍 Checking for other active members...');
    const { data: otherMembers, error: membersError } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .neq('user_id', userId);

    console.log('🔍 Other members check:', { otherMembers, membersError, count: otherMembers?.length });

    if (membersError) {
      console.error('❌ Error checking members:', membersError);
      return NextResponse.json({ error: 'Failed to verify organization members' }, { status: 500 });
    }

    if (otherMembers && otherMembers.length > 0) {
      console.log('❌ Cannot delete - other active members exist:', otherMembers.length);
      return NextResponse.json({
        error: 'Cannot delete organization with other active members. Please remove all members first.'
      }, { status: 400 });
    }

    // Delete the organization (this will cascade to related data)
    console.log('🗑️ Attempting to delete organization from database...');
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (deleteError) {
      console.error('❌ Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    console.log('✅ Organization deleted successfully:', organizationId);

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete organization error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}