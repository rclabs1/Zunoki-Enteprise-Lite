import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Production-grade circuit breaker for Firebase Admin
class FirebaseCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 5;
  private readonly resetTimeout = 60000; // 1 minute

  isOpen(): boolean {
    if (this.failures >= this.maxFailures) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

const firebaseCircuitBreaker = new FirebaseCircuitBreaker();

// Initialize Firebase Admin SDK with better error handling and performance
function initializeFirebaseAdmin() {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Validate required environment variables
    const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
    }

    // Handle private key with better parsing
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is required');
    }
    
    // Fix common private key formatting issues
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      // If it's base64 encoded, decode it
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch (decodeError) {
        // If decode fails, try direct newline replacement
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
    } else {
      // Already formatted, just fix escaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Initialize with service account
    const adminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    };

    console.log('🔥 Initializing Firebase Admin SDK...');
    const app = initializeApp(adminConfig);
    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw new Error(`Firebase Admin initialization failed: ${error.message}`);
  }
}

// Singleton instances for performance
let cachedAdminApp: any = null;
let cachedAdminAuth: any = null;

// Get Firebase Admin app (singleton pattern)
function getFirebaseAdminApp() {
  if (!cachedAdminApp) {
    cachedAdminApp = initializeFirebaseAdmin();
  }
  return cachedAdminApp;
}

// Get Firebase Admin auth (singleton pattern)
function getFirebaseAdminAuth() {
  if (!cachedAdminAuth) {
    cachedAdminAuth = getAuth(getFirebaseAdminApp());
  }
  return cachedAdminAuth;
}

// Initialize the admin app
const adminApp = getFirebaseAdminApp();

// Export admin auth instance
export const adminAuth = getFirebaseAdminAuth();

// Production-grade token verification with circuit breaker protection
export async function verifyFirebaseToken(idToken: string) {
  const startTime = Date.now();
  
  try {
    // Input validation for production safety
    if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid token format',
        duration: Date.now() - startTime
      };
    }

    // Circuit breaker protection - fail fast if Firebase is down
    if (firebaseCircuitBreaker.isOpen()) {
      console.warn('🚨 Firebase circuit breaker is OPEN - failing fast to protect user experience');
      return {
        success: false,
        error: 'Authentication service temporarily unavailable, please try again',
        duration: Date.now() - startTime,
        circuitOpen: true
      };
    }

    // Use singleton auth instance for optimal performance
    const auth = getFirebaseAdminAuth();
    
    // Verify token with aggressive timeout for user experience
    const verifyPromise = auth.verifyIdToken(idToken, true); // checkRevoked = true for security
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Token verification timeout')), 5000) // 5s max for production
    );
    
    const decodedToken = await Promise.race([verifyPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    
    // Record success for circuit breaker
    firebaseCircuitBreaker.recordSuccess();
    
    // Performance monitoring for production optimization
    if (duration > 2000) {
      console.warn(`⚠️ Slow Firebase token verification: ${duration}ms`);
    }
    
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      user: decodedToken,
      duration
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Record failure for circuit breaker
    firebaseCircuitBreaker.recordFailure();
    
    // Production-safe error logging
    console.error('Error verifying Firebase token:', {
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      circuitBreakerFailures: firebaseCircuitBreaker['failures']
    });
    
    // Return user-friendly error based on error type
    let userError = 'Authentication failed';
    
    if (error.code === 'auth/id-token-expired') {
      userError = 'Token expired, please sign in again';
    } else if (error.code === 'auth/id-token-revoked') {
      userError = 'Access revoked, please sign in again';
    } else if (error.message?.includes('timeout')) {
      userError = 'Authentication timeout, please try again';
    } else if (error.code?.includes('invalid')) {
      userError = 'Invalid or expired token';
    } else if (duration > 10000) {
      userError = 'Authentication service slow, please try again';
    }
    
    return {
      success: false,
      error: userError,
      duration,
      code: error.code
    };
  }
}

// Helper function to get user by UID
export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return {
      success: true,
      user: userRecord,
    };
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return {
      success: false,
      error: 'User not found',
    };
  }
}

export default adminApp;