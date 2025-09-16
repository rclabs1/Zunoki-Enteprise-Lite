"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  DollarSign, 
  Target, 
  MousePointer,
  Calendar,
  Filter,
  Download,
  Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  date: string
  impressions: number
  ctr: number
  cac: number
  roas: number
  cpm: number
  cpi: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
}

interface AnalyticsChartProps {
  data?: AnalyticsData[]
  timeRange: string
  onTimeRangeChange: (range: string) => void
  loading?: boolean
  className?: string
}

const sampleData: AnalyticsData[] = [
  {
    date: "2024-07-13",
    impressions: 45000,
    ctr: 3.2,
    cac: 1250,
    roas: 4.8,
    cpm: 12.5,
    cpi: 0.95,
    clicks: 1440,
    conversions: 92,
    spend: 18000,
    revenue: 86400
  },
  {
    date: "2024-07-14",
    impressions: 52000,
    ctr: 3.8,
    cac: 1150,
    roas: 5.2,
    cpm: 11.8,
    cpi: 0.88,
    clicks: 1976,
    conversions: 118,
    spend: 21000,
    revenue: 109200
  },
  {
    date: "2024-07-15",
    impressions: 48000,
    ctr: 3.5,
    cac: 1320,
    roas: 4.3,
    cpm: 13.2,
    cpi: 1.02,
    clicks: 1680,
    conversions: 85,
    spend: 19500,
    revenue: 83850
  },
  {
    date: "2024-07-16",
    impressions: 58000,
    ctr: 4.1,
    cac: 1080,
    roas: 5.8,
    cpm: 10.9,
    cpi: 0.82,
    clicks: 2378,
    conversions: 142,
    spend: 24000,
    revenue: 139200
  },
  {
    date: "2024-07-17",
    impressions: 61000,
    ctr: 4.4,
    cac: 995,
    roas: 6.1,
    cpm: 10.2,
    cpi: 0.78,
    clicks: 2684,
    conversions: 165,
    spend: 26500,
    revenue: 161650
  },
  {
    date: "2024-07-18",
    impressions: 55000,
    ctr: 3.9,
    cac: 1180,
    roas: 5.4,
    cpm: 11.5,
    cpi: 0.91,
    clicks: 2145,
    conversions: 128,
    spend: 22800,
    revenue: 123120
  },
  {
    date: "2024-07-19",
    impressions: 59000,
    ctr: 4.2,
    cac: 1050,
    roas: 5.9,
    cpm: 10.8,
    cpi: 0.85,
    clicks: 2478,
    conversions: 156,
    spend: 25200,
    revenue: 148680
  }
]

const timeRanges = [
  { label: "7D", value: "7d" },
  { label: "14D", value: "14d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" }
]

const metrics = [
  { key: "impressions", label: "Impressions", color: "#3b82f6", icon: Eye },
  { key: "ctr", label: "CTR (%)", color: "#10b981", icon: MousePointer },
  { key: "cac", label: "CAC (₹)", color: "#f59e0b", icon: Target },
  { key: "roas", label: "ROAS", color: "#8b5cf6", icon: TrendingUp },
  { key: "cpm", label: "CPM (₹)", color: "#ef4444", icon: DollarSign },
  { key: "cpi", label: "CPI (₹)", color: "#06b6d4", icon: DollarSign }
]

