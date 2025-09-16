"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChevronRight,
  Eye,
  Tv,
  Users,
  Filter,
  Search,
  ArrowUpDown,
  Smartphone,
  Monitor,
  Grid3X3,
  Cpu,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useCampaignStore, type Campaign } from "@/lib/campaign-store"

const categoryIcons = {
  Digital: <Smartphone className="h-5 w-5" />,
  CTV: <Tv className="h-5 w-5" />,
  DOOH: <Monitor className="h-5 w-5" />,
  App: <Grid3X3 className="h-5 w-5" />,
  "Smart Devices": <Cpu className="h-5 w-5" />,
  "Streaming TV": <Tv className="h-5 w-5" />,
  "Meta Ads": <Users className="h-5 w-5" />,
  "Social Media": <Users className="h-5 w-5" />,
  "Multi-channel": <Eye className="h-5 w-5" />,
}

const categoryColors = {
  Digital: "from-blue-500 to-purple-600",
  CTV: "from-red-500 to-pink-600",
  DOOH: "from-green-500 to-teal-600",
  App: "from-orange-500 to-yellow-600",
  "Smart Devices": "from-purple-500 to-indigo-600",
  "Streaming TV": "from-red-500 to-pink-600",
  "Meta Ads": "from-blue-500 to-purple-600",
  "Social Media": "from-blue-500 to-purple-600",
  "Multi-channel": "from-purple-500 to-indigo-600",
}

