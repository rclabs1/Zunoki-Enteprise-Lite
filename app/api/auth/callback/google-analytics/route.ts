import { NextRequest, NextResponse } from 'next/server';
import { platformConnectionService } from '@/lib/services/platform-connection-service';
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { createClient } from '@supabase/supabase-js';
import { encryptTokenData, validateEncryptionConfig } from '@/lib/utils/token-encryption';
import { SecurityLogger } from '@/lib/utils/security-logger';

// Rate limiting map - in production, use Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting: max 5 OAuth callbacks per IP per 10 minutes
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  // Reset if window has passed
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  current.count++;
  rateLimitMap.set(ip, current);
  
  return current.count <= RATE_LIMIT_MAX;
}

function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': 'default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\';'
  };
}

/**
 * Google Analytics 4 OAuth Callback Handler
 * Handles OAuth redirect from Google Analytics and stores tokens
 * Pattern mirrors Google Ads OAuth callback implementation exactly
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Security: Rate limiting check
    if (!checkRateLimit(clientIp)) {
      console.warn(`🚨 GA4: Rate limit exceeded for IP: ${clientIp}`);
      await SecurityLogger.logRateLimitHit(clientIp, '/api/auth/callback/google-analytics', {
        user_agent: request.headers.get('user-agent') || 'unknown',
        referer: request.headers.get('referer') || 'none'
      });
      
      return NextResponse.json(
        { error: 'Too many OAuth attempts. Please try again later.' },
        { 
          status: 429,
          headers: getSecurityHeaders()
        }
      );
    }

    // Validate encryption configuration on startup
    if (!validateEncryptionConfig()) {
      console.warn('⚠️  GA4: Encryption config validation failed, continuing with fallback');
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    // Security: Input validation
    if (state && !/^[a-zA-Z0-9_-]{20,50}$/.test(state)) {
      console.error('❌ GA4: Invalid state parameter format');
      await SecurityLogger.logSuspiciousRequest(clientIp, request.headers.get('user-agent') || 'unknown', {
        invalid_state: state,
        endpoint: '/api/auth/callback/google-analytics',
        reason: 'Invalid state parameter format'
      });
      
      return NextResponse.redirect(
        new URL('/shell?module=ad-hub&error=ga4_invalid_state', process.env.NEXT_PUBLIC_APP_URL!),
        { headers: getSecurityHeaders() }
      );
    }

    console.log('🔐 GA4 OAuth Callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error, 
      userId: state,
      ip: clientIp
    });

    // Handle OAuth errors
    if (error) {
      console.error('❌ GA4 OAuth Error:', error);
      await SecurityLogger.logOAuthFailure(state, 'google_analytics', clientIp, error, {
        oauth_error: error,
        user_agent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      });
      
      return NextResponse.redirect(
        new URL(`/shell?module=ad-hub&error=ga4_oauth_${error}`, process.env.NEXT_PUBLIC_APP_URL!),
        { headers: getSecurityHeaders() }
      );
    }

    if (!code || !state) {
      console.error('❌ GA4 OAuth: Missing required parameters', { code: !!code, state: !!state });
      await SecurityLogger.logOAuthFailure(null, 'google_analytics', clientIp, 'missing_parameters', {
        has_code: !!code,
        has_state: !!state,
        user_agent: request.headers.get('user-agent')
      });
      
      return NextResponse.redirect(
        new URL('/shell?module=ad-hub&error=ga4_missing_parameters', process.env.NEXT_PUBLIC_APP_URL!),
        { headers: getSecurityHeaders() }
      );
    }

    const userId = state;

    // Create user identity object for compatibility with existing code
    const userIdentity = {
      firebaseUid: userId,
      supabaseUserId: userId,
    };

    // Exchange authorization code for tokens
    console.log('🔄 GA4: Exchanging auth code for tokens...');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google-analytics`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ GA4 Token Exchange Failed:', errorData);
      return NextResponse.redirect(
        new URL('/modules/ad-hub?error=ga4_token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('✅ GA4 Tokens received:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in 
    });

    // Get Google account info for "Connected as:" display
    console.log('👤 GA4: Fetching Google account information...');
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

    // Get user's GA4 accounts to verify connection
    console.log('🔍 GA4: Fetching Analytics accounts...');
    const accountsResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1alpha/accounts',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      }
    );

    let accountInfo = {};
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      accountInfo = {
        accounts: accountsData.accounts?.slice(0, 5).map((account: any) => ({
          name: account.name,
          displayName: account.displayName,
          createTime: account.createTime,
        })) || [],
        totalAccounts: accountsData.accounts?.length || 0,
      };
      console.log('✅ GA4 Account info fetched:', { 
        accountsCount: accountsData.accounts?.length || 0 
      });
    } else {
      console.warn('⚠️ GA4 Account fetch failed, but continuing with connection');
    }

    // Store tokens in Supabase with enhanced account information
    console.log('💾 GA4: Storing OAuth tokens with account info in Supabase...');
    
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      scope: tokens.scope || 'https://www.googleapis.com/auth/analytics.readonly',
      token_type: tokens.token_type || 'Bearer',
      
      // Enhanced: Google account info for "Connected as:" UI
      google_account: {
        email: googleUserInfo.email || 'Unknown Account',
        name: googleUserInfo.name || 'Connected Account',
        picture: googleUserInfo.picture || null,
        verified_email: googleUserInfo.verified_email || false
      },
      
      // Enhanced: Connection metadata for UI status
      connection_metadata: {
        data_count: accountInfo.totalAccounts || 0,
        status: (accountInfo.totalAccounts || 0) > 0 ? 'active' : 'no_access',
        last_verified_at: new Date().toISOString(),
        analytics_accounts: accountInfo.accounts || [],
        connected_via: 'oauth_flow'
      },
      
      // Legacy compatibility
      account_info: accountInfo,
      connected_at: new Date().toISOString(),
    };

    // Encrypt sensitive token data before storage
    console.log('🔐 GA4: Encrypting token data for secure storage...');
    const encryptedTokenData = await encryptTokenData(tokenData);
    
    // Log token encryption success
    await SecurityLogger.logTokenAccess(userIdentity.firebaseUid, 'google_analytics', 'encrypt', true, {
      token_fields: Object.keys(tokenData),
      google_account_email: tokenData.google_account?.email
    });

    // Use Service Role client for secure token storage (bypasses RLS)
    // This matches the Google Ads integration pattern for security
    console.log('🔒 GA4: Using Service Role client for secure token storage...');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store in user_tokens table with encrypted data (same as Google Ads pattern)
    const { error: tokenError } = await adminClient
      .from('user_tokens')
      .upsert({
        user_id: userIdentity.firebaseUid,
        platform: 'google_analytics',
        token_data: encryptedTokenData, // Store encrypted data
        expires_at: tokenData.expires_at,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (tokenError) {
      console.error('❌ GA4: Failed to store tokens:', tokenError);
      return NextResponse.redirect(
        new URL('/modules/ad-hub?error=ga4_token_storage_failed', request.url)
      );
    }
    
    console.log('✅ GA4: OAuth tokens stored securely with Service Role client');

    // Track user activity (same as Google Ads pattern)
    try {
      await supabaseMultiUserService.trackActivity('oauth_connected', {
        platform: 'google_analytics',
        timestamp: new Date().toISOString(),
        accounts: accountInfo.totalAccounts || 0,
        user_id: userIdentity.firebaseUid // Pass Firebase UID in details since getCurrentUser() doesn't work
      }, 'google_analytics');
      console.log('✅ GA4: Activity tracked successfully');
    } catch (activityError) {
      console.error('⚠️ GA4: Failed to track activity:', {
        error: activityError,
        message: activityError instanceof Error ? activityError.message : 'Unknown error',
        stack: activityError instanceof Error ? activityError.stack : undefined,
        userId: userIdentity.firebaseUid,
        platform: 'google_analytics'
      });
      // Don't fail the OAuth flow for activity tracking errors
    }

    // Clear any cached connection data
    platformConnectionService.clearUserCache(userIdentity.firebaseUid);

    // Log successful OAuth completion
    await SecurityLogger.logOAuthSuccess(userIdentity.firebaseUid, 'google_analytics', clientIp, {
      duration_ms: Date.now() - startTime,
      google_account_email: tokenData.google_account?.email,
      analytics_accounts_count: tokenData.connection_metadata?.data_count || 0,
      user_agent: request.headers.get('user-agent')
    });

    console.log('🎉 GA4 OAuth Integration Successful!', {
      userId: userIdentity.firebaseUid,
      duration: Date.now() - startTime,
      ip: clientIp
    });
    
    // Redirect back to Ad Hub with success message (same as Google Ads)
    return NextResponse.redirect(
      new URL('/shell?module=ad-hub&success=google_analytics_connected', process.env.NEXT_PUBLIC_APP_URL!),
      { headers: getSecurityHeaders() }
    );

  } catch (error) {
    // Log critical error
    await SecurityLogger.logOAuthFailure(state, 'google_analytics', clientIp, 'callback_exception', {
      error_message: error.message,
      error_stack: error.stack,
      duration_ms: Date.now() - startTime,
      user_agent: request.headers.get('user-agent')
    });

    console.error('❌ GA4 OAuth Callback Error:', {
      error: error.message,
      userId: state,
      duration: Date.now() - startTime,
      ip: clientIp
    });
    
    return NextResponse.redirect(
      new URL('/shell?module=ad-hub&error=ga4_callback_failed', process.env.NEXT_PUBLIC_APP_URL!),
      { headers: getSecurityHeaders() }
    );
  }
}

/**
 * Handle preflight OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}