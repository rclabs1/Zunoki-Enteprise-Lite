import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const firebaseToken = authHeader.substring(7);
    const tokenResult = await verifyFirebaseToken(firebaseToken);

    if (!tokenResult.success) {
      return NextResponse.json({ error: tokenResult.error }, { status: 401 });
    }

    const userId = tokenResult.uid;
    const userEmail = tokenResult.email;

    // Await params for Next.js 15
    const { token } = await params;

    // Create Supabase client
    const supabase = createClient();

    console.log('🤝 Accepting invitation:', { token, userId, userEmail });

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Invitation not found:', invitationError);
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      console.log('❌ Invitation has expired');
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check if invitation has already been accepted
    if (invitation.accepted_at) {
      console.log('❌ Invitation already accepted');
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 });
    }

    // Verify email matches invitation
    if (userEmail !== invitation.email) {
      console.error('❌ Email mismatch:', { userEmail, invitationEmail: invitation.email });
      return NextResponse.json({
        error: 'Email address does not match the invitation'
      }, { status: 403 });
    }

    // Check if user is already a member of this organization
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('organization_memberships')
      .select('id, status')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking existing membership:', membershipCheckError);
      return NextResponse.json({ error: 'Failed to check existing membership' }, { status: 500 });
    }

    if (existingMembership) {
      console.log('❌ User already a member');
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 });
    }

    console.log('✅ Invitation valid, accepting...');

    // Begin transaction-like operations
    try {
      // Update or create the membership record
      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .upsert({
          organization_id: invitation.organization_id,
          user_id: userId,
          email: invitation.email,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.invited_by,
          invitation_token: token,
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,user_id'
        });

      if (membershipError) {
        console.error('❌ Error creating/updating membership:', membershipError);
        throw new Error('Failed to create membership');
      }

      // Mark invitation as accepted
      const { error: invitationUpdateError } = await supabase
        .from('organization_invitations')
        .update({
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (invitationUpdateError) {
        console.error('❌ Error updating invitation:', invitationUpdateError);
        // Don't fail the whole operation for this
      }

      console.log('✅ Invitation accepted successfully');

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
        organization: {
          id: invitation.organization_id,
          role: invitation.role
        }
      });

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}