"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Zap,
  BarChart3,
  Lightbulb,
  Settings,
  PlayCircle,
  X,
  Sparkles,
  Target,
  TrendingUp,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  feature: string
  tip?: string
}

interface OnboardingWalkthroughProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  className?: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Zunoki",
    description: "Let's take a quick tour of your unified marketing automation platform",
    feature: "Get Started",
    icon: Sparkles,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Zunoki Enterprise
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Zunoki Enterprise connects WhatsApp Business, Gmail, Telegram, and SMS into one powerful AI-driven platform.
            Let's explore the enterprise features that will transform your customer communications and business operations.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/20 rounded-lg border border-gray-300">
            <Users className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-800 mb-1">AI Conversations</h4>
            <p className="text-xs text-gray-600">AI-powered chat enablement to conversion</p>
          </div>
          <div className="p-4 bg-white/20 rounded-lg border border-gray-300">
            <TrendingUp className="h-6 w-6 text-emerald-600 mb-2" />
            <h4 className="font-medium text-gray-800 mb-1">Multi-Platform Messaging</h4>
            <p className="text-xs text-gray-600">WhatsApp Business, Gmail, Telegram, SMS in one place</p>
          </div>
          <div className="p-4 bg-white/20 rounded-lg border border-gray-300">
            <Zap className="h-6 w-6 text-orange-600 mb-2" />
            <h4 className="font-medium text-gray-800 mb-1">Business Intelligence</h4>
            <p className="text-xs text-gray-600">Enterprise analytics and advanced insights dashboard</p>
          </div>
          <div className="p-4 bg-white/20 rounded-lg border border-gray-300">
            <Target className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-800 mb-1">Enterprise Automation</h4>
            <p className="text-xs text-gray-600">Advanced workflow and process automation</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "connect-platforms",
    title: "Connect Your Business Platforms",
    description: "Link WhatsApp Business, Gmail, and other messaging platforms",
    feature: "Platform Integration",
    icon: Zap,
    tip: "Start with WhatsApp Business for immediate customer engagement",
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-200 rounded-lg flex items-center justify-center">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-700">
            Connect your business messaging platforms to enable Zunoki Enterprise's AI automation.
            The more platforms you connect, the more unified and powerful your enterprise communications become.
          </p>
        </div>
        
        <div className="space-y-3">
          {[
            { name: "AI Powered Chat Widget", icon: "💬", status: "connected", data: "AI-powered website chat for conversions" },
            { name: "WhatsApp Business", icon: "📱", status: "connected", data: "Customer conversations and support" },
            { name: "Gmail Integration", icon: "📧", status: "connected", data: "Email marketing and automation" },
            { name: "Telegram Bot", icon: "📱", status: "available", data: "Telegram messaging and groups" },
            { name: "SMS Gateway", icon: "📨", status: "available", data: "SMS campaigns and notifications" }
          ].map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                platform.status === "connected" 
                  ? "bg-emerald-100 border-emerald-300" 
                  : "bg-white/30 border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{platform.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{platform.name}</span>
                    {platform.status === "connected" && (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{platform.data}</p>
                </div>
              </div>
              
              <Badge className={
                platform.status === "connected" 
                  ? "bg-emerald-200 text-emerald-800 border-emerald-400"
                  : "bg-blue-200 text-blue-800 border-blue-400"
              }>
                {platform.status === "connected" ? "Connected" : "Connect"}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "reading-dashboard",
    title: "Understanding Your Dashboard",
    description: "Learn how to navigate your conversation insights and metrics",
    feature: "Business Dashboard",
    icon: BarChart3,
    tip: "Monitor response times and customer satisfaction to optimize your communication",
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-200 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-gray-700">
            Your enterprise dashboard features a unified inbox that consolidates all conversations from connected platforms.
            Zunoki Enterprise automatically tracks customer interactions, response patterns, chat-to-conversion metrics, and business performance data in real-time.
          </p>
        </div>
        
        <div className="bg-white/30 rounded-lg p-4 border border-gray-300">
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Key Metrics to Watch</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Messages Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Response Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Chat-to-Conversion Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Unified Inbox Activity</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Avg Response Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Customer Satisfaction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Active Conversations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-gray-800">Conversion Value</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Pro Tip</h4>
              <p className="text-sm text-gray-700">
                Monitor peak conversation hours to optimize your team availability. 
                Most customers expect responses within 2 hours during business hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ai-automation",
    title: "AI-Powered Automation",
    description: "Zunoki analyzes conversations and provides smart response suggestions",
    feature: "Smart AI",
    icon: Lightbulb,
    tip: "Enable AI responses for common questions to improve response times",
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-200 rounded-lg flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-gray-700">
            Zunoki Enterprise continuously learns from your conversations and suggests optimal responses.
            Each suggestion is tailored to your enterprise business tone and customer context.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-red-200 rounded">
                <Target className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800 text-sm">Long Response Time Alert</span>
                  <Badge className="bg-red-200 text-red-800 border-red-400 text-xs">High Priority</Badge>
                  <Badge className="bg-gray-200 text-gray-700 border-gray-400 text-xs">92% Confidence</Badge>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  Customer waiting 2+ hours. Consider enabling auto-responses for common questions.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-6 text-xs bg-gray-800 text-white hover:bg-gray-700">
                    Enable Auto-Reply
                  </Button>
                  <span className="text-xs text-emerald-600">Improve satisfaction by 40%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-emerald-200 rounded">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800 text-sm">Engagement Opportunity</span>
                  <Badge className="bg-emerald-200 text-emerald-800 border-emerald-400 text-xs">Medium Priority</Badge>
                  <Badge className="bg-gray-200 text-gray-700 border-gray-400 text-xs">87% Confidence</Badge>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  Customers are 40% more active on weekends. Consider weekend campaigns.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-6 text-xs bg-gray-800 text-white hover:bg-gray-700">
                    Schedule Campaign
                  </Button>
                  <span className="text-xs text-emerald-600">+34% engagement potential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "automation",
    title: "Explore Automation Features",
    description: "Set up Smart Automation to handle customer conversations automatically",
    feature: "Smart Automation",
    icon: Settings,
    tip: "Start with auto-greetings - they create great first impressions",
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-200 rounded-lg flex items-center justify-center">
            <Settings className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-gray-700">
            Zunoki Enterprise's Smart Automation can handle customer conversations 24/7, providing
            instant responses and routing complex queries to your enterprise team with advanced workflow capabilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-white/30 rounded-lg border border-gray-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-200 rounded">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Auto-Greetings</h4>
                <p className="text-xs text-gray-600">Automatically welcome new customers with personalized messages</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-200 text-emerald-800 border-emerald-400 text-xs">
                Recommended
              </Badge>
              <Button size="sm" variant="outline" className="h-6 text-xs bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200">
                Enable
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-white/30 rounded-lg border border-gray-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-200 rounded">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Smart Routing</h4>
                <p className="text-xs text-gray-600">Route conversations to the right team members automatically</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-200 text-blue-800 border-blue-400 text-xs">
                Available
              </Badge>
              <Button size="sm" variant="outline" className="h-6 text-xs bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200">
                Setup
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-white/30 rounded-lg border border-gray-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-200 rounded">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">AI Voice Responses</h4>
                <p className="text-xs text-gray-600">Generate voice messages automatically with natural speech</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-200 text-yellow-800 border-yellow-400 text-xs">
                Pro Feature
              </Badge>
              <Button size="sm" variant="outline" className="h-6 text-xs bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200">
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
]

export default function OnboardingWalkthrough({
  isOpen,
  onClose,
  onComplete,
  className
}: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('maya-onboarding-completed')
    if (hasSeenOnboarding && !isOpen) {
      return
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsCompleted(true)
    localStorage.setItem('maya-onboarding-completed', 'true')
    if (onComplete) {
      onComplete()
    }
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const handleSkip = () => {
    localStorage.setItem('maya-onboarding-completed', 'true')
    onClose()
  }

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100
  const step = onboardingSteps[currentStep]

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "max-w-md bg-[#88e7ae] border-[#88e7ae] text-gray-800",
          className
        )}>
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 bg-emerald-200 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">You're All Set!</h3>
            <p className="text-gray-700 mb-6">
              Welcome to Zunoki Enterprise! Start exploring your unified enterprise marketing automation platform.
            </p>
            <Button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              Start Optimizing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-lg max-h-[80vh] bg-[#88e7ae] border-[#88e7ae] text-gray-800 overflow-hidden",
        className
      )}>
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold" dangerouslySetInnerHTML={{ __html: step.title }} />
              <p className="text-gray-700 text-sm">
                {step.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-700 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
              <Badge className="bg-white/30 text-gray-800 border-gray-400">
                {step.feature}
              </Badge>
            </div>
            <Progress value={progress} className="h-2 bg-white/30" />
          </div>
        </DialogHeader>

        <div className="py-6 max-h-[50vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step.content}
            </motion.div>
          </AnimatePresence>

          {step.tip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-400 mb-1">Tip</h4>
                  <p className="text-sm text-gray-300">{step.tip}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="bg-white/30 border-gray-400 hover:bg-white/50 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep
                    ? "bg-gray-800"
                    : index < currentStep
                    ? "bg-emerald-600"
                    : "bg-white/50"
                )}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            {currentStep === onboardingSteps.length - 1 ? (
              <>
                Complete
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}