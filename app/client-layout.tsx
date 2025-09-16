"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context"
import { DashboardProvider } from "@/contexts/dashboard-context"
import { TopNavBar } from "@/components/layout/top-nav-bar"
import { Sidebar } from "@/components/layout/sidebar"
import { ConditionalMayaAgent } from "@/components/conditional-maya-agent"
import { MainContentWrapper } from "@/components/layout/main-content-wrapper"
import { SessionProvider } from "next-auth/react"
import { useState, useEffect } from "react"
import OnboardingWalkthrough from "@/components/dashboard/onboarding-walkthrough"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  // Legacy routes that should redirect to shell
  const legacyRoutes = [
    "/dashboard",
    "/settings", 
    "/marketplace",
    "/smartagenticautomation",
    "/integrationhub",
    "/analytics",
    "/audience",
    "/reports",
    "/profile",
    "/ad-creator",
    "/admin",
    "/autopilot",
    "/campaign",
    "/campaigns",
    "/platforms",
    "/workflow"
  ]
  
  const isLegacyRoute = legacyRoutes.some((route) => pathname.toLowerCase().startsWith(route))
  const isShellRoute = pathname.startsWith('/shell')
  const isAppRoute = isLegacyRoute || isShellRoute
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Redirect legacy routes to shell
  useEffect(() => {
    if (isLegacyRoute) {
      window.location.replace('/shell')
      return
    }
    
    if (isShellRoute) {
      const hasSeenOnboarding = localStorage.getItem('maya-onboarding-completed')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [isLegacyRoute, isShellRoute])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <SessionProvider>
            <AuthProvider>
              <DashboardProvider>
                {isLegacyRoute ? (
                  // Show loading while redirecting legacy routes
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Redirecting to Zunoki. Agentic Platform...</p>
                    </div>
                  </div>
                ) : isShellRoute ? (
                  // New shell-based architecture
                  <div className="min-h-screen">
                    {children}
                    <OnboardingWalkthrough
                      isOpen={showOnboarding}
                      onClose={() => setShowOnboarding(false)}
                      onComplete={() => {
                        setShowOnboarding(false)
                        localStorage.setItem('maya-onboarding-completed', 'true')
                      }}
                    />
                  </div>
                ) : (
                  // Marketing pages (landing, login, signup)
                  <div className="min-h-screen">{children}</div>
                )}
                <Toaster />
                <SonnerToaster />
              </DashboardProvider>
            </AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
