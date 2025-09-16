import type React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children, className, ...props }: DashboardHeaderProps) {
  return (
    <div
      className={cn("mb-6 flex flex-col gap-1 md:flex-row md:items-center md:justify-between", className)}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#333333]">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}
