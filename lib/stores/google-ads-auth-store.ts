"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { googleAdsAuthService, type GoogleAdsAuthStatus } from "@/lib/services/google-ads-auth-service"

export interface GoogleAdsAuthState {
  // Auth status data
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
  bannerDismissed: boolean
  bannerDismissedAt: string | null
  
  // Actions
  setAuthStatus: (status: GoogleAdsAuthStatus) => void
  setIsChecking: (checking: boolean) => void
  checkAuthStatus: () => Promise<void>
  showModal: () => void
  hideModal: () => void
  showBanner: () => void
  hideBanner: () => void
  dismissBanner: () => void
  initiateReAuth: () => Promise<void>
  clearAuthData: () => void
  shouldShowBanner: () => boolean
  isExpiringSoon: (daysThreshold?: number) => boolean
  isExpired: () => boolean
}

export const useGoogleAdsAuthStore = create<GoogleAdsAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      status: 'not_connected',
      expiresAt: null,
      lastSync: null,
      customerCount: 0,
      customerIds: [],
      isChecking: false,
      lastChecked: null,
      showReAuthModal: false,
      showReAuthBanner: false,
      bannerDismissed: false,
      bannerDismissedAt: null,

      // Actions
      setAuthStatus: (authStatus: GoogleAdsAuthStatus) =>
        set((state) => ({
          isConnected: authStatus.connected,
          status: authStatus.status,
          expiresAt: authStatus.expiresAt,
          lastSync: authStatus.lastSync,
          customerCount: authStatus.customerCount,
          customerIds: authStatus.customerIds,
          lastChecked: new Date().toISOString(),
          // Reset banner dismissal if status changes
          bannerDismissed: authStatus.status === 'connected' ? false : state.bannerDismissed,
        })),

      setIsChecking: (checking: boolean) =>
        set(() => ({ isChecking: checking })),

      checkAuthStatus: async () => {
        const { setIsChecking, setAuthStatus } = get()
        
        try {
          setIsChecking(true)
          const authStatus = await googleAdsAuthService.checkAuthStatus()
          setAuthStatus(authStatus)
        } catch (error) {
          console.error('Failed to check Google Ads auth status:', error)
          // On error, assume not connected
          setAuthStatus({
            connected: false,
            platform: 'google_ads',
            status: 'not_connected',
            customerCount: 0,
            customerIds: [],
            expiresAt: null,
            lastSync: null
          })
        } finally {
          setIsChecking(false)
        }
      },

      showModal: () => set(() => ({ showReAuthModal: true })),
      hideModal: () => set(() => ({ showReAuthModal: false })),
      
      showBanner: () => set(() => ({ showReAuthBanner: true })),
      hideBanner: () => set(() => ({ showReAuthBanner: false })),
      
      dismissBanner: () => 
        set(() => ({ 
          showReAuthBanner: false, 
          bannerDismissed: true,
          bannerDismissedAt: new Date().toISOString()
        })),

      initiateReAuth: async () => {
        try {
          await googleAdsAuthService.initiateReAuth()
          // The redirect happens automatically, so we won't reach this point
          // unless there's an error
        } catch (error) {
          console.error('Failed to initiate re-authentication:', error)
          throw error
        }
      },

      clearAuthData: () =>
        set(() => ({
          isConnected: false,
          status: 'not_connected',
          expiresAt: null,
          lastSync: null,
          customerCount: 0,
          customerIds: [],
          showReAuthModal: false,
          showReAuthBanner: false,
          bannerDismissed: false,
          bannerDismissedAt: null,
        })),

      shouldShowBanner: (): boolean => {
        const state = get()
        
        // Don't show banner if already dismissed recently
        if (state.bannerDismissed && state.bannerDismissedAt) {
          const dismissedAt = new Date(state.bannerDismissedAt)
          const now = new Date()
          const daysSinceDismissal = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
          
          // If expired, show banner again after 1 day
          // If expiring, show banner again after 3 days
          const threshold = state.status === 'expired' ? 1 : 3
          if (daysSinceDismissal < threshold) {
            return false
          }
        }

        // Show banner for expired or expiring tokens
        return state.status === 'expired' || state.isExpiringSoon()
      },

      isExpiringSoon: (daysThreshold: number = 7): boolean => {
        const { expiresAt } = get()
        return googleAdsAuthService.isTokenExpiringSoon(expiresAt, daysThreshold)
      },

      isExpired: (): boolean => {
        const { expiresAt } = get()
        return googleAdsAuthService.isTokenExpired(expiresAt)
      },
    }),
    {
      name: "google-ads-auth-store",
      // Only persist certain fields to avoid stale UI state
      partialize: (state) => ({
        isConnected: state.isConnected,
        status: state.status,
        expiresAt: state.expiresAt,
        lastSync: state.lastSync,
        customerCount: state.customerCount,
        customerIds: state.customerIds,
        lastChecked: state.lastChecked,
        bannerDismissed: state.bannerDismissed,
        bannerDismissedAt: state.bannerDismissedAt,
      }),
    }
  )
)