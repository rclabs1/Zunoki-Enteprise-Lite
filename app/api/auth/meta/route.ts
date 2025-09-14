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

    console.log('Starting Meta Ads OAuth flow for user:', userId);

    // Get environment variables
    const clientId = process.env.META_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/meta`;

    if (!clientId) {
      console.error('META_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_not_configured', request.url));
    }

    // Generate OAuth URL
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'ads_read,pages_read_engagement,instagram_basic');
    oauthUrl.searchParams.set('state', `user_id=${userId}`);

    console.log('Redirecting to Meta OAuth:', oauthUrl.toString());

    // Redirect to Meta OAuth
    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error('Meta OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_init_failed', request.url));
  }
}