"use client"

import { auth } from "@/lib/firebase"

export interface GoogleAdsAuthStatus {
  connected: boolean
  platform: 'google_ads'
  status: 'connected' | 'expired' | 'not_connected'
  customerCount: number
  customerIds: string[]
  expiresAt: string | null
  lastSync: string | null
}

export interface GoogleAdsAuthError {
  code: 'GOOGLE_ADS_TOKEN_EXPIRED' | 'NETWORK_ERROR' | 'AUTH_ERROR'
  message: string
}

export class GoogleAdsAuthService {
  private static instance: GoogleAdsAuthService
  private baseUrl = '/api/google-ads-proxy'

  static getInstance(): GoogleAdsAuthService {
    if (!GoogleAdsAuthService.instance) {
      GoogleAdsAuthService.instance = new GoogleAdsAuthService()
    }
    return GoogleAdsAuthService.instance
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

  async checkAuthStatus(): Promise<GoogleAdsAuthStatus> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/status`, { headers })

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            platform: 'google_ads',
            status: 'not_connected',
            customerCount: 0,
            customerIds: [],
            expiresAt: null,
            lastSync: null
          }
        }
        throw new Error(`Failed to check auth status: ${response.status}`)
      }

      const result = await response.json()
      return result.success ? result.data : {
        connected: false,
        platform: 'google_ads',
        status: 'not_connected',
        customerCount: 0,
        customerIds: [],
        expiresAt: null,
        lastSync: null
      }
    } catch (error) {
      console.error('Error checking Google Ads auth status:', error)
      return {
        connected: false,
        platform: 'google_ads',
        status: 'not_connected',
        customerCount: 0,
        customerIds: [],
        expiresAt: null,
        lastSync: null
      }
    }
  }

  async initiateReAuth(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.baseUrl}/connect`, { 
        headers,
        redirect: 'manual' // Don't follow redirects automatically
      })

      if (response.type === 'opaqueredirect' || response.status === 302) {
        // Extract redirect URL from Location header
        const location = response.headers.get('Location') || `${this.baseUrl}/connect`
        window.location.href = location
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to initiate re-authentication: ${response.status}`)
      }

      // If we get here without a redirect, something went wrong
      throw new Error('Expected redirect to Google OAuth but none received')
    } catch (error) {
      console.error('Error initiating Google Ads re-authentication:', error)
      throw error
    }
  }

  isTokenExpiringSoon(expiresAt: string | null, daysThreshold: number = 7): boolean {
    if (!expiresAt) return false
    
    const expirationDate = new Date(expiresAt)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)
    
    return expirationDate <= thresholdDate
  }

  isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true
    
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    
    return expirationDate <= now
  }

  static isGoogleAdsError(error: any): error is { error: GoogleAdsAuthError } {
    return error?.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED'
  }

  static extractErrorFromApiResponse(error: any): GoogleAdsAuthError | null {
    if (this.isGoogleAdsError(error)) {
      return error.error
    }
    return null
  }
}

export const googleAdsAuthService = GoogleAdsAuthService.getInstance()