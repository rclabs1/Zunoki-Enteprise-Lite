"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  CreditCard,
  Heart,
  ShoppingCart,
  Package,
  Plus,
  Edit,
  Trash2,
  Star,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function UserProfile() {
  const { user, userProfile, updateProfile, addAddress, updateAddress, deleteAddress } = useAuth()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<string | null>(null)

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  const handleProfileUpdate = async (updates: any) => {
    await updateProfile(updates)
    setIsEditingProfile(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "shipped":
        return "bg-blue-500"
      case "confirmed":
        return "bg-yellow-500"
      case "pending":
        return "bg-orange-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "confirmed":
        return <Package className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "cancelled":
        return <X className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarImage src={userProfile.photoURL || "/placeholder.svg"} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{userProfile.displayName}</h1>
              <p className="text-white/80">{userProfile.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge className="bg-white/20 text-white">Premium Member</Badge>
                <Badge className="bg-white/20 text-white">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {userProfile.cart.length} items in cart
                </Badge>
                <Badge className="bg-white/20 text-white">
                  <Heart className="h-3 w-3 mr-1" />
                  {userProfile.wishlist.length} wishlist items
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setIsEditingProfile(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-900">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Orders
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Addresses
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Payment
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[hsl(var(--primary))]">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[hsl(var(--primary))]/20 rounded-lg">
                    <Package className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{userProfile.orderHistory.length}</p>
                    <p className="text-gray-400">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      ₹{userProfile.orderHistory.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                    </p>
                    <p className="text-gray-400">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Heart className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{userProfile.wishlist.length}</p>
                    <p className="text-gray-400">Wishlist Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Star className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">4.8</p>
                    <p className="text-gray-400">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Orders</CardTitle>
              <CardDescription>Your latest purchases and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {userProfile.orderHistory.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(order.status)}/20`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <p className="font-medium text-white">Order #{order.id}</p>
                          <p className="text-sm text-gray-400">{order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">₹{order.total.toLocaleString()}</p>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Order History</CardTitle>
              <CardDescription>View all your past orders and track current ones</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {userProfile.orderHistory.map((order) => (
                    <div key={order.id} className="p-6 bg-gray-800 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">Order #{order.id}</h3>
                          <p className="text-sm text-gray-400">Placed on {order.date}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      <Separator className="bg-gray-700" />
                      <div className="flex justify-between items-center">
                        <p className="text-gray-400">Total: ₹{order.total.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                            View Details
                          </Button>
                          {order.status === "delivered" && (
                            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">My Wishlist</CardTitle>
              <CardDescription>Items you've saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProfile.wishlist.map((brandId) => (
                  <div key={brandId} className="p-4 bg-gray-800 rounded-lg">
                    <div className="aspect-square bg-gray-700 rounded-lg mb-4"></div>
                    <h3 className="font-medium text-white mb-2">Brand {brandId}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                        Add to Cart
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-700">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Saved Addresses</CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </div>
                <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                  <DialogTrigger asChild>
                    <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                      onSubmit={async (address) => {
                        await addAddress(address)
                        setIsAddingAddress(false)
                      }}
                      onCancel={() => setIsAddingAddress(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {userProfile.addresses.map((address) => (
                  <div key={address.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">{address.name}</h3>
                        <Badge variant={address.isDefault ? "default" : "outline"} className="mt-1">
                          {address.type}
                          {address.isDefault && " (Default)"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingAddress(address.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteAddress(address.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {address.street}, {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
              <CardDescription>Manage your payment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white">Preferred Payment Method</Label>
                <Select
                  value={userProfile.shoppingPreferences.preferredPaymentMethod}
                  onValueChange={(value: any) =>
                    updateProfile({
                      shoppingPreferences: {
                        ...userProfile.shoppingPreferences,
                        preferredPaymentMethod: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-white">Saved Cards</h3>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-white">**** **** **** 1234</p>
                      <p className="text-sm text-gray-400">Expires 12/25</p>
                    </div>
                    <Badge className="ml-auto">Default</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-400">Receive updates about your orders</p>
                </div>
                <Switch
                  checked={userProfile.shoppingPreferences.notifications}
                  onCheckedChange={(checked) =>
                    updateProfile({
                      shoppingPreferences: {
                        ...userProfile.shoppingPreferences,
                        notifications: checked,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-white">Currency</Label>
                <Select
                  value={userProfile.shoppingPreferences.currency}
                  onValueChange={(value) =>
                    updateProfile({
                      shoppingPreferences: {
                        ...userProfile.shoppingPreferences,
                        currency: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Favorite Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Digital", "CTV", "DOOH", "Radio", "Print"].map((category) => (
                    <Badge
                      key={category}
                      variant={
                        userProfile.shoppingPreferences.favoriteCategories.includes(category) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const favorites = userProfile.shoppingPreferences.favoriteCategories
                        const updatedFavorites = favorites.includes(category)
                          ? favorites.filter((c) => c !== category)
                          : [...favorites, category]

                        updateProfile({
                          shoppingPreferences: {
                            ...userProfile.shoppingPreferences,
                            favoriteCategories: updatedFavorites,
                          },
                        })
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileEditForm
            userProfile={userProfile}
            onSubmit={handleProfileUpdate}
            onCancel={() => setIsEditingProfile(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Address Form Component
function AddressForm({ onSubmit, onCancel }: { onSubmit: (address: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "home" as "home" | "work" | "other",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    isDefault: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white">Address Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="e.g., Home, Office"
          required
        />
      </div>

      <div>
        <Label className="text-white">Type</Label>
        <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Street Address</Label>
        <Textarea
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Enter your street address"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-white">City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-white">State</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-white">ZIP Code</Label>
          <Input
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-white">Country</Label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label className="text-white">Set as default address</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
          Save Address
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700">
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Profile Edit Form Component
function ProfileEditForm({
  userProfile,
  onSubmit,
  onCancel,
}: { userProfile: any; onSubmit: (updates: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    displayName: userProfile.displayName,
    email: userProfile.email,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white">Display Name</Label>
        <Input
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          required
        />
      </div>

      <div>
        <Label className="text-white">Email</Label>
        <Input
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          type="email"
          required
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700">
          Cancel
        </Button>
      </div>
    </form>
  )
}
