import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        id,
        organization_memberships (
          organization_id,
          organizations (
            id,
            name,
            subscription_tier,
            subscription_status
          )
        )
      `)
      .eq('email', session.user.email)
      .single();

    if (!profile?.organization_memberships?.[0]) {
      // New user without organization yet
      return NextResponse.json({
        total_credits: 1000,
        used_credits: 0,
        remaining_credits: 1000,
        subscription_tier: 'trial',
        reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const organization = profile.organization_memberships[0].organizations;

    // Define credit limits based on plan
    const planLimits = {
      starter: 5000,
      business: 25000,
      enterprise: 100000,
      trial: 1000
    };

    const planType = organization.subscription_tier || 'trial';
    const totalCredits = planLimits[planType] || 1000;

    // TODO: In production, calculate actual usage from messages/conversations table
    // For now, return mock data based on plan
    const mockUsage = {
      starter: Math.floor(Math.random() * 1000),
      business: Math.floor(Math.random() * 5000),
      enterprise: Math.floor(Math.random() * 10000),
      trial: Math.floor(Math.random() * 100)
    };

    const usedCredits = mockUsage[planType] || 0;

    return NextResponse.json({
      total_credits: totalCredits,
      used_credits: usedCredits,
      remaining_credits: totalCredits - usedCredits,
      subscription_tier: planType,
      organization_id: organization.id,
      organization_name: organization.name,
      reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}