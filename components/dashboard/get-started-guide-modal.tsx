"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  X,
  Sparkles,
  Target,
  Users,
  TrendingUp,
  Settings,
  Zap,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: "pending" | "in_progress" | "completed"
  action?: {
    text: string
    href?: string
    onClick?: () => void
  }
  estimatedTime: string
  priority: "high" | "medium" | "low"
}

interface GetStartedGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onStepComplete?: (stepId: string) => void
  onGetStarted?: () => void
  className?: string
}

const defaultSteps: OnboardingStep[] = [
  {
    id: "connect-platforms",
    title: "Connect Your Advertising Platforms",
    description: "Link your Google Ads, Meta Ads, and other marketing platforms to start tracking performance in one place.",
    icon: Target,
    status: "pending",
    action: {
      text: "Connect Platforms",
      href: "/audience"
    },
    estimatedTime: "5 min",
    priority: "high"
  },
  {
    id: "setup-audiences",
    title: "Define Your Target Audiences",
    description: "Create and segment your audiences based on demographics, behavior, and conversion data.",
    icon: Users,
    status: "pending",
    action: {
      text: "Setup Audiences",
      href: "/audience"
    },
    estimatedTime: "10 min",
    priority: "high"
  },
  {
    id: "configure-maya",
    title: "Configure Maya AI Assistant",
    description: "Set up Maya to provide personalized insights and recommendations based on your business goals.",
    icon: Sparkles,
    status: "pending",
    action: {
      text: "Configure Maya",
      href: "/settings/maya"
    },
    estimatedTime: "3 min",
    priority: "medium"
  },
  {
    id: "create-campaign",
    title: "Create Your First Campaign",
    description: "Launch a data-driven campaign using Maya's recommendations and audience insights.",
    icon: Zap,
    status: "pending",
    action: {
      text: "Create Campaign",
      href: "/campaigns/create"
    },
    estimatedTime: "15 min",
    priority: "medium"
  },
  {
    id: "setup-tracking",
    title: "Set Up Performance Tracking",
    description: "Configure conversion tracking and attribution models to measure campaign effectiveness.",
    icon: TrendingUp,
    status: "pending",
    action: {
      text: "Setup Tracking",
      href: "/analytics/setup"
    },
    estimatedTime: "8 min",
    priority: "low"
  },
  {
    id: "customize-dashboard",
    title: "Customize Your Dashboard",
    description: "Organize your dashboard widgets and metrics to match your workflow and priorities.",
    icon: Settings,
    status: "pending",
    action: {
      text: "Customize Dashboard",
      href: "/dashboard/settings"
    },
    estimatedTime: "5 min",
    priority: "low"
  }
]

export default function GetStartedGuideModal({
  isOpen,
  onClose,
  onStepComplete,
  onGetStarted,
  className
}: GetStartedGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps)

  const currentStep = steps[currentStepIndex]
  const completedSteps = steps.filter(step => step.status === "completed").length
  const progressPercentage = (completedSteps / steps.length) * 100

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: "completed" as const }
        : step
    ))
    
    if (onStepComplete) {
      onStepComplete(stepId)
    }
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleStepAction = () => {
    if (currentStep.action?.onClick) {
      currentStep.action.onClick()
    } else if (currentStep.action?.href) {
      // Handle navigation
      if (onGetStarted) {
        onGetStarted()
      }
      onClose()
    }
  }

  const handleSkipToStep = (index: number) => {
    setCurrentStepIndex(index)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-3xl bg-[#88e7ae] border-[#88e7ae] text-black overflow-hidden",
        className
      )}>
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: "Welcome to Admolabs Intelligence with <sub className=\"text-[0.7rem] align-middle\">powering Agent Maya</sub> Platform" }} />
              <DialogDescription className="text-gray-700 text-base">
                Let's get you set up with your attribution and audience intelligence dashboard
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-700 hover:text-black"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-700">
                {completedSteps}/{steps.length} completed
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-white/30"
            />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Navigation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-black mb-4">Setup Steps</h3>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStepIndex
                const isCompleted = step.status === "completed"
                
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => handleSkipToStep(index)}
                    whileHover={{ x: 2 }}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all duration-200 text-left",
                      isActive ? "bg-white/20 border-gray-600" : 
                      isCompleted ? "bg-emerald-500/20 border-emerald-600" :
                      "bg-white/10 border-gray-500 hover:border-gray-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isCompleted ? "bg-emerald-500/30" :
                        isActive ? "bg-white/30" : "bg-white/20"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Icon className={cn(
                            "h-4 w-4",
                            isActive ? "text-black" : "text-gray-700"
                          )} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          isActive ? "text-black" :
                          isCompleted ? "text-emerald-700" : "text-gray-700"
                        )}>
                          {step.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getPriorityColor(step.priority)}>
                            {step.priority}
                          </Badge>
                          <span className="text-xs text-gray-700">
                            {step.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Current Step Detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                      <currentStep.icon className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">
                        {currentStep.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getPriorityColor(currentStep.priority)}>
                          {currentStep.priority} priority
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-700">
                          ~{currentStep.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>

                {/* Step-specific content */}
                <div className="p-6 bg-white/20 rounded-lg border border-gray-600">
                  {currentStep.id === "connect-platforms" && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-black">Supported Platforms</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Google Ads", icon: "🎯" },
                          { name: "Meta Ads", icon: "📘" },
                          { name: "YouTube", icon: "📺" },
                          { name: "LinkedIn", icon: "💼" }
                        ].map((platform) => (
                          <div key={platform.name} className="flex items-center gap-3 p-3 bg-white/30 rounded-lg border border-gray-600">
                            <span className="text-lg">{platform.icon}</span>
                            <span className="text-sm text-gray-800">{platform.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep.id === "setup-audiences" && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-black">Audience Types</h4>
                      <div className="space-y-2">
                        {[
                          "Demographic segments",
                          "Behavioral audiences", 
                          "Custom conversions",
                          "Lookalike audiences"
                        ].map((type) => (
                          <div key={type} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-gray-800">{type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep.id === "configure-maya" && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-black">Maya AI Features</h4>
                      <div className="space-y-2">
                        {[
                          "Personalized insights and recommendations",
                          "Automated budget optimization suggestions",
                          "Audience discovery and expansion",
                          "Performance anomaly detection"
                        ].map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-gray-800">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    className="bg-white/20 border-gray-600 hover:bg-white/30 text-gray-800 hover:text-black"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-3">
                    {currentStep.status !== "completed" && (
                      <Button
                        variant="outline"
                        onClick={() => handleStepComplete(currentStep.id)}
                        className="bg-white/20 border-gray-600 hover:bg-white/30 text-gray-800 hover:text-black"
                      >
                        Mark Complete
                      </Button>
                    )}
                    
                    {currentStep.action && (
                      <Button
                        onClick={handleStepAction}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {currentStep.action.text}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}

                    {currentStepIndex < steps.length - 1 && (
                      <Button
                        onClick={handleNext}
                        className="bg-black hover:bg-gray-800 text-white"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        {completedSteps === steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg border border-emerald-500/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <h3 className="font-semibold text-black">Setup Complete!</h3>
            </div>
            <p className="text-gray-800 mb-4">
              You're all set! Your Maya Intelligence Platform is ready to help you optimize your campaigns and discover new audience opportunities.
            </p>
            <Button
              onClick={onClose}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Start Using Maya
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}