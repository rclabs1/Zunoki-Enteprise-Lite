'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [setupStatus, setSetupStatus] = useState<'pending' | 'completed' | 'skipped' | null>(null)
  
  console.log('🚀 OnboardingGuard - Component mounted', { user: !!user, loading })

  useEffect(() => {
    console.log('🔄 OnboardingGuard - useEffect ENTRY', {
      user: !!user,
      loading,
      userUid: user?.uid,
      timestamp: new Date().toISOString()
    })

    const checkSubscription = async () => {
      console.log('🔄 OnboardingGuard - checkSubscription called', { user: !!user, loading })
      if (!user || loading) {
        console.log('🚫 OnboardingGuard - Early return due to no user or loading')
        return
      }

      // Check localStorage setup status first
      const localSetupStatus = localStorage.getItem('setupStatus') as 'pending' | 'completed' | 'skipped' | null
      console.log('🔧 OnboardingGuard - Setup status from localStorage:', localSetupStatus)
      setSetupStatus(localSetupStatus || 'pending')

      try {
        // Check if user has a valid subscription/plan
        console.log('🚀 OnboardingGuard - About to call /api/user/subscription-status')
        const response = await fetch('/api/user/subscription-status', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })

        console.log('📡 OnboardingGuard - Response status:', response.status, response.statusText)

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 OnboardingGuard - Subscription check:', {
            userEmail: user?.email,
            hasPaidSubscription: data.hasPaidSubscription,
            success: data.success,
            needsOnboarding: data.needsOnboarding,
            organizations: data.organizations,
            organizationsLength: data.organizations?.length || 0,
            primaryOrganization: data.primaryOrganization,
            currentPath: window.location.pathname,
            setupStatus: localSetupStatus
          })

          const hasActivePlan = data.hasPaidSubscription === true
          setHasSubscription(hasActivePlan)

          // If user is on setup page, they must be paid (don't check subscription)
          if (window.location.pathname.includes('/onboarding/setup')) {
            console.log('🔧 OnboardingGuard - User is on setup page, assuming paid status')
            // If they're skipping or completing setup, allow it
            if (localSetupStatus === 'skipped' || localSetupStatus === 'completed') {
              console.log('🚀 OnboardingGuard - Setup complete/skipped, redirecting to app shell')
              router.push('/shell')
              return
            }
            // Otherwise stay on setup page
            return
          }

          // If user reaches shell and setup is skipped/completed, they must be paid
          if (window.location.pathname.includes('/shell')) {
            console.log('🚀 OnboardingGuard - User in shell, allowing access')
            return
          }

          // Redirect to onboarding if no active subscription
          if (!hasActivePlan) {
            console.log('🔄 OnboardingGuard - Redirecting to onboarding (no active plan)')
            // Check if we're in a redirect loop
            if (window.location.pathname.includes('/onboarding/plans')) {
              console.log('⚠️ OnboardingGuard - Already on plans page, preventing loop')
              return
            }
            router.push('/onboarding/plans')
            return
          }

          // User has paid subscription
          // Check if setup is still pending
          if (!localSetupStatus || localSetupStatus === 'pending') {
            console.log('🔧 OnboardingGuard - Setup is pending, redirecting to setup page')
            if (window.location.pathname.includes('/onboarding/setup')) {
              console.log('⚠️ OnboardingGuard - Already on setup page, preventing loop')
              return
            }
            router.push('/onboarding/setup')
            return
          }

          // Setup completed/skipped - check if we're in org context
          console.log('🚀 OnboardingGuard - Setup complete, checking context')

          // If user is in org context, allow them to stay there
          if (window.location.pathname.includes('/org/')) {
            console.log('🏢 OnboardingGuard - User in org context, allowing access')
            return
          }

          // Otherwise redirect to app shell
          console.log('🚀 OnboardingGuard - Redirecting to app shell')
          router.push('/shell')
          return
        } else {
          // If API fails, assume no subscription and redirect to onboarding
          setHasSubscription(false)
          router.push('/onboarding/plans')
          return
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        // On error, redirect to onboarding for safety
        setHasSubscription(false)
        router.push('/onboarding/plans')
      }
    }

    checkSubscription()
  }, [user, loading, router])

  // Show loading while checking subscription and setup status
  if (loading || hasSubscription === null || setupStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  // If no subscription, return null (user will be redirected)
  if (!hasSubscription) {
    return null
  }

  // If setup is pending, return null (user will be redirected to setup)
  if (setupStatus === 'pending') {
    return null
  }

  // User has subscription and setup is complete, show the protected content
  return <>{children}</>
}