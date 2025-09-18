'use client'

console.log('🚨 PLANS PAGE MODULE LOADED - This should show in console')

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { CheckCircle, Zap, Users, Sparkles, ArrowRight, Clock } from 'lucide-react'

// Dynamic pricing configuration (easily updatable)
const PRICING_CONFIG = {
  chat: {
    name: 'Zunoki Enterprise Lite (Chat)',
    price: 49,
    currency: 'USD',
    inrPrice: 4099,
    popular: true,
    description: 'Chat-based customer engagement',
    icon: Users,
    paymentEnabled: true,
    features: [
      'WhatsApp Business integration',
      'Gmail & Telegram support',
      'SMS messaging included',
      'Zunoki Agentic AI assistant',
      'Chat-based interactions',
      'Credit-based messaging per month',
      '3 platform connections',
      'Email support'
    ]
  },
  voice: {
    name: 'Zunoki Enterprise Lite (Voice)',
    price: null,
    currency: 'USD',
    inrPrice: null,
    popular: false,
    description: 'Voice-enabled customer engagement',
    icon: Zap,
    paymentEnabled: false,
    contactSales: true,
    features: [
      'All Chat features',
      'Voice call integration',
      'AI voice synthesis',
      'Voice analytics',
      'Premium voice features',
      'Voice-based AI interactions',
      'Advanced voice automation',
      'Priority voice support'
    ]
  },
  full: {
    name: 'Enterprise Full',
    price: null,
    currency: 'USD',
    inrPrice: null,
    popular: false,
    description: 'Complete enterprise solution',
    icon: Sparkles,
    paymentEnabled: false,
    contactSales: true,
    features: [
      'All Voice features',
      'Custom platform connections',
      'Meta (Facebook/Instagram) integration',
      'Custom voice training',
      'Voice-narrated chart insights',
      'Custom AI agents',
      'Unlimited messaging',
      'Dedicated success manager',
      'White-glove onboarding',
      'Custom integrations',
      'SLA support',
      'Advanced analytics'
    ]
  }
}

interface PlanCardProps {
  planKey: string
  plan: any
  isSelected: boolean
  onSelect: (planKey: string) => void
  getPlanPricing: (planKey: string) => any
  isAnnual: boolean
}

