"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, Eye, DollarSign, MousePointer, Calendar } from "lucide-react"

// Sample data for the last 30 days
const generateTimeSeriesData = () => {
  const data = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split("T")[0],
      dateFormatted: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: Math.floor(Math.random() * 50000) + 30000,
      cac: Math.floor(Math.random() * 200) + 150,
      roas: (Math.random() * 2 + 2).toFixed(1),
      ctr: (Math.random() * 1.5 + 1).toFixed(2),
      spend: Math.floor(Math.random() * 15000) + 5000,
      conversions: Math.floor(Math.random() * 500) + 200,
    })
  }

  return data
}

const timeSeriesData = generateTimeSeriesData()

interface MetricConfig {
  key: string
  name: string
  color: string
  icon: React.ReactNode
  format: (value: any) => string
  enabled: boolean
}

export function CentralAnalyticsGraph() {
  const [dateRange, setDateRange] = useState("30d")
  const [chartType, setChartType] = useState("line")
  const [metrics, setMetrics] = useState<MetricConfig[]>([
    {
      key: "impressions",
      name: "Impressions",
      color: "#3b82f6",
      icon: <Eye className="h-4 w-4" />,
      format: (value) => `${(value / 1000).toFixed(1)}K`,
      enabled: true,
    },
    {
      key: "cac",
      name: "CAC",
      color: "#ef4444",
      icon: <DollarSign className="h-4 w-4" />,
      format: (value) => `₹${value}`,
      enabled: true,
    },
    {
      key: "roas",
      name: "ROAS",
      color: "#10b981",
      icon: <TrendingUp className="h-4 w-4" />,
      format: (value) => `${value}x`,
      enabled: true,
    },
    {
      key: "ctr",
      name: "CTR",
      color: "#f59e0b",
      icon: <MousePointer className="h-4 w-4" />,
      format: (value) => `${value}%`,
      enabled: true,
    },
  ])

  const toggleMetric = (metricKey: string) => {
    setMetrics((prev) =>
      prev.map((metric) => (metric.key === metricKey ? { ...metric, enabled: !metric.enabled } : metric)),
    )
  }

  const enabledMetrics = metrics.filter((metric) => metric.enabled)

  // Calculate summary stats
  const calculateTrend = (key: string) => {
    const recent = timeSeriesData.slice(-7).reduce((sum, item) => sum + Number.parseFloat(item[key]), 0) / 7
    const previous = timeSeriesData.slice(-14, -7).reduce((sum, item) => sum + Number.parseFloat(item[key]), 0) / 7
    const change = ((recent - previous) / previous) * 100
    return { value: recent, change }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f1f1f] border border-[#333] rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-medium">
                {metrics.find((m) => m.key === entry.dataKey)?.format(entry.value) || entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="bg-[#1f1f1f] border-[#333] text-white w-full">
        <CardHeader>
          <div className="flex flex-col space-y-[clamp(0.5rem,1vh,1rem)]">
            <div>
              <CardTitle className="scalable-text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[hsl(var(--primary))]" />
                Campaign Performance Analytics
              </CardTitle>
              <p className="text-gray-400 scalable-text-sm mt-1">
                Track key metrics across all your advertising campaigns
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32 bg-[#141414] border-[#333] text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#333]">
                  <SelectItem value="7d" className="text-white">
                    7 days
                  </SelectItem>
                  <SelectItem value="30d" className="text-white">
                    30 days
                  </SelectItem>
                  <SelectItem value="90d" className="text-white">
                    90 days
                  </SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={chartType} onValueChange={setChartType}>
                <TabsList className="bg-[#141414] border-[#333]">
                  <TabsTrigger value="line" className="text-white data-[state=active]:bg-[hsl(var(--primary))]">
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="text-white data-[state=active]:bg-[hsl(var(--primary))]">
                    Bar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Metric Toggle Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {metrics.map((metric) => {
              const trend = calculateTrend(metric.key)
              return (
                <Button
                  key={metric.key}
                  variant={metric.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleMetric(metric.key)}
                  className={`flex items-center gap-2 ${
                    metric.enabled
                      ? "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white"
                      : "border-[#333] text-gray-300 hover:bg-[#1f1f1f] hover:text-white"
                  }`}
                >
                  {metric.icon}
                  <span className="scalable-text-sm">{metric.name}</span>
                  <Badge
                    className={`ml-1 text-xs ${
                      trend.change > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trend.change > 0 ? "+" : ""}
                    {trend.change.toFixed(1)}%
                  </Badge>
                </Button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="dateFormatted" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {enabledMetrics.map((metric) => (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: metric.color, strokeWidth: 2 }}
                      name={metric.name}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="dateFormatted" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {enabledMetrics.map((metric, index) => (
                    <Bar
                      key={metric.key}
                      dataKey={metric.key}
                      fill={metric.color}
                      name={metric.name}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="responsive-grid-4 mt-[clamp(1rem,2vh,1.5rem)] pt-[clamp(1rem,2vh,1.5rem)] border-t border-[#333]">
            {metrics.map((metric) => {
              const trend = calculateTrend(metric.key)
              return (
                <div key={metric.key} className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 scalable-text-sm mb-1">
                    {metric.icon}
                    <span>{metric.name}</span>
                  </div>
                  <div className="scalable-text-lg font-bold text-white">{metric.format(trend.value)}</div>
                  <div
                    className={`scalable-text-sm flex items-center justify-center gap-1 ${
                      trend.change > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {trend.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(trend.change).toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
