"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Home,
  ShoppingCart,
  Plug,
  Target,
  FileText,
  PlusCircle,
  TrendingUp,
  User,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Smart Agentic Automation", href: "/SmartAgenticAutomation", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingCart },
  { name: "Integration Hub", href: "/IntegrationHub", icon: Plug },
  { name: "Audience Intelligence", href: "/audience", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const { logout } = useAuth()

  // Hide sidebar on homepage and ensure no space is taken
  if (pathname === "/" || pathname === "/landing" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-sidebar/95 backdrop-blur-lg border-r border-border/50 transition-all duration-300 ease-in-out",
        isHovered ? "w-64" : "w-16",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full py-4">
        <nav className="flex-1 space-y-2 px-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ease-out group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn("ml-3 transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Create Campaign Button */}
        <div className="px-3 pb-4">
          <Link
            href="/SmartAgenticAutomation/create"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105",
              !isHovered && "justify-center",
            )}
          >
            <PlusCircle className="h-5 w-5 flex-shrink-0" />
            <span className={cn("ml-3 transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
              Create Campaign
            </span>
          </Link>
        </div>

        {/* Sign Out Button */}
        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 mt-auto cursor-pointer px-3 py-2 rounded-xl transition-all duration-200 w-full hover:bg-destructive/10",
              !isHovered && "justify-center",
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn("transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
