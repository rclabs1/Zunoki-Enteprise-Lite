"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

interface MainContentWrapperProps {
  children: ReactNode
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const pathname = usePathname()

  // Pages where sidebar should be hidden completely
  const noSidebarPages = ["/", "/landing", "/login", "/signup"]
  const shouldHideSidebar = noSidebarPages.includes(pathname)

  if (shouldHideSidebar) {
    return (
      <main className="fill-available">
        <div className="scroll-container">
          <div className="p-[clamp(1rem,3vw,2rem)]">{children}</div>
        </div>
      </main>
    )
  }

  // With sidebar - responsive to sidebar state
  return (
    <main className="sidebar-adjusted-content hover:sidebar-expanded-content transition-all duration-300 ease-in-out fill-available">
      <div className="scroll-container">
        <div className="p-[clamp(1rem,3vw,2rem)] min-h-full">{children}</div>
      </div>
    </main>
  )
}
