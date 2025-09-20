"use client"

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMaya } from '@/contexts/maya-context'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, CreditCard, User, MessageCircle } from 'lucide-react'

interface NavigationBarProps {
  currentModule: string | null
  onModuleSelect: (module: string) => void
}

export function NavigationBar({ currentModule, onModuleSelect }: NavigationBarProps) {
  const { navigateToModule } = useMaya()
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    // Simple immediate logout without complex async handling
    logout().catch(error => {
      console.error('Logout error:', error)
    }).finally(() => {
      // Always redirect regardless of logout success/failure
      window.location.href = '/'
    })
  }

  const modules = [
    { id: 'zunoki-intelligence', label: 'Zunoki Intelligence', icon: '🧠', description: 'AI-Powered Intelligent Analytics' },
    { id: 'conversations', label: 'Inbox', icon: '💬', description: 'Unified Inbox' },
    { id: 'campaigns', label: 'Broadcasts', icon: '📱', description: 'Message Campaigns' },
    { id: 'platforms', label: 'Connect Platforms', icon: '🔗', description: 'Connect Messaging Platforms' },
    { id: 'ad-hub', label: 'Ad Hub', icon: '📺', description: 'Connect & Analyze Ad Platforms' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒', description: 'Agent Marketplace' },
    { id: 'agent-builder', label: 'Builder', icon: '🔧', description: 'Classic Agent Builder' },
    { id: 'setup', label: 'Setup', icon: '🚀', description: 'Platform Integration Setup' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Configuration' }
  ]

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === 'setup') {
      // Navigate directly to setup page
      router.push('/onboarding/setup')
    } else {
      // Handle all other modules through shell navigation
      onModuleSelect(moduleId)
      navigateToModule(moduleId)
    }
  }

  return (
    <div className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-8">
              <Link href="/" className="block hover:opacity-80 transition-opacity">
                <h2 className="text-xl font-bold text-primary">
                  Zunoki.
                </h2>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  Agentic Intelligence. Unified Growth.
                </p>
              </Link>
            </div>
          </div>

          {/* Navigation Modules */}
          <nav className="flex space-x-3 ml-20">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentModule === module.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                title={module.description}
              >
                <span className="mr-2">{module.icon}</span>
                {module.label}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">User menu</span>
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => router.push('/onboarding/plans')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plans & Billing</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => router.push('/connect-messaging')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Connect Messaging</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}