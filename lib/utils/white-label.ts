export interface BrandConfig {
  // Brand Identity
  name: string
  logo: string
  favicon: string

  // Colors (CSS Custom Properties)
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string

  // Domain & Deployment
  customDomain?: string
  isWhiteLabel: boolean

  // Features
  features: {
    agentLimit: number
    conversationLimit: number
    whatsappIntegration: boolean
    paymentIntegration: boolean
    customBranding: boolean
    apiAccess: boolean
  }

  // Contact & Support
  supportEmail: string
  supportPhone?: string
  companyAddress?: string
}

export const defaultBrandConfig: BrandConfig = {
  name: "Zunoki Enterprise Chat",
  logo: "/assets/logo-placeholder.svg",
  favicon: "/assets/favicon-template.ico",
  primaryColor: "#10B981", // Emerald 500
  secondaryColor: "#F8FAFC", // Slate 50
  accentColor: "#34D399", // Emerald 400
  backgroundColor: "#FFFFFF",
  textColor: "#1E293B", // Slate 800
  customDomain: undefined,
  isWhiteLabel: false,
  features: {
    agentLimit: 10,
    conversationLimit: 1000,
    whatsappIntegration: true,
    paymentIntegration: true,
    customBranding: false,
    apiAccess: true,
  },
  supportEmail: "support@zunoki.com",
  supportPhone: "+1-800-ZUNOKI",
  companyAddress: "Enterprise Solution by Zunoki",
}

export function applyBrandTheme(config: Partial<BrandConfig>) {
  const finalConfig = { ...defaultBrandConfig, ...config }

  // Update CSS Custom Properties
  const root = document.documentElement
  root.style.setProperty('--primary-color', finalConfig.primaryColor)
  root.style.setProperty('--secondary-color', finalConfig.secondaryColor)
  root.style.setProperty('--accent-color', finalConfig.accentColor)
  root.style.setProperty('--background-color', finalConfig.backgroundColor)
  root.style.setProperty('--text-color', finalConfig.textColor)

  // Update document title and favicon
  document.title = finalConfig.name

  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (favicon) {
    favicon.href = finalConfig.favicon
  }

  return finalConfig
}

export function getBrandConfig(): BrandConfig {
  // In production, this would fetch from database or config file
  // For now, return default or load from environment
  const envConfig: Partial<BrandConfig> = {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || defaultBrandConfig.name,
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || defaultBrandConfig.primaryColor,
    customDomain: process.env.NEXT_PUBLIC_CUSTOM_DOMAIN,
    isWhiteLabel: process.env.NEXT_PUBLIC_WHITE_LABEL === 'true',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || defaultBrandConfig.supportEmail,
  }

  return { ...defaultBrandConfig, ...envConfig }
}