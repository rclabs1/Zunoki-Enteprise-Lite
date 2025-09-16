"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Facebook,
  ShoppingCart,
  Tv,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  RefreshCw,
} from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useState } from "react"
import { toast } from "sonner"

export function ModularPerformancePanels() {
  const { getPerformancePanelData, refreshPlatform, isLoading } = useDashboardData();
  const platformData = getPerformancePanelData();
  const [applyingAction, setApplyingAction] = useState<string | null>(null);

  const handleApplySuggestion = async (platform: string, action: string, index: number) => {
    const actionKey = `${platform}-${index}`;
    setApplyingAction(actionKey);
    
    try {
      // Simulate API call to apply the suggestion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Applied: ${action}`);
      
      // Refresh platform data
      await refreshPlatform(platform);
    } catch (error) {
      toast.error('Failed to apply suggestion');
      console.error('Error applying suggestion:', error);
    } finally {
      setApplyingAction(null);
    }
  };

  const handleSyncCampaigns = async () => {
    setApplyingAction('sync-campaigns');
    
    try {
      // Call sync API
      const response = await fetch('/api/campaigns/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success('Campaigns synced successfully');
        await refreshPlatform('all');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync campaigns');
      console.error('Error syncing campaigns:', error);
    } finally {
      setApplyingAction(null);
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const googleAdsData = {
    metrics: {
      impressions: platformData?.googleAds?.metrics?.impressions ? formatNumber(platformData.googleAds.metrics.impressions) : "0",
      clicks: platformData?.googleAds?.metrics?.clicks ? formatNumber(platformData.googleAds.metrics.clicks) : "0",
      ctr: platformData?.googleAds?.metrics?.ctr ? `${platformData.googleAds.metrics.ctr.toFixed(1)}%` : "0%",
      cpc: platformData?.googleAds?.metrics?.cpc ? `₹${platformData.googleAds.metrics.cpc.toFixed(2)}` : "₹0",
      roas: platformData?.googleAds?.metrics?.roas ? `${platformData.googleAds.metrics.roas.toFixed(1)}x` : "0x",
      spend: platformData?.googleAds?.metrics?.spend ? `₹${formatNumber(platformData.googleAds.metrics.spend)}` : "₹0",
    },
    connected: platformData?.googleAds?.connected || false,
    alerts: [
      { type: "opportunity", message: "Budget utilization at 85% - consider increasing", impact: "+₹12K potential" },
      { type: "warning", message: "CTR declining in mobile campaigns", impact: "Review ad copy" },
    ],
    suggestions: [
      { action: "Increase budget by 25%", confidence: 92, impact: "+₹12K revenue" },
      { action: "Pause underperforming keywords", confidence: 87, impact: "Save ₹3K/week" },
    ],
  }

  const metaAdsData = {
    metrics: {
      reach: platformData?.metaAds?.metrics?.reach ? formatNumber(platformData.metaAds.metrics.reach) : "0",
      impressions: platformData?.metaAds?.metrics?.impressions ? formatNumber(platformData.metaAds.metrics.impressions) : "0",
      ctr: platformData?.metaAds?.metrics?.ctr ? `${platformData.metaAds.metrics.ctr.toFixed(1)}%` : "0%",
      cpm: platformData?.metaAds?.metrics?.cpm ? `₹${platformData.metaAds.metrics.cpm.toFixed(2)}` : "₹0",
      roas: platformData?.metaAds?.metrics?.roas ? `${platformData.metaAds.metrics.roas.toFixed(1)}x` : "0x",
      spend: platformData?.metaAds?.metrics?.spend ? `₹${formatNumber(platformData.metaAds.metrics.spend)}` : "₹0",
    },
    connected: platformData?.metaAds?.connected || false,
    alerts: [
      { type: "alert", message: "Creative fatigue detected in 3 ad sets", impact: "Refresh needed" },
      { type: "success", message: "Lookalike audiences performing well", impact: "+15% CTR" },
    ],
    suggestions: [
      { action: "Upload new creative assets", confidence: 89, impact: "+0.4% CTR" },
      { action: "Expand lookalike audience", confidence: 84, impact: "+20% reach" },
    ],
  }

  const marketplaceData = {
    partners: [
      { name: "Zomato", impact: "High", conversions: 234, roas: "4.1x", status: "active" },
      { name: "Zepto", impact: "Medium", conversions: 156, roas: "3.5x", status: "active" },
      { name: "Blinkit", impact: "High", conversions: 189, roas: "3.8x", status: "pending" },
    ],
    totalAttribution: "₹45,680",
    topPerformer: "Zomato",
    avgRoas: "3.8x",
  }

  const doohCtvData = {
    metrics: {
      brandLift: "+18%",
      reachLift: "+25%",
      digitalSynergy: "+15%",
      impressions: "5.2M",
      frequency: "3.2",
      spend: "₹89,450",
    },
    insights: [
      { metric: "Cross-channel lift", value: "+15%", trend: "up" },
      { metric: "Brand awareness", value: "+18%", trend: "up" },
      { metric: "Search volume lift", value: "+22%", trend: "up" },
    ],
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-neutral-400" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "opportunity":
        return "bg-emerald-500/10 border-emerald-500/20"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20"
      case "alert":
        return "bg-red-500/10 border-red-500/20"
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20"
      default:
        return "bg-neutral-500/10 border-neutral-500/20"
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
          Performance Panels
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="google-ads" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-neutral-800 border border-neutral-700">
            <TabsTrigger value="google-ads" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white">
              <Search className="h-4 w-4 mr-2" />
              Google Ads
            </TabsTrigger>
            <TabsTrigger value="meta-ads" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white">
              <Facebook className="h-4 w-4 mr-2" />
              Meta Ads
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="dooh-ctv" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white">
              <Tv className="h-4 w-4 mr-2" />
              DOOH/CTV
            </TabsTrigger>
          </TabsList>

          {/* Google Ads Panel */}
          <TabsContent value="google-ads" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">Impressions</span>
                  <Eye className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{googleAdsData.metrics.impressions}</div>
                <div className="text-xs text-emerald-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5%
                </div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">CTR</span>
                  <MousePointer className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{googleAdsData.metrics.ctr}</div>
                <div className="text-xs text-red-400 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -0.2%
                </div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">ROAS</span>
                  <DollarSign className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{googleAdsData.metrics.roas}</div>
                <div className="text-xs text-emerald-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.8x
                </div>
              </div>
            </div>

            {/* Live Alerts */}
            <div>
              <h4 className="font-medium text-white mb-3">Live Alerts</h4>
              <div className="space-y-2">
                {googleAdsData.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-neutral-400 mt-1">{alert.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maya's Suggestions */}
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Zap className="h-4 w-4 text-[hsl(var(--primary))] mr-2" />
                Maya's Suggestions
              </h4>
              <div className="space-y-3">
                {googleAdsData.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{suggestion.action}</p>
                      <p className="text-xs text-emerald-400 mt-1">{suggestion.impact}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-neutral-400">Confidence:</span>
                        <Progress value={suggestion.confidence} className="w-16 h-1" />
                        <span className="text-xs text-neutral-400">{suggestion.confidence}%</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleApplySuggestion('google-ads', suggestion.action, index)}
                      disabled={applyingAction === `google-ads-${index}`}
                      className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white ml-4"
                    >
                      {applyingAction === `google-ads-${index}` ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Meta Ads Panel */}
          <TabsContent value="meta-ads" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">Reach</span>
                  <Eye className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{metaAdsData.metrics.reach}</div>
                <div className="text-xs text-emerald-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.3%
                </div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">CTR</span>
                  <MousePointer className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{metaAdsData.metrics.ctr}</div>
                <div className="text-xs text-yellow-400 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -0.1%
                </div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-400">ROAS</span>
                  <DollarSign className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-lg font-bold text-white">{metaAdsData.metrics.roas}</div>
                <div className="text-xs text-emerald-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.3x
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3">Live Alerts</h4>
              <div className="space-y-2">
                {metaAdsData.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-neutral-400 mt-1">{alert.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Zap className="h-4 w-4 text-[hsl(var(--primary))] mr-2" />
                Maya's Suggestions
              </h4>
              <div className="space-y-3">
                {metaAdsData.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{suggestion.action}</p>
                      <p className="text-xs text-emerald-400 mt-1">{suggestion.impact}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-neutral-400">Confidence:</span>
                        <Progress value={suggestion.confidence} className="w-16 h-1" />
                        <span className="text-xs text-neutral-400">{suggestion.confidence}%</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleApplySuggestion('meta-ads', suggestion.action, index)}
                      disabled={applyingAction === `meta-ads-${index}`}
                      className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white ml-4"
                    >
                      {applyingAction === `meta-ads-${index}` ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Marketplace Panel */}
          <TabsContent value="marketplace" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Total Attribution</span>
                <div className="text-lg font-bold text-white">{marketplaceData.totalAttribution}</div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Top Performer</span>
                <div className="text-lg font-bold text-white">{marketplaceData.topPerformer}</div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Avg ROAS</span>
                <div className="text-lg font-bold text-white">{marketplaceData.avgRoas}</div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Active Partners</span>
                <div className="text-lg font-bold text-white">3</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3">Partner Performance</h4>
              <div className="space-y-3">
                {marketplaceData.partners.map((partner, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {partner.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{partner.name}</p>
                        <p className="text-xs text-neutral-400">{partner.conversions} conversions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{partner.roas}</div>
                      <Badge
                        className={
                          partner.impact === "High"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }
                      >
                        {partner.impact} Impact
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* DOOH/CTV Panel */}
          <TabsContent value="dooh-ctv" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Brand Lift</span>
                <div className="text-lg font-bold text-white">{doohCtvData.metrics.brandLift}</div>
                <div className="text-xs text-emerald-400">vs baseline</div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Digital Synergy</span>
                <div className="text-lg font-bold text-white">{doohCtvData.metrics.digitalSynergy}</div>
                <div className="text-xs text-emerald-400">cross-channel lift</div>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-sm text-neutral-400">Impressions</span>
                <div className="text-lg font-bold text-white">{doohCtvData.metrics.impressions}</div>
                <div className="text-xs text-emerald-400">+25% reach lift</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3">Key Insights</h4>
              <div className="space-y-3">
                {doohCtvData.insights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
                    <span className="text-sm text-white">{insight.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-emerald-400">{insight.value}</span>
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white mb-1">Cross-Channel Optimization</h4>
                  <p className="text-sm text-neutral-300">DOOH campaigns are driving 15% lift in digital performance</p>
                </div>
                <Button 
                  onClick={handleSyncCampaigns}
                  disabled={applyingAction === 'sync-campaigns'}
                  className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${applyingAction === 'sync-campaigns' ? 'animate-spin' : ''}`} />
                  {applyingAction === 'sync-campaigns' ? 'Syncing...' : 'Sync Campaigns'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
