import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BarChart3, Users, Globe, DollarSign, Clock, Smartphone, Laptop, Tv, Eye, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { useTrackPageView } from "@/hooks/use-track-page-view"

export default function PlatformsCompare() {
  useTrackPageView("Platforms Compare");
  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Media Platform Comparison</h1>
        <p className="text-muted-foreground">
          Compare different advertising platforms to find the best fit for your campaign
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-background">
          <Users className="mr-1 h-4 w-4" />
          Demographics
        </Badge>
        <Badge variant="outline" className="bg-background">
          <Globe className="mr-1 h-4 w-4" />
          Geography
        </Badge>
        <Badge variant="outline" className="bg-background">
          <DollarSign className="mr-1 h-4 w-4" />
          Pricing
        </Badge>
        <Badge variant="outline" className="bg-background">
          <Clock className="mr-1 h-4 w-4" />
          Time Spent
        </Badge>
        <Badge variant="outline" className="bg-background">
          <Smartphone className="mr-1 h-4 w-4" />
          Device
        </Badge>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>All Platforms</span>
          </TabsTrigger>
          <TabsTrigger value="digital" className="flex items-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span>Digital</span>
          </TabsTrigger>
          <TabsTrigger value="ctv" className="flex items-center gap-1">
            <Tv className="h-4 w-4" />
            <span>CTV</span>
          </TabsTrigger>
          <TabsTrigger value="dooh" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>DOOH</span>
          </TabsTrigger>
          <TabsTrigger value="influencers" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Influencers</span>
          </TabsTrigger>
          <TabsTrigger value="app-based" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>App Brands</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Instagram */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    alt="Instagram"
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div>
                    <CardTitle>Instagram</CardTitle>
                    <CardDescription>Social Media</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                    <span className="text-sm font-medium">360.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Min. Spend</span>
                    <span className="text-sm font-medium">₹10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CPM</span>
                    <span className="text-sm font-medium">₹215</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CTR</span>
                    <span className="text-sm font-medium">1.3%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top Performing Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">Fashion</Badge>
                    <Badge variant="secondary">Beauty</Badge>
                    <Badge variant="secondary">Lifestyle</Badge>
                    <Badge variant="secondary">Food</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Device Distribution</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="flex flex-col items-center">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span>Mobile</span>
                        <span className="font-medium">92%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                        <span>Desktop</span>
                        <span className="font-medium">7%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Tv className="h-4 w-4 text-muted-foreground" />
                        <span>Other</span>
                        <span className="font-medium">1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">Add to Comparison</Button>
              </CardFooter>
            </Card>

            {/* Google Search */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    alt="Google Search"
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div>
                    <CardTitle>Google Search</CardTitle>
                    <CardDescription>Performance Marketing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                    <span className="text-sm font-medium">200M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Min. Spend</span>
                    <span className="text-sm font-medium">₹10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CPM</span>
                    <span className="text-sm font-medium">₹180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CTR</span>
                    <span className="text-sm font-medium">2.1%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top Performing Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">E-commerce</Badge>
                    <Badge variant="secondary">Finance</Badge>
                    <Badge variant="secondary">Education</Badge>
                    <Badge variant="secondary">Tech</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Device Distribution</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="flex flex-col items-center">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span>Mobile</span>
                        <span className="font-medium">63%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                        <span>Desktop</span>
                        <span className="font-medium">35%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Tv className="h-4 w-4 text-muted-foreground" />
                        <span>Other</span>
                        <span className="font-medium">2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">Add to Comparison</Button>
              </CardFooter>
            </Card>

            {/* Streamr */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    alt="Streamr"
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div>
                    <CardTitle>Streamr</CardTitle>
                    <CardDescription>Connected TV</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                    <span className="text-sm font-medium">45M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Min. Spend</span>
                    <span className="text-sm font-medium">₹50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CPM</span>
                    <span className="text-sm font-medium">₹350</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. CTR</span>
                    <span className="text-sm font-medium">0.8%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top Performing Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">Entertainment</Badge>
                    <Badge variant="secondary">Real Estate</Badge>
                    <Badge variant="secondary">Automotive</Badge>
                    <Badge variant="secondary">Luxury</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Device Distribution</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="flex flex-col items-center">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span>Mobile</span>
                        <span className="font-medium">5%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                        <span>Desktop</span>
                        <span className="font-medium">10%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col items-center">
                        <Tv className="h-4 w-4 text-muted-foreground" />
                        <span>TV</span>
                        <span className="font-medium">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">Add to Comparison</Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
              <CardDescription>Select platforms above to compare their metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No platforms selected</h3>
                <p className="mt-2">Add platforms to comparison to see detailed metrics side by side</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would have similar content structure */}
        <TabsContent value="digital">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Digital Platforms</h3>
            <p>Content for digital platforms would appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="ctv">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Connected TV Platforms</h3>
            <p>Content for CTV platforms would appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
