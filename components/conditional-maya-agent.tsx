"use client"

import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { lazy, Suspense } from "react"

// Use lazy loading to prevent bundling Maya on every page
const MayaAgent = lazy(() => import("@/components/maya-agent").then(mod => ({ default: mod.MayaAgent })))

export function ConditionalMayaAgent() {
  const { user, mayaReady, mayaLoading } = useAuth()
  const pathname = usePathname()

  // Pages where Maya should not appear (public/unauthenticated pages)
  const publicPages = ["/", "/landing", "/login", "/signup"]
  const isPublicPage = publicPages.includes(pathname)

  // Only render Maya Agent if user is authenticated and not on a public page
  if (!user || isPublicPage) {
    return null
  }

  // Show loading state while Maya is being set up
  if (mayaLoading || !mayaReady) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
          <span className="text-white text-sm">Setting up Maya...</span>
        </div>
      </div>
    )
  }

  // Only render Maya when it's fully ready
  return (
    <Suspense fallback={
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
          <span className="text-white text-sm">Loading Maya...</span>
        </div>
      </div>
    }>
      <MayaAgent mayaReady={mayaReady} mayaLoading={mayaLoading} />
    </Suspense>
  )
}