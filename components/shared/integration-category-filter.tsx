"use client"

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { IntegrationStatus } from '@/lib/types/integrations'

interface IntegrationCategoryFilterProps {
  integrations: IntegrationStatus[]
  onFilterChange: (filtered: IntegrationStatus[]) => void
  showConnectedOnly?: boolean
}

export default function IntegrationCategoryFilter({
  integrations,
  onFilterChange,
  showConnectedOnly = false
}: IntegrationCategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [connectedOnly, setConnectedOnly] = useState(showConnectedOnly)

  // Get unique categories with counts
  const categories = integrations.reduce((acc, integration) => {
    const category = integration.category || 'other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    applyFilters(category, connectedOnly)
  }

  const handleConnectedToggle = () => {
    const newConnectedOnly = !connectedOnly
    setConnectedOnly(newConnectedOnly)
    applyFilters(selectedCategory, newConnectedOnly)
  }

  const applyFilters = (category: string, connected: boolean) => {
    let filtered = integrations

    if (category !== 'all') {
      filtered = filtered.filter(integration => integration.category === category)
    }

    if (connected) {
      filtered = filtered.filter(integration => integration.connected)
    }

    onFilterChange(filtered)
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setConnectedOnly(false)
    onFilterChange(integrations)
  }

  const hasActiveFilters = selectedCategory !== 'all' || connectedOnly

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filter Integrations</span>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
        <TabsList className="bg-[#141414] flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#333]">
            All
            <Badge variant="secondary" className="ml-1 bg-[#333] text-xs">
              {integrations.length}
            </Badge>
          </TabsTrigger>
          
          {Object.entries(categories).map(([category, count]) => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="data-[state=active]:bg-[#333] capitalize"
            >
              {category}
              <Badge variant="secondary" className="ml-1 bg-[#333] text-xs">
                {count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          variant={connectedOnly ? "default" : "outline"}
          size="sm"
          onClick={handleConnectedToggle}
          className={connectedOnly 
            ? "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white" 
            : "border-[#333] text-gray-300 hover:bg-[#333]"
          }
        >
          Connected Only
        </Button>
        
        <span className="text-xs text-gray-500">
          {connectedOnly 
            ? `${integrations.filter(i => i.connected).length} connected`
            : `${integrations.length} total`
          }
        </span>
      </div>
    </div>
  )
}