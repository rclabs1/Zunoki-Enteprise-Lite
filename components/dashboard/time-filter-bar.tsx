"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

export type TimeRange = {
  label: string
  value: string
  from: Date
  to: Date
}

const PRESET_RANGES: TimeRange[] = [
  {
    label: "Last 7 days",
    value: "7d",
    from: subDays(new Date(), 7),
    to: new Date(),
  },
  {
    label: "Last 14 days", 
    value: "14d",
    from: subDays(new Date(), 14),
    to: new Date(),
  },
  {
    label: "Last 30 days",
    value: "30d", 
    from: subDays(new Date(), 30),
    to: new Date(),
  },
  {
    label: "This week",
    value: "week",
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  },
  {
    label: "This month",
    value: "month",
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  },
]

interface TimeFilterBarProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  loading?: boolean
  className?: string
}

export default function TimeFilterBar({
  selectedRange,
  onRangeChange,
  loading = false,
  className
}: TimeFilterBarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [customDate, setCustomDate] = useState<Date>()

  const handlePresetSelect = (range: TimeRange) => {
    onRangeChange(range)
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (date) {
      setCustomDate(date)
      const customRange: TimeRange = {
        label: "Custom",
        value: "custom",
        from: date,
        to: new Date(),
      }
      onRangeChange(customRange)
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset Time Ranges */}
      <div className="flex items-center gap-1 p-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
        {PRESET_RANGES.map((range) => (
          <Button
            key={range.value}
            variant="ghost"
            size="sm"
            onClick={() => handlePresetSelect(range)}
            disabled={loading}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all duration-200",
              selectedRange.value === range.value
                ? "bg-white text-black hover:bg-gray-100"
                : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            )}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className={cn(
              "h-8 border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-gray-400 hover:text-white",
              selectedRange.value === "custom" && "border-white text-white"
            )}
          >
            <CalendarIcon className="h-3 w-3 mr-2" />
            Custom
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#0a0a0a] border-[#1a1a1a]" align="start">
          <Calendar
            mode="single"
            selected={customDate}
            onSelect={handleCustomDateSelect}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
            className="text-white"
          />
        </PopoverContent>
      </Popover>

      {/* Selected Range Display */}
      <div className="flex items-center gap-2 ml-2">
        <Badge variant="outline" className="border-[#333] text-gray-400 text-xs">
          {format(selectedRange.from, "MMM d")} - {format(selectedRange.to, "MMM d")}
        </Badge>
        
        {loading && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Updating...</span>
          </div>
        )}
      </div>
    </div>
  )
}