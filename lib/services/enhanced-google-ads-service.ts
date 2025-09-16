"use client"

import { auth } from "@/lib/firebase"
import { useGoogleAdsAuthStore } from "@/lib/stores/google-ads-auth-store"

export interface GoogleAdsApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: 'GOOGLE_ADS_TOKEN_EXPIRED' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'API_ERROR'
    message: string
  }
  message?: string
}

export interface GoogleAdsPerformanceMetrics {
  campaigns: Array<{
    id: string
    name: string
    status: string
    impressions: number
    clicks: number
    cost: number
    ctr: number
    cpc: number
    conversions: number
    conversionRate: number
  }>
  summary?: {
    totalImpressions: number
    totalClicks: number
    totalSpend: number
    averageCtr: number
    averageCpc: number
    totalConversions: number
    averageConversionRate: number
  }
  performanceData?: Array<{
    date: string
    impressions: number
    clicks: number
    spend: number
  }>
}

export class EnhancedGoogleAdsService {
  private static instance: EnhancedGoogleAdsService
  private baseUrl = '/api/google-ads-proxy'
  
  static getInstance(): EnhancedGoogleAdsService {
    if (!EnhancedGoogleAdsService.instance) {
      EnhancedGoogleAdsService.instance = new EnhancedGoogleAdsService()
    }
    return EnhancedGoogleAdsService.instance
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }

    const token = await user.getIdToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private handleApiError(error: any, response?: Response): GoogleAdsApiResponse {
    console.error('Google Ads API Error:', error)

    // Handle different types of errors
    if (response) {
      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: 'GOOGLE_ADS_TOKEN_EXPIRED',
            message: 'Google Ads authentication expired. Please reconnect your account.'
          }
        }
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded. Please try again later.'
          }
        }
      }
    }

    // Check if it's a network error
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please check your connection.'
        }
      }
    }

    // Default error response
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'An unexpected error occurred.'
      }
    }
  }

  async fetchCampaigns(): Promise<GoogleAdsApiResponse<GoogleAdsPerformanceMetrics>> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/fetchCampaigns`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check for specific Google Ads token expired error
        if (errorData?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
          // Update auth store state
          const { showModal } = useGoogleAdsAuthStore.getState()
          showModal()
          
          return {
            success: false,
            error: errorData.error
          }
        }

        return this.handleApiError(errorData, response)
      }

      const result = await response.json()
      return result

    } catch (error) {
      return this.handleApiError(error)
    }
  }

  async fetchPerformanceMetrics(
    startDate?: string,
    endDate?: string,
    customerId?: string
  ): Promise<GoogleAdsApiResponse<GoogleAdsPerformanceMetrics>> {
    try {
      const headers = await this.getAuthHeaders()
      const body = {
        startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        customerId
      }

      const response = await fetch(`${this.baseUrl}/fetchPerformanceMetrics`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check for specific Google Ads token expired error
        if (errorData?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
          // Update auth store state
          const { showModal } = useGoogleAdsAuthStore.getState()
          showModal()
          
          return {
            success: false,
            error: errorData.error
          }
        }

        return this.handleApiError(errorData, response)
      }

      const result = await response.json()
      return result

    } catch (error) {
      return this.handleApiError(error)
    }
  }

  async pauseCampaign(campaignId: string, customerId?: string): Promise<GoogleAdsApiResponse> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/pauseCampaign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ campaignId, customerId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (errorData?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
          const { showModal } = useGoogleAdsAuthStore.getState()
          showModal()
          
          return {
            success: false,
            error: errorData.error
          }
        }

        return this.handleApiError(errorData, response)
      }

      const result = await response.json()
      return result

    } catch (error) {
      return this.handleApiError(error)
    }
  }

  async enableCampaign(campaignId: string, customerId?: string): Promise<GoogleAdsApiResponse> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/enableCampaign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ campaignId, customerId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (errorData?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
          const { showModal } = useGoogleAdsAuthStore.getState()
          showModal()
          
          return {
            success: false,
            error: errorData.error
          }
        }

        return this.handleApiError(errorData, response)
      }

      const result = await response.json()
      return result

    } catch (error) {
      return this.handleApiError(error)
    }
  }

  // Utility method to check if an error is a Google Ads auth error
  static isAuthError(response: GoogleAdsApiResponse): boolean {
    return response.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED'
  }

  // Utility method to check if we should show the re-auth modal
  static shouldShowReAuthModal(response: GoogleAdsApiResponse): boolean {
    return this.isAuthError(response)
  }
}

export const enhancedGoogleAdsService = EnhancedGoogleAdsService.getInstance()

// React Hook for easy component integration
export function useEnhancedGoogleAds() {
  const service = EnhancedGoogleAdsService.getInstance()
  
  return {
    fetchCampaigns: service.fetchCampaigns.bind(service),
    fetchPerformanceMetrics: service.fetchPerformanceMetrics.bind(service),
    pauseCampaign: service.pauseCampaign.bind(service),
    enableCampaign: service.enableCampaign.bind(service),
    isAuthError: EnhancedGoogleAdsService.isAuthError,
    shouldShowReAuthModal: EnhancedGoogleAdsService.shouldShowReAuthModal
  }
}