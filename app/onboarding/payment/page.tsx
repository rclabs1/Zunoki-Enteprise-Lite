'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { 
  CreditCard, 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  Lock,
  Smartphone,
  Building,
  Wallet
} from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SelectedPlan {
  planKey: string
  name: string
  price: number
  inrPrice: number
  currency: string
  features: string[]
}

export default function PaymentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [finalAmount, setFinalAmount] = useState<number>(0)
  const [userCurrency, setUserCurrency] = useState<'USD' | 'INR'>('USD')
  const [exchangeRate] = useState<number>(88) // Current USD to INR rate

  useEffect(() => {
    if (!user) {
      router.push('/signup')
      return
    }

    // Detect user's country/currency based on timezone or locale
    const detectUserCurrency = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const isIndian = timezone.includes('Asia/Kolkata') || 
                         timezone.includes('Asia/Calcutta') ||
                         navigator.language?.includes('hi') ||
                         navigator.language?.includes('en-IN')
        return isIndian ? 'INR' : 'USD'
      } catch {
        return 'USD' // Default fallback
      }
    }

    const currency = detectUserCurrency()
    setUserCurrency(currency)
    console.log('🌍 Detected currency:', currency, 'Exchange rate:', exchangeRate)

    // Load selected plan from localStorage
    const planData = localStorage.getItem('selectedPlan')
    if (!planData) {
      router.push('/onboarding/plans')
      return
    }

    try {
      const plan = JSON.parse(planData)
      setSelectedPlan(plan)
      
      // Set amount based on user's currency
      const amount = currency === 'INR' ? plan.price * exchangeRate : plan.price
      console.log('💰 Setting initial amount:', { 
        planPrice: plan.price, 
        currency, 
        exchangeRate, 
        calculatedAmount: amount 
      })
      setFinalAmount(amount)
      
      // Pre-fill customer info from user data
      setCustomerInfo({
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      })
    } catch (error) {
      console.error('Invalid plan data:', error)
      router.push('/onboarding/plans')
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [user, router])

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  // Coupon validation function
  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan || !user) return

    setIsValidatingCoupon(true)
    setCouponError('')

    try {
      const requestAmount = userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price
      console.log('🎫 Coupon validation request:', { 
        code: couponCode.trim(),
        planKey: selectedPlan.planKey,
        amount: requestAmount,
        currency: userCurrency,
        selectedPlanPrice: selectedPlan.price,
        exchangeRate 
      })
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          planKey: selectedPlan.planKey,
          amount: userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price,
          currency: userCurrency
        })
      })

      const data = await response.json()

      if (data.valid && data.coupon) {
        // The coupon API now returns amounts in the correct currency, no conversion needed
        setAppliedCoupon(data.coupon)
        setFinalAmount(data.coupon.finalAmount)
        setCouponError('')
        
        console.log('🎫 Coupon applied:', {
          currency: data.coupon.currency,
          originalAmount: data.coupon.originalAmount,
          discountAmount: data.coupon.discountAmount,
          finalAmount: data.coupon.finalAmount
        })
      } else {
        setCouponError(data.error || 'Invalid coupon code')
        setAppliedCoupon(null)
        // Reset to base amount in user's currency
        const amount = userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price
        setFinalAmount(amount)
      }
    } catch (error) {
      setCouponError('Failed to validate coupon')
      setAppliedCoupon(null)
      const amount = userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price
      setFinalAmount(amount)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    if (selectedPlan) {
      const amount = userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price
      setFinalAmount(amount)
    }
  }

  const handlePayment = async () => {
    if (!selectedPlan || !user) return

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields')
      return
    }

    setIsProcessing(true)

    try {
      // Create Razorpay order
      const paymentAmount = Math.round(Math.abs(finalAmount))
      console.log('💳 Payment request:', {
        finalAmount,
        roundedAmount: paymentAmount,
        currency: userCurrency,
        planKey: selectedPlan.planKey
      })
      
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          planKey: selectedPlan.planKey,
          amount: Math.round(Math.abs(finalAmount)), // Ensure positive integer for Razorpay
          originalAmount: Math.round(Math.abs(userCurrency === 'INR' ? selectedPlan.price * exchangeRate : selectedPlan.price)), // Store original price in user's currency  
          currency: userCurrency,
          customerInfo,
          // Include coupon information if applied
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            discountApplied: selectedPlan.price - finalAmount
          })
        })
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      // Configure Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Zunoki Agentic Platform',
        description: `${selectedPlan.name} Plan Subscription`,
        image: '/favicon.ico',
        order_id: orderData.order.id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          }
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planKey: selectedPlan.planKey
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              // Store payment info for success page
              localStorage.setItem('paymentSuccess', JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                planKey: selectedPlan.planKey,
                planName: selectedPlan.name,
                amount: selectedPlan.price
              }))
              
              router.push('/onboarding/success')
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            alert('Payment verification failed. Please contact support.')
          } finally {
            setIsProcessing(false)
          }
        }
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error: any) {
      console.error('Payment initiation error:', error)
      alert(error.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleBackToPlans = () => {
    router.push('/onboarding/plans')
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    )
  }

  // Calculate discount amount for display in user's currency
  const discountAmount = appliedCoupon ? 
    (userCurrency === 'INR' ? 
      selectedPlan.price * exchangeRate - finalAmount : 
      selectedPlan.price - finalAmount) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Complete Your Purchase 💳
          </h1>
          <p className="text-gray-600">
            Secure payment powered by Razorpay
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPlan.name} Plan (Monthly)</span>
                <span className="font-bold">
                  {userCurrency === 'INR' ? '₹' : '$'}
                  {userCurrency === 'INR' ? Math.round(selectedPlan.price * exchangeRate) : selectedPlan.price}
                </span>
              </div>

              {/* Coupon Input Section */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">
                  🎟️ Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter coupon code..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1"
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <Button
                      type="button"
                      onClick={validateCoupon}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      className="px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeCoupon}
                      className="px-4"
                    >
                      ❌ Remove
                    </Button>
                  )}
                </div>

                {/* Coupon Status Messages */}
                {couponError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    ❌ {couponError}
                  </p>
                )}

                {appliedCoupon && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                      ✅ Coupon "{appliedCoupon.code}" Applied!
                    </p>
                    <p className="text-sm text-green-700">
                      🎉 {appliedCoupon.name} - {appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}% off` 
                        : `$${appliedCoupon.discountValue} off`}
                    </p>
                  </div>
                )}

                {/* Popular Offers (only show public coupons) */}
                {!appliedCoupon && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">🏷️ Popular Offers</h4>
                    <div className="space-y-1 text-xs text-blue-800">
                      <div className="flex justify-between">
                        <span>🚀 EARLY50 - 50% off early adopters</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎉 LAUNCH25 - 25% off launch special</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎓 STUDENT20 - 20% off for students</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Display */}
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{userCurrency === 'INR' ? '₹' : '$'}{Math.round(discountAmount).toFixed(2)}</span>
                </div>
              )}
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Today:</span>
                <span className="text-blue-600">
                  {userCurrency === 'INR' ? '₹' : '$'}{Math.round(finalAmount).toFixed(2)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {userCurrency === 'USD' && (
                  <p>₹{Math.round(finalAmount * exchangeRate)} (INR equivalent)</p>
                )}
                {userCurrency === 'INR' && (
                  <p>${(finalAmount / exchangeRate).toFixed(2)} (USD equivalent)</p>
                )}
                <p className="mt-2">
                  Next billing (Month 4): {userCurrency === 'INR' ? '₹' : '$'}
                  {userCurrency === 'INR' ? Math.round(selectedPlan.price * exchangeRate) : selectedPlan.price}
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What's Included:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  {selectedPlan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {selectedPlan.features.length > 5 && (
                    <li className="text-blue-600 font-medium">
                      + {selectedPlan.features.length - 5} more features...
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                Secure Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Payment Options */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Payment Options
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>UPI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Net Banking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span>Wallets</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing || !customerInfo.name || !customerInfo.email}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay {userCurrency === 'INR' ? '₹' : '$'}{Math.round(finalAmount)} Securely
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleBackToPlans}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Plans
                </Button>
              </div>

              {/* Security Notice */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p className="flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secured by Razorpay • SSL Encrypted
                </p>
                <p>Your payment information is secure and encrypted</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}