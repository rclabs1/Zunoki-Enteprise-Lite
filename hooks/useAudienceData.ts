"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface AudienceInsight {
  id: string
  user_id: string
  platform: string
  segment_name: string
  segment_type?: string
  description?: string
  size?: number
  data?: any
  created_at: string
  updated_at: string
  date: string
}

interface AudienceStats {
  totalAudiences: number
  activeSegments: number
  avgAudienceSize: number
  matchRate: number
}

interface UseAudienceDataReturn {
  audiences: AudienceInsight[]
  stats: AudienceStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useAudienceData = (): UseAudienceDataReturn => {
  const { data: session } = useSession()
  const [audiences, setAudiences] = useState<AudienceInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAudiences = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/audience-insights', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch audiences: ${response.status}`)
      }

      const data: AudienceInsight[] = await response.json()
      setAudiences(data || [])
    } catch (err: any) {
      console.error('Error fetching audiences:', err)
      setError(err.message || 'Failed to fetch audience data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudiences()
  }, [session?.user?.id])

  // Calculate stats
  const stats: AudienceStats = {
    totalAudiences: audiences.length,
    activeSegments: audiences.filter(aud => 
      aud.platform !== 'meta_ads' && aud.platform !== 'google_ads'
    ).length,
    avgAudienceSize: audiences.length > 0 
      ? Math.round(audiences.reduce((sum, aud) => sum + (aud.size || 0), 0) / audiences.length)
      : 0,
    matchRate: 87 // Placeholder - implement real calculation
  }

  return {
    audiences,
    stats,
    loading,
    error,
    refetch: fetchAudiences
  }
}