export function ActiveCampaigns() {
  const { campaigns } = useCampaignStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Mock campaigns for demo
  const mockCampaigns: Campaign[] = [
    {
      id: "1",
      name: "Zepto Office Launch",
      type: "Streaming TV",
      brand: "Hotstar",
      status: "active",
      budget: {
        spent: 12500,
        allocated: 50000,
      },
      metrics: {
        impressions: "1.2M",
        ctr: "2.1%",
        reach: "850K",
      },
      targetGroup: ["Sports Fans", "Family Audience"],
      startDate: "2025-05-01",
      duration: 30,
      cpm: "₹450",
      estimatedImpressions: "2,500,000",
    },
    {
      id: "2",
      name: "Tech Professionals Campaign",
      type: "Meta Ads",
      brand: "Meta",
      status: "active",
      budget: {
        spent: 18750,
        allocated: 25000,
      },
      metrics: {
        impressions: "850K",
        ctr: "1.8%",
        reach: "650K",
      },
      targetGroup: ["Professionals", "B2B"],
      startDate: "2025-04-15",
      duration: 45,
      cpm: "₹180",
      estimatedImpressions: "1,800,000",
    },
    {
      id: "3",
      name: "Urban Commuters DOOH",
      type: "DOOH",
      brand: "Times OOH",
      status: "active",
      budget: {
        spent: 8500,
        allocated: 20000,
      },
      metrics: {
        impressions: "350K",
        ctr: "1.2%",
        reach: "280K",
      },
      targetGroup: ["Urban Commuters"],
      startDate: "2025-04-20",
      duration: 60,
      cpm: "₹280",
      estimatedImpressions: "1,200,000",
    },
  ]

  // Combine mock campaigns with purchased campaigns
  const allCampaigns = [...mockCampaigns, ...campaigns]

  // Load campaigns
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter and sort campaigns
  const filteredCampaigns = allCampaigns
    .filter((campaign) => {
      // Apply search filter
      const matchesSearch =
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.brand.toLowerCase().includes(searchQuery.toLowerCase())

      // Apply status filter
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "date") {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "budget") {
        return b.budget.allocated - a.budget.allocated
      } else {
        return 0
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500">Active</Badge>
      case "paused":
        return <Badge className="bg-amber-500">Paused</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      case "scheduled":
        return <Badge className="bg-purple-500">Scheduled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Calculate budget percentage
  const getBudgetPercentage = (spent: number, allocated: number) => {
    return Math.round((spent / allocated) * 100)
  }

  // Get campaign icon
  const getCampaignIcon = (type: string) => {
    return categoryIcons[type as keyof typeof categoryIcons] || <Eye className="h-5 w-5" />
  }

  // Get campaign color
  const getCampaignColor = (type: string) => {
    return categoryColors[type as keyof typeof categoryColors] || "from-gray-500 to-gray-600"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading campaigns..."
                : `You have ${filteredCampaigns.filter((c) => c.status === "active").length} active campaigns`}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1) // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value)
                  setCurrentPage(1) // Reset to first page on sort change
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="px-6">
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div>
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-32 mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-9 w-16 rounded-md" />
                      </div>
                    </div>
                    <div className="border-t mt-4 pt-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-32 mt-1" />
                          <Skeleton className="h-2 w-full mt-2 rounded-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-16 mt-1" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-16 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : paginatedCampaigns.length > 0 ? (
            paginatedCampaigns.map((campaign) => (
              <div key={campaign.id} className="px-6">
                <div className="rounded-lg border shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-md bg-gradient-to-br ${getCampaignColor(campaign.type)} p-2 text-white`}>
                        {getCampaignIcon(campaign.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.brand} • {campaign.type} • Started{" "}
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      {getStatusBadge(campaign.status)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(campaign)}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          {selectedCampaign && (
                            <>
                              <DialogHeader>
                                <DialogTitle>{selectedCampaign.name}</DialogTitle>
                              </DialogHeader>
                              <Tabs defaultValue="overview">
                                <TabsList>
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="performance">Performance</TabsTrigger>
                                  <TabsTrigger value="budget">Budget</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4 pt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Campaign Type</p>
                                      <p className="font-medium">{selectedCampaign.type}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Platform</p>
                                      <p className="font-medium">{selectedCampaign.brand}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Start Date</p>
                                      <p className="font-medium">
                                        {new Date(selectedCampaign.startDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Duration</p>
                                      <p className="font-medium">{selectedCampaign.duration} days</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <div>{getStatusBadge(selectedCampaign.status)}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground">CPM</p>
                                      <p className="font-medium">{selectedCampaign.cpm}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Target Groups</p>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedCampaign.targetGroup.map((tg) => (
                                        <Badge key={tg} variant="secondary" className="text-xs">
                                          {tg}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="rounded-lg border p-4 mt-4">
                                    <h4 className="font-medium mb-2">Campaign Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                      This is a {selectedCampaign.type} campaign running on {selectedCampaign.brand}{" "}
                                      platform. The campaign was launched on{" "}
                                      {new Date(selectedCampaign.startDate).toLocaleDateString()} and is currently{" "}
                                      {selectedCampaign.status}.
                                    </p>
                                  </div>
                                </TabsContent>
                                <TabsContent value="performance" className="pt-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg border p-3">
                                      <p className="text-xs text-muted-foreground">Impressions</p>
                                      <p className="text-lg font-bold">{selectedCampaign.metrics.impressions}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                      <p className="text-xs text-muted-foreground">CTR</p>
                                      <p className="text-lg font-bold">{selectedCampaign.metrics.ctr}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                      <p className="text-xs text-muted-foreground">Reach</p>
                                      <p className="text-lg font-bold">{selectedCampaign.metrics.reach}</p>
                                    </div>
                                  </div>
                                  <div className="h-[200px] flex items-center justify-center mt-4 border rounded-lg">
                                    <p className="text-muted-foreground">Performance chart would appear here</p>
                                  </div>
                                </TabsContent>
                                <TabsContent value="budget" className="pt-4">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm font-medium">Budget Spent</p>
                                      <div className="mt-1 flex items-center gap-2">
                                        <p className="text-lg font-bold">
                                          ₹{selectedCampaign.budget.spent.toLocaleString()} / ₹
                                          {selectedCampaign.budget.allocated.toLocaleString()}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          (
                                          {getBudgetPercentage(
                                            selectedCampaign.budget.spent,
                                            selectedCampaign.budget.allocated,
                                          )}
                                          %)
                                        </span>
                                      </div>
                                      <Progress
                                        value={getBudgetPercentage(
                                          selectedCampaign.budget.spent,
                                          selectedCampaign.budget.allocated,
                                        )}
                                        className="mt-2 h-2 bg-muted [&>div]:bg-[#D005D3]"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                      <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Daily Budget</p>
                                        <p className="text-lg font-bold">
                                          ₹
                                          {Math.round(
                                            selectedCampaign.budget.allocated / selectedCampaign.duration,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Remaining Budget</p>
                                        <p className="text-lg font-bold">
                                          ₹
                                          {(
                                            selectedCampaign.budget.allocated - selectedCampaign.budget.spent
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                      <Button className="bg-[#D005D3] hover:bg-[#D005D3]/90 text-white">
                                        Adjust Budget
                                      </Button>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="border-t p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium">Budget Spent</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-lg font-bold">
                            ₹{campaign.budget.spent.toLocaleString()} / ₹{campaign.budget.allocated.toLocaleString()}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            ({getBudgetPercentage(campaign.budget.spent, campaign.budget.allocated)}%)
                          </span>
                        </div>
                        <Progress
                          value={getBudgetPercentage(campaign.budget.spent, campaign.budget.allocated)}
                          className="mt-2 h-2 bg-muted [&>div]:bg-[#D005D3]"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Impressions</p>
                        <p className="text-lg font-bold">{campaign.metrics.impressions}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">CTR</p>
                        <p className="text-lg font-bold">{campaign.metrics.ctr}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <p>No campaigns found matching your criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isLoading && filteredCampaigns.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </>
        )}
        {!isLoading && (
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link href="/campaigns">
              View All Campaigns
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
