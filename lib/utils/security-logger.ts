/**
 * Security Audit Logging Utility
 * Logs security-related events for monitoring and compliance
 */

import { createClient } from '@supabase/supabase-js';

export interface SecurityEvent {
  event_type: 'oauth_callback' | 'token_encryption' | 'rate_limit_hit' | 'invalid_request' | 'token_access' | 'admin_action';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  platform?: string;
  details?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
}

export class SecurityLogger {
  private static adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Log a security event to the database
   * Uses Service Role client to bypass RLS
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = {
        ...event,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        // Sanitize sensitive data from details
        details: event.details ? this.sanitizeDetails(event.details) : null,
      };

      const { error } = await this.adminClient
        .from('security_audit_log')
        .insert(logEntry);

      if (error) {
        console.error('❌ Failed to log security event:', error);
        // Fallback to console logging if DB fails
        console.warn('🔐 Security Event (DB failed):', JSON.stringify(logEntry, null, 2));
      }
    } catch (error) {
      console.error('❌ Security logging error:', error);
      // Always log to console as fallback
      console.warn('🔐 Security Event (exception):', JSON.stringify(event, null, 2));
    }
  }

  /**
   * Log successful OAuth callback
   */
  static async logOAuthSuccess(userId: string, platform: string, ip: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'oauth_callback',
      user_id: userId,
      ip_address: ip,
      platform,
      details,
      risk_level: 'low',
      success: true,
    });
  }

  /**
   * Log failed OAuth attempt
   */
  static async logOAuthFailure(userId: string | null, platform: string, ip: string, error: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'oauth_callback',
      user_id: userId || undefined,
      ip_address: ip,
      platform,
      details: { ...details, error },
      risk_level: 'medium',
      success: false,
    });
  }

  /**
   * Log rate limiting hit
   */
  static async logRateLimitHit(ip: string, endpoint: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'rate_limit_hit',
      ip_address: ip,
      details: { ...details, endpoint },
      risk_level: 'medium',
      success: false,
    });
  }

  /**
   * Log token encryption/decryption events
   */
  static async logTokenAccess(userId: string, platform: string, operation: 'encrypt' | 'decrypt', success: boolean, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'token_encryption',
      user_id: userId,
      platform,
      details: { ...details, operation },
      risk_level: success ? 'low' : 'high',
      success,
    });
  }

  /**
   * Log invalid or suspicious requests
   */
  static async logSuspiciousRequest(ip: string, userAgent: string, details: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'invalid_request',
      ip_address: ip,
      user_agent: userAgent,
      details,
      risk_level: 'high',
      success: false,
    });
  }

  /**
   * Log admin actions using Service Role
   */
  static async logAdminAction(action: string, userId?: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'admin_action',
      user_id: userId,
      details: { ...details, action },
      risk_level: 'medium',
      success: true,
    });
  }

  /**
   * Sanitize sensitive data from log details
   * Remove tokens, passwords, and other sensitive information
   */
  private static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive keys
    const sensitiveKeys = [
      'access_token', 'refresh_token', 'token', 'password', 'secret', 
      'client_secret', 'api_key', 'authorization', 'cookie'
    ];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Create security audit log table if it doesn't exist
   */
  static async ensureAuditTableExists(): Promise<void> {
    try {
      const { error } = await this.adminClient.rpc('create_security_audit_table_if_not_exists');
      if (error) {
        console.warn('⚠️  Could not ensure security audit table exists:', error.message);
      }
    } catch (error) {
      console.warn('⚠️  Could not check security audit table:', error);
    }
  }
}