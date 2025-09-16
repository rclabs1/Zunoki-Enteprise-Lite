"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

interface InsightCardProps {
  icon: React.ReactNode
  title: string
  description: string
  actionText: string
  isNew?: boolean
  priority?: "low" | "medium" | "high"
  detailedContent?: React.ReactNode
}

export function InsightCard({
  icon,
  title,
  description,
  actionText,
  isNew = false,
  priority = "medium",
  detailedContent,
}: InsightCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get priority color
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "bg-[#D005D3]/10 text-[#D005D3]"
      case "medium":
        return "bg-[#5D00FF]/10 text-[#5D00FF]"
      case "low":
        return "bg-[#00C2FF]/10 text-[#00C2FF]"
      default:
        return "bg-[#5D00FF]/10 text-[#5D00FF]"
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/20">
      <div className={`rounded-full p-2 ${getPriorityColor()}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold">{title}</h3>
          {isNew && <Badge className="bg-[#D005D3]">New</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="mt-1 h-auto p-0 text-[#D005D3]">
              {actionText}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {detailedContent ? (
                detailedContent
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <div className="rounded-lg border p-4 bg-muted/10">
                    <h4 className="font-medium mb-2">AI Recommendation</h4>
                    <p className="text-sm">
                      Based on your campaign data, we recommend taking action to address this insight. Our AI analysis
                      suggests this could improve your campaign performance significantly.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-[#D005D3] hover:bg-[#D005D3]/90 text-white">Apply Recommendation</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
