"use client"

import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns"

/**
 * Utility functions for Google Ads authentication system
 */

export interface AuthStatusConfig {
  color: string
  badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary'
  icon: string
  text: string
  label: string
  urgency: 'low' | 'medium' | 'high'
}

/**
 * Get configuration for auth status display
 */
export function getAuthStatusConfig(
  isConnected: boolean,
  status: 'connected' | 'expired' | 'not_connected',
  expiresAt: string | null
): AuthStatusConfig {
  if (!isConnected || status === 'not_connected') {
    return {
      color: 'bg-gray-400',
      badgeVariant: 'secondary',
      icon: '⚫',
      text: 'Disconnected',
      label: 'Not Connected',
      urgency: 'medium'
    }
  }

  if (status === 'expired' || (expiresAt && isTokenExpired(expiresAt))) {
    return {
      color: 'bg-red-500',
      badgeVariant: 'destructive',
      icon: '🔴',
      text: 'Expired',
      label: 'Connection Expired',
      urgency: 'high'
    }
  }

  if (expiresAt && isTokenExpiringSoon(expiresAt)) {
    const daysLeft = getDaysUntilExpiry(expiresAt)
    return {
      color: 'bg-yellow-500',
      badgeVariant: 'outline',
      icon: '🟡',
      text: 'Expiring',
      label: `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      urgency: 'medium'
    }
  }

  return {
    color: 'bg-green-500',
    badgeVariant: 'default',
    icon: '🟢',
    text: 'Connected',
    label: 'Connected & Syncing',
    urgency: 'low'
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  
  try {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    return isAfter(now, expirationDate)
  } catch {
    return true
  }
}

/**
 * Check if token is expiring soon
 */
export function isTokenExpiringSoon(expiresAt: string | null, daysThreshold: number = 7): boolean {
  if (!expiresAt) return false
  
  try {
    const expirationDate = new Date(expiresAt)
    const thresholdDate = addDays(new Date(), daysThreshold)
    return isBefore(expirationDate, thresholdDate) && !isTokenExpired(expiresAt)
  } catch {
    return false
  }
}

/**
 * Get days until token expiry
 */
export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  
  try {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const diffInDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diffInDays)
  } catch {
    return null
  }
}

/**
 * Format last sync date for display
 */
export function formatLastSync(lastSync: string | null): string | null {
  if (!lastSync) return null
  
  try {
    const syncDate = new Date(lastSync)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return format(syncDate, 'MMM d, yyyy')
  } catch {
    return lastSync
  }
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  
  try {
    const expirationDate = new Date(expiresAt)
    if (isTokenExpired(expiresAt)) {
      return `Expired ${formatDistanceToNow(expirationDate, { addSuffix: true })}`
    }
    return `Expires ${formatDistanceToNow(expirationDate, { addSuffix: true })}`
  } catch {
    return expiresAt
  }
}

/**
 * Get banner message based on status
 */
export function getBannerMessage(
  status: 'connected' | 'expired' | 'not_connected',
  lastSync: string | null,
  expiresAt: string | null
): { title: string; message: string; urgency: 'low' | 'medium' | 'high' } {
  const formattedLastSync = formatLastSync(lastSync)
  const daysUntilExpiry = getDaysUntilExpiry(expiresAt)

  if (status === 'expired' || (expiresAt && isTokenExpired(expiresAt))) {
    return {
      title: 'Google Ads connection expired',
      message: formattedLastSync 
        ? `Last synced: ${formattedLastSync}. Reconnect to see latest data and manage campaigns.`
        : 'Reconnect to see latest data and manage campaigns.',
      urgency: 'high'
    }
  }

  if (expiresAt && isTokenExpiringSoon(expiresAt) && daysUntilExpiry !== null) {
    return {
      title: `Google Ads connection expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
      message: 'Reconnect your account to avoid data sync interruptions.',
      urgency: 'medium'
    }
  }

  return {
    title: 'Google Ads connection needs attention',
    message: 'Please reconnect your account to continue syncing data.',
    urgency: 'medium'
  }
}

