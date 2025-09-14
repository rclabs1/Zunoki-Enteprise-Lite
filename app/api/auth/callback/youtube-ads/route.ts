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
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=missing_code', process.env.NEXT_PUBLIC_APP_URL!));
    }

    // Get user ID from state parameter (passed from OAuth initiation)
    const userId = state?.split('user_id=')[1]?.split('&')[0];
    if (!userId) {
      console.error('Missing user ID in OAuth state parameter');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=missing_user_id', process.env.NEXT_PUBLIC_APP_URL!));
    }

    console.log('Processing YouTube Ads OAuth callback for user:', userId);

    // Create user identity object for compatibility with existing code
    const userIdentity = {
      firebaseUid: userId,
      supabaseUserId: userId,
      email: `user_${userId}@temp.com` // Temporary email for compatibility
    };

    // Exchange OAuth code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/youtube-ads`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get Google account info for "Connected as:" display
    console.log('🎥 YouTube Ads: Fetching Google account information...');
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      }
    );

    let googleUserInfo = {};
    if (userInfoResponse.ok) {
      googleUserInfo = await userInfoResponse.json();
      console.log('✅ Google user info fetched:', { 
        email: googleUserInfo.email, 
        name: googleUserInfo.name 
      });
    }

    // Get YouTube channel info and Google Ads accounts
    console.log('🎥 YouTube Ads: Fetching YouTube channels and ads accounts...');
    let accountInfo = { totalChannels: 0, channels: [], adsAccounts: [] };
    
    try {
      // Get YouTube channels
      const channelsResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      let channelsData = {};
      if (channelsResponse.ok) {
        channelsData = await channelsResponse.json();
        console.log('✅ YouTube channels fetched:', channelsData);
      }

      // Get Google Ads accounts (for YouTube advertising)
      const adsResponse = await fetch('https://googleads.googleapis.com/v21/customers:listAccessibleCustomers', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'Content-Type': 'application/json',
        },
      });

      let adsData = {};
      if (adsResponse.ok) {
        adsData = await adsResponse.json();
        console.log('✅ Google Ads accounts fetched:', adsData);
      }
      
      accountInfo = {
        totalChannels: channelsData.items?.length || 0,
        channels: channelsData.items || [],
        adsAccounts: adsData.resourceNames || []
      };
    } catch (apiError) {
      console.warn('⚠️ YouTube/Ads API error:', apiError);
      // Continue with connection even if account fetch fails
    }

    // Store tokens in user_tokens table (same as Google Ads pattern)
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const expiryTime = tokens.expires_in ?
        new Date(Date.now() + (tokens.expires_in * 1000)).toISOString() :
        null;

      const { error } = await supabaseClient
        .from('user_tokens')
        .upsert({
          user_id: userIdentity.firebaseUid,
          platform: 'youtube_ads',
          token_data: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiryTime,
            scope: tokens.scope,
            
            // Enhanced: Google account info for "Connected as:" UI
            google_account: {
              email: googleUserInfo.email || 'Unknown Account',
              name: googleUserInfo.name || 'Connected Account',
              picture: googleUserInfo.picture || null,
              verified_email: googleUserInfo.verified_email || false
            },
            
            // Enhanced: Connection metadata for UI status
            connection_metadata: {
              data_count: (accountInfo.totalChannels || 0) + (accountInfo.adsAccounts?.length || 0),
              status: ((accountInfo.totalChannels || 0) > 0 || (accountInfo.adsAccounts?.length || 0) > 0) ? 'active' : 'no_access',
              last_verified_at: new Date().toISOString(),
              youtube_channels: accountInfo.channels || [],
              ads_accounts: accountInfo.adsAccounts || [],
              connected_via: 'oauth_flow'
            },
            
            // Legacy compatibility
            account_info: accountInfo,
          },
          expires_at: expiryTime,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;
      console.log('OAuth tokens stored successfully for user:', userIdentity.firebaseUid, 'platform:', 'youtube_ads');
    } catch (storeError) {
      console.error('Failed to store tokens:', {
        error: storeError,
        message: storeError instanceof Error ? storeError.message : 'Unknown error',
        userId: userIdentity.firebaseUid,
        platform: 'youtube_ads'
      });
      throw storeError;
    }

    // Track user activity (same pattern as Google Ads and Google Analytics)
    try {
      await supabaseMultiUserService.trackActivity('oauth_connected', {
        platform: 'youtube_ads',
        timestamp: new Date().toISOString(),
        accounts: (accountInfo.totalChannels || 0) + (accountInfo.adsAccounts?.length || 0),
        user_id: userIdentity.firebaseUid // Pass Firebase UID in details since getCurrentUser() doesn't work
      }, 'youtube_ads');
      console.log('✅ YouTube Ads: Activity tracked successfully');
    } catch (activityError) {
      console.error('⚠️ YouTube Ads: Failed to track activity:', {
        error: activityError,
        message: activityError instanceof Error ? activityError.message : 'Unknown error',
        stack: activityError instanceof Error ? activityError.stack : undefined,
        userId: userIdentity.firebaseUid,
        platform: 'youtube_ads'
      });
      // Don't fail the OAuth flow for activity tracking errors
    }

    // Check if this was initiated from setup page
    const isSetupFlow = state?.includes('source=setup');
    
    if (isSetupFlow) {
      // Redirect back to setup page with success
      return NextResponse.redirect(new URL('/onboarding/setup?success=youtube_ads_connected', process.env.NEXT_PUBLIC_APP_URL!));
    } else {
      // Redirect back to Ad Hub with success (existing behavior)
      return NextResponse.redirect(new URL('/shell?module=ad-hub&success=youtube_ads_connected', process.env.NEXT_PUBLIC_APP_URL!));
    }

  } catch (error) {
    console.error('YouTube Ads OAuth callback error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    const errorUrl = '/shell?module=ad-hub&error=oauth_callback_failed';
    return NextResponse.redirect(new URL(errorUrl, process.env.NEXT_PUBLIC_APP_URL!));
  }
}