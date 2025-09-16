"use client"
import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { format } from "date-fns"

interface InteractiveKpiCardProps {
  title: string
  value: string
  change: {
    value: string
    isPositive: boolean
  }
  icon: React.ReactNode
  progressValue: number
  chartData: any[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }

  return null
}

export function InteractiveKpiCard({ title, value, change, icon, progressValue, chartData }: InteractiveKpiCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("30D")

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, "MMM d")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-[#D005D3]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={change.isPositive ? "text-emerald-500" : "text-rose-500"}>{change.value}</span> from last
              month
            </p>
            <div className="mt-3 h-1 w-full rounded-full bg-muted">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-[#D005D3] to-[#5D00FF]"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-sm text-muted-foreground">
                <span className={change.isPositive ? "text-emerald-500" : "text-rose-500"}>{change.value}</span> from
                last month
              </p>
            </div>
            <div className="flex gap-2">
              {["7D", "30D", "90D"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-[#D005D3] text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                className="transition-all duration-500 ease-in-out"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis
                  tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}`}
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={title}
                  stroke="#D005D3"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  animationDuration={1000}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">By Platform</p>
              <p className="text-sm font-medium">Instagram: 45%</p>
              <p className="text-sm font-medium">Google: 30%</p>
              <p className="text-sm font-medium">Others: 25%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">By Geography</p>
              <p className="text-sm font-medium">Mumbai: 35%</p>
              <p className="text-sm font-medium">Delhi: 25%</p>
              <p className="text-sm font-medium">Others: 40%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">By Device</p>
              <p className="text-sm font-medium">Mobile: 65%</p>
              <p className="text-sm font-medium">Desktop: 25%</p>
              <p className="text-sm font-medium">Others: 10%</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
