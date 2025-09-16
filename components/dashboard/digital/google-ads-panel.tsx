"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { DollarSign, MousePointer, Eye, Target, Loader2, AlertCircle, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { fetchGoogleAdsData, connectGoogleAds, type GoogleAdsData } from "@/lib/google-ads-service"
import { useEnhancedGoogleAds } from "@/lib/services/enhanced-google-ads-service"
import { GoogleAdsReAuthModal } from "@/components/google-ads-reauth-modal"
import { GoogleAdsStatusIndicator } from "@/components/google-ads-status-indicator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const COLORS = ["hsl(var(--primary))", "#E600FF", "#5D00FF", "#00C4A7", "#FFB800"]

export function GoogleAdsPanel() {
  const { user } = useAuth()
  const { fetchCampaigns } = useEnhancedGoogleAds()
  const [data, setData] = useState<GoogleAdsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use enhanced service with automatic re-auth handling
      const response = await fetchCampaigns()
      
      if (response.success && response.data) {
        // Convert response to expected format
        const googleAdsData: GoogleAdsData = {
          connected: true,
          campaigns: response.data.campaigns,
          summary: response.data.summary,
          performanceData: response.data.performanceData
        }
        setData(googleAdsData)
      } else if (response.error?.code === 'GOOGLE_ADS_TOKEN_EXPIRED') {
        // Enhanced service will automatically show re-auth modal
        setError('Please reconnect your Google Ads account')
      } else {
        setError(response.error?.message || 'Failed to load Google Ads data')
      }
    } catch (err) {
      setError("Failed to load Google Ads data")
      console.error("Error fetching Google Ads data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      await connectGoogleAds()
      // For now, just show a success message
      setError(null)
      // In a real implementation, this would trigger the OAuth flow
      alert("Google Ads connection initiated. This would normally redirect to Google OAuth.")
    } catch (err) {
      setError("Failed to connect Google Ads account")
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading Google Ads data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div className="flex items-center gap-2">
              Google Ads
              <GoogleAdsStatusIndicator size="sm" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Google Ads Account</h3>
            <p className="text-muted-foreground mb-6">
              Securely connect your Google Ads account to view campaign performance, get AI insights, and optimize your
              advertising strategy. Your credentials are encrypted and stored securely.
            </p>
            <Button onClick={handleConnect} disabled={connecting} className="bg-blue-600 hover:bg-blue-700">
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Google Ads Securely"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              We use OAuth 2.0 for secure authentication. Your Google credentials are never stored on our servers.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { campaigns = [], summary, performanceData = [] } = data

  // Prepare chart data
  const campaignPerformanceData = campaigns.map((campaign) => ({
    name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + "..." : campaign.name,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    spend: campaign.cost,
    ctr: campaign.ctr,
  }))

  const statusData = campaigns.reduce(
    (acc, campaign) => {
      const status = campaign.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                  <p className="text-2xl font-bold">{summary.totalImpressions.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{summary.totalClicks.toLocaleString()}</p>
                </div>
                <MousePointer className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold">${summary.totalSpend.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average CTR</p>
                  <p className="text-2xl font-bold">{summary.averageCtr.toFixed(2)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Data */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                    <Bar dataKey="clicks" fill="#E600FF" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <Badge variant={campaign.status === "ENABLED" ? "default" : "secondary"}>{campaign.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-medium">{campaign.ctr.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spend</p>
                        <p className="font-medium">${campaign.cost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" name="Impressions" />
                  <Line type="monotone" dataKey="clicks" stroke="#E600FF" name="Clicks" />
                  <Line type="monotone" dataKey="spend" stroke="#5D00FF" name="Spend ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Re-authentication modal - automatically shows when token expires */}
      <GoogleAdsReAuthModal />
    </div>
  )
}
