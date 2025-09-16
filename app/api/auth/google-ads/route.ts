import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user ID and source from query parameters (passed from frontend)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const source = searchParams.get('source'); // 'setup' or null
    
    if (!userId) {
      console.error('Missing userId parameter');
      const errorUrl = source === 'setup' 
        ? '/onboarding/setup?error=user_id_missing'
        : '/shell?module=ad-hub&error=user_id_missing';
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    console.log('Starting Google Ads OAuth flow for user:', userId);

    // Get environment variables
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google-ads`;

    if (!clientId) {
      console.error('GOOGLE_ADS_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_not_configured', request.url));
    }

    // Generate OAuth URL
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords');
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    // Include source in state parameter for callback handling
    const stateParam = source === 'setup' 
      ? `user_id=${userId}&source=setup`
      : `user_id=${userId}`;
    oauthUrl.searchParams.set('state', stateParam);

    console.log('Redirecting to Google Ads OAuth:', oauthUrl.toString());

    // Redirect to Google OAuth
    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error('Google Ads OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_init_failed', request.url));
  }
}