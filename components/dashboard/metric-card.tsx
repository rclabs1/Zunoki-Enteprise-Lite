"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
  category?: string
  loading?: boolean
  className?: string
  onClick?: () => void
}

export default function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  category,
  loading = false,
  className,
  onClick
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-accent"
      case "down":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return TrendingUp
      case "down":
        return TrendingDown
      default:
        return Minus
    }
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <Card className={cn("bg-card border-border hover:border-border/50 transition-all duration-200", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
            <div className="h-8 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "bg-card border-border hover:border-border/50 transition-all duration-200 group hover:shadow-lg",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {category && (
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    {category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-2 bg-secondary rounded-lg group-hover:bg-secondary/80 transition-colors duration-200">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            
            {change && (
              <div className="flex items-center gap-1">
                <TrendIcon className={cn("h-3 w-3", getTrendColor())} />
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs last period</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}