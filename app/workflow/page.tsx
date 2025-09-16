import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Filter,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tv,
  Eye,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { MilestoneNavigation } from "@/components/milestone-navigation"
import { useTrackPageView } from "@/hooks/use-track-page-view"

// Define milestone steps
const milestoneSteps = [
  {
    id: 1,
    title: "Discover/Select Media",
    description: "Explore media categories",
  },
  {
    id: 2,
    title: "Buy Media",
    description: "Select and purchase",
  },
  {
    id: 3,
    title: "Create Ads/Upload",
    description: "Design your creative",
  },
  {
    id: 4,
    title: "Distribute & Go Live",
    description: "Launch campaign",
  },
]

export default function WorkflowPage() {
  useTrackPageView("Workflow");
  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Campaign Workflow</h1>
        <p className="text-muted-foreground">Create and manage your advertising campaign</p>
      </div>

      {/* Milestone Navigation */}
      <MilestoneNavigation steps={milestoneSteps} currentStep={2} />

      <Tabs defaultValue="buy-media" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="discover" className="flex-1">
            Discover/Select Media
          </TabsTrigger>
          <TabsTrigger value="buy-media" className="flex-1">
            Buy Media
          </TabsTrigger>
          <TabsTrigger value="create-ads" className="flex-1">
            Create Ads/Upload
          </TabsTrigger>
          <TabsTrigger value="distribute" className="flex-1">
            Distribute & Go Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Discover Media Platforms</CardTitle>
                  <CardDescription>Explore and select media platforms for your campaign</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search platforms..." className="pl-8" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background">
                  <Smartphone className="mr-1 h-4 w-4" />
                  Digital
                </Badge>
                <Badge variant="outline" className="bg-background">
                  <Tv className="mr-1 h-4 w-4" />
                  CTV
                </Badge>
                <Badge variant="outline" className="bg-background">
                  <Eye className="mr-1 h-4 w-4" />
                  DOOH
                </Badge>
                <Badge variant="outline" className="bg-background">
                  <Users className="mr-1 h-4 w-4" />
                  Influencers
                </Badge>
                <Badge variant="outline" className="bg-background">
                  <Zap className="mr-1 h-4 w-4" />
                  App Brands
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Sample platform cards */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src="/placeholder.svg?height=40&width=40"
                          alt="Platform"
                          width={40}
                          height={40}
                          className="rounded"
                        />
                        <div>
                          <CardTitle className="text-base">Platform {i + 1}</CardTitle>
                          <CardDescription>Category</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Users</p>
                          <p className="font-medium">{(Math.random() * 500 + 100).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min. Spend</p>
                          <p className="font-medium">₹{(Math.random() * 90000 + 10000).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg. CPM</p>
                          <p className="font-medium">₹{(Math.random() * 400 + 100).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg. CTR</p>
                          <p className="font-medium">{(Math.random() * 3 + 0.5).toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t p-3">
                      <Button size="sm" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
                        Add to Selection
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="buy-media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buy Media</CardTitle>
              <CardDescription>Select inventory and complete your purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Selected Platforms</h3>

                  <div className="space-y-3">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image
                            src="/placeholder.svg?height=32&width=32"
                            alt="Instagram"
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium">Instagram</p>
                            <p className="text-xs text-muted-foreground">Social Media</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="500000" className="w-24 text-right" />
                          <span className="text-sm">impressions</span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">CPM</p>
                          <p>₹215</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium">₹107,500</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Availability</p>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            In Stock
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image
                            src="/placeholder.svg?height=32&width=32"
                            alt="Hotstar"
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium">Hotstar</p>
                            <p className="text-xs text-muted-foreground">CTV</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="200000" className="w-24 text-right" />
                          <span className="text-sm">impressions</span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">CPM</p>
                          <p>₹450</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium">₹90,000</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Availability</p>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Limited
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Instagram (500K impressions)</span>
                          <span>₹107,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hotstar (200K impressions)</span>
                          <span>₹90,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform fees</span>
                          <span>₹2,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes</span>
                          <span>₹36,000</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹236,000</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label>Payment Method</Label>
                        <Select defaultValue="credit-card">
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit-card">Credit Card</SelectItem>
                            <SelectItem value="debit-card">Debit Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="mt-4">
                        <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-2">Delivery Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Campaign Start</span>
                        <span>May 15, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Campaign End</span>
                        <span>June 15, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Daily Delivery</span>
                        <span>~23.3K impressions/day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Selection
              </Button>
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
                Next: Create Ads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="create-ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Ads</CardTitle>
              <CardDescription>Design and upload your creative assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <h3 className="text-lg font-medium">Ad Creation Interface</h3>
                <p>Content for ad creation would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribute & Go Live</CardTitle>
              <CardDescription>Launch your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <h3 className="text-lg font-medium">Campaign Launch Interface</h3>
                <p>Content for campaign launch would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
