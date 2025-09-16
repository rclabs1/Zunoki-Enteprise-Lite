"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Star, ShoppingCart, Grid, List } from "lucide-react"

interface MarketplaceItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  rating: number
  reviews: number
  image: string
  featured: boolean
  tags: string[]
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: "1",
    title: "Premium Ad Templates Pack",
    description: "Professional advertising templates for social media campaigns",
    price: 49.99,
    category: "Templates",
    rating: 4.8,
    reviews: 124,
    image: "/placeholder.svg?height=200&width=400",
    featured: true,
    tags: ["Social Media", "Professional", "Templates"],
  },
  {
    id: "2",
    title: "AI-Generated Video Assets",
    description: "High-quality video backgrounds and animations for modern ads",
    price: 79.99,
    category: "Video",
    rating: 4.9,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=400",
    featured: true,
    tags: ["AI", "Video", "Animation"],
  },
  {
    id: "3",
    title: "Brand Identity Kit",
    description: "Complete branding package with logos, colors, and guidelines",
    price: 129.99,
    category: "Branding",
    rating: 4.7,
    reviews: 156,
    image: "/placeholder.svg?height=200&width=400",
    featured: false,
    tags: ["Branding", "Logo", "Identity"],
  },
  {
    id: "4",
    title: "Mobile App UI Components",
    description: "Modern UI components optimized for mobile advertising apps",
    price: 39.99,
    category: "UI/UX",
    rating: 4.6,
    reviews: 203,
    image: "/placeholder.svg?height=200&width=400",
    featured: false,
    tags: ["Mobile", "UI", "Components"],
  },
  {
    id: "5",
    title: "Stock Photo Bundle",
    description: "Curated collection of high-resolution marketing photos",
    price: 24.99,
    category: "Photos",
    rating: 4.5,
    reviews: 312,
    image: "/placeholder.svg?height=200&width=400",
    featured: false,
    tags: ["Photos", "Stock", "Marketing"],
  },
  {
    id: "6",
    title: "Audio Branding Package",
    description: "Custom jingles and sound effects for brand recognition",
    price: 89.99,
    category: "Audio",
    rating: 4.8,
    reviews: 67,
    image: "/placeholder.svg?height=200&width=400",
    featured: false,
    tags: ["Audio", "Branding", "Sound"],
  },
  {
    id: "7",
    title: "AI Kiosk Interface Kit",
    description: "Interactive UI components for smart device and kiosk applications",
    price: 159.99,
    category: "Smart Devices",
    rating: 4.9,
    reviews: 45,
    image: "/placeholder.svg?height=200&width=400",
    featured: true,
    tags: ["AI", "Kiosk", "Interactive", "Smart Devices"],
  },
  {
    id: "8",
    title: "Touch Screen Templates",
    description: "Responsive templates designed for interactive kiosk displays",
    price: 99.99,
    category: "Smart Devices",
    rating: 4.7,
    reviews: 78,
    image: "/placeholder.svg?height=200&width=400",
    featured: false,
    tags: ["Touch Screen", "Kiosk", "Interactive", "Templates"],
  },
]

const categories = ["All", "Templates", "Video", "Branding", "UI/UX", "Photos", "Audio", "Smart Devices"]

export function ModernMarketplaceDark() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")

  const filteredItems = marketplaceItems
    .filter(
      (item) =>
        (selectedCategory === "All" || item.category === selectedCategory) &&
        (searchTerm === "" ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "featured":
        default:
          return b.featured ? 1 : -1
      }
    })

  return (
    <div className="fill-available bg-gray-900 text-white overflow-auto">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="scalable-text-xl font-bold mb-4 text-center">Digital Marketplace</h1>
          <p className="scalable-text-base text-gray-400 text-center max-w-2xl mx-auto">
            Discover premium digital assets, templates, and tools to supercharge your advertising campaigns
          </p>
        </motion.section>

        {/* Search and Filter Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search marketplace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              <div className="flex border border-gray-700 rounded">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-700" : ""}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-700" : ""}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Featured Items Section */}
        {selectedCategory === "All" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="scalable-text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Items
            </h2>
            <div className="responsive-grid-3 gap-6">
              {marketplaceItems
                .filter((item) => item.featured)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="scalable-card bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 group">
                      <div className="relative overflow-hidden">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 right-2 bg-yellow-600 text-yellow-100">Featured</Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="scalable-text-base">{item.title}</CardTitle>
                        <CardDescription className="text-gray-400 scalable-text-sm">{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="scalable-text-sm text-gray-300">
                              {item.rating} ({item.reviews})
                            </span>
                          </div>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="scalable-text-lg font-bold text-green-400">${item.price}</span>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </motion.section>
        )}

        {/* All Items Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="scalable-text-lg font-semibold mb-4">
            {selectedCategory === "All" ? "All Items" : `${selectedCategory} Items`}
            <span className="text-gray-400 scalable-text-sm ml-2">({filteredItems.length} items)</span>
          </h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="scalable-text-base text-gray-400">No items found matching your criteria.</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "responsive-grid-3 gap-6" : "space-y-4"}>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card
                    className={`scalable-card bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 group ${
                      viewMode === "list" ? "flex flex-row" : ""
                    }`}
                  >
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "list" ? "w-full h-full" : "w-full h-48"
                        }`}
                      />
                      {item.featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-600 text-yellow-100">Featured</Badge>
                      )}
                    </div>
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="scalable-text-base">{item.title}</CardTitle>
                        <CardDescription className="text-gray-400 scalable-text-sm">{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="scalable-text-sm text-gray-300">
                              {item.rating} ({item.reviews} reviews)
                            </span>
                          </div>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="scalable-text-lg font-bold text-green-400">${item.price}</span>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default ModernMarketplaceDark
