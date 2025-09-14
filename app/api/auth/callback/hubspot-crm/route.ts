import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { tripleAuthBridge } from '@/lib/services/triple-auth-bridge';
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/integration-hub?error=missing_code', request.url));
    }

    // Get NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login?error=no_session', request.url));
    }

    // Resolve triple authentication
    const userIdentity = await tripleAuthBridge.resolveUserIdentity(session.user.email);

    // Exchange OAuth code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/hubspot-crm`,
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get account info
    const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const accountInfo = await accountResponse.json();

    // Store tokens with Firebase UID
    await supabaseMultiUserService.storeTokens(userIdentity.firebaseUid, 'hubspot_crm', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
      scope: tokens.scope,
      account_info: accountInfo,
    });

    // Track user activity
    await supabaseMultiUserService.trackActivity('oauth_connected', {
      platform: 'hubspot_crm',
      timestamp: new Date().toISOString(),
      portal_id: accountInfo.portalId,
    });

    return NextResponse.redirect(new URL('/dashboard?success=hubspot_crm_connected', request.url));

  } catch (error) {
    console.error('HubSpot CRM OAuth callback error:', error);
    return NextResponse.redirect(new URL('/integration-hub?error=oauth_failed', request.url));
  }
}