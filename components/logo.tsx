import Link from "next/link"
import { Bot } from "lucide-react"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export function Logo({ className = "", size = "md", showTagline = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
        <Bot className={`${iconSizeClasses[size]} text-primary-foreground`} />
      </div>
      <div className="flex flex-col">
        <span className={`${textSizeClasses[size]} font-bold leading-none text-primary`}>
          Admolabs
        </span>
        {showTagline && (
          <span className="text-xs text-muted-foreground font-medium">
            Agentic Intelligence Platform
          </span>
        )}
      </div>
    </Link>
  )
}
