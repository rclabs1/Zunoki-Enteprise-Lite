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

    console.log('Starting Branch OAuth flow for user:', userId);

    // Get environment variables
    const clientId = process.env.BRANCH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/branch`;

    if (!clientId) {
      console.error('BRANCH_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_not_configured', request.url));
    }

    // Generate OAuth URL
    const oauthUrl = new URL('https://dashboard.branch.io/oauth/authorize');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'read export');
    oauthUrl.searchParams.set('state', `user_id=${userId}`);

    console.log('Redirecting to Branch OAuth:', oauthUrl.toString());

    // Redirect to Branch OAuth
    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error('Branch OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/shell?module=ad-hub&error=oauth_init_failed', request.url));
  }
}