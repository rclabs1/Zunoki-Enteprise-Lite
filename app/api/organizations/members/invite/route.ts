import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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
    const { organizationId, email, role } = body;

    // Basic validation
    if (!organizationId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validRoles = ['viewer', 'member', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient();

    console.log('📧 Invite user request:', { organizationId, email, role, currentUserId });

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
      return NextResponse.json({ error: 'Only organization owners and admins can invite users' }, { status: 403 });
    }

    // Check if user is already a member or has a pending invitation
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('organization_memberships')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .maybeSingle();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking existing membership:', memberCheckError);
      return NextResponse.json({ error: 'Failed to check existing membership' }, { status: 500 });
    }

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
      } else if (existingMember.status === 'invited') {
        return NextResponse.json({ error: 'User already has a pending invitation' }, { status: 400 });
      }
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    console.log('✅ Permissions verified, creating invitation');

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: currentUserId,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Error creating invitation:', inviteError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Also create a pending membership record
    const { error: membershipCreateError } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: organizationId,
        email,
        role,
        status: 'invited',
        invited_by: currentUserId,
        invitation_token: invitationToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (membershipCreateError) {
      console.error('❌ Error creating membership record:', membershipCreateError);
      // Clean up the invitation if membership creation fails
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitation.id);

      return NextResponse.json({ error: 'Failed to create membership record' }, { status: 500 });
    }

    console.log('✅ Invitation created successfully');

    // TODO: Send email invitation here
    // For now, we'll return the invitation details
    // In production, you would send an email with the invitation link

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email,
        role,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        // Include invitation link for testing
        invitationLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${invitationToken}`
      }
    });

  } catch (error) {
    console.error('❌ Invite user error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}