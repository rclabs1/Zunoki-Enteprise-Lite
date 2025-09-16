"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Eye,
  MousePointer,
  ShoppingCart,
  TrendingUp,
  Tv,
  Building,
  Smartphone,
  Search,
  Filter,
} from "lucide-react"

export function AttributionHeatmap() {
  const touchpointData = [
    {
      stage: "Awareness",
      channels: [
        { name: "DOOH", impact: 85, conversions: 245, color: "bg-red-500" },
        { name: "Google Ads", impact: 72, conversions: 189, color: "bg-blue-500" },
        { name: "Meta Ads", impact: 68, conversions: 156, color: "bg-purple-500" },
        { name: "CTV", impact: 45, conversions: 98, color: "bg-green-500" },
      ],
    },
    {
      stage: "Consideration",
      channels: [
        { name: "Google Ads", impact: 92, conversions: 312, color: "bg-blue-500" },
        { name: "Meta Ads", impact: 78, conversions: 234, color: "bg-purple-500" },
        { name: "Marketplace", impact: 65, conversions: 167, color: "bg-orange-500" },
        { name: "DOOH", impact: 35, conversions: 89, color: "bg-red-500" },
      ],
    },
    {
      stage: "Conversion",
      channels: [
        { name: "Google Ads", impact: 88, conversions: 445, color: "bg-blue-500" },
        { name: "Marketplace", impact: 82, conversions: 378, color: "bg-orange-500" },
        { name: "Meta Ads", impact: 71, conversions: 289, color: "bg-purple-500" },
        { name: "CTV", impact: 28, conversions: 67, color: "bg-green-500" },
      ],
    },
  ]

  const crossChannelInsights = [
    {
      combination: "DOOH + Google Ads",
      lift: "+15%",
      impact: "Brand awareness campaigns drive 15% higher search volume",
      strength: "high",
    },
    {
      combination: "Meta + Marketplace",
      lift: "+12%",
      impact: "Social engagement increases marketplace conversion rates",
      strength: "high",
    },
    {
      combination: "CTV + Digital",
      lift: "+8%",
      impact: "Connected TV viewing correlates with mobile app usage",
      strength: "medium",
    },
  ]

  const getIntensityOpacity = (impact: number) => {
    if (impact >= 80) return "opacity-100"
    if (impact >= 60) return "opacity-75"
    if (impact >= 40) return "opacity-50"
    return "opacity-25"
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "Awareness":
        return Eye
      case "Consideration":
        return MousePointer
      case "Conversion":
        return ShoppingCart
      default:
        return Activity
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Attribution Heatmap</CardTitle>
              <p className="text-sm text-neutral-400 mt-1">Cross-channel touchpoint analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 bg-transparent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">15% Cross-channel lift</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="heatmap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-800 border border-neutral-700">
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white">
              Touchpoint Heatmap
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white">
              Cross-Channel Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="mt-6">
            <div className="space-y-6">
              {/* Heatmap Visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {touchpointData.map((stage, stageIndex) => {
                  const StageIcon = getStageIcon(stage.stage)
                  return (
                    <div key={stageIndex} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <StageIcon className="h-5 w-5 text-[hsl(var(--primary))]" />
                        <h3 className="font-semibold text-white">{stage.stage}</h3>
                      </div>
                      <div className="space-y-3">
                        {stage.channels.map((channel, channelIndex) => (
                          <div
                            key={channelIndex}
                            className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{channel.name}</span>
                              <span className="text-xs text-neutral-400">{channel.conversions} conv.</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-neutral-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${channel.color} ${getIntensityOpacity(channel.impact)}`}
                                  style={{ width: `${channel.impact}%` }}
                                />
                              </div>
                              <span className="text-xs text-white font-medium">{channel.impact}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Channel Performance Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-neutral-700">
                <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                  <Search className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">Google Ads</div>
                  <div className="text-sm text-blue-400">Top Performer</div>
                </div>
                <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                  <Building className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">DOOH</div>
                  <div className="text-sm text-red-400">Awareness Driver</div>
                </div>
                <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                  <Smartphone className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">Meta Ads</div>
                  <div className="text-sm text-purple-400">Engagement Leader</div>
                </div>
                <div className="text-center p-3 bg-neutral-800/30 rounded-lg">
                  <Tv className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">CTV</div>
                  <div className="text-sm text-green-400">Brand Builder</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-white mb-4">Key Cross-Channel Synergies</h3>
              {crossChannelInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{insight.combination}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          insight.strength === "high"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }
                      >
                        {insight.strength} impact
                      </Badge>
                      <span className="text-lg font-bold text-emerald-400">{insight.lift}</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300">{insight.impact}</p>
                </div>
              ))}

              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Optimization Opportunity</h4>
                    <p className="text-sm text-neutral-300">
                      Increase DOOH budget by 20% to maximize digital channel lift
                    </p>
                  </div>
                  <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Apply Optimization
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
