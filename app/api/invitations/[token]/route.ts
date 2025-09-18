import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Await params for Next.js 15
    const { token } = await params;

    // Create Supabase client
    const supabase = createClient();

    console.log('🔍 Validating invitation token:', token);

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        invited_by,
        expires_at,
        accepted_at,
        organizations (name)
      `)
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

    console.log('✅ Invitation is valid');

    // Return invitation details
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        organization_id: invitation.organization_id,
        organization_name: invitation.organizations?.name || 'Unknown Organization',
        email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invited_by,
        expires_at: invitation.expires_at,
        valid: true
      }
    });

  } catch (error) {
    console.error('❌ Validate invitation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}