// app/api/auth/callback/google/route.ts
// This route will handle the OAuth callback from Google.

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabase, tokenService } from '@/lib/supabase-campaign-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

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

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Store tokens securely in Supabase
    await tokenService.storeToken('google', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope,
    })

    console.log('Google tokens stored for user:', userId)

    // Trigger initial data sync from Google Ads/Analytics using these tokens
    await googleAdsAnalyticsService.syncGoogleData(userId)

    return NextResponse.redirect(new URL('/IntegrationHub?status=success', request.url))
  } catch (error: any) {
    console.error('Error during Google OAuth callback:', error)
    return NextResponse.redirect(
      new URL(`/IntegrationHub?status=error&message=${error.message || 'token_exchange_failed'}`, request.url),
    )
  }
}

