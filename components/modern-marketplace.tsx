"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  Star,
  Heart,
  ArrowLeft,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface Brand {
  id: string
  name: string
  description: string
  price: number
  category: string
  rating: number
  image: string
  featured: boolean
}

const mockBrands: Brand[] = [
  {
    id: "1",
    name: "Nike Air Max",
    description: "Premium athletic footwear with innovative design",
    price: 12999,
    category: "Footwear",
    rating: 4.8,
    image: "https://source.unsplash.com/400x300/?nike,shoes",
    featured: true,
  },
  {
    id: "2",
    name: "Apple MacBook Pro",
    description: "Professional laptop for creative professionals",
    price: 199999,
    category: "Electronics",
    rating: 4.9,
    image: "https://source.unsplash.com/400x300/?macbook,laptop",
    featured: true,
  },
  {
    id: "3",
    name: "Samsung Galaxy S24",
    description: "Latest flagship smartphone with AI features",
    price: 79999,
    category: "Electronics",
    rating: 4.7,
    image: "https://source.unsplash.com/400x300/?samsung,phone",
    featured: false,
  },
  {
    id: "4",
    name: "Adidas Ultraboost",
    description: "Running shoes with responsive cushioning",
    price: 15999,
    category: "Footwear",
    rating: 4.6,
    image: "https://source.unsplash.com/400x300/?adidas,running",
    featured: false,
  },
  {
    id: "5",
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones",
    price: 29999,
    category: "Audio",
    rating: 4.8,
    image: "https://source.unsplash.com/400x300/?sony,headphones",
    featured: true,
  },
  {
    id: "6",
    name: "Tesla Model Y",
    description: "Electric SUV with autopilot capabilities",
    price: 5999999,
    category: "Automotive",
    rating: 4.9,
    image: "https://source.unsplash.com/400x300/?tesla,car",
    featured: true,
  },
]

const categories = ["All", "Electronics", "Footwear", "Audio", "Automotive", "Fashion"]

interface CartItem extends Brand {
  quantity: number
}

export function ModernMarketplace() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [isLoading, setIsLoading] = useState(true)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredBrands = mockBrands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || brand.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsCheckoutOpen(true)
  }

  const handleAddToCart = (brand: Brand, quantity = 1) => {
    const existingItem = cartItems.find((item) => item.id === brand.id)
    if (existingItem) {
      setCartItems((prev) =>
        prev.map((item) => (item.id === brand.id ? { ...item, quantity: item.quantity + quantity } : item)),
      )
    } else {
      setCartItems((prev) => [...prev, { ...brand, quantity }])
    }
    toast.success(`${brand.name} added to cart!`)
  }

  const handleUpdateQuantity = (brandId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== brandId))
    } else {
      setCartItems((prev) => prev.map((item) => (item.id === brandId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const handleCheckout = () => {
    if (selectedBrand) {
      const quantity = cartItems.find((item) => item.id === selectedBrand.id)?.quantity || 1
      const total = selectedBrand.price * quantity

      toast.success(`Payment successful! ₹${total.toLocaleString()} paid via ${paymentMethod.toUpperCase()}`, {
        duration: 3000,
      })

      setIsCheckoutOpen(false)
      setSelectedBrand(null)
    }
  }

  const toggleWishlist = (brandId: string) => {
    setWishlist((prev) => (prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]))
  }

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (isLoading) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-['Inter']">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Dashboard Button */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                variant="outline"
                className="hidden sm:flex items-center space-x-2 border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Marketplace
              </h1>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                className="relative border-slate-300 hover:bg-slate-50 md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon" className="relative border-slate-300 hover:bg-slate-50">
                <ShoppingCart className="h-4 w-4" />
                {totalCartItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {totalCartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Search & Filters */}
      <div className="md:hidden px-4 py-4 bg-white border-b border-slate-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-4 py-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Products</h2>
          <p className="text-slate-600 mb-8">Discover our handpicked selection of premium brands</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands
              .filter((brand) => brand.featured)
              .map((brand, index) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  index={index}
                  onSelect={handleBrandSelect}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isWishlisted={wishlist.includes(brand.id)}
                />
              ))}
          </div>
        </motion.section>

        {/* All Products */}
        <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">All Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand, index) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                index={index}
                onSelect={handleBrandSelect}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.includes(brand.id)}
              />
            ))}
          </div>
        </motion.section>

        {filteredBrands.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-slate-400 text-lg">No products found matching your criteria</div>
          </motion.div>
        )}
      </main>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        brand={selectedBrand}
        cartItems={cartItems}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
      />

      {/* Floating Cart Button - Mobile */}
      {totalCartItems > 0 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-6 right-6 z-40 md:hidden">
          <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
            <ShoppingCart className="h-5 w-5 mr-2" />
            {totalCartItems} • ₹{cartTotal.toLocaleString()}
          </Button>
        </motion.div>
      )}
    </div>
  )
}

// Brand Card Component
interface BrandCardProps {
  brand: Brand
  index: number
  onSelect: (brand: Brand) => void
  onAddToCart: (brand: Brand) => void
  onToggleWishlist: (brandId: string) => void
  isWishlisted: boolean
}

function BrandCard({ brand, index, onSelect, onAddToCart, onToggleWishlist, isWishlisted }: BrandCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden border-slate-200 hover:shadow-xl transition-all duration-300 bg-white">
        <div className="relative">
          <img
            src={brand.image || "/placeholder.svg"}
            alt={brand.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white ${
              isWishlisted ? "text-red-500" : "text-slate-400"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleWishlist(brand.id)
            }}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </Button>
          {brand.featured && <Badge className="absolute top-3 left-3 bg-blue-600 text-white">Featured</Badge>}
        </div>

        <CardContent className="p-6" onClick={() => onSelect(brand)}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{brand.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-slate-600">{brand.rating}</span>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{brand.description}</p>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">₹{brand.price.toLocaleString()}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {brand.category}
              </Badge>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onSelect(brand)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Buy Now
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart(brand)
              }}
              className="border-slate-300 hover:bg-slate-50"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Checkout Modal Component
interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand | null
  cartItems: CartItem[]
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  onUpdateQuantity: (brandId: string, quantity: number) => void
  onCheckout: () => void
}

function CheckoutModal({
  isOpen,
  onClose,
  brand,
  cartItems,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQuantity,
  onCheckout,
}: CheckoutModalProps) {
  if (!brand) return null

  const cartItem = cartItems.find((item) => item.id === brand.id)
  const quantity = cartItem?.quantity || 1
  const subtotal = brand.price * quantity
  const tax = subtotal * 0.18
  const total = subtotal + tax

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center space-x-4">
            <img
              src={brand.image || "/placeholder.svg"}
              alt={brand.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{brand.name}</h3>
              <p className="text-slate-600 text-sm">{brand.description}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">Quantity</span>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(brand.id, Math.max(1, quantity - 1))}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(brand.id, quantity + 1)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-medium text-slate-900 mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>UPI Payment</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Credit Card</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="debit" id="debit" />
                <Label htmlFor="debit" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Debit Card</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-medium"
          >
            Pay ₹{total.toLocaleString()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Skeleton Loader Component
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-32 bg-slate-200 rounded"></div>
            </div>
            <div className="h-8 w-8 bg-slate-200 rounded"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
