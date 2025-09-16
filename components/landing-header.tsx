"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles, ChevronDown, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ThemeToggleSimple } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function LandingHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleDashboardClick = () => {
    if (user) {
      router.push("/shell")
    } else {
      router.push("/login")
    }
  }

  const handleSignInClick = () => {
    router.push("/login")
  }

  const handleCreateAccountClick = () => {
    router.push("/signup")
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none text-primary">
              Zunoki.
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Agentic Intelligence. Unified Growth.
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/#platform" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Platform
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          
          {/* Resources Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
              Resources
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 p-2">
              <DropdownMenuItem className="cursor-pointer p-3">
                <div className="font-medium">Help Center</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer p-3">
                <div className="font-medium">Documentation</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer p-3">
                <div className="font-medium">Blog</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer p-3">
                <div className="font-medium">About Us</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer p-3">
                <div className="font-medium">Contact</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggleSimple />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 p-2" align="end">
                <DropdownMenuItem 
                  onClick={handleDashboardClick}
                  className="cursor-pointer p-3"
                >
                  <Sparkles className="h-4 w-4 mr-3" />
                  <span className="font-medium">Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer p-3 text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSignInClick} className="text-foreground hover:text-primary">
                Sign In
              </Button>
              <Button onClick={handleCreateAccountClick} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
