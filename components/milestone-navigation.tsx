"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface MilestoneNavigationProps {
  steps: {
    id: number
    title: string
    description: string
  }[]
  currentStep: number
  onStepClick?: (stepId: number) => void
}

export function MilestoneNavigation({ steps, currentStep, onStepClick }: MilestoneNavigationProps) {
  const [activeStep, setActiveStep] = useState(currentStep)
  const [openDialog, setOpenDialog] = useState<number | null>(null)

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId)
    setOpenDialog(stepId)
    if (onStepClick) {
      onStepClick(stepId)
    }
  }

  const getDialogContent = (stepId: number) => {
    switch (stepId) {
      case 1: // Discover/Select Media
        return (
          <>
            <DialogHeader>
              <DialogTitle>Discover/Select Media</DialogTitle>
              <DialogDescription>
                Choose from our wide range of media categories to reach your target audience effectively.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-auto flex flex-col p-4 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#D005D3]/10 flex items-center justify-center">
                  <span className="text-[#D005D3] font-bold">DOOH</span>
                </div>
                <span>Digital Out-of-Home</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col p-4 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#5D00FF]/10 flex items-center justify-center">
                  <span className="text-[#5D00FF] font-bold">DIG</span>
                </div>
                <span>Digital</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col p-4 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#00C2FF]/10 flex items-center justify-center">
                  <span className="text-[#00C2FF] font-bold">CTV</span>
                </div>
                <span>Connected TV</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col p-4 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#D005D3]/10 flex items-center justify-center">
                  <span className="text-[#D005D3] font-bold">APP</span>
                </div>
                <span>App Brands</span>
              </Button>
            </div>
            <div className="flex justify-end">
              <Button className="bg-[#D005D3] hover:bg-[#D005D3]/90">Continue</Button>
            </div>
          </>
        )
      case 2: // Buy Media
        return (
          <>
            <DialogHeader>
              <DialogTitle>Buy Media</DialogTitle>
              <DialogDescription>Select quantities and complete your purchase.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Digital Package</h3>
                    <p className="text-sm text-muted-foreground">Social, Search, Display</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 h-8 rounded border px-2"
                      defaultValue="1000"
                      min="100"
                      step="100"
                    />
                    <span className="text-sm">impressions</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price per 1000 impressions:</span>
                    <span>₹215</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>₹215,000</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Credit Card
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Debit Card
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    UPI
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-[#D005D3] hover:bg-[#D005D3]/90">Proceed to Payment</Button>
            </div>
          </>
        )
      case 3: // Create Ads/Upload
        return (
          <>
            <DialogHeader>
              <DialogTitle>Create Ads/Upload</DialogTitle>
              <DialogDescription>Upload your creative assets or create new ones with our AI tools.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-auto flex flex-col p-6 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#5D00FF]/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#5D00FF]"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <span className="font-medium">Upload Existing Creative</span>
                <span className="text-xs text-muted-foreground">Drag & drop or browse files</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col p-6 items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#D005D3]/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#D005D3]"
                  >
                    <path d="M12 2v8"></path>
                    <path d="m4.93 10.93 1.41 1.41"></path>
                    <path d="M2 18h2"></path>
                    <path d="M20 18h2"></path>
                    <path d="m19.07 10.93-1.41 1.41"></path>
                    <path d="M22 22H2"></path>
                    <path d="m16 6-4 4-4-4"></path>
                    <path d="M16 18a4 4 0 0 0-8 0"></path>
                  </svg>
                </div>
                <span className="font-medium">Build with Gen AI</span>
                <span className="text-xs text-muted-foreground">Create ads with AI assistance</span>
              </Button>
            </div>
          </>
        )
      case 4: // Distribute & Go Live
        return (
          <>
            <DialogHeader>
              <DialogTitle>Distribute & Go Live</DialogTitle>
              <DialogDescription>Review your campaign and launch it to your audience.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Campaign Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Creative Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Payment Processed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Targeting Configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Distribution Pending</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-[#D005D3]/5">
                <h3 className="font-medium mb-2">Ready to Launch</h3>
                <p className="text-sm mb-4">Your campaign is ready to go live. Click the button below to launch.</p>
                <Button className="w-full bg-[#D005D3] hover:bg-[#D005D3]/90">Go Live Now</Button>
              </div>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between">
        {/* Progress Bar */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-muted">
          <div
            className="h-full bg-[#D005D3] transition-all duration-500"
            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        {/* Steps */}
        {steps.map((step) => (
          <Dialog key={step.id} open={openDialog === step.id} onOpenChange={(open) => !open && setOpenDialog(null)}>
            <DialogTrigger asChild>
              <div
                className={cn(
                  "relative flex flex-col items-center cursor-pointer",
                  step.id < activeStep
                    ? "text-[#D005D3]"
                    : step.id === activeStep
                      ? "text-[#D005D3]"
                      : "text-muted-foreground",
                )}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-current">
                  {step.id < activeStep ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : step.id === activeStep ? (
                    <div className="h-3 w-3 rounded-full bg-[#D005D3] animate-pulse"></div>
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">{getDialogContent(step.id)}</DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}
