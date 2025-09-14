import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters (passed from frontend)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('Missing userId parameter');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=user_id_missing', request.url));
    }

    console.log('Starting YouTube OAuth flow for user:', userId);

    // Get environment variables
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/youtube`;

    if (!clientId) {
      console.error('YOUTUBE_CLIENT_ID or GOOGLE_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_not_configured', request.url));
    }

    // Generate OAuth URL
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly');
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('state', `user_id=${userId}`);

    console.log('Redirecting to YouTube OAuth:', oauthUrl.toString());

    // Redirect to Google OAuth
    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error('YouTube OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_init_failed', request.url));
  }
}