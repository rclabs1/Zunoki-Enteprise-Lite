import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return NextResponse.redirect(new URL('/integration-hub?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/integration-hub?error=missing_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/linkedin`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    // Get user profile and ad accounts
    const [profileResponse, adAccountsResponse] = await Promise.all([
      fetch('https://api.linkedin.com/v2/people/(id,firstName,lastName,emailAddress)', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'LinkedIn-Version': '202304',
        },
      }),
      fetch('https://api.linkedin.com/rest/adAccounts?q=search&search.type.values[0]=BUSINESS', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202304',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }),
    ]);

    let accountInfo = null;
    if (profileResponse.ok && adAccountsResponse.ok) {
      const profile = await profileResponse.json();
      const adAccounts = await adAccountsResponse.json();

      accountInfo = {
        profile_id: profile.id,
        name: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
        email: profile.emailAddress,
        ad_accounts: adAccounts.elements?.map((account: any) => ({
          id: account.id,
          name: account.name,
          status: account.status,
        })) || [],
        ad_account_id: adAccounts.elements?.[0]?.id || null,
      };
    }

    // Save tokens to Supabase
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        platform: 'linkedin_ads',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
          null,
        scope: tokenData.scope || 'r_ads,r_ads_reporting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (tokenError) {
      throw new Error(`Failed to save tokens: ${tokenError.message}`);
    }

    // Save integration status
    const { error: integrationError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider: 'linkedin_ads',
        connected: true,
        account_info: accountInfo,
        last_sync: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      });

    if (integrationError) {
      throw new Error(`Failed to save integration: ${integrationError.message}`);
    }

    // Log the connection activity
    await supabase.from('user_activities').insert({
      user_id: userId,
      action: 'connect',
      platform: 'linkedin_ads',
      details: {
        account_info: accountInfo,
        connected_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/integration-hub?success=linkedin_connected', request.url));

  } catch (error: any) {
    console.error('LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(new URL(`/integration-hub?error=connection_failed&details=${encodeURIComponent(error.message)}`, request.url));
  }
}