"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  User, 
  Briefcase, 
  Heart, 
  Rocket, 
  Settings,
  Camera,
  Lock,
  Bell,
  CreditCard,
  Download,
  Shield,
  CheckCircle,
  Star,
  Crown,
  Activity
} from "lucide-react"
import { useTrackPageView } from "@/hooks/use-track-page-view"

const avatars = [
  { name: "User", icon: User, color: "bg-blue-500" },
  { name: "Briefcase", icon: Briefcase, color: "bg-green-500" },
  { name: "Heart", icon: Heart, color: "bg-red-500" },
  { name: "Rocket", icon: Rocket, color: "bg-purple-500" },
]

export default function ProfilePage() {
  useTrackPageView("Profile");
  const { user, userProfile, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState("")
  const [company, setCompany] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "")
      setCompany(userProfile.company || "")
      setBio(userProfile.bio || "")
      setAvatar(userProfile.avatar_url || "User")
    }
  }, [userProfile])

  const handleSaveChanges = async () => {
    setLoading(true)
    try {
      await updateUserProfile({ displayName, company, bio, avatar_url: avatar })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarSelect = (name: string) => {
    setAvatar(name)
    setIsAvatarDialogOpen(false)
  }

  const userEmail = user?.email || "user@example.com"

  const SelectedAvatar = avatars.find((a) => a.name === avatar)?.icon || User
  const SelectedAvatarColor = avatars.find((a) => a.name === avatar)?.color || "bg-gray-500"

  return (
    <ProtectedRoute>
      <div className="min-h-screen netflix-bg netflix-scrollbar">
        {/* Netflix-inspired background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#1a1a1a] to-[#0d0d0d] pointer-events-none" />
        
        <div className="relative z-10 p-6 space-y-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl"
                >
                  <Settings className="h-6 w-6 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold netflix-text-gradient">Profile Settings</h1>
              </div>
              <p className="text-[#cccccc] text-lg">
                Manage your account information, preferences, and billing settings
              </p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <Badge className="bg-[#333333] text-[#cccccc] border-[#404040] px-3 py-1.5">
                <Crown className="h-3 w-3 mr-1" />
                Pro Member
              </Badge>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </motion.div>
          </motion.div>

          {/* Profile Layout */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8"
          >
            {/* Enhanced Profile Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="netflix-card h-fit overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/10 to-transparent" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-6">
                    {/* Enhanced Avatar */}
                    <div className="relative group">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className={`h-28 w-28 rounded-full flex items-center justify-center ${SelectedAvatarColor} ring-4 ring-[hsl(var(--primary))]/20 group-hover:ring-[hsl(var(--primary))]/40 transition-all duration-300`}
                      >
                        <SelectedAvatar className="h-14 w-14 text-white" />
                      </motion.div>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-[hsl(var(--primary))] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Camera className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-white">{displayName || "User"}</h2>
                      <p className="text-sm text-[#cccccc]">{userEmail}</p>
                      <p className="text-xs text-[#999999]">{company || "Add your company"}</p>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="w-full grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-[#262626] rounded-lg">
                        <div className="text-lg font-bold text-white">24</div>
                        <div className="text-xs text-[#999999]">Campaigns</div>
                      </div>
                      <div className="text-center p-3 bg-[#262626] rounded-lg">
                        <div className="text-lg font-bold text-white">5.2M</div>
                        <div className="text-xs text-[#999999]">Impressions</div>
                      </div>
                    </div>
                    
                    {/* Change Avatar Button */}
                    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full netflix-btn-primary">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Avatar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1a1a] border-[#404040] text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Choose Your Avatar</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-4 gap-4 p-4">
                          {avatars.map((avatar) => (
                            <motion.div 
                              key={avatar.name} 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="cursor-pointer flex flex-col items-center group" 
                              onClick={() => handleAvatarSelect(avatar.name)}
                            >
                              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${avatar.color} group-hover:ring-2 group-hover:ring-[hsl(var(--primary))] transition-all duration-200`}>
                                <avatar.icon className="h-8 w-8 text-white" />
                              </div>
                              <span className="text-xs mt-2 text-[#cccccc]">{avatar.name}</span>
                            </motion.div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Settings Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="netflix-card">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
                    Account Settings
                  </CardTitle>
                  <CardDescription className="text-[#cccccc]">
                    Manage your account information, security, and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="bg-[#262626] border border-[#404040] p-1">
                      <TabsTrigger value="profile" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </TabsTrigger>
                      <TabsTrigger value="password" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                        <Lock className="h-4 w-4 mr-2" />
                        Security
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger value="billing" className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white text-[#cccccc]">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-white font-medium">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="netflix-input"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-white font-medium">
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              defaultValue={userEmail}
                              disabled
                              className="netflix-input opacity-60"
                            />
                            <p className="text-xs text-[#999999]">Email cannot be changed for security reasons</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-white font-medium">
                            Company / Organization
                          </Label>
                          <Input
                            id="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="netflix-input"
                            placeholder="Enter your company name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-white font-medium">
                            Bio / Description
                          </Label>
                          <Input
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="netflix-input"
                            placeholder="Tell us about yourself"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={handleSaveChanges} 
                            disabled={loading} 
                            className="netflix-btn-primary flex-1"
                          >
                            {loading ? (
                              <>
                                <Activity className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button variant="outline" className="netflix-btn-secondary">
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="password" className="space-y-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="p-4 bg-[#262626] border border-[#404040] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-[hsl(var(--primary))]" />
                            <h3 className="text-white font-medium">Security Requirements</h3>
                          </div>
                          <ul className="text-sm text-[#cccccc] space-y-1">
                            <li>• At least 8 characters long</li>
                            <li>• Include uppercase and lowercase letters</li>
                            <li>• Include at least one number</li>
                            <li>• Include at least one special character</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-white font-medium">
                              Current Password
                            </Label>
                            <Input
                              id="current-password"
                              type="password"
                              className="netflix-input"
                              placeholder="Enter current password"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-white font-medium">
                              New Password
                            </Label>
                            <Input
                              id="new-password"
                              type="password"
                              className="netflix-input"
                              placeholder="Enter new password"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-white font-medium">
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              className="netflix-input"
                              placeholder="Confirm new password"
                            />
                          </div>
                          
                          <div className="flex gap-3 pt-4">
                            <Button className="netflix-btn-primary flex-1">
                              <Lock className="mr-2 h-4 w-4" />
                              Update Password
                            </Button>
                            <Button variant="outline" className="netflix-btn-secondary">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-12"
                      >
                        <div className="p-8 netflix-glass rounded-xl">
                          <Bell className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--primary))] netflix-loading" />
                          <h3 className="text-2xl font-semibold text-white mb-2">Notification Settings</h3>
                          <p className="text-[#cccccc] text-lg">Customize your notification preferences</p>
                          <p className="text-[#999999] text-sm mt-2">Advanced notification controls coming soon...</p>
                        </div>
                      </motion.div>
                    </TabsContent>

                <TabsContent value="billing" className="space-y-6">
                  <div className="space-y-6">
                    <Card className="bg-[#141414] border-[#333]">
                      <CardHeader>
                        <CardTitle className="text-white">Current Plan</CardTitle>
                        <CardDescription className="text-gray-400">You are currently on the Pro plan.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-bold text-white">$99/month</p>
                            <p className="text-gray-400">Billed monthly</p>
                          </div>
                          <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white">Change Plan</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#141414] border-[#333]">
                      <CardHeader>
                        <CardTitle className="text-white">Payment Method</CardTitle>
                        <CardDescription className="text-gray-400">Your primary payment method.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="text-white text-2xl">💳</div>
                            <div>
                              <p className="font-bold text-white">Visa ending in 1234</p>
                              <p className="text-gray-400">Expires 12/2025</p>
                            </div>
                          </div>
                          <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white">Update</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#141414] border-[#333]">
                      <CardHeader>
                        <CardTitle className="text-white">Billing History</CardTitle>
                        <CardDescription className="text-gray-400">View and download your past invoices.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th className="text-gray-400 font-normal pb-2">Date</th>
                              <th className="text-gray-400 font-normal pb-2">Amount</th>
                              <th className="text-gray-400 font-normal pb-2">Status</th>
                              <th className="text-gray-400 font-normal pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-2 text-white">July 1, 2024</td>
                              <td className="py-2 text-white">$99.00</td>
                              <td className="py-2 text-green-400">Paid</td>
                              <td className="py-2 text-right">
                                <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">Download</Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-white">June 1, 2024</td>
                              <td className="py-2 text-white">$99.00</td>
                              <td className="py-2 text-green-400">Paid</td>
                              <td className="py-2 text-right">
                                <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">Download</Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-white">May 1, 2024</td>
                              <td className="py-2 text-white">$99.00</td>
                              <td className="py-2 text-green-400">Paid</td>
                              <td className="py-2 text-right">
                                <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">Download</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
