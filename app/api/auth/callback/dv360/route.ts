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

    // Exchange OAuth code for tokens (DV360 uses Google OAuth)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DV360_CLIENT_ID!,
        client_secret: process.env.DV360_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/dv360`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get account info (DV360 partners)
    const accountResponse = await fetch('https://displayvideo.googleapis.com/v2/partners', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const accountInfo = await accountResponse.json();

    // Store tokens with Firebase UID
    await supabaseMultiUserService.storeTokens(userIdentity.firebaseUid, 'dv360', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
      scope: tokens.scope,
      account_info: accountInfo,
    });

    // Track user activity
    await supabaseMultiUserService.trackActivity('oauth_connected', {
      platform: 'dv360',
      timestamp: new Date().toISOString(),
      partners: accountInfo.partners?.length || 0,
    });

    return NextResponse.redirect(new URL('/dashboard?success=dv360_connected', request.url));

  } catch (error) {
    console.error('DV360 OAuth callback error:', error);
    return NextResponse.redirect(new URL('/integration-hub?error=oauth_failed', request.url));
  }
}