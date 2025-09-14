"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { BrandConfig, getBrandConfig, applyBrandTheme } from '@/lib/utils/white-label'

interface BrandContextType {
  brandConfig: BrandConfig
  updateBrand: (config: Partial<BrandConfig>) => void
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(getBrandConfig())

  useEffect(() => {
    // Apply brand theme on initial load
    applyBrandTheme(brandConfig)
  }, [brandConfig])

  const updateBrand = (config: Partial<BrandConfig>) => {
    const newConfig = { ...brandConfig, ...config }
    setBrandConfig(newConfig)
    applyBrandTheme(newConfig)
  }

  return (
    <BrandContext.Provider value={{ brandConfig, updateBrand }}>
      <NextThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemeProvider>
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}