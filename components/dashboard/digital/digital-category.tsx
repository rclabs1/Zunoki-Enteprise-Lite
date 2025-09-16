"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GoogleAdsPanel } from "./google-ads-panel"
import { FacebookAdsPanel } from "./facebook-ads-panel"
import { InstagramAdsPanel } from "./instagram-ads-panel"
import { Globe } from "lucide-react"

export function DigitalCategory() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Digital Media
            <Badge variant="secondary">3 Platforms</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage and optimize your digital advertising campaigns across Google, Facebook, and Instagram platforms.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="google-ads" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google-ads" className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
            Google Ads
          </TabsTrigger>
          <TabsTrigger value="facebook-ads" className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
            Facebook Ads
            <Badge variant="outline" className="ml-1 text-xs">
              Soon
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="instagram-ads" className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm"></div>
            Instagram Ads
            <Badge variant="outline" className="ml-1 text-xs">
              Soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google-ads">
          <GoogleAdsPanel />
        </TabsContent>

        <TabsContent value="facebook-ads">
          <FacebookAdsPanel />
        </TabsContent>

        <TabsContent value="instagram-ads">
          <InstagramAdsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
