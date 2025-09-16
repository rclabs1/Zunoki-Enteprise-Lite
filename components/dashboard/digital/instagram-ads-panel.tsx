"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Instagram } from "lucide-react"

export function InstagramAdsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          Instagram Ads
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Instagram Ads integration is currently in development. You'll be able to connect your Instagram Ads account
            and view campaign performance soon.
          </p>
          <Button disabled variant="outline">
            Notify Me When Available
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
