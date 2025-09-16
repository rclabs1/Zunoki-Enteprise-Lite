"use client"

import { Badge } from '@/components/ui/badge'
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { IntegrationMetadata } from '@/lib/types/integrations'

interface IntegrationHealthBadgeProps {
  metadata: IntegrationMetadata
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export default function IntegrationHealthBadge({ 
  metadata, 
  size = 'md',
  showDetails = false 
}: IntegrationHealthBadgeProps) {
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'healthy', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle }
    if (score >= 60) return { status: 'warning', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle }
    return { status: 'critical', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
  }

  const { status, color, icon: Icon } = getHealthStatus(metadata.healthScore)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${color} ${sizeClasses[size]} flex items-center gap-1`}>
        <Icon className={iconSizes[size]} />
        Health: {metadata.healthScore}%
      </Badge>
      
      {showDetails && (
        <div className="text-xs text-gray-400">
          {metadata.totalConnected} connected • {Object.keys(metadata.byCategory).length} categories
        </div>
      )}
    </div>
  )
}