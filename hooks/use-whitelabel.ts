"use client"

import { useState, useEffect } from 'react'
import { BrandConfig, getBrandConfig } from '@/lib/utils/white-label'

export function useWhiteLabel() {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(getBrandConfig())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBrandConfig = async () => {
      try {
        // In production, this would fetch from database based on domain
        const config = getBrandConfig()
        setBrandConfig(config)
      } catch (error) {
        console.error('Failed to load brand configuration:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBrandConfig()
  }, [])

  const updateBrandConfig = (updates: Partial<BrandConfig>) => {
    setBrandConfig(prev => ({ ...prev, ...updates }))
  }

  const isWhiteLabelEnabled = brandConfig.isWhiteLabel

  const getFeatureAccess = (feature: keyof BrandConfig['features']) => {
    return brandConfig.features[feature]
  }

  const getBrandAsset = (asset: 'logo' | 'favicon') => {
    return brandConfig[asset]
  }

  const getSupportInfo = () => ({
    email: brandConfig.supportEmail,
    phone: brandConfig.supportPhone,
    address: brandConfig.companyAddress,
  })

  return {
    brandConfig,
    isLoading,
    isWhiteLabelEnabled,
    updateBrandConfig,
    getFeatureAccess,
    getBrandAsset,
    getSupportInfo,
  }
}