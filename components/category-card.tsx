import type React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CategoryCardProps {
  title: string
  icon: React.ReactNode
  description: string
  platforms: number
  color: string
}

export function CategoryCard({ title, icon, description, platforms, color }: CategoryCardProps) {
  return (
    <Link href={`/platforms?category=${title.toLowerCase()}`}>
      <div className="group relative overflow-hidden rounded-lg border bg-background p-4 transition-all hover:border-fuchsia-200 hover:shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <div className={cn("rounded-full bg-gradient-to-br p-2 text-white", color)}>{icon}</div>
          <span className="text-xs font-medium text-muted-foreground">{platforms} platforms</span>
        </div>
        <h3 className="font-semibold group-hover:text-fuchsia-600">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className={cn("absolute -right-12 -top-12 h-24 w-24 rounded-full bg-gradient-to-br opacity-10", color)} />
      </div>
    </Link>
  )
}
