"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Smartphone, Tv, Eye, AppWindow, Upload, DollarSign, CheckCircle, ArrowLeft, ArrowRight, Lightbulb } from "lucide-react"
import { allBrands, type Brand } from "@/lib/data"
import Image from "next/image"

const getCategoryIcon = (category: Brand["category"]) => {
  switch (category) {
    case "Digital":
      return "/icon-digital.svg";
    case "CTV":
      return "/icon-ctv.svg";
    case "DOOH":
      return "/icon-dooh.svg";
    case "App":
      return "/icon-app.svg";
    case "Smart Devices":
      return "/icon-smart-devices.svg";
    default:
      return "/placeholder.svg";
  }
};
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"

interface CampaignCreationModalProps {
  open: boolean
  onClose: () => void
}

export function CampaignCreationModal({ open, onClose }: CampaignCreationModalProps) {
  const [step, setStep] = useState(1)
  const [campaignName, setCampaignName] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Brand[]>([])
  const [creatives, setCreatives] = useState<File[]>([])
  const [budget, setBudget] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const categories = [
    { name: "Digital", icon: <Smartphone className="h-6 w-6" />, description: "Social, Search, Display" },
    { name: "DOOH", icon: <Eye className="h-6 w-6" />, description: "Digital Out-of-Home" },
    { name: "CTV", icon: <Tv className="h-6 w-6" />, description: "Connected TV" },
    { name: "App", icon: <AppWindow className="h-6 w-6" />, description: "App Brands" },
    { name: "Smart Devices", icon: <Lightbulb className="h-6 w-6" />, description: "AI-powered Devices" },
  ]

  const filteredPlatforms = selectedCategory
    ? allBrands.filter((brand) => brand.category === selectedCategory)
    : allBrands

  const handleNext = () => setStep((prev) => prev + 1)
  const handleBack = () => setStep((prev) => prev - 1)

  const handlePlatformSelect = (brand: Brand) => {
    setSelectedPlatforms((prev) =>
      prev.some((p) => p.id === brand.id) ? prev.filter((p) => p.id !== brand.id) : [...prev, brand],
    )
  }

  const handleCreativeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCreatives((prev) => [...prev, ...Array.from(event.target.files || [])])
    }
  }

  const handleSubmit = () => {
    console.log("Campaign Submitted:", {
      campaignName,
      campaignDescription,
      selectedCategory,
      selectedPlatforms,
      creatives,
      budget,
      startDate,
      endDate,
    })
    // Here you would send data to a backend endpoint
    onClose()
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-4">
            <Label htmlFor="campaignName" className="text-white">
              Campaign Name
            </Label>
            <Input
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer Sales Campaign"
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Label htmlFor="campaignDescription" className="text-white">
              Campaign Description
            </Label>
            <Textarea
              id="campaignDescription"
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="Brief description of your campaign goals."
              className="bg-gray-900 border-gray-700 text-white"
            />
            <h3 className="text-lg font-semibold mt-4 text-white">Select Media Category</h3>
            <RadioGroup
              value={selectedCategory || ""}
              onValueChange={setSelectedCategory}
              className="grid grid-cols-2 gap-4"
            >
              {categories.map((cat) => (
                <div key={cat.name}>
                  <RadioGroupItem value={cat.name} id={cat.name} className="sr-only" />
                  <Label
                    htmlFor={cat.name}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-gray-700 bg-gray-900 p-4 hover:bg-gray-800 cursor-pointer data-[state=checked]:border-[hsl(var(--primary))] data-[state=checked]:bg-[hsl(var(--primary))]/20"
                  >
                    {cat.icon}
                    <span className="mt-2 text-white">{cat.name}</span>
                    <span className="text-sm text-gray-400 text-center">{cat.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      case 2:
        return (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white">Choose Platforms</h3>
            <p className="text-sm text-gray-400">Select platforms from the {selectedCategory || "all"} category.</p>
            <ScrollArea className="h-[300px] border border-gray-700 rounded-md p-4 bg-gray-900">
              <div className="grid gap-3">
                {filteredPlatforms.length > 0 ? (
                  filteredPlatforms.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={brand.id}
                          checked={selectedPlatforms.some((p) => p.id === brand.id)}
                          onCheckedChange={() => handlePlatformSelect(brand)}
                          className="border-gray-500 data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:border-[hsl(var(--primary))]"
                        />
                        <Label htmlFor={brand.id} className="flex items-center gap-2 text-white cursor-pointer">
                          <Image
                            src={getCategoryIcon(brand.category)}
                            alt={brand.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                          {brand.name}
                        </Label>
                      </div>
                      <span className="text-sm text-gray-400">{brand.cpm}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-10">No platforms available for this category.</div>
                )}
              </div>
            </ScrollArea>
            <h4 className="text-md font-semibold mt-2 text-white">Selected Platforms:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPlatforms.length > 0 ? (
                selectedPlatforms.map((brand) => (
                  <Badge key={brand.id} className="bg-[hsl(var(--primary))]/20 text-white border border-[hsl(var(--primary))]">
                    {brand.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">None selected</span>
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white">Upload Creatives</h3>
            <p className="text-sm text-gray-400">Upload your ad images or videos.</p>
            <div className="flex items-center justify-center border-2 border-dashed border-gray-700 rounded-md p-6 text-center bg-gray-900">
              <Label
                htmlFor="creative-upload"
                className="cursor-pointer flex flex-col items-center gap-2 text-gray-400"
              >
                <Upload className="h-8 w-8" />
                <span>Drag & drop or click to upload</span>
                <Input id="creative-upload" type="file" multiple className="sr-only" onChange={handleCreativeUpload} />
              </Label>
            </div>
            {creatives.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-white">Uploaded Files:</h4>
                <ul className="list-disc list-inside text-gray-300">
                  {creatives.map((file, index) => (
                    <li key={index} className="text-sm">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      case 4:
        return (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white">Set Budget & Schedule</h3>
            <Label htmlFor="budget" className="text-white">
              Total Budget (₹)
            </Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 50000"
              className="bg-gray-900 border-gray-700 text-white"
              icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-white">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800",
                        !startDate && "text-gray-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700 text-white">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="endDate" className="text-white">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-900 border-gray-700 text-white hover:bg-gray-800",
                        !endDate && "text-gray-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700 text-white">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" /> Review & Submit
            </h3>
            <div className="bg-gray-900 border border-gray-700 rounded-md p-4 space-y-3">
              <p className="text-white">
                <span className="font-semibold text-gray-300">Campaign Name:</span> {campaignName}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Description:</span> {campaignDescription || "N/A"}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Category:</span> {selectedCategory || "N/A"}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Platforms:</span>{" "}
                {selectedPlatforms.map((p) => p.name).join(", ") || "N/A"}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Creatives:</span>{" "}
                {creatives.map((f) => f.name).join(", ") || "N/A"}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Budget:</span> ₹{budget || "N/A"}
              </p>
              <p className="text-white">
                <span className="font-semibold text-gray-300">Schedule:</span>{" "}
                {startDate ? format(startDate, "PPP") : "N/A"} to {endDate ? format(endDate, "PPP") : "N/A"}
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] bg-black text-white border-gray-800 p-6">
        <DialogHeader className="border-b border-gray-800 pb-4 mb-4">
          <DialogTitle className="text-2xl font-bold text-white">Create New Campaign</DialogTitle>
          <DialogDescription className="text-gray-400">
            Step {step} of 5:{" "}
            {step === 1
              ? "Campaign Details & Category"
              : step === 2
                ? "Choose Platforms"
                : step === 3
                  ? "Upload Creatives"
                  : step === 4
                    ? "Set Budget & Schedule"
                    : "Review & Submit"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[350px] max-h-[calc(100vh-200px)] overflow-y-auto pr-4">{renderStepContent()}</div>

        <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && (!campaignName || !selectedCategory)) ||
                (step === 2 && selectedPlatforms.length === 0) ||
                (step === 3 && creatives.length === 0) ||
                (step === 4 && (!budget || !startDate || !endDate))
              }
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white ml-auto"
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white ml-auto">
              Submit Campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
