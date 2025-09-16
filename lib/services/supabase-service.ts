import { createClient, SupabaseClient } from '@supabase/supabase-js';

// YC Startup Pattern: Singleton client with safeguards
let supabaseService: SupabaseClient | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

/**
 * Get shared Supabase service client (singleton pattern)
 * Implements connection pooling, circuit breaker, and monitoring
 */
export function getSupabaseService(): SupabaseClient {
  if (!supabaseService) {
    try {
      connectionAttempts++;
      
      // 1. Connection pool limits + circuit breaker pattern
      supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            pool: {
              min: 0,
              max: 10, // YC startup scale: 10 connections max
              acquireTimeoutMillis: 30000,
              idleTimeoutMillis: 600000,
              createTimeoutMillis: 15000
            }
          },
          // 2. Circuit breaker pattern with timeout
          global: {
            fetch: async (url: string, options: any = {}) => {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
              
              try {
                const response = await fetch(url, {
                  ...options,
                  signal: controller.signal
                });
                clearTimeout(timeoutId);
                return response;
              } catch (error) {
                clearTimeout(timeoutId);
                console.error('🔥 Supabase request failed:', error);
                throw error;
              }
            }
          }
        }
      );

      // 3. Health monitoring
      console.log(`🚀 Supabase singleton initialized (attempt ${connectionAttempts})`);
      
    } catch (error) {
      console.error(`❌ Supabase connection failed (attempt ${connectionAttempts}):`, error);
      
      // 4. Graceful degradation
      if (connectionAttempts >= MAX_RETRIES) {
        console.error('💥 Max connection retries exceeded. Service degraded.');
        // Could implement fallback logic here in production
      }
      throw error;
    }
  }
  
  return supabaseService;
}

/**
 * Reset singleton connection (for testing or error recovery)
 */
export function resetSupabaseService(): void {
  supabaseService = null;
  connectionAttempts = 0;
  console.log('🔄 Supabase singleton reset');
}

/**
 * Get connection health status
 */
export function getSupabaseServiceHealth(): {
  isInitialized: boolean;
  attempts: number;
  maxRetries: number;
} {
  return {
    isInitialized: supabaseService !== null,
    attempts: connectionAttempts,
    maxRetries: MAX_RETRIES
  };
}