/**
 * Get modal configuration based on reason
 */
export function getModalConfig(
  reason: 'expired' | 'error' | 'manual',
  status: 'connected' | 'expired' | 'not_connected',
  lastSync: string | null,
  expiresAt: string | null
): {
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  icon: 'alert' | 'warning' | 'shield'
} {
  const formattedLastSync = formatLastSync(lastSync)
  const daysUntilExpiry = getDaysUntilExpiry(expiresAt)

  switch (reason) {
    case 'error':
      return {
        title: 'Google Ads Re-authentication Required',
        description: 'Your Google Ads connection has expired while trying to fetch data. Please reconnect to continue.',
        urgency: 'high',
        icon: 'alert'
      }
    
    case 'expired':
      return {
        title: 'Google Ads Connection Expired',
        description: formattedLastSync 
          ? `Your connection expired. Last successful sync: ${formattedLastSync}. Reconnect to resume data access.`
          : 'Your Google Ads connection has expired. Reconnect to resume data access.',
        urgency: 'high',
        icon: 'alert'
      }

    case 'manual':
    default:
      if (status === 'expired' || (expiresAt && isTokenExpired(expiresAt))) {
        return {
          title: 'Google Ads Connection Expired',
          description: 'Your connection has expired. Please reconnect to continue accessing your Google Ads data.',
          urgency: 'high',
          icon: 'alert'
        }
      } else {
        return {
          title: 'Reconnect Google Ads',
          description: daysUntilExpiry 
            ? `Your connection expires in ${daysUntilExpiry} days. Reconnect now to avoid interruption.`
            : 'Reconnect your Google Ads account to ensure continuous data access.',
          urgency: 'medium',
          icon: 'shield'
        }
      }
  }
}

/**
 * Check if banner should be dismissed based on time
 */
export function shouldKeepBannerDismissed(
  dismissedAt: string | null,
  status: 'connected' | 'expired' | 'not_connected'
): boolean {
  if (!dismissedAt) return false

  try {
    const dismissed = new Date(dismissedAt)
    const now = new Date()
    const daysSinceDismissal = (now.getTime() - dismissed.getTime()) / (1000 * 60 * 60 * 24)

    // If expired, show banner again after 1 day
    // If expiring, show banner again after 3 days
    const threshold = status === 'expired' ? 1 : 3
    return daysSinceDismissal < threshold
  } catch {
    return false
  }
}

/**
 * Validate auth status response from API
 */
export function validateAuthStatusResponse(data: any): boolean {
  if (!data || typeof data !== 'object') return false

  return (
    typeof data.connected === 'boolean' &&
    typeof data.platform === 'string' &&
    ['connected', 'expired', 'not_connected'].includes(data.status) &&
    typeof data.customerCount === 'number' &&
    Array.isArray(data.customerIds) &&
    (data.expiresAt === null || typeof data.expiresAt === 'string') &&
    (data.lastSync === null || typeof data.lastSync === 'string')
  )
}

/**
 * Sanitize auth status data
 */
export function sanitizeAuthStatus(data: any) {
  return {
    connected: Boolean(data?.connected),
    platform: 'google_ads',
    status: ['connected', 'expired', 'not_connected'].includes(data?.status) 
      ? data.status 
      : 'not_connected',
    customerCount: Math.max(0, Number(data?.customerCount) || 0),
    customerIds: Array.isArray(data?.customerIds) ? data.customerIds : [],
    expiresAt: data?.expiresAt || null,
    lastSync: data?.lastSync || null
  }
}

/**
 * Generate OAuth URL with proper parameters
 */
export function generateOAuthUrl(baseUrl: string, userId: string, redirectUrl?: string): string {
  const params = new URLSearchParams({
    userId,
    ...(redirectUrl && { redirect: redirectUrl })
  })
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Debounce function for rate limiting API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}