"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CreditCard,
  Check,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  X,
  ArrowRight,
  Gift
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingPlan {
  id: string
  name: string
  credits: number
  price: number
  originalPrice?: number
  period: string
  popular?: boolean
  features: string[]
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

interface CreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentCredits: number
  creditLimit: number
  onUpgrade?: (planId: string) => void
  className?: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 50,
    price: 999,
    period: "month",
    features: [
      "50 AI insights per month",
      "Basic campaign optimization",
      "Email support",
      "3 platform connections",
      "Standard analytics"
    ],
    icon: Zap,
    color: "blue",
    description: "Perfect for small businesses getting started"
  },
  {
    id: "professional",
    name: "Professional",
    credits: 200,
    price: 2999,
    originalPrice: 3999,
    period: "month",
    popular: true,
    features: [
      "200 AI insights per month",
      "Advanced campaign automation",
      "Priority support",
      "Unlimited platform connections",
      "Advanced analytics & reporting",
      "Custom audience builder",
      "A/B testing tools"
    ],
    icon: Crown,
    color: "purple",
    description: "Most popular for growing marketing teams"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 1000,
    price: 9999,
    originalPrice: 12999,
    period: "month",
    features: [
      "1000 AI insights per month",
      "White-label solutions",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced security & compliance",
      "Custom reporting & dashboards",
      "API access",
      "Team collaboration tools"
    ],
    icon: Star,
    color: "gold",
    description: "Enterprise-grade solution for large organizations"
  }
]

const creditUsageBenefits = [
  {
    icon: Target,
    title: "Smart Campaign Optimization",
    description: "AI-powered budget allocation and bid management"
  },
  {
    icon: Users,
    title: "Audience Intelligence",
    description: "Advanced audience segmentation and targeting insights"
  },
  {
    icon: TrendingUp,
    title: "Performance Predictions",
    description: "Forecast campaign performance and ROI predictions"
  },
  {
    icon: Sparkles,
    title: "Creative Suggestions",
    description: "AI-generated ad copy and creative recommendations"
  }
]

export default function CreditsModal({
  isOpen,
  onClose,
  currentCredits,
  creditLimit,
  onUpgrade,
  className
}: CreditsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const creditUsagePercentage = (currentCredits / creditLimit) * 100
  const creditsRemaining = creditLimit - currentCredits

  const getPlanColor = (color: string, variant: 'bg' | 'border' | 'text') => {
    const colors = {
      blue: {
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
        text: "text-blue-400"
      },
      purple: {
        bg: "bg-purple-500/20",
        border: "border-purple-500/30", 
        text: "text-purple-400"
      },
      gold: {
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
        text: "text-yellow-400"
      }
    }
    return colors[color as keyof typeof colors]?.[variant] || colors.blue[variant]
  }

  const handleUpgrade = async (planId: string) => {
    if (!onUpgrade) return
    
    setIsLoading(true)
    try {
      await onUpgrade(planId)
      onClose()
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-6xl bg-[#0a0a0a] border-[#1a1a1a] text-white overflow-hidden max-h-[90vh] overflow-y-auto",
        className
      )}>
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
                Credits & Pricing
              </DialogTitle>
              <p className="text-gray-400">
                Upgrade your plan to unlock more AI-powered insights and automation
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Current Usage */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Current Usage</h3>
                <Badge className={cn(
                  "px-3 py-1",
                  creditsRemaining < 5 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  creditsRemaining < 15 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                  "bg-green-500/20 text-green-400 border-green-500/30"
                )}>
                  {creditsRemaining} credits remaining
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Credits Used</span>
                  <span className="text-white font-medium">
                    {currentCredits} / {creditLimit}
                  </span>
                </div>
                
                <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${creditUsagePercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      creditUsagePercentage > 90 ? "bg-red-500" :
                      creditUsagePercentage > 75 ? "bg-yellow-500" : "bg-emerald-500"
                    )}
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  Credits reset monthly on your billing cycle
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What Credits Unlock */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">What Credits Unlock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditUsageBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#333]"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                    <benefit.icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">{benefit.title}</h4>
                    <p className="text-sm text-gray-400">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pricing Plans */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Choose Your Plan</h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Gift className="h-3 w-3 mr-1" />
                25% OFF First Month
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => {
                const Icon = plan.icon
                const isSelected = selectedPlan === plan.id
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="relative"
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-purple-500 text-white px-3 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <Card 
                      className={cn(
                        "relative overflow-hidden transition-all duration-200 cursor-pointer",
                        isSelected 
                          ? "bg-[#1a1a1a] border-purple-500/50 ring-2 ring-purple-500/30" 
                          : "bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#333]",
                        plan.popular && "border-purple-500/30"
                      )}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn(
                            "p-2 rounded-lg",
                            getPlanColor(plan.color, 'bg')
                          )}>
                            <Icon className={cn("h-5 w-5", getPlanColor(plan.color, 'text'))} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{plan.name}</h4>
                            <p className="text-sm text-gray-400">{plan.description}</p>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="mb-6">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">
                              {formatPrice(plan.price)}
                            </span>
                            <span className="text-gray-400">/{plan.period}</span>
                            {plan.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(plan.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-xs",
                              getPlanColor(plan.color, 'bg'),
                              getPlanColor(plan.color, 'border'),
                              getPlanColor(plan.color, 'text')
                            )}>
                              {plan.credits} credits/month
                            </Badge>
                            {plan.originalPrice && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Save {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 mb-6">
                          {plan.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isLoading}
                          className={cn(
                            "w-full transition-all",
                            plan.popular 
                              ? "bg-purple-600 hover:bg-purple-700 text-white" 
                              : "bg-white text-black hover:bg-gray-100"
                          )}
                        >
                          {isLoading ? (
                            "Processing..."
                          ) : (
                            <>
                              Upgrade to {plan.name}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* FAQ or Additional Info */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-6">
              <h4 className="font-semibold text-white mb-3">Frequently Asked Questions</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-300 font-medium">How do credits work?</p>
                  <p className="text-gray-400">Credits are consumed when Maya AI generates insights, optimizations, or predictions. Each action costs 1 credit.</p>
                </div>
                <div>
                  <p className="text-gray-300 font-medium">Can I change plans anytime?</p>
                  <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                </div>
                <div>
                  <p className="text-gray-300 font-medium">What happens to unused credits?</p>
                  <p className="text-gray-400">Unused credits expire at the end of your billing cycle. We recommend upgrading if you consistently run out.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}