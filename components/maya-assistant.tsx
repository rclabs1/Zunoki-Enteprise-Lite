"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, X } from "lucide-react"
import { useState } from "react"

export function MayaAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat Bubble */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 p-0 text-white shadow-lg hover:from-fuchsia-700 hover:to-purple-700"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden shadow-xl md:w-96">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-fuchsia-600 to-purple-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Maya Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-80 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 p-2 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    Hi there! I'm Zunoki. your AI advertising strategist. How can I help you with your campaigns today?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 p-2 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    I can help you optimize campaigns, suggest platforms, analyze performance, or create new ad content.
                    Just ask!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t p-3">
            <div className="flex w-full items-center gap-2">
              <Input placeholder="Ask Zunoki. anything..." className="flex-1 border-muted-foreground/20" />
              <Button size="icon" className="bg-fuchsia-600 hover:bg-fuchsia-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
