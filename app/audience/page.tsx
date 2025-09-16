"use client"

import { useState, Suspense } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Download, Brain, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTrackPageView } from "@/hooks/use-track-page-view"
import { useAudienceData } from "@/hooks/useAudienceData"
import AudienceErrorBoundary from "@/components/audience/audience-error-boundary"
import AudienceStatsCards from "@/components/audience/audience-stats-cards"
import AudienceList from "@/components/audience/audience-list"
import AudienceInsightsPanel from "@/components/audience/audience-insights-panel"
import IntegrationsPanelOptimized from "@/components/audience/integrations-panel-optimized"

export default function AudiencePage() {
  useTrackPageView("Audience Intelligence")
  const { audiences, stats, loading, error, refetch } = useAudienceData()
  
  const [isCreateAudienceModalOpen, setIsCreateAudienceModalOpen] = useState(false)
  const [newAudienceName, setNewAudienceName] = useState("")
  const [newAudienceDescription, setNewAudienceDescription] = useState("")
  const [isCreatingAudience, setIsCreatingAudience] = useState(false)

  const handleCreateAudience = async () => {
    if (!newAudienceName.trim()) {
      alert("Audience name cannot be empty.")
      return
    }

    setIsCreatingAudience(true)
    try {
      const response = await fetch('/api/create-user-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAudienceName,
          description: newAudienceDescription,
          attributes: {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create audience')
      }

      await response.json()
      await refetch() // Refresh the data
      setIsCreateAudienceModalOpen(false)
      setNewAudienceName("")
      setNewAudienceDescription("")
    } catch (err: any) {
      console.error('Error creating audience:', err)
      alert(err.message || 'Failed to create audience')
    } finally {
      setIsCreatingAudience(false)
    }
  }

  return (
    <ProtectedRoute>
      <AudienceErrorBoundary>
        <div className="min-h-screen netflix-bg netflix-scrollbar">
          {/* Netflix-inspired background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#1a1a1a] to-[#0d0d0d] pointer-events-none" />
          
          <div className="relative z-10 p-6 space-y-8">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl"
                  >
                    <Brain className="h-6 w-6 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold netflix-text-gradient">Audience Intelligence</h1>
                </div>
                <p className="text-[#cccccc] text-lg">
                  Create, analyze, and optimize your target audiences with AI-powered insights
                </p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center flex-wrap gap-3"
              >
                <Badge className="bg-[#333333] text-[#cccccc] border-[#404040] px-3 py-1.5">
                  <Eye className="h-3 w-3 mr-1" />
                  {stats.totalAudiences} Segments
                </Badge>
                <Button className="netflix-btn-secondary">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button className="netflix-btn-secondary">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Dialog open={isCreateAudienceModalOpen} onOpenChange={setIsCreateAudienceModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Audience
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-[#1f1f1f] text-white border-[#333]">
                    <DialogHeader>
                      <DialogTitle>Create New Audience</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Define a new audience segment. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-gray-300">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newAudienceName}
                          onChange={(e) => setNewAudienceName(e.target.value)}
                          className="col-span-3 bg-[#141414] border-[#333] text-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right text-gray-300">
                          Description
                        </Label>
                        <Input
                          id="description"
                          value={newAudienceDescription}
                          onChange={(e) => setNewAudienceDescription(e.target.value)}
                          className="col-span-3 bg-[#141414] border-[#333] text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={handleCreateAudience}
                        className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
                        disabled={isCreatingAudience}
                      >
                        {isCreatingAudience ? "Saving..." : "Save Audience"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </motion.div>

            {/* Audience Stats */}
            <Suspense fallback={<AudienceStatsCards stats={stats} loading={true} />}>
              <AudienceStatsCards stats={stats} loading={loading} />
            </Suspense>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Column - Audience List & Integrations */}
              <div className="xl:col-span-2 space-y-8">
                <Suspense fallback={<AudienceList audiences={[]} loading={true} error={null} />}>
                  <AudienceList audiences={audiences} loading={loading} error={error} />
                </Suspense>
                
                <Suspense fallback={<div className="animate-pulse bg-neutral-800 h-96 rounded-lg" />}>
                  <IntegrationsPanelOptimized />
                </Suspense>
              </div>

              {/* Right Column - Insights Panel */}
              <div className="xl:col-span-2">
                <Suspense fallback={<div className="animate-pulse bg-neutral-800 h-96 rounded-lg" />}>
                  <AudienceInsightsPanel />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </AudienceErrorBoundary>
    </ProtectedRoute>
  )
}
