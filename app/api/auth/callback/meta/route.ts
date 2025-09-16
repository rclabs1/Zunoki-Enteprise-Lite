// app/api/auth/callback/meta/route.ts
// This route will handle the OAuth callback from Meta (Facebook/Instagram).

import { NextResponse } from 'next/server'
import axios from 'axios'
import { supabase, tokenService } from '@/lib/supabase-campaign-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/IntegrationHub?status=error&message=no_code', request.url))
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      throw new Error("User not authenticated")
    }
    const userId = session.user.id

    // Exchange authorization code for access token
    const { data } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    })

    const accessToken = data.access_token
    const expiresIn = data.expires_in // Access token expiration time in seconds

    // Exchange short-lived token for long-lived token (recommended for server-side)
    const { data: longLivedTokenData } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: accessToken,
      },
    })

    const longLivedAccessToken = longLivedTokenData.access_token
    const longLivedExpiresIn = longLivedTokenData.expires_in

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + longLivedExpiresIn * 1000).toISOString()

    // Store tokens securely in Supabase
    await tokenService.storeToken('meta', {
      access_token: longLivedAccessToken,
      // Meta generally doesn't provide a refresh token in the same way Google does for long-lived tokens.
      // The long-lived token itself is designed to last much longer (e.g., 60 days) and can be refreshed programmatically.
      refresh_token: null, // Or store a mechanism to refresh if available
      expires_at: expiresAt,
      scope: url.searchParams.get('scope'), // Store the scopes granted
    })

    console.log('Meta tokens stored for user:', userId)

    // Trigger initial data sync from Meta Ads API using this token
    await metaAdsAnalyticsService.syncMetaData(userId)

    return NextResponse.redirect(new URL('/IntegrationHub?status=success', request.url))
  } catch (error: any) {
    console.error('Error during Meta OAuth callback:', error.response?.data || error.message)
    return NextResponse.redirect(
      new URL(`/IntegrationHub?status=error&message=${error.response?.data?.error?.message || error.message || 'token_exchange_failed'}`, request.url),
    )
  }
}
