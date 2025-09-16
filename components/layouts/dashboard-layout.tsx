"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNavBar } from "@/components/layout/top-nav-bar"
// import { MayaAgent } from "@/components/maya-agent" // Removed to prevent bundling, handled by ConditionalMayaAgent
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Don't render dashboard layout for landing pages
  if (pathname === "/" || pathname === "/landing" || pathname === "/login" || pathname === "/signup") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top Navigation - Only render once */}
      <TopNavBar />

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content - Add left margin to account for sidebar */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] ml-16 bg-background transition-colors duration-300">
          <div className="p-6 modern-scrollbar overflow-y-auto max-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </main>
      </div>

      {/* Global Maya Agent - Now handled by ConditionalMayaAgent in client-layout */}
    </div>
  )
}
