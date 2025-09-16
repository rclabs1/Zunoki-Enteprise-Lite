"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Monitor, Tv, Smartphone, Grid3X3, Cpu, TrendingUp, Users, Target } from "lucide-react"
import { useRouter } from "next/navigation"

interface MediaCategory {
  id: string
  name: string
  description: string
  activeCampaigns: number
  totalReach: string
  avgCPM: string
  icon: React.ReactNode
  tags: string[]
  growth: string
  color: string
}

const marketplaceCategories: MediaCategory[] = [
  {
    id: "digital",
    name: "Digital Media",
    description: "Social media, search ads, and display campaigns across web platforms",
    activeCampaigns: 24,
    totalReach: "3.2B",
    avgCPM: "₹150",
    icon: <Smartphone className="h-12 w-12" />,
    tags: ["Google", "Meta", "LinkedIn"],
    growth: "+18%",
    color: "from-blue-500 to-purple-600",
  },
  {
    id: "ctv",
    name: "CTV & Streaming",
    description: "Connected TV and OTT platform advertising campaigns",
    activeCampaigns: 12,
    totalReach: "450M",
    avgCPM: "₹420",
    icon: <Tv className="h-12 w-12" />,
    tags: ["Hotstar", "Netflix", "Prime"],
    growth: "+28%",
    color: "from-red-500 to-pink-600",
  },
  {
    id: "dooh",
    name: "Digital Out-of-Home",
    description: "Digital billboards, transit ads, and outdoor display networks",
    activeCampaigns: 18,
    totalReach: "180M",
    avgCPM: "₹290",
    icon: <Monitor className="h-12 w-12" />,
    tags: ["Times OOH", "JCDecaux", "Transit"],
    growth: "+12%",
    color: "from-green-500 to-teal-600",
  },
  {
    id: "apps",
    name: "In-App Advertising",
    description: "Mobile app advertising across popular consumer applications",
    activeCampaigns: 16,
    totalReach: "200M",
    avgCPM: "₹180",
    icon: <Grid3X3 className="h-12 w-12" />,
    tags: ["Swiggy", "Zomato", "Rapido"],
    growth: "+22%",
    color: "from-orange-500 to-yellow-600",
  },
  {
    id: "smart-devices",
    name: "Smart Devices",
    description: "AI-powered kiosks and interactive smart display networks",
    activeCampaigns: 8,
    totalReach: "63M",
    avgCPM: "₹340",
    icon: <Cpu className="h-12 w-12" />,
    tags: ["AI Kiosk", "Interactive", "Retail"],
    growth: "+45%",
    color: "from-purple-500 to-indigo-600",
  },
]

interface EnhancedMediaCategoriesProps {
  categories?: MediaCategory[]
}

export function EnhancedMediaCategories({ categories = marketplaceCategories }: EnhancedMediaCategoriesProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const router = useRouter()

  const handleCategoryClick = (categoryName: string) => {
    const categoryMap: { [key: string]: string } = {
      digital: "Digital",
      ctv: "CTV",
      dooh: "DOOH",
      apps: "In-App",
      "smart-devices": "Smart Devices",
    }

    const mappedCategoryName = categoryMap[categoryName.toLowerCase()] || "Digital" // Default to Digital if not found

    router.push(`/marketplace?category=${mappedCategoryName}`)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="scalable-text-xl font-bold text-white mb-2">Media Categories</h2>
        <p className="scalable-text-base text-gray-400">
          Explore our comprehensive advertising channels and their performance metrics
        </p>
      </div>

      <div className="responsive-grid-3 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredCard(category.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className="group"
          >
            <Card className="scalable-card bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 h-full">
              <CardHeader className="text-center pb-4">
                {/* Large Icon */}
                <div
                  className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {category.icon}
                </div>

                <div className="flex items-center justify-between">
                  <CardTitle className="scalable-text-base text-white group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </CardTitle>
                  <Badge className="bg-green-600 text-white text-xs">{category.growth}</Badge>
                </div>

                <CardDescription className="scalable-text-sm text-gray-400 mt-2">
                  {category.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Platform Tags */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {category.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Target className="h-3 w-3 text-blue-400 mr-1" />
                    </div>
                    <p className="scalable-text-sm font-semibold text-white">{category.activeCampaigns}</p>
                    <p className="text-xs text-gray-400">Campaigns</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Users className="h-3 w-3 text-green-400 mr-1" />
                    </div>
                    <p className="scalable-text-sm font-semibold text-white">{category.totalReach}</p>
                    <p className="text-xs text-gray-400">Reach</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-yellow-400 mr-1" />
                    </div>
                    <p className="scalable-text-sm font-semibold text-white">{category.avgCPM}</p>
                    <p className="text-xs text-gray-400">Avg CPM</p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  Explore Category
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default EnhancedMediaCategories
