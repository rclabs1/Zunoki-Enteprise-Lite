/**
 * Edge Runtime Compatible Authentication
 * For use in middleware where Firebase Admin SDK is not available
 */

import { NextRequest } from 'next/server';

export interface EdgeAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
  error?: string;
}

/**
 * Extract and validate Firebase token without Firebase Admin SDK
 * This is a lightweight version for Edge Runtime
 */
export async function validateFirebaseTokenEdge(request: NextRequest): Promise<EdgeAuthResult> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
      };
    }

    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return {
        success: false,
        error: 'No token provided',
      };
    }

    // Basic JWT structure validation (without verification for Edge Runtime)
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      return {
        success: false,
        error: 'Invalid token format',
      };
    }

    try {
      // Decode payload (without verification - this is Edge Runtime compatible)
      const payload = JSON.parse(atob(tokenParts[1]));

      // Basic validation
      if (!payload.aud || !payload.iss || !payload.sub) {
        return {
          success: false,
          error: 'Invalid token payload',
        };
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return {
          success: false,
          error: 'Token expired',
        };
      }

      // For Edge Runtime, we do basic validation
      // Full verification happens in API routes with Firebase Admin
      return {
        success: true,
        user: {
          uid: payload.sub,
          email: payload.email || '',
          emailVerified: payload.email_verified || false,
        },
      };

    } catch (decodeError) {
      return {
        success: false,
        error: 'Failed to decode token',
      };
    }

  } catch (error) {
    console.error('Edge auth error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Extract tenant info from different sources (Edge Runtime compatible)
 */
export function getTenantFromRequestEdge(request: NextRequest): {
  method: 'header' | 'subdomain' | 'query' | 'none';
  identifier: string | null;
} {
  // Check headers first
  const headerOrgId = request.headers.get('X-Organization-ID');
  if (headerOrgId) {
    return { method: 'header', identifier: headerOrgId };
  }

  const headerSlug = request.headers.get('X-Organization-Slug');
  if (headerSlug) {
    return { method: 'header', identifier: headerSlug };
  }

  // Check subdomain
  const host = request.headers.get('host');
  if (host) {
    // Skip localhost and IPs completely
    if (host.startsWith('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/)) {
      // Skip subdomain detection for localhost/IPs
    } else {
      const subdomain = host.split('.')[0];
      if (!['www', 'app', 'api', 'admin'].includes(subdomain)) {
        return { method: 'subdomain', identifier: subdomain };
      }
    }
  }

  // Check query
  const url = new URL(request.url);
  const queryOrg = url.searchParams.get('org');
  if (queryOrg) {
    return { method: 'query', identifier: queryOrg };
  }

  return { method: 'none', identifier: null };
}