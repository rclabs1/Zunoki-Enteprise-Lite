import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Analytics 4 OAuth Initiation
 * Redirects user to Google OAuth for GA4 permissions
 * Pattern matches Google Ads OAuth implementation exactly
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters (passed from Ad Hub)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('❌ GA4 OAuth: Missing userId parameter');
      return NextResponse.redirect(new URL('/modules/ad-hub?error=user_id_missing', request.url));
    }

    console.log('🔐 Starting Google Analytics 4 OAuth flow for user:', userId);

    // Get environment variables
    const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google-analytics`;

    if (!clientId) {
      console.error('❌ GOOGLE_ANALYTICS_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/modules/ad-hub?error=ga4_oauth_not_configured', request.url));
    }

    // Generate Google Analytics OAuth URL
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/analytics.readonly');
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('state', userId); // Pass userId as state

    console.log('🚀 Redirecting to Google Analytics OAuth:', oauthUrl.toString());

    // Redirect to Google OAuth
    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error('❌ Google Analytics OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/modules/ad-hub?error=ga4_oauth_init_failed', request.url));
  }
}