"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, Tv, Smartphone, Grid3X3, Cpu, Eye, Users, ShoppingCart } from "lucide-react"
import { allBrands, type Brand } from "@/lib/data"
import { useState } from "react"

import { CheckoutFlow } from "./checkout-flow"

const categoryIcons = {
  Digital: <Smartphone className="h-16 w-16" />,
  CTV: <Tv className="h-16 w-16" />,
  DOOH: <Monitor className="h-16 w-16" />,
  App: <Grid3X3 className="h-16 w-16" />,
  "Smart Devices": <Cpu className="h-16 w-16" />,
}

const categoryColors = {
  Digital: "from-blue-500 to-purple-600",
  CTV: "from-red-500 to-pink-600",
  DOOH: "from-green-500 to-teal-600",
  App: "from-orange-500 to-yellow-600",
  "Smart Devices": "from-purple-500 to-indigo-600",
}

interface MarketplaceCategoriesProps {
  selectedCategory?: string
  onCategorySelect?: (category: string) => void
}

export function MarketplaceCategories({ selectedCategory = "All", onCategorySelect }: MarketplaceCategoriesProps) {
  const [checkoutBrand, setCheckoutBrand] = useState<Brand | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const categories = ["Digital", "CTV", "DOOH", "App", "Smart Devices"] as const

  const filteredBrands =
    selectedCategory === "All" ? allBrands : allBrands.filter((brand) => brand.category === selectedCategory)

  const handleCheckout = (brand: Brand) => {
    setCheckoutBrand(brand)
    setIsCheckoutOpen(true)
  }

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false)
    setCheckoutBrand(null)
  }

  return (
    <div className="space-y-8">
      {/* Category Overview */}
      {selectedCategory === "All" && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Marketplace Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  onClick={() => onCategorySelect?.(category)}
                >
                  <CardHeader className="text-center pb-2">
                    <div
                      className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {categoryIcons[category]}
                    </div>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {allBrands.filter((b) => b.category === category).length} brands available
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Starting from ₹
                      {Math.min(
                        ...allBrands
                          .filter((b) => b.category === category)
                          .map((b) => Number.parseInt(b.cpm.replace("₹", ""))),
                      )}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Brand Cards */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory === "All" ? "All Brands" : `${selectedCategory} Brands`}
          </h2>
          <Badge variant="outline" className="text-sm">
            {filteredBrands.length} brands
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryColors[brand.category]} flex items-center justify-center text-white text-lg font-bold`}
                      >
                        {brand.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {brand.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium">Impressions</span>
                      </div>
                      <p className="text-lg font-bold">{brand.impressions}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium">Reach</span>
                      </div>
                      <p className="text-lg font-bold">{brand.reach}</p>
                    </div>
                  </div>

                  {/* Target Groups */}
                  <div>
                    <p className="text-sm font-medium mb-2">Target Groups:</p>
                    <div className="flex flex-wrap gap-1">
                      {brand.targetGroup.map((tg) => (
                        <Badge key={tg} variant="secondary" className="text-xs">
                          {tg}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-sm font-medium mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {brand.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Checkout */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">CPM</p>
                        <p className="text-2xl font-bold text-green-600">{brand.cpm}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Min Budget</p>
                        <p className="text-lg font-semibold">
                          ₹{(Number.parseInt(brand.cpm.replace("₹", "")) * 10).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleCheckout(brand)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Checkout Flow */}
      {checkoutBrand && <CheckoutFlow isOpen={isCheckoutOpen} onClose={handleCheckoutClose} brand={checkoutBrand} />}
    </div>
  )
}
