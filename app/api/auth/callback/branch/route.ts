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
      console.error('Branch OAuth error:', error);
      return NextResponse.redirect(new URL('/integration-hub?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/integration-hub?error=missing_code', request.url));
    }

    // Exchange code for access token (Branch OAuth flow)
    const tokenResponse = await fetch('https://api2.branch.io/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.BRANCH_CLIENT_ID!,
        client_secret: process.env.BRANCH_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/branch`,
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

    // Get app information
    let accountInfo = null;
    if (tokenData.app_id) {
      try {
        const appResponse = await fetch(`https://api2.branch.io/v1/app/${tokenData.app_id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (appResponse.ok) {
          const appData = await appResponse.json();
          accountInfo = {
            app_id: tokenData.app_id,
            app_name: appData.name || 'Branch App',
            creation_date: appData.creation_date,
            dev_name: appData.dev_name,
            dev_email: appData.dev_email,
            platform_type: appData.type || 'mobile',
          };
        }
      } catch (error) {
        console.warn('Could not fetch Branch app details:', error);
      }
    }

    // Save tokens to Supabase
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: userId,
        platform: 'branch',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
          null,
        scope: tokenData.scope || 'read export',
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
        provider: 'branch',
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
      platform: 'branch',
      details: {
        account_info: accountInfo,
        connected_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/integration-hub?success=branch_connected', request.url));

  } catch (error: any) {
    console.error('Branch OAuth callback error:', error);
    return NextResponse.redirect(new URL(`/integration-hub?error=connection_failed&details=${encodeURIComponent(error.message)}`, request.url));
  }
}