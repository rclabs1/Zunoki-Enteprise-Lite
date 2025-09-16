"use client"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-xl border border-border bg-background hover:bg-accent hover:scale-105 transition-all duration-300 group"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
          
          {/* Subtle glow effect */}
          <div className="
            absolute inset-0 rounded-xl
            bg-gradient-to-r from-primary/20 to-accent/20
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out
            -z-10 blur-lg scale-110
          " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-card border-border/50">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="hover:bg-accent/50 transition-colors duration-200"
        >
          <Sun className="mr-2 h-4 w-4 text-primary" />
          <span>Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="hover:bg-accent/50 transition-colors duration-200"
        >
          <Moon className="mr-2 h-4 w-4 text-primary" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="hover:bg-accent/50 transition-colors duration-200"
        >
          <Monitor className="mr-2 h-4 w-4 text-accent-foreground" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple toggle version for compact spaces
export function ThemeToggleSimple() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-xl border border-border bg-background hover:bg-accent hover:scale-105 transition-all duration-300 group"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
      
      {/* Subtle glow effect */}
      <div className="
        absolute inset-0 rounded-xl
        bg-gradient-to-r from-primary/20 to-accent/20
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300 ease-out
        -z-10 blur-lg scale-110
      " />
    </Button>
  )
}