export default function AnalyticsChart({
  data = sampleData,
  timeRange,
  onTimeRangeChange,
  loading = false,
  className
}: AnalyticsChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState(["impressions", "ctr", "roas"])
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line")

  const filteredData = useMemo(() => {
    if (!data) return []
    
    const days = parseInt(timeRange.replace('d', ''))
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return data.filter(item => new Date(item.date) >= cutoffDate)
  }, [data, timeRange])

  const formatValue = (value: number, key: string) => {
    if (key === 'impressions' || key === 'clicks' || key === 'conversions') {
      return value.toLocaleString()
    }
    if (key === 'ctr') {
      return `${value.toFixed(1)}%`
    }
    if (key.includes('ca') || key.includes('cp') || key === 'spend' || key === 'revenue') {
      return `₹${value.toLocaleString()}`
    }
    if (key === 'roas') {
      return `${value.toFixed(1)}x`
    }
    return value.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4 shadow-xl">
          <p className="text-white font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 text-sm">
                {entry.name}: <span className="text-white font-medium">
                  {formatValue(entry.value, entry.dataKey)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    )
  }

  const getTrendData = (metricKey: string) => {
    if (filteredData.length < 2) return { trend: "neutral", change: "0%" }
    
    const current = filteredData[filteredData.length - 1][metricKey as keyof AnalyticsData]
    const previous = filteredData[filteredData.length - 2][metricKey as keyof AnalyticsData]
    
    const change = ((Number(current) - Number(previous)) / Number(previous)) * 100
    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral"
    
    return { 
      trend, 
      change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%` 
    }
  }

  if (loading) {
    return (
      <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a]", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[#1a1a1a] rounded w-48 mb-4" />
            <div className="h-80 bg-[#1a1a1a] rounded mb-4" />
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-[#1a1a1a] rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    const chartProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...chartProps}>
            <defs>
              {selectedMetrics.map((metricKey) => {
                const metric = metrics.find(m => m.key === metricKey)
                return (
                  <linearGradient key={metricKey} id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric?.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={metric?.color} stopOpacity={0}/>
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metricKey) => {
              const metric = metrics.find(m => m.key === metricKey)
              return (
                <Area
                  key={metricKey}
                  type="monotone"
                  dataKey={metricKey}
                  stroke={metric?.color}
                  fillOpacity={1}
                  fill={`url(#gradient-${metricKey})`}
                  name={metric?.label}
                />
              )
            })}
          </AreaChart>
        )
      
      case "bar":
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metricKey) => {
              const metric = metrics.find(m => m.key === metricKey)
              return (
                <Bar
                  key={metricKey}
                  dataKey={metricKey}
                  fill={metric?.color}
                  name={metric?.label}
                  radius={[2, 2, 0, 0]}
                />
              )
            })}
          </BarChart>
        )
      
      default:
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedMetrics.map((metricKey) => {
              const metric = metrics.find(m => m.key === metricKey)
              return (
                <Line
                  key={metricKey}
                  type="monotone"
                  dataKey={metricKey}
                  stroke={metric?.color}
                  strokeWidth={2}
                  dot={{ fill: metric?.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: metric?.color, strokeWidth: 2 }}
                  name={metric?.label}
                />
              )
            })}
          </LineChart>
        )
    }
  }

  return (
    <Card className={cn("bg-[#0a0a0a] border-[#1a1a1a] overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Performance Analytics</h3>
            <p className="text-gray-400 text-sm">Track key metrics and campaign performance over time</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] border border-[#333] rounded-lg">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTimeRangeChange(range.value)}
                  className={cn(
                    "h-7 px-3 text-xs font-medium transition-all",
                    timeRange === range.value
                      ? "bg-white text-black hover:bg-gray-100"
                      : "text-gray-400 hover:text-white hover:bg-[#333]"
                  )}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] border border-[#333] rounded-lg">
              {["line", "area", "bar"].map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType(type as any)}
                  className={cn(
                    "h-7 px-3 text-xs font-medium transition-all capitalize",
                    chartType === type
                      ? "bg-white text-black hover:bg-gray-100"
                      : "text-gray-400 hover:text-white hover:bg-[#333]"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#333] hover:bg-[#333] text-gray-300">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Metric Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Select Metrics:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => {
              const isSelected = selectedMetrics.includes(metric.key)
              const trendData = getTrendData(metric.key)
              const TrendIcon = trendData.trend === "up" ? TrendingUp : TrendingDown
              
              return (
                <motion.button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                    isSelected 
                      ? "bg-white/10 border-white/20 text-white" 
                      : "bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-white hover:border-white/20"
                  )}
                >
                  <metric.icon className="h-3 w-3" />
                  <span className="font-medium">{metric.label}</span>
                  {isSelected && (
                    <div className="flex items-center gap-1 ml-1">
                      <TrendIcon className={cn(
                        "h-3 w-3",
                        trendData.trend === "up" ? "text-emerald-400" : "text-red-400"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        trendData.trend === "up" ? "text-emerald-400" : "text-red-400"
                      )}>
                        {trendData.change}
                      </span>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedMetrics.slice(0, 4).map((metricKey) => {
            const metric = metrics.find(m => m.key === metricKey)
            const latestValue = filteredData[filteredData.length - 1]?.[metricKey as keyof AnalyticsData]
            const trendData = getTrendData(metricKey)
            const TrendIcon = trendData.trend === "up" ? TrendingUp : TrendingDown
            
            return (
              <div key={metricKey} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <metric.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">{metric?.label}</span>
                </div>
                <div className="text-lg font-bold text-white mb-1">
                  {formatValue(Number(latestValue), metricKey)}
                </div>
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn(
                    "h-3 w-3",
                    trendData.trend === "up" ? "text-emerald-400" : "text-red-400"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    trendData.trend === "up" ? "text-emerald-400" : "text-red-400"
                  )}>
                    {trendData.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs prev day</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}