const PlanCard: React.FC<PlanCardProps> = ({ planKey, plan, isSelected, onSelect, getPlanPricing, isAnnual }) => {
  const Icon = plan.icon

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected 
          ? 'ring-2 ring-primary shadow-xl' 
          : plan.popular 
            ? 'ring-2 ring-accent shadow-lg hover:shadow-xl' 
            : 'hover:shadow-lg'
      }`}
      onClick={() => onSelect(planKey)}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 font-bold shadow-lg">
          💡 Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
        
        <div className="mt-4">
          {plan.contactSales ? (
            <div className="text-center">
              <span className="text-3xl font-bold text-blue-600">Contact Sales</span>
              <p className="text-sm text-gray-600 mt-1">Custom pricing available</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  ${getPlanPricing(planKey).price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                ₹{getPlanPricing(planKey).inrPrice.toLocaleString()}/month
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAnnual ? (
                  'billed annually'
                ) : (
                  <>Save ${getPlanPricing(planKey).savings} with annual billing</>
                )}
              </p>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className={`w-full ${
            isSelected 
              ? 'bg-green-500 hover:bg-green-600' 
              : plan.popular 
                ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300' 
                : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300'
          }`}
          size="lg"
        >
          {isSelected ? 'Selected' : plan.contactSales ? 'Contact Sales' : 'Get Started'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function PlansPage() {
  console.log('📋 PlansPage - Component loaded')
  const router = useRouter()
  const { user, loading } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string>('chat') // Default to chat plan
  const [timeLeft, setTimeLeft] = useState('47 hours')
  const [isAnnual, setIsAnnual] = useState(true) // Default to annual
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true)

  console.log('📋 PlansPage - Auth state:', { user: !!user, email: user?.email, loading })

  useEffect(() => {
    console.log('📋 PlansPage - useEffect triggered:', { user: !!user, loading })

    // Wait for auth to finish loading
    if (loading) {
      console.log('📋 PlansPage - Auth still loading, waiting...')
      return
    }

    if (!user) {
      console.log('📋 PlansPage - No user after loading, redirecting to signup')
      router.push('/signup')
      return
    }

    console.log('📋 PlansPage - User authenticated, checking payment status for:', user.email)

    // Check if user has already paid - if so, redirect to main app immediately
    // This prevents paid users from accessing the onboarding plans page
    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 PLANS PAGE - Starting payment status check for:', user.email)
        const response = await fetch('/api/user/subscription-status', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 PLANS PAGE - Full API response:', JSON.stringify(data, null, 2))

          console.log('🔍 PLANS PAGE - Detailed analysis:', {
            hasPaidSubscription: data.hasPaidSubscription,
            success: data.success,
            organizationsExist: !!data.organizations,
            organizationsLength: data.organizations?.length || 0,
            firstOrgSlug: data.organizations?.[0]?.slug || 'undefined'
          })

          // CRITICAL FIX: If user has paid subscription, redirect immediately
          if (data.hasPaidSubscription === true) {
            console.log('🔒 PAID USER DETECTED - Redirecting immediately to prevent double payment')

            // Check setup status before deciding where to redirect
            const setupStatus = localStorage.getItem('setupStatus')
            console.log('🔧 Plans page - Setup status:', setupStatus)

            if (!setupStatus || setupStatus === 'pending') {
              console.log('🚀 Redirecting to setup page (setup not completed)')
              router.push('/onboarding/setup')
            } else {
              console.log('🚀 Setup completed, redirecting to app shell')
              router.push('/shell')
            }
            return
          } else {
            console.log('❌ User has no paid subscription, staying on plans page', {
              hasPaidSubscription: data.hasPaidSubscription,
              success: data.success
            })
            setIsCheckingSubscription(false)
          }
        } else {
          console.error('❌ API request failed:', response.status, response.statusText)
          setIsCheckingSubscription(false)
        }
      } catch (error) {
        console.error('⚠️ Error checking subscription status:', error)
        console.log('⚠️ Could not check subscription status, allowing access to plans')
        setIsCheckingSubscription(false)
      }
    }
    
    checkPaymentStatus()

    // Countdown timer simulation
    const timer = setInterval(() => {
      const hours = Math.floor(Math.random() * 48) + 24 // Random between 24-72 hours
      setTimeLeft(`${hours} hours`)
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [user, loading, router])

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey)
  }

  const handleContinue = () => {
    if (!selectedPlan) return

    const plan = PRICING_CONFIG[selectedPlan as keyof typeof PRICING_CONFIG]

    // If it's a contact sales plan, open email instead of going to payment
    if (plan.contactSales) {
      handleContactSales()
      return
    }

    // Store selected plan in localStorage for payment page
    localStorage.setItem('selectedPlan', JSON.stringify({
      planKey: selectedPlan,
      ...plan
    }))

    router.push('/onboarding/payment')
  }

  const handleContactSales = () => {
    window.open('mailto:zunoki@zunoki.com?subject=Enterprise Plan Inquiry', '_blank')
  }


  // Dynamic pricing based on billing cycle
  const getPlanPricing = (planKey: string) => {
    const plan = PRICING_CONFIG[planKey as keyof typeof PRICING_CONFIG]

    // Handle Contact Sales plans
    if (plan.contactSales || !plan.price) {
      return {
        price: 0,
        inrPrice: 0,
        billing: 'contact',
        savings: 0
      }
    }

    if (isAnnual) {
      return {
        price: plan.price,
        inrPrice: plan.inrPrice,
        billing: 'annually',
        savings: 0
      }
    } else {
      // Monthly pricing (20-25% premium)
      const monthlyMultiplier = planKey === 'chat' ? 1.20 : 1.23
      const monthlyPrice = Math.round(plan.price * monthlyMultiplier)
      const monthlyInrPrice = Math.round(plan.inrPrice * monthlyMultiplier)
      const savings = (monthlyPrice * 12) - (plan.price * 12)
      return {
        price: monthlyPrice,
        inrPrice: monthlyInrPrice,
        billing: 'monthly',
        savings
      }
    }
  }

  if (loading) {
    console.log('📋 PlansPage - Auth loading, showing loading...')
    return <div className="flex justify-center items-center h-screen">Loading authentication...</div>
  }

  if (!user) {
    console.log('📋 PlansPage - No user after loading, should redirect...')
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>
  }

  if (isCheckingSubscription) {
    console.log('📋 PlansPage - Checking subscription status...')
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your subscription status...</p>
        </div>
      </div>
    )
  }
  
  console.log('📋 PlansPage - Rendering plans for user:', user.email)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Choose Your Perfect Plan 💎
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Based on your profile, we recommend the <strong>Business Plan</strong>
          </p>
          
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-muted p-1 rounded-full inline-flex">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  !isAnnual
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📅 Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                  isAnnual
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🏷️ Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          {/* Limited time offer banner */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-6 py-3 rounded-full border border-orange-300 mb-8">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              🚀 Early Access: Join the AI Revolution Today! 
            </span>
            <Badge variant="destructive" className="ml-2">
              ⏰ {timeLeft} left
            </Badge>
          </div>

        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(PRICING_CONFIG).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              plan={plan}
              isSelected={selectedPlan === key}
              onSelect={handlePlanSelect}
              getPlanPricing={getPlanPricing}
              isAnnual={isAnnual}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Why Choose Zunoki?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime, no contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>24/7 Zunoki AI assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Industry-first voice analytics</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleContinue}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              disabled={!selectedPlan}
            >
              {selectedPlan && PRICING_CONFIG[selectedPlan as keyof typeof PRICING_CONFIG]?.contactSales
                ? 'Contact Sales'
                : 'Continue to Payment'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              onClick={handleContactSales}
              variant="outline"
              size="lg"
              className="px-8"
            >
              💬 Contact Sales
            </Button>
          </div>

          <p className="text-sm text-gray-500 max-w-md mx-auto">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            Your subscription will auto-renew monthly unless cancelled.
          </p>
        </div>
      </div>
    </div>
  )
}