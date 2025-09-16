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
    const checkSubscription = async () => {
      console.log('🔄 OnboardingGuard - useEffect triggered', { user: !!user, loading })
      if (!user || loading) return

      try {
        // Check if user has a valid subscription/plan
        const response = await fetch('/api/user/subscription', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 OnboardingGuard - Subscription check:', {
            userEmail: user?.email,
            hasAccess: data.hasAccess,
            needsOnboarding: data.needsOnboarding,
            isAdmin: data.isAdmin,
            subscription: data.subscription,
            userProfile: data.userProfile
          })
          
          const hasActivePlan = data.hasAccess === true
          setHasSubscription(hasActivePlan)

          // Redirect to onboarding if no active subscription
          if (!hasActivePlan) {
            console.log('🔄 OnboardingGuard - Redirecting to onboarding (no active plan)')
            router.push('/onboarding/plans')
            return
          } 
          
          // User has active plan, now check setup status
          const userSetupStatus = localStorage.getItem('setupStatus') || 'pending'
          setSetupStatus(userSetupStatus as 'pending' | 'completed' | 'skipped')
          
          if (data.isAdmin) {
            console.log('👑 OnboardingGuard - Admin access granted, bypassing setup')
            setSetupStatus('completed') // Admins skip setup
          } else if (userSetupStatus === 'pending') {
            console.log('⚙️ OnboardingGuard - User needs setup, redirecting to setup page')
            router.push('/onboarding/setup')
            return
          } else {
            console.log('✅ OnboardingGuard - User setup complete, showing dashboard')
          }
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