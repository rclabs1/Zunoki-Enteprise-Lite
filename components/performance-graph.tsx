"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

type DateRange = "7D" | "30D" | "90D" | "YTD" | "Custom"
type Metric = "Impressions" | "CTR" | "Spend" | "ROAS"

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-md dark:bg-gray-800 dark:border-gray-700">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}:{" "}
            {entry.name === "Impressions"
              ? `${(Number(entry.value) / 1000).toFixed(1)}K`
              : entry.name === "Spend"
                ? `₹${(Number(entry.value) / 1000).toFixed(1)}K`
                : entry.name === "CTR"
                  ? `${entry.value}%`
                  : entry.name === "ROAS"
                    ? `${entry.value}x`
                    : entry.value}
          </p>
        ))}
      </div>
    )
  }

  return null
}

// Cache for performance data
const dataCache = new Map<string, any[]>()

export function PerformanceGraph() {
  const [dateRange, setDateRange] = useState<DateRange>("30D")
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(["Impressions", "CTR"])
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)

  // Toggle metric selection
  const toggleMetric = useCallback((metric: Metric) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(metric)) {
        return prev.filter((m) => m !== metric)
      } else {
        return [...prev, metric]
      }
    })
  }, [])

  // Format date for display
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, "MMM d")
  }, [])

  // Format value based on metric
  const formatValue = useCallback((value: number, metric: string) => {
    if (metric === "Impressions") return `${(value / 1000).toFixed(1)}K`
    if (metric === "CTR") return `${value}%`
    if (metric === "Spend") return `₹${(value / 1000).toFixed(1)}K`
    if (metric === "ROAS") return `${value}x`
    return `${value}`
  }, [])

  // Get color for metric
  const getMetricColor = useCallback((metric: Metric) => {
    switch (metric) {
      case "Impressions":
        return "#D005D3" // vibrant magenta
      case "CTR":
        return "#5D00FF" // deep purple
      case "Spend":
        return "#00C2FF" // bright blue
      case "ROAS":
        return "#22c55e" // green
      default:
        return "#D005D3"
    }
  }, [])

  // Handle date range selection
  const handleDateRangeChange = useCallback((value: string) => {
    if (value === "Custom") {
      setIsCustomDateOpen(true)
    } else {
      setDateRange(value as DateRange)
    }
  }, [])

  // Apply custom date range
  const applyCustomDateRange = useCallback(() => {
    if (customDateRange.from && customDateRange.to) {
      setIsCustomDateOpen(false)
      setDateRange("Custom")
    }
  }, [customDateRange])

  // Generate sample data based on date range
  useEffect(() => {
    setIsLoading(true)

    // Check if data is in cache
    const cacheKey = `${dateRange}-${customDateRange.from?.toISOString() || ""}-${
      customDateRange.to?.toISOString() || ""
    }`
    if (dataCache.has(cacheKey)) {
      setData(dataCache.get(cacheKey)!)
      setIsLoading(false)
      return
    }

    // Simulate API call delay
    const timer = setTimeout(() => {
      let days: number
      let startDate: Date

      if (dateRange === "Custom" && customDateRange.from && customDateRange.to) {
        const diffTime = Math.abs(customDateRange.to.getTime() - customDateRange.from.getTime())
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        startDate = new Date(customDateRange.from)
      } else {
        days = dateRange === "7D" ? 7 : dateRange === "30D" ? 30 : dateRange === "90D" ? 90 : 365
        startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
      }

      const newData = []
      const dataPoints = Math.min(days, 30) // Limit to 30 data points for readability
      const interval = Math.max(1, Math.floor(days / dataPoints))

      for (let i = 0; i < days; i += interval) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split("T")[0]

        const dataPoint: any = { date: dateString }

        // Add random values for each metric with some trend
        const progress = i / days
        dataPoint.Impressions = Math.floor(50000 + progress * 50000 + Math.random() * 20000)
        dataPoint.CTR = Number.parseFloat((1 + progress * 2 + Math.random()).toFixed(2))
        dataPoint.Spend = Math.floor(5000 + progress * 40000 + Math.random() * 5000)
        dataPoint.ROAS = Number.parseFloat((1 + progress * 3 + Math.random()).toFixed(1))

        // Add anomaly flag for random points
        if (Math.random() > 0.8) {
          dataPoint.isAnomaly = true
        }

        newData.push(dataPoint)
      }

      // Store in cache
      dataCache.set(cacheKey, newData)
      setData(newData)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [dateRange, customDateRange.from, customDateRange.to])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (data.length === 0)
      return {
        impressions: "0",
        ctr: "0%",
        spend: "₹0",
        roas: "0x",
      }

    const impressionsSum = data.reduce((sum, item) => sum + item.Impressions, 0)
    const ctrAvg = data.reduce((sum, item) => sum + item.CTR, 0) / data.length
    const spendSum = data.reduce((sum, item) => sum + item.Spend, 0)
    const roasAvg = data.reduce((sum, item) => sum + item.ROAS, 0) / data.length

    return {
      impressions: `${(impressionsSum / 1000).toFixed(1)}K`,
      ctr: `${ctrAvg.toFixed(1)}%`,
      spend: `₹${(spendSum / 1000).toFixed(1)}K`,
      roas: `${roasAvg.toFixed(1)}x`,
    }
  }, [data])

  // Handle data export
  const handleExportData = useCallback(() => {
    // Create CSV content
    const headers = ["Date", "Impressions", "CTR", "Spend", "ROAS"].join(",")
    const rows = data.map((item) => [item.date, item.Impressions, item.CTR, item.Spend, item.ROAS].join(","))
    const csvContent = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `campaign_performance_${dateRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [data, dateRange])

  // Custom date range display
  const customDateRangeDisplay = useMemo(() => {
    if (customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`
    }
    return "Custom"
  }, [customDateRange])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Track your campaign metrics over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={dateRange} onValueChange={handleDateRangeChange}>
              <TabsList className="bg-gray-100 dark:bg-gray-800">
                {["7D", "30D", "90D", "YTD"].map((range) => (
                  <TabsTrigger
                    key={range}
                    value={range}
                    className={`${
                      dateRange === range ? "bg-[#D005D3] text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    } transition-all`}
                  >
                    {range}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="Custom"
                  className={`${
                    dateRange === "Custom" ? "bg-[#D005D3] text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  } transition-all`}
                >
                  {dateRange === "Custom" ? customDateRangeDisplay : "Custom"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="icon"
              className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Impressions", "CTR", "Spend", "ROAS"].map((metric) => (
            <Badge
              key={metric}
              variant={selectedMetrics.includes(metric as Metric) ? "default" : "outline"}
              className="cursor-pointer transition-all"
              style={{
                backgroundColor: selectedMetrics.includes(metric as Metric)
                  ? getMetricColor(metric as Metric)
                  : undefined,
                borderColor: !selectedMetrics.includes(metric as Metric) ? getMetricColor(metric as Metric) : undefined,
                color: !selectedMetrics.includes(metric as Metric) ? getMetricColor(metric as Metric) : "#fff",
              }}
              onClick={() => toggleMetric(metric as Metric)}
            >
              {metric}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D005D3]"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                className="transition-all duration-500 ease-in-out"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value) => formatValue(value, "Impressions")}
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  hide={!selectedMetrics.includes("Impressions") && !selectedMetrics.includes("Spend")}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatValue(value, "CTR")}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  hide={!selectedMetrics.includes("CTR") && !selectedMetrics.includes("ROAS")}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {selectedMetrics.includes("Impressions") && (
                  <Line
                    type="monotone"
                    dataKey="Impressions"
                    stroke={getMetricColor("Impressions")}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    yAxisId="left"
                    animationDuration={1000}
                    isAnimationActive={true}
                  />
                )}

                {selectedMetrics.includes("CTR") && (
                  <Line
                    type="monotone"
                    dataKey="CTR"
                    stroke={getMetricColor("CTR")}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    yAxisId="right"
                    animationDuration={1000}
                    isAnimationActive={true}
                  />
                )}

                {selectedMetrics.includes("Spend") && (
                  <Line
                    type="monotone"
                    dataKey="Spend"
                    stroke={getMetricColor("Spend")}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    yAxisId="left"
                    animationDuration={1000}
                    isAnimationActive={true}
                  />
                )}

                {selectedMetrics.includes("ROAS") && (
                  <Line
                    type="monotone"
                    dataKey="ROAS"
                    stroke={getMetricColor("ROAS")}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    yAxisId="right"
                    animationDuration={1000}
                    isAnimationActive={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Anomaly indicators */}
          {!isLoading &&
            data
              .filter((d) => d.isAnomaly)
              .map((anomaly, index) => {
                const anomalyIndex = data.findIndex((d) => d.date === anomaly.date)
                const position = (anomalyIndex / (data.length - 1)) * 100

                return (
                  <div
                    key={index}
                    className="absolute flex items-center justify-center"
                    style={{
                      top: "30%",
                      left: `${position}%`,
                    }}
                  >
                    <div className="relative group">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded w-48 z-10">
                        Anomaly detected: Unusual activity on {anomaly.date}
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-3 transition-all hover:shadow-md">
            <p className="text-xs text-muted-foreground">Avg. Impressions</p>
            <p className="text-lg font-bold">{summaryMetrics.impressions}</p>
            <p className="text-xs text-emerald-500">+12.3% vs previous</p>
          </div>
          <div className="rounded-lg border p-3 transition-all hover:shadow-md">
            <p className="text-xs text-muted-foreground">Avg. CTR</p>
            <p className="text-lg font-bold">{summaryMetrics.ctr}</p>
            <p className="text-xs text-emerald-500">+0.3% vs previous</p>
          </div>
          <div className="rounded-lg border p-3 transition-all hover:shadow-md">
            <p className="text-xs text-muted-foreground">Total Spend</p>
            <p className="text-lg font-bold">{summaryMetrics.spend}</p>
            <p className="text-xs text-rose-500">-2.5% vs previous</p>
          </div>
          <div className="rounded-lg border p-3 transition-all hover:shadow-md">
            <p className="text-xs text-muted-foreground">Avg. ROAS</p>
            <p className="text-lg font-bold">{summaryMetrics.roas}</p>
            <p className="text-xs text-emerald-500">+0.8x vs previous</p>
          </div>
        </div>
      </CardContent>

      {/* Custom Date Range Dialog */}
      <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Calendar
                  mode="range"
                  selected={{
                    from: customDateRange.from,
                    to: customDateRange.to,
                  }}
                  onSelect={(range) => setCustomDateRange(range || { from: undefined, to: undefined })}
                  className="rounded-md border"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCustomDateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#D005D3] hover:bg-[#D005D3]/90 text-white"
                  onClick={applyCustomDateRange}
                  disabled={!customDateRange.from || !customDateRange.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
