import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

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

    console.log('🔍 Checking subscription status for user:', authResult.uid);

    // Create Supabase client
    const supabase = createClient();

    // Get user profile first
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', authResult.uid)
      .single();

    if (!profile) {
      console.log('👤 No user profile found for:', authResult.uid);
      return NextResponse.json({
        success: true,
        hasPaidSubscription: false,
        organizations: [],
        needsOnboarding: true
      });
    }

    // Get user's organization memberships with organization details
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_memberships')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug,
          subscription_status,
          subscription_tier,
          is_trial,
          trial_ends_at
        )
      `)
      .eq('user_id', authResult.uid)
      .eq('status', 'active');

    if (membershipError) {
      console.error('Error checking memberships:', membershipError);
      return NextResponse.json(
        { error: 'Failed to check organization memberships' },
        { status: 500 }
      );
    }

    // Check if user has ACTUALLY PAID - directly by user_id
    let hasPaidSubscription = false;
    let primaryOrganization = null;

    const { data: userPayments } = await supabase
      .from('payments')
      .select('id, payment_status, organization_id, amount, created_at')
      .eq('user_id', authResult.uid)
      .eq('payment_status', 'completed');

    console.log('🔍 User payment check:', {
      userId: authResult.uid,
      completedPayments: userPayments?.length || 0,
      paymentDetails: userPayments || []
    });

    if (userPayments && userPayments.length > 0 && memberships && memberships.length > 0) {
      // User has completed payments - they're paid
      hasPaidSubscription = true;

      // Find the organization that user paid for
      const paidOrgId = userPayments[0].organization_id;
      let primaryOrgMembership = memberships.find(m => m.organization_id === paidOrgId);

      // If not found, fallback to first owner role
      if (!primaryOrgMembership) {
        primaryOrgMembership = memberships.find(m => m.role === 'owner');
      }

      // Final fallback to first membership
      if (!primaryOrgMembership) {
        primaryOrgMembership = memberships[0];
      }

      primaryOrganization = primaryOrgMembership?.organizations || null;

      console.log('🔍 Primary org selection debug:', {
        paidOrgId,
        foundByPaidOrgId: !!memberships.find(m => m.organization_id === paidOrgId),
        foundByOwnerRole: !!memberships.find(m => m.role === 'owner'),
        selectedPrimaryOrg: primaryOrganization?.name || 'null',
        totalMemberships: memberships.length
      });
    }

    console.log('💳 Subscription status:', {
      uid: authResult.uid,
      hasPaidSubscription,
      organizationCount: memberships?.length || 0,
      primaryOrg: primaryOrganization?.name || null,
      organizationIds: memberships?.map(m => m.organizations.id) || [],
      membershipRoles: memberships?.map(m => m.role) || []
    });

    return NextResponse.json({
      success: true,
      hasPaidSubscription,
      organizations: memberships?.map(m => ({
        id: m.organizations.id,
        name: m.organizations.name,
        slug: m.organizations.slug,
        role: m.role,
        subscription_status: m.organizations.subscription_status,
        subscription_tier: m.organizations.subscription_tier
      })) || [],
      primaryOrganization: primaryOrganization ? {
        id: primaryOrganization.id,
        name: primaryOrganization.name,
        slug: primaryOrganization.slug,
        subscription_status: primaryOrganization.subscription_status
      } : null,
      needsOnboarding: !hasPaidSubscription
    });

  } catch (error: any) {
    console.error('💥 Subscription status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}