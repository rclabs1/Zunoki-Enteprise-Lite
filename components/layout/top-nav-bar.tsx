"use client"

import { Bell, Search, Settings, User, LogOut, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

const notifications = [
  {
    title: "New feature unlocked!",
    description: "You can now use Smart Agentic Automation.",
    read: false,
  },
  {
    title: "Campaign 'Summer Sale' is live",
    description: "Your new campaign has been successfully launched.",
    read: true,
  },
  {
    title: "Weekly report is ready",
    description: "Your performance summary for last week is available.",
    read: true,
  },
];

export function TopNavBar() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter((n) => !n.read).length
  );

  const handleSignOut = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 nav-modern">
      <div className="container flex h-16 items-center px-6">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Logo />
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center px-8">
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, analytics..."
                className="pl-10 modern-input border-border/50 focus:border-primary focus:ring-primary/20 w-full"
              />
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 glass-card border-border/50"
              align="end"
            >
              <DropdownMenuLabel className="font-semibold">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {notifications.map((notification, index) => (
                <DropdownMenuItem
                  key={index}
                  className="hover:bg-accent/50 focus:bg-accent/50 flex items-start gap-3 transition-colors duration-200"
                >
                  <div className="mt-1">
                    {!notification.read ? (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-chart-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200"
            aria-label="Settings"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-accent transition-all duration-200">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={userProfile?.avatar_url || undefined}
                    alt={userProfile?.displayName || "User"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-card border-border/50" align="end" forceMount>
              <DropdownMenuItem className="hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200" onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200" onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors duration-200" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
