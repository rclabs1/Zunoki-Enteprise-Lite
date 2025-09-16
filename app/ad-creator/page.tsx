import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Upload, Video, ImageIcon, Mic, QrCode, Wand2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { useTrackPageView } from "@/hooks/use-track-page-view"

export default function AdCreator() {
  useTrackPageView("Ad Creator");
  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ad Creation Assistant</h1>
        <p className="text-muted-foreground">Create compelling ads for your campaign</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ad Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Preview</CardTitle>
            <CardDescription>See how your ad will appear on different platforms</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="mb-2 text-2xl font-bold">Zepto Office</div>
                  <div className="mb-4">Discover the future today</div>
                  <div className="flex justify-center">
                    <QrCode className="h-24 w-24" />
                  </div>
                  <div className="mt-4 text-xl">zeptooffice</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="h-1 flex-1 rounded-full bg-white/30">
                  <div className="h-full w-1/3 rounded-full bg-fuchsia-600"></div>
                </div>
                <div className="ml-4 text-sm text-white">00:10 / 00:30</div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm">
                <Video className="mr-2 h-4 w-4" />
                Preview Video
              </Button>
              <Button variant="outline" size="sm">
                <ImageIcon className="mr-2 h-4 w-4" />
                Preview Image
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ad Creator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
            <CardDescription>Enter information for your ad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Ad Title</Label>
              <Input id="ad-title" placeholder="e.g., Zepto Office" defaultValue="Zepto Office" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="e.g., Discover the future today"
                defaultValue="Discover the future today"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Bengaluru, Karnataka"
                defaultValue="WM99+R97, Bellandur, Bengaluru"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <Button variant="outline" size="sm">
                  Upload Logo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Call to Action</Label>
              <Select defaultValue="visit">
                <SelectTrigger>
                  <SelectValue placeholder="Select a CTA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visit Now</SelectItem>
                  <SelectItem value="learn">Learn More</SelectItem>
                  <SelectItem value="shop">Shop Now</SelectItem>
                  <SelectItem value="sign-up">Sign Up</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="rounded-md border p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tech professionals and young adults</span>
                    <Button variant="link" className="h-auto p-0 text-xs">
                      Edit
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span>Ages 25-45</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urban tech hubs in Bengaluru</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Ad
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Ad Frames */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Ad Frames</h2>
        <Tabs defaultValue="frame1" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="frame1">Frame 1</TabsTrigger>
            <TabsTrigger value="frame2">Frame 2</TabsTrigger>
            <TabsTrigger value="frame3">Frame 3</TabsTrigger>
            <TabsTrigger value="frame4">Frame 4</TabsTrigger>
            <TabsTrigger value="outro">Outro</TabsTrigger>
          </TabsList>

          <TabsContent value="frame1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Frame 1 Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frame 1 Text</Label>
                  <Textarea placeholder="Enter text for frame 1" defaultValue="Discover the future of workspace" />
                </div>
                <div className="space-y-2">
                  <Label>Frame 1 Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-32 overflow-hidden rounded-md border">
                      <Image
                        src="/placeholder.svg?height=96&width=128"
                        alt="Office building"
                        width={128}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      Change Image
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frame 1 Audio</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 flex-1 items-center rounded-md border px-3">
                      <Mic className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">voice_recording_1.mp3</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select defaultValue="7">
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="7">7 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto bg-fuchsia-600 hover:bg-fuchsia-700">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit with AI
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="frame2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Frame 2 Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <h3 className="text-lg font-medium">Frame 2 Configuration</h3>
                  <p>Settings for frame 2 would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other frames would have similar content */}
        </Tabs>
      </div>

      {/* AI Suggestions */}
      <Card className="mt-8">
        <CardHeader className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Suggestions
          </CardTitle>
          <CardDescription className="text-white/80">Maya's recommendations to improve your ad</CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-fuchsia-100 p-2 text-fuchsia-600">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Try a more action-oriented tagline</h3>
                  <p className="text-sm text-muted-foreground">
                    Instead of "Discover the future today", try "Transform your workspace today" to create more urgency.
                  </p>
                  <Button variant="link" className="mt-2 h-auto p-0 text-fuchsia-600">
                    Apply suggestion
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-fuchsia-100 p-2 text-fuchsia-600">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Add a statistic to increase credibility</h3>
                  <p className="text-sm text-muted-foreground">
                    Including "Join 10,000+ professionals" can boost conversion rates by highlighting social proof.
                  </p>
                  <Button variant="link" className="mt-2 h-auto p-0 text-fuchsia-600">
                    Apply suggestion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
