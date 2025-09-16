"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface NotificationCardProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  isNew: boolean
  priority?: "low" | "medium" | "high"
  actionText?: string
  onAction?: () => void
}

export function NotificationCard({
  icon,
  title,
  description,
  time,
  isNew,
  priority = "medium",
  actionText,
  onAction,
}: NotificationCardProps) {
  // Get priority color
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      case "medium":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
      case "low":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/20">
      <div className={`rounded-full p-2 ${getPriorityColor()}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {isNew && <Badge className="bg-[#D005D3]">New</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{time}</p>
          {actionText && (
            <Button variant="link" size="sm" className="h-auto p-0 text-[#D005D3] text-xs" onClick={onAction}>
              {actionText}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
