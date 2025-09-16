"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, TrendingUp, Eye } from "lucide-react"

interface AudienceStatsCardsProps {
  stats: {
    totalAudiences: number
    activeSegments: number
    avgAudienceSize: number
    matchRate: number
  }
  loading?: boolean
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  index 
}: { 
  title: string
  value: string | number
  change: string
  icon: any
  index: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + (index * 0.1) }}
  >
    <Card className="bg-[#1f1f1f] border-[#333] text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-emerald-500">{change}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function AudienceStatsCards({ stats, loading }: AudienceStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-[#1f1f1f] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-neutral-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-neutral-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-neutral-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Audiences",
      value: stats.totalAudiences,
      change: "+3 this month",
      icon: Users
    },
    {
      title: "Active Segments", 
      value: stats.activeSegments,
      change: "+2 this week",
      icon: Target
    },
    {
      title: "Avg. Audience Size",
      value: stats.avgAudienceSize.toLocaleString(),
      change: "+12% growth",
      icon: TrendingUp
    },
    {
      title: "Match Rate",
      value: `${stats.matchRate}%`,
      change: "+5% improvement",
      icon: Eye
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          index={index}
        />
      ))}
    </div>
  )
}