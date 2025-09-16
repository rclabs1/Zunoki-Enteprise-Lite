"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, Target, TrendingUp, Users, MapPin, Smartphone, Lightbulb } from "lucide-react"
import { FacebookInsightsService } from "@/lib/integrations/facebook-insights"
import { GoogleInsightsService } from "@/lib/integrations/google-insights"

interface AudienceInsightsPanelProps {
  className?: string
}

export default function AudienceInsightsPanel({ className }: AudienceInsightsPanelProps) {
  const [facebookData, setFacebookData] = useState<any>(null)
  const [googleData, setGoogleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const fbService = new FacebookInsightsService()
        const googleService = new GoogleInsightsService()

        const [fbData, gData] = await Promise.all([
          fbService.getAudienceInsights(''),
          googleService.getAudienceInsights('')
        ])

        setFacebookData(fbData)
        setGoogleData(gData)
      } catch (error) {
        console.error('Error loading insights:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [])

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-[#1f1f1f] border-[#333]">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-neutral-700 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-700 rounded w-3/4" />
                  <div className="h-4 bg-neutral-700 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Audience Cohort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#1f1f1f] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
              Current Audience Cohort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="demographics" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#141414]">
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="demographics" className="space-y-4">
                {facebookData?.cohorts?.[0] && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Age Distribution</h4>
                      {Object.entries(facebookData.cohorts[0].demographics.age_ranges).map(([range, percentage]) => (
                        <div key={range} className="flex items-center justify-between mb-1">
                          <span className="text-sm">{range}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage as number} className="w-16 h-2" />
                            <span className="text-sm text-gray-400">{percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Gender Split</h4>
                      {Object.entries(facebookData.cohorts[0].demographics.gender).map(([gender, percentage]) => (
                        <div key={gender} className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize">{gender}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage as number} className="w-16 h-2" />
                            <span className="text-sm text-gray-400">{percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                {facebookData?.cohorts?.[0] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Geographic Distribution</h4>
                    {Object.entries(facebookData.cohorts[0].demographics.locations).map(([location, percentage]) => (
                      <div key={location} className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage as number} className="w-16 h-2" />
                          <span className="text-sm text-gray-400">{percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="devices" className="space-y-4">
                {googleData?.target_groups?.[0] && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Device Usage</h4>
                    {Object.entries(googleData.target_groups[0].characteristics.device_usage).map(([device, percentage]) => (
                      <div key={device} className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm capitalize">{device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage as number} className="w-16 h-2" />
                          <span className="text-sm text-gray-400">{percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interests" className="space-y-4">
                {facebookData?.cohorts?.[0] && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Top Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {facebookData.cohorts[0].interests.map((interest: string) => (
                          <Badge key={interest} variant="secondary" className="bg-[#333] text-gray-300">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Behaviors</h4>
                      <div className="flex flex-wrap gap-2">
                        {facebookData.cohorts[0].behaviors.map((behavior: string) => (
                          <Badge key={behavior} variant="outline" className="border-[#555] text-gray-300">
                            {behavior}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Target Group Potential */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#1f1f1f] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
              Target Group Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            {googleData?.target_groups && (
              <div className="space-y-4">
                {googleData.target_groups.slice(0, 2).map((group: any, index: number) => (
                  <div key={group.id} className="p-4 bg-[#141414] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{group.name}</h4>
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        {(group.audience_size / 1000000).toFixed(1)}M reach
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Primary age: {Object.entries(group.characteristics.demographics.age_ranges)
                        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]}</p>
                      <p>Top location: {Object.keys(group.characteristics.geographic.countries)[0]}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {group.affinity_segments.slice(0, 3).map((segment: string) => (
                          <Badge key={segment} variant="outline" className="border-[#555] text-xs">
                            {segment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ICP Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-[#1f1f1f] border-[#333] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[hsl(var(--primary))]" />
              ICP Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#141414]">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <h4 className="text-sm font-medium">Campaign Recommendations</h4>
                  </div>
                  {facebookData?.ad_performance?.recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="p-3 bg-[#141414] rounded border-l-2 border-[hsl(var(--primary))]">
                      <p className="text-sm text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <h4 className="text-sm font-medium">Distribution Planning</h4>
                  </div>
                  {googleData?.performance_insights?.optimization_recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="p-3 bg-[#141414] rounded border-l-2 border-green-500">
                      <p className="text-sm text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="marketplace" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium">Marketplace & Integration Hub Usage</h4>
                  </div>
                  <div className="p-3 bg-[#141414] rounded border-l-2 border-blue-500">
                    <p className="text-sm text-gray-300">
                      Consider targeting similar businesses in the {googleData?.icp_patterns?.primary_characteristics?.industries?.[0]} industry
                    </p>
                  </div>
                  <div className="p-3 bg-[#141414] rounded border-l-2 border-blue-500">
                    <p className="text-sm text-gray-300">
                      Users with {googleData?.icp_patterns?.secondary_characteristics?.experience} show higher engagement with automation tools
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}