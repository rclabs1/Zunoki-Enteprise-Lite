"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Filter, RefreshCw, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useTrackPageView } from "@/hooks/use-track-page-view"

const impressionsData = [
  { month: "Jan", impressions: 400000 },
  { month: "Feb", impressions: 450000 },
  { month: "Mar", impressions: 520000 },
  { month: "Apr", impressions: 600000 },
  { month: "May", impressions: 750000 },
  { month: "Jun", impressions: 850000 },
]

const spendData = [
  { category: "Digital", spend: 150000 },
  { category: "CTV", spend: 120000 },
  { category: "DOOH", spend: 80000 },
  { category: "App", spend: 60000 },
]

export default function ReportsPage() {
  useTrackPageView("Reports");
  const [timeRange, setTimeRange] = useState("monthly")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white"
          >
            Campaign Reports
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 mt-2"
          >
            Detailed analytics and performance insights for your campaigns.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-3"
        >
          <Button variant="outline" className="border-[#333] text-white hover:bg-[#1f1f1f]">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-[#333] text-white hover:bg-[#1f1f1f]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </motion.div>
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Impressions Trend */}
        <Card className="bg-[#1f1f1f] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Impressions Trend</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-[#141414] border-[#333] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1f1f1f] border-[#333] text-white">
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={impressionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center mt-4">
              <Badge className="bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] mr-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Impressions
              </Badge>
              <span className="text-sm text-gray-400">+23.2% growth</span>
            </div>
          </CardContent>
        </Card>

        {/* Spend Breakdown */}
        <Card className="bg-[#1f1f1f] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Spend Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="category" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center mt-4">
              <Badge className="bg-red-500/20 text-red-400 mr-2">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                Spend
              </Badge>
              <span className="text-sm text-gray-400">Total: ₹4,10,000</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CPM vs ROAS Scatter Plot */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-[#1f1f1f] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">CPM vs ROAS Scatter Plot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>Interactive scatter plot visualization would be rendered here</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
