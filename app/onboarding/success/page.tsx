'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { 
  CheckCircle, 
  ArrowRight, 
  Mail, 
  MessageCircle, 
  BookOpen,
  Sparkles,
  Gift,
  Calendar,
  Copy
} from 'lucide-react'

interface PaymentSuccessData {
  orderId: string
  paymentId: string
  planKey: string
  planName: string
  amount: number
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!user) {
      router.push('/signup')
      return
    }

    // Load payment success data
    const successData = localStorage.getItem('paymentSuccess')
    if (!successData) {
      // If no success data, user might have already paid - redirect to main app
      router.push('/')
      return
    }

    try {
      const data = JSON.parse(successData)
      setPaymentData(data)
      
      // Clear the success data after loading
      localStorage.removeItem('paymentSuccess')
      
      // Clear selected plan data
      localStorage.removeItem('selectedPlan')

      // Auto-redirect logic after 5 seconds
      const redirectTimer = setTimeout(async () => {
        // Check if setup has already been completed/skipped
        const setupStatus = localStorage.getItem('setupStatus')
        console.log('🎉 Auto-redirecting paid user - setup status:', setupStatus)

        if (setupStatus === 'completed' || setupStatus === 'skipped') {
          // Setup was already done, go directly to app shell
          console.log('🚀 Setup already completed, redirecting to app shell')
          router.push('/shell');
        } else {
          // Setup not done yet, go to setup page
          router.push('/onboarding/setup');
        }
      }, 5000)

      // Countdown timer
      const countdownTimer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)

      return () => {
        clearTimeout(redirectTimer)
        clearInterval(countdownTimer)
      }
    } catch (error) {
      console.error('Invalid payment success data:', error)
      router.push('/')
    }
  }, [user, router])

  const handleCopyOrderId = async () => {
    if (paymentData) {
      await navigator.clipboard.writeText(paymentData.orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartSetup = async () => {
    // Check if setup has already been completed/skipped
    const setupStatus = localStorage.getItem('setupStatus')
    console.log('🚀 Start Setup button clicked - setup status:', setupStatus)

    if (setupStatus === 'completed' || setupStatus === 'skipped') {
      // Setup was already done, go directly to app shell
      console.log('🚀 Start Setup: Setup already completed, redirecting to app shell')
      router.push('/shell');
    } else {
      // Setup not done yet, go to setup page
      router.push('/onboarding/setup');
    }
  }

  const handleGoToDashboard = async () => {
    console.log('⏭️ Going directly to organization dashboard')

    try {
      // Get user's organization information
      const response = await fetch('/api/user/subscription-status', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const subscriptionData = await response.json();
        if (subscriptionData.primaryOrganization) {
          router.push(`/org/${subscriptionData.primaryOrganization.slug}/dashboard`);
          return;
        } else if (subscriptionData.organizations && subscriptionData.organizations.length > 0) {
          router.push(`/org/${subscriptionData.organizations[0].slug}/dashboard`);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to get organization info:', error);
    }

    // Fallback to home page
    router.push('/');
  }

  const handleContactSupport = () => {
    window.open('mailto:support@zunoki.com?subject=Payment Success - Need Help', '_blank')
  }

  const handleOpenChat = () => {
    // This would open your chat widget or support chat
    console.log('Opening support chat...')
    // For now, redirect to help center
    window.open('/help', '_blank')
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payment confirmation...</p>
        </div>
      </div>
    )
  }

  const savings = Math.round((paymentData.amount * 0.5) * 100) / 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Welcome to Zunoki! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Your subscription is now active!
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">
              Redirecting to platform setup in {countdown} seconds...
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Confirmation */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{paymentData.planName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-green-600">${paymentData.amount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{paymentData.orderId}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyOrderId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt sent to:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">You saved ${savings}!</span>
                </div>
                <p className="text-sm text-orange-700">
                  With our launch discount, you're getting 3 months at 50% off!
                </p>
              </div>

              {copied && (
                <div className="text-sm text-green-600 text-center">
                  ✅ Order ID copied to clipboard
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Sparkles className="w-5 h-5" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Connect Your Platforms</h4>
                    <p className="text-sm text-blue-700">WhatsApp, Google Ads, Gmail, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Meet Zunoki AI</h4>
                    <p className="text-sm text-blue-700">Your personal AI assistant is ready to help</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Import Your Data</h4>
                    <p className="text-sm text-blue-700">Get instant insights from your existing campaigns</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Set Up Automations</h4>
                    <p className="text-sm text-blue-700">Save time with intelligent workflows</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Your subscription</span>
                </div>
                <p className="text-sm text-blue-700">
                  Active until {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Notice */}
        <Card className="mt-8 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Mail className="w-8 h-8 text-gray-600 mx-auto" />
              <h3 className="font-medium text-gray-900">Check Your Email!</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                We've sent you important information including:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span>📧 Payment receipt</span>
                <span>📘 Quick start guide</span>
                <span>🎓 Setup tutorial</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleStartSetup}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            🚀 Start Setup Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            onClick={handleGoToDashboard}
            variant="outline"
            size="lg"
            className="px-8"
          >
            ⏭️ Skip Setup & Go to Dashboard
          </Button>
        </div>

        {/* Support Options */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Need help getting started?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleContactSupport}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
            
            <Button 
              onClick={handleOpenChat}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
            
            <Button 
              onClick={() => window.open('/help', '_blank')}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}