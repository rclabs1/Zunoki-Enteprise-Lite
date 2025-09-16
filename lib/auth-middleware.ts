import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken as verifyToken } from './firebase-admin';

// Re-export for backwards compatibility
export { verifyFirebaseToken } from './firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
  error?: string;
}

/**
 * Middleware to authenticate Firebase tokens in API routes
 */
export async function authenticateFirebaseUser(request: NextRequest): Promise<AuthResult> {
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

    // Verify the token with Firebase Admin
    const verificationResult = await verifyToken(idToken);
    
    if (!verificationResult.success) {
      return {
        success: false,
        error: verificationResult.error,
      };
    }

    return {
      success: true,
      user: {
        uid: verificationResult.uid!,
        email: verificationResult.email!,
        emailVerified: verificationResult.emailVerified!,
      },
    };
  } catch (error) {
    console.error('Firebase authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Helper function for API routes that need Firebase authentication
 */
export async function withFirebaseAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthResult['user']) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticateFirebaseUser(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        message: authResult.error 
      },
      { status: 401 }
    );
  }
  
  return handler(request, authResult.user!);
}