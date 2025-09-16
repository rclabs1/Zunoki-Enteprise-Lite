"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Mail, Check, AlertCircle, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

export function ReportGenerator() {
  const [email, setEmail] = useState("")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [reportDate, setReportDate] = useState<Date | undefined>(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(["all"])
  const [emailError, setEmailError] = useState("")

  // Validate email
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    } else {
      setEmailError("")
    }

    setIsSubmitting(true)
    setStatus("idle")

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setStatus("success")
    } catch (error) {
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset status after 5 seconds
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setStatus("idle")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [status])

  // Campaign options
  const campaigns = [
    { id: "all", name: "All Campaigns" },
    { id: "zepto", name: "Zepto Office Launch" },
    { id: "tech", name: "Tech Professionals Campaign" },
    { id: "urban", name: "Urban Commuters DOOH" },
  ]

  // Handle campaign selection
  const handleCampaignChange = (campaignId: string) => {
    if (campaignId === "all") {
      setSelectedCampaigns(["all"])
    } else {
      const newSelection = selectedCampaigns.includes(campaignId)
        ? selectedCampaigns.filter((id) => id !== campaignId)
        : [...selectedCampaigns.filter((id) => id !== "all"), campaignId]

      setSelectedCampaigns(newSelection.length ? newSelection : ["all"])
    }
  }

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date"
    return format(date, "PPP")
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-[#D005D3] to-[#5D00FF] text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Analytics Report
        </CardTitle>
        <CardDescription className="text-white/80">
          Create and send a detailed report of your campaign performance
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
              required
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            <p className="text-xs text-muted-foreground">The report will be sent to this email address</p>
          </div>

          <div className="space-y-2">
            <Label>Report Date Range</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDate(reportDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={reportDate}
                  onSelect={(date) => {
                    setReportDate(date)
                    setIsDatePickerOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Campaigns to Include</Label>
            <div className="space-y-2 border rounded-md p-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`campaign-${campaign.id}`}
                    checked={selectedCampaigns.includes(campaign.id)}
                    onCheckedChange={() => handleCampaignChange(campaign.id)}
                  />
                  <Label htmlFor={`campaign-${campaign.id}`} className="font-normal">
                    {campaign.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Report Format</Label>
            <RadioGroup
              defaultValue="pdf"
              value={reportFormat}
              onValueChange={setReportFormat}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="font-normal">
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="font-normal">
                  Excel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal">
                  CSV
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Report Sections</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select sections to include" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="performance">Performance Metrics Only</SelectItem>
                <SelectItem value="audience">Audience Analytics Only</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "success" && (
            <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Your report has been generated and sent to {email}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>There was a problem generating your report. Please try again.</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-[#D005D3] hover:bg-[#D005D3]/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Generate and Send Report
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
