"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Filter, AlertCircle, Loader2 } from "lucide-react"

interface AudienceInsight {
  id: string
  user_id: string
  platform: string
  segment_name: string
  segment_type?: string
  description?: string
  size?: number
  data?: any
  created_at: string
  updated_at: string
}

interface AudienceListProps {
  audiences: AudienceInsight[]
  loading: boolean
  error: string | null
}

const AudienceItem = ({ audience, index }: { audience: AudienceInsight, index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center justify-between p-4 bg-[#141414] rounded-lg hover:bg-[#1a1a1a] transition-colors"
  >
    <div className="flex items-center space-x-4">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] flex items-center justify-center">
        <Users className="h-5 w-5 text-white" />
      </div>
      <div>
        <h4 className="font-medium text-white">{audience.segment_name}</h4>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>{audience.size ? `${audience.size.toLocaleString()} users` : 'Size N/A'}</span>
          <span>•</span>
          <span>{audience.segment_type || 'N/A'}</span>
          <span>•</span>
          <span>
            {audience.platform === 'google_ads' ? 'Google Ads' : 
             audience.platform === 'google_analytics' ? 'Google Analytics' : 
             audience.platform === 'meta_ads' ? 'Meta Ads' : 
             audience.platform}
          </span>
          <span>•</span>
          <span>Updated {new Date(audience.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <Badge
        className={
          audience.platform === 'google_ads' || audience.platform === 'meta_ads'
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-yellow-500/20 text-yellow-400"
        }
      >
        {audience.platform === 'google_ads' || audience.platform === 'meta_ads' ? 'Active' : 'Inactive'}
      </Badge>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-gray-400 hover:text-white hover:bg-[#333]"
      >
        View Details
      </Button>
    </div>
  </motion.div>
)

const LoadingState = () => (
  <div className="flex items-center justify-center h-32">
    <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
    <p className="ml-3 text-neutral-400">Loading audiences...</p>
  </div>
)

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center h-32 text-red-400">
    <AlertCircle className="h-8 w-8 mb-2" />
    <p>Error: {error}</p>
    <p className="text-sm text-neutral-500 mt-1">
      Please ensure your ad accounts are connected and configured correctly.
    </p>
  </div>
)

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
    <Users className="h-8 w-8 mb-2" />
    <p>No audiences found.</p>
    <p className="text-sm text-neutral-500">
      Connect your ad accounts to see your audience insights here.
    </p>
  </div>
)

export default function AudienceList({ audiences, loading, error }: AudienceListProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-[#1f1f1f] border-[#333] text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Audiences</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-[#333] text-gray-300 hover:bg-[#333] hover:text-white"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <LoadingState />}
          {error && <ErrorState error={error} />}
          {!loading && !error && audiences.length === 0 && <EmptyState />}
          {!loading && !error && audiences.length > 0 && (
            <div className="space-y-4">
              {audiences.map((audience, index) => (
                <AudienceItem 
                  key={audience.id} 
                  audience={audience} 
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}