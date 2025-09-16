import type { ReactNode } from "react"

interface DashboardShellProps {
  children: ReactNode
  className?: string
}

export function DashboardShell({ children, className = "" }: DashboardShellProps) {
  return <div className={`min-h-screen bg-background ${className}`}>{children}</div>
}

export default DashboardShell
