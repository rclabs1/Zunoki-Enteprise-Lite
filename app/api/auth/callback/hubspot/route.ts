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
      console.error('HubSpot OAuth error:', error);
      return NextResponse.redirect(new URL('/integration-hub?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/integration-hub?error=missing_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/hubspot`,
        code,
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

    // Get account information
    const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let accountInfo = null;
    if (accountResponse.ok) {
      const account = await accountResponse.json();
      accountInfo = {
        portal_id: account.portalId,
        account_name: account.accountName || 'HubSpot Account',
        currency: account.currencyCode || 'USD',
        time_zone: account.timeZone || 'UTC',
        subscription: account.subscriptionType || 'Unknown',
        hub_domain: account.hubDomain,
      };
    }

    // Save tokens to Supabase
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        platform: 'hubspot_crm',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
          null,
        scope: tokenData.scope || 'contacts content reports',
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
        provider: 'hubspot_crm',
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
      platform: 'hubspot_crm',
      details: {
        account_info: accountInfo,
        connected_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/integration-hub?success=hubspot_connected', request.url));

  } catch (error: any) {
    console.error('HubSpot OAuth callback error:', error);
    return NextResponse.redirect(new URL(`/integration-hub?error=connection_failed&details=${encodeURIComponent(error.message)}`, request.url));
  }
}