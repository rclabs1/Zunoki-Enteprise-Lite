import React from 'react'
import { MayaProvider } from '@/contexts/maya-context'
import { OnboardingGuard } from '@/components/onboarding-guard'

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingGuard>
      <MayaProvider>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </MayaProvider>
    </OnboardingGuard>
  )
}