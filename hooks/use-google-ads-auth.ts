"use client"

import { useEffect, useCallback, useRef } from "react"
import { useGoogleAdsAuthStore } from "@/lib/stores/google-ads-auth-store"
import { useAuth } from "@/contexts/auth-context"

export interface UseGoogleAdsAuthReturn {
  // Auth status
  isConnected: boolean
  status: 'connected' | 'expired' | 'not_connected'
  expiresAt: string | null
  lastSync: string | null
  customerCount: number
  customerIds: string[]
  
  // UI state
  isChecking: boolean
  lastChecked: string | null
  showReAuthModal: boolean
  showReAuthBanner: boolean
  
  // Computed states
  isExpired: boolean
  isExpiringSoon: boolean
  shouldShowBanner: boolean
  
  // Actions
  checkAuthStatus: () => Promise<void>
  initiateReAuth: () => Promise<void>
  showModal: () => void
  hideModal: () => void
  showBanner: () => void
  hideBanner: () => void
  dismissBanner: () => void
  
  // Utils
  formatLastSync: () => string | null
  getDaysUntilExpiry: () => number | null
}

export function useGoogleAdsAuth(): UseGoogleAdsAuthReturn {
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    // State
    isConnected,
    status,
    expiresAt,
    lastSync,
    customerCount,
    customerIds,
    isChecking,
    lastChecked,
    showReAuthModal,
    showReAuthBanner,
    
    // Actions
    checkAuthStatus: storeCheckAuthStatus,
    initiateReAuth: storeInitiateReAuth,
    showModal,
    hideModal,
    showBanner,
    hideBanner,
    dismissBanner,
    shouldShowBanner,
    isExpiringSoon: storeIsExpiringSoon,
    isExpired: storeIsExpired,
  } = useGoogleAdsAuthStore()

  // Wrapped actions with error handling
  const checkAuthStatus = useCallback(async () => {
    if (!user) return
    
    try {
      await storeCheckAuthStatus()
    } catch (error) {
      console.error('Failed to check Google Ads auth status:', error)
    }
  }, [user, storeCheckAuthStatus])

  const initiateReAuth = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to initiate re-auth')
    }
    
    try {
      await storeInitiateReAuth()
    } catch (error) {
      console.error('Failed to initiate Google Ads re-authentication:', error)
      throw error
    }
  }, [user, storeInitiateReAuth])

  // Auto-check auth status when user logs in
  useEffect(() => {
    if (user && !lastChecked) {
      checkAuthStatus()
    }
  }, [user, lastChecked, checkAuthStatus])

  // Set up periodic status checks (every 30 minutes)
  useEffect(() => {
    if (!user) return

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      checkAuthStatus()
    }, 30 * 60 * 1000) // 30 minutes

    // Cleanup on unmount or user change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, checkAuthStatus])

  // Auto-show banner when appropriate
  useEffect(() => {
    if (shouldShowBanner() && !showReAuthBanner) {
      showBanner()
    }
  }, [shouldShowBanner, showReAuthBanner, showBanner])

  // Utility functions
  const formatLastSync = useCallback((): string | null => {
    if (!lastSync) return null
    
    try {
      const syncDate = new Date(lastSync)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`
      
      return syncDate.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting last sync date:', error)
      return lastSync
    }
  }, [lastSync])

  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!expiresAt) return null
    
    try {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      const diffInDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return Math.max(0, diffInDays)
    } catch (error) {
      console.error('Error calculating days until expiry:', error)
      return null
    }
  }, [expiresAt])

  return {
    // Auth status
    isConnected,
    status,
    expiresAt,
    lastSync,
    customerCount,
    customerIds,
    
    // UI state
    isChecking,
    lastChecked,
    showReAuthModal,
    showReAuthBanner,
    
    // Computed states
    isExpired: storeIsExpired(),
    isExpiringSoon: storeIsExpiringSoon(),
    shouldShowBanner: shouldShowBanner(),
    
    // Actions
    checkAuthStatus,
    initiateReAuth,
    showModal,
    hideModal,
    showBanner,
    hideBanner,
    dismissBanner,
    
    // Utils
    formatLastSync,
    getDaysUntilExpiry,
  }
}

// Hook for handling Google Ads API errors
export function useGoogleAdsErrorHandler() {
  const { showModal } = useGoogleAdsAuth()
  
  const handleApiError = useCallback((error: any) => {
    // Check if it's a Google Ads token expired error
    if (error?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
      showModal()
      return true // Indicates the error was handled
    }
    
    return false // Indicates the error was not handled
  }, [showModal])
  
  return { handleApiError }
}