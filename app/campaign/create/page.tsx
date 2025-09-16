import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Upload, Target, Globe, DollarSign, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useTrackPageView } from "@/hooks/use-track-page-view"

export default function CampaignCreate() {
  useTrackPageView("Create Campaign");
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground">Set up your campaign details, creative assets, targeting, and budget</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-600 text-white">1</div>
            <span className="mt-2 text-xs font-medium">Campaign Details</span>
          </div>
          <div className="flex-1 border-t border-muted"></div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground">
              2
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Creative Upload</span>
          </div>
          <div className="flex-1 border-t border-muted"></div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground">
              3
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Audience Targeting</span>
          </div>
          <div className="flex-1 border-t border-muted"></div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground">
              4
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Channel Selection</span>
          </div>
          <div className="flex-1 border-t border-muted"></div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground">
              5
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Budget</span>
          </div>
          <div className="flex-1 border-t border-muted"></div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground">
              6
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground">Review & Launch</span>
          </div>
        </div>
      </div>

      {/* Step 1: Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Provide basic information about your campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" placeholder="e.g., Summer Product Launch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-objective">Campaign Objective</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="consideration">Consideration</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="traffic">Website Traffic</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-description">Campaign Description</Label>
            <Textarea id="campaign-description" placeholder="Describe your campaign goals and expectations..." />
          </div>

          <div className="space-y-2">
            <Label>Campaign Type</Label>
            <RadioGroup defaultValue="standard" className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="font-normal">
                  Standard Campaign
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seasonal" id="seasonal" />
                <Label htmlFor="seasonal" className="font-normal">
                  Seasonal Promotion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="product-launch" id="product-launch" />
                <Label htmlFor="product-launch" className="font-normal">
                  Product Launch
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brand-awareness" id="brand-awareness" />
                <Label htmlFor="brand-awareness" className="font-normal">
                  Brand Awareness
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Preview of Next Steps */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Step 2</CardTitle>
            <CardDescription>Creative Upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Step 3</CardTitle>
            <CardDescription>Audience Targeting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Target className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Step 4</CardTitle>
            <CardDescription>Channel Selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Globe className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Step 5</CardTitle>
            <CardDescription>Budget Allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <DollarSign className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Step 6</CardTitle>
            <CardDescription>Review & Launch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
