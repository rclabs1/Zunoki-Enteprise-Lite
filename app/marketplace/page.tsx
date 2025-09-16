"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Bot, Filter, TrendingUp, Star, Zap, Eye, Users, MessageSquare, Download, ShoppingCart, Settings, Loader2, CheckCircle, XCircle, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { useSearchParams, useRouter } from "next/navigation"
import { agentMarketplaceService, AgentTemplate, Agent } from "@/lib/agent-marketplace-service"
import { AgentMarketplaceDetailModal } from "@/components/agent-marketplace-detail-modal"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useTrackPageView } from "@/hooks/use-track-page-view"

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "support":
      return "🎧";
    case "sales":
      return "💼";
    case "technical":
      return "⚙️";
    case "marketing":
      return "📢";
    case "general":
      return "🤖";
    default:
      return "🤖";
  }
};

const getCategoryBgColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "support":
      return "bg-blue-100";
    case "sales":
      return "bg-green-100";
    case "technical":
      return "bg-purple-100";
    case "marketing":
      return "bg-orange-100";
    case "general":
      return "bg-gray-100";
    default:
      return "bg-muted";
  }
};

type MarketplaceItem = AgentTemplate | Agent;

interface MarketplaceFilters {
  category: string;
  search: string;
  minRating: number;
  maxPrice: number;
  sortBy: 'rating' | 'price' | 'usage' | 'newest';
  itemType: 'templates' | 'agents' | 'all';
}

export default function AgentMarketplacePage() {
  useTrackPageView("Agent Marketplace");
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>([])
  const [marketplaceAgents, setMarketplaceAgents] = useState<Agent[]>([])
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["All"])
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: "All",
    search: "",
    minRating: 0,
    maxPrice: 1000,
    sortBy: "rating",
    itemType: "all"
  })
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [showPlatformDialog, setShowPlatformDialog] = useState(false)
  const [selectedItemForPlatforms, setSelectedItemForPlatforms] = useState<MarketplaceItem | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [allPlatformsEnabled, setAllPlatformsEnabled] = useState(true)
  
  // Agent status tracking for visual indicators
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'adding' | 'added' | 'failed'>>({})
  
  // Available platforms
  const availablePlatforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
    { id: 'gmail', name: 'Gmail', icon: '📧' },
    { id: 'telegram', name: 'Telegram', icon: '✈️' },
    { id: 'sms', name: 'SMS (Twilio)', icon: '📱' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook Messenger', icon: '💙' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'slack', name: 'Slack', icon: '💼' },
    { id: 'discord', name: 'Discord', icon: '🎮' },
    { id: 'website', name: 'Website Chat', icon: '💻' },
  ]
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, userProfile, loading: authLoading } = useAuth()

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam)
    } else {
      setSelectedCategory("All")
    }
  }, [searchParams, categories])

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === "All") {
      params.delete("category")
    } else {
      params.set("category", category)
    }
    router.push(`?${params.toString()}`)
    setSelectedCategory(category)
  }

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        setLoading(true)
        const [templates, agents] = await Promise.all([
          agentMarketplaceService.getAgentTemplates(),
          agentMarketplaceService.getMarketplaceAgents()
        ])
        setAgentTemplates(templates)
        setMarketplaceAgents(agents)
        
        // Extract categories
        const templateCategories = templates.map(t => t.category)
        const agentCategories = agents.map(a => a.category)
        const uniqueCategories = [...new Set([...templateCategories, ...agentCategories])]
        setCategories(["All", ...uniqueCategories])
      } catch (error) {
        toast({
          title: "Error fetching marketplace data",
          description: "Failed to load agents and templates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchMarketplaceData()
  }, [toast])

  // Load user teams and create default team if none exist
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user?.uid) return
      
      try {
        // Fetch teams using API endpoint
        const response = await fetch('/api/teams?includeMembers=true', {
          headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch teams')
        }
        
        let teams = await response.json()
        console.log('Loaded teams:', teams)
        
        // If no teams exist, create a default team
        if (!teams || teams.length === 0) {
          console.log('No teams found, creating default team...')
          
          const createResponse = await fetch('/api/teams', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}` 
            },
            body: JSON.stringify({
              name: "My Agents",
              description: "Personal collection of AI agents",
              specialization: ["Customer Support", "Sales", "Technical", "Marketing"],
              status: "active"
            })
          })
          
          if (createResponse.ok) {
            const createResult = await createResponse.json()
            console.log('Default team created:', createResult.team)
            
            if (createResult.team) {
              teams = [createResult.team]
            }
          } else {
            console.error('Failed to create default team:', createResponse.statusText)
          }
        }
        
        setUserTeams(teams || [])
        
        // Auto-select first team if available and no team is currently selected
        if (teams && teams.length > 0 && !selectedTeamId) {
          console.log('Auto-selecting team:', teams[0].id)
          setSelectedTeamId(teams[0].id)
        }
      } catch (error) {
        console.error('Error fetching/creating user teams:', error)
        // Show user-friendly error
        toast({
          title: "Setup in Progress",
          description: "Setting up your agent collection. This may take a moment...",
          variant: "default",
        })
      }
    }
    
    fetchUserTeams()
  }, [user?.uid]) // Use user instead of userProfile

  useEffect(() => {
    let allItems: MarketplaceItem[] = []
    
    // Combine templates and agents based on filter
    if (filters.itemType === 'templates') {
      allItems = agentTemplates
    } else if (filters.itemType === 'agents') {
      allItems = marketplaceAgents
    } else {
      allItems = [...agentTemplates, ...marketplaceAgents]
    }

    // Filter by category
    if (selectedCategory !== "All") {
      allItems = allItems.filter(
        (item) => item.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim(),
      )
    }

    // Filter by search query
    if (searchQuery) {
      allItems = allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          )
      )
    }

    // Filter by rating
    if (filters.minRating > 0) {
      allItems = allItems.filter(item => (item.rating || 0) >= filters.minRating)
    }

    // Filter by price
    const maxPrice = filters.maxPrice
    if (maxPrice < 1000) {
      allItems = allItems.filter(item => {
        const price = 'price' in item ? item.price : 0
        return price <= maxPrice
      })
    }

    // Sort items
    allItems.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'price':
          const aPrice = 'price' in a ? a.price : 0
          const bPrice = 'price' in b ? b.price : 0
          return aPrice - bPrice
        case 'usage':
          const aUsage = 'usageCount' in a ? a.usageCount : 0
          const bUsage = 'usageCount' in b ? b.usageCount : 0
          return bUsage - aUsage
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })

    setFilteredItems(allItems)
  }, [agentTemplates, marketplaceAgents, selectedCategory, searchQuery, filters])

  const handleItemClick = (item: MarketplaceItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleAddAgentToTeam = (item: MarketplaceItem) => {
    // Set loading state immediately for visual feedback
    setAgentStatuses(prev => ({ ...prev, [item.id]: 'adding' }));
    
    // Check if still loading or not authenticated
    if (authLoading) {
      setAgentStatuses(prev => ({ ...prev, [item.id]: 'failed' }));
      toast({
        title: "Loading",
        description: "Please wait while authentication is being verified.",
        variant: "default",
      });
      // Reset status after showing error
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
      return;
    }
    
    if (!user || !user.uid) {
      setAgentStatuses(prev => ({ ...prev, [item.id]: 'failed' }));
      toast({
        title: "Authentication Required",
        description: "Please log in to add agents to your collection.",
        variant: "destructive",
      });
      // Reset status after showing error
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
      return;
    }

    // Check if user profile is loaded (needed for team operations)
    if (!userProfile?.uid) {
      setAgentStatuses(prev => ({ ...prev, [item.id]: 'failed' }));
      toast({
        title: "Profile Loading",
        description: "Your profile is being loaded, please try again in a moment.",
        variant: "default",
      });
      // Reset status after showing error
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
      return;
    }

    // Auto-select team if user has only one team (common case)
    let teamId = selectedTeamId;
    if (!teamId && userTeams.length === 1) {
      teamId = userTeams[0].id;
      setSelectedTeamId(teamId);
      console.log('Auto-selected single team:', teamId);
    }

    if (!teamId) {
      setAgentStatuses(prev => ({ ...prev, [item.id]: 'failed' }));
      // Enhanced error message with actionable guidance
      toast({
        title: "Agent Collection Setup",
        description: userTeams.length === 0 
          ? "Setting up your agent collection. Please wait a moment and try again." 
          : "Please select a team from the dropdown above to continue.",
        variant: "destructive",
      });
      // Reset status after showing error
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
      return;
    }

    // Show platform selection dialog (keep status as 'adding' throughout)
    setSelectedItemForPlatforms(item);
    setSelectedPlatforms([]);
    setAllPlatformsEnabled(true);
    setShowPlatformDialog(true);
    setIsModalOpen(false);
  };

  const handleConfirmPlatformSelection = async () => {
    if (!selectedItemForPlatforms || !user?.uid) return;

    // Status is already set to 'adding' from handleAddAgentToTeam

    // Ensure we have a valid team selected
    let teamId = selectedTeamId;
    if (!teamId && userTeams.length === 1) {
      teamId = userTeams[0].id;
      setSelectedTeamId(teamId);
    }

    if (!teamId) {
      setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'failed' }));
      toast({
        title: "No Team Selected",
        description: "Please select a team to continue.",
        variant: "destructive",
      });
      return;
    }

    let agentId: string = selectedItemForPlatforms.id; // Default to item ID
    
    try {

      // Check if this is a template (needs to be purchased/converted) or direct agent
      if ('templateId' in selectedItemForPlatforms) {
        // This is a template - need to purchase/convert it to an agent first
        const purchaseResult = await agentMarketplaceService.purchaseAgentTemplate(
          user.uid,
          selectedItemForPlatforms.templateId,
          'standard'
        );
        
        if (!purchaseResult.success || !purchaseResult.agentId) {
          throw new Error(purchaseResult.error || "Failed to create agent from template");
        }
        
        agentId = purchaseResult.agentId;
      } else {
        // This is already an agent - use directly
        agentId = selectedItemForPlatforms.id;
      }

      // Add agent to selected team using API endpoint
      console.log('Adding agent to team:', { teamId, agentId });
      
      const addToTeamResponse = await fetch('/api/teams/add-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          teamId,
          agentId,
          role: 'member'
        })
      });
      
      if (!addToTeamResponse.ok) {
        const errorData = await addToTeamResponse.json();
        throw new Error(errorData.error || "Failed to add agent to team");
      }
      
      const addToTeamResult = await addToTeamResponse.json();
      console.log('Agent added to team successfully:', addToTeamResult);

      // Save platform assignments (this would need to be implemented in the team service)
      const platformsToAssign = allPlatformsEnabled ? availablePlatforms.map(p => p.id) : selectedPlatforms;
      
      // TODO: Add platform assignment logic here
      console.log('Agent platforms:', platformsToAssign);

      // Set success state
      setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'added' }));
      
      toast({
        title: "Agent Added Successfully",
        description: `${selectedItemForPlatforms.name} has been added to your collection and is ready for conversations!`,
      });

      setShowPlatformDialog(false);
      setSelectedItemForPlatforms(null);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'idle' }));
      }, 3000);
      
    } catch (error) {
      console.error("Error adding agent to team:", error);
      console.error("Detailed error info:", {
        message: error.message,
        userId: user.uid,
        teamId,
        agentId,
        selectedItem: selectedItemForPlatforms.name,
        userTeams: userTeams.length
      });
      
      // Set failed state
      setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'failed' }));
      
      toast({
        title: "Failed to Add Agent",
        description: error instanceof Error ? error.message : `Failed to add ${selectedItemForPlatforms.name} to your collection. Please try again.`,
        variant: "destructive",
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'idle' }));
      }, 3000);
    }
  };

  // Handle platform dialog cancellation
  const handlePlatformDialogClose = () => {
    if (selectedItemForPlatforms) {
      // Reset status when dialog is cancelled
      setAgentStatuses(prev => ({ ...prev, [selectedItemForPlatforms.id]: 'idle' }));
    }
    setShowPlatformDialog(false);
    setSelectedItemForPlatforms(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="p-6 space-y-8">
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
                  <ShoppingCart className="h-6 w-6 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold text-foreground">Agent Marketplace</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Discover and install AI agents and templates for your business platforms
              </p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <Badge className="bg-card text-foreground border-border px-3 py-1.5">
                <Bot className="h-3 w-3 mr-1" />
                {filteredItems.length} Available Agents
              </Badge>
              
              {/* Team Selection - Only show if user has multiple teams */}
              {userTeams.length > 1 && (
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="w-48 bg-card border-border text-foreground">
                    <SelectValue placeholder="Select Collection" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {userTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="text-foreground hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Show current collection for single team users */}
              {userTeams.length === 1 && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Users className="h-3 w-3 mr-1" />
                  {userTeams[0].name}
                </Badge>
              )}
              
              <Button variant="outline" className="border-border hover:bg-accent">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Search and Filters with Inline Agent Filters */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Top Row: Search and Advanced Filters */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search agents and templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground"
                      />
                    </div>

                    {/* Agent Filters - Now Inline */}
                    <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
                        <Filter className="h-3 w-3" />
                        Filters:
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <Select
                          onValueChange={(value: 'templates' | 'agents' | 'all') => setFilters(prev => ({ ...prev, itemType: value }))}
                          value={filters.itemType}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground text-xs h-8">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="all" className="text-foreground hover:bg-accent text-xs">All Items</SelectItem>
                            <SelectItem value="templates" className="text-foreground hover:bg-accent text-xs">Templates</SelectItem>
                            <SelectItem value="agents" className="text-foreground hover:bg-accent text-xs">Live Agents</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={(value: 'rating' | 'price' | 'usage' | 'newest') => setFilters(prev => ({ ...prev, sortBy: value }))}
                          value={filters.sortBy}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground text-xs h-8">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="rating" className="text-foreground hover:bg-accent text-xs">Highest Rated</SelectItem>
                            <SelectItem value="usage" className="text-foreground hover:bg-accent text-xs">Most Used</SelectItem>
                            <SelectItem value="price" className="text-foreground hover:bg-accent text-xs">Price (Low to High)</SelectItem>
                            <SelectItem value="newest" className="text-foreground hover:bg-accent text-xs">Newest</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Rating:</span>
                          <Input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={filters.minRating}
                            onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                            className="bg-background border-border text-foreground h-6 w-16"
                          />
                          <span className="text-xs text-muted-foreground">{filters.minRating}+</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Price:</span>
                          <Input
                            type="range"
                            min="0"
                            max="1000"
                            step="10"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                            className="bg-background border-border text-foreground h-6 w-16"
                          />
                          <span className="text-xs text-muted-foreground">${filters.maxPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category, index) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <Button
                          variant={selectedCategory === category ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCategoryClick(category)}
                          className={
                            selectedCategory === category
                              ? "bg-primary text-primary-foreground h-8 text-xs"
                              : "border-border hover:bg-accent h-8 text-xs"
                          }
                        >
                          {category}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Marketplace Content */}
          {loading ? (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border-border rounded-lg border">
                  <Skeleton className="w-full h-48 rounded-t-lg bg-muted" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-1/2 mb-4 bg-muted" />
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                      <Skeleton className="h-5 w-20 rounded-full bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="bg-card border-border rounded-lg border group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
                  onClick={() => handleItemClick(item)}
                >
                  {/* Enhanced card background with glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className={`relative w-full h-48 flex items-center justify-center rounded-t-lg ${getCategoryBgColor('category' in item ? item.category : 'general')} group-hover:brightness-110 transition-all duration-300`}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-6xl"
                    >
                      {getCategoryIcon('category' in item ? item.category : 'general')}
                    </motion.div>
                    
                    {/* Type and Category badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {'templateConfig' in item ? 'Template' : 'Agent'}
                      </Badge>
                      {'category' in item && (
                        <Badge className="bg-muted text-muted-foreground border-border text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {item.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Enhanced metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-muted rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">Rating</div>
                        <div className="text-sm font-semibold text-yellow-600 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {('rating' in item ? item.rating : 'marketplaceRating' in item ? item.marketplaceRating : 0).toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">
                          {'templateConfig' in item ? 'Usage' : 'Conversations'}
                        </div>
                        <div className="text-sm font-semibold text-blue-600">
                          {'usageCount' in item ? item.usageCount : 'conversationsHandled' in item ? item.conversationsHandled : 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-2 mb-3">
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="text-sm font-semibold text-green-600">
                        ${'price' in item ? item.price : 'marketplacePrice' in item ? item.marketplacePrice || 0 : 0}
                        {'templateConfig' in item ? ' one-time' : '/month'}
                      </div>
                    </div>
                    
                    {/* Capabilities/Specialization */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(('capabilities' in item ? item.capabilities : 'specialization' in item ? item.specialization : []) || []).slice(0, 3).map((capability) => (
                        <Badge
                          key={capability}
                          variant="outline"
                          className="text-xs border-border text-muted-foreground bg-transparent"
                        >
                          {capability}
                        </Badge>
                      ))}
                      {(('capabilities' in item ? item.capabilities : 'specialization' in item ? item.specialization : []) || []).length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground bg-transparent"
                        >
                          +{(('capabilities' in item ? item.capabilities : 'specialization' in item ? item.specialization : []) || []).length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Creator Attribution */}
                    <div className="text-muted-foreground text-xs">
                      {'creatorName' in item ? (
                        // System templates - show as Official or creator name
                        <><span className="font-medium">By:</span> {item.creatorName || 'AdmoLabs Official'}</>
                      ) : 'creator' in item && item.creator ? (
                        // User templates - show user name
                        <><span className="font-medium">By:</span> {item.creator.business_name || item.creator.first_name || 'Community Creator'}</>
                      ) : 'languages' in item ? (
                        // Agents - show languages instead
                        <><span className="font-medium">Languages:</span> {item.languages.slice(0, 2).join(', ')}{item.languages.length > 2 && '...'}</>
                      ) : (
                        // Fallback for system agents
                        <><span className="font-medium">By:</span> AdmoLabs Official</>
                      )}
                    </div>
                    
                    {/* Action button */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                        disabled={agentStatuses[item.id] === 'adding'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAgentToTeam(item);
                        }}
                      >
                        {agentStatuses[item.id] === 'adding' ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding to Team...</>
                        ) : agentStatuses[item.id] === 'added' ? (
                          <><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Added Successfully!</>
                        ) : agentStatuses[item.id] === 'failed' ? (
                          <><XCircle className="h-4 w-4 mr-2 text-red-500" />Failed - Try Again</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" />Add to Team</>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {/* Status Overlay */}
                  <AnimatePresence>
                    {agentStatuses[item.id] && agentStatuses[item.id] !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-20"
                      >
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border flex items-center gap-3"
                        >
                          {agentStatuses[item.id] === 'adding' && (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                              <span className="text-sm font-medium">Adding agent to team...</span>
                            </>
                          )}
                          {agentStatuses[item.id] === 'added' && (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">Agent added successfully!</span>
                            </>
                          )}
                          {agentStatuses[item.id] === 'failed' && (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="text-sm font-medium text-red-700 dark:text-red-400">Failed to add agent</span>
                            </>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <AgentMarketplaceDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onInstall={handleAddAgentToTeam}
      />

      {/* Platform Selection Dialog */}
      <Dialog open={showPlatformDialog} onOpenChange={(open) => {
        if (!open) handlePlatformDialogClose();
      }}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configure {selectedItemForPlatforms?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Global Option */}
            <div className="flex items-center space-x-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <Switch 
                checked={allPlatformsEnabled} 
                onCheckedChange={setAllPlatformsEnabled}
              />
              <div>
                <Label className="text-base font-medium text-foreground">
                  All Platforms
                </Label>
                <p className="text-sm text-muted-foreground">
                  Agent will handle conversations from all connected platforms
                </p>
              </div>
            </div>

            {/* Individual Platform Selection */}
            {!allPlatformsEnabled && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground">
                  Or select specific platforms:
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availablePlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.id]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{platform.icon}</span>
                        <span className="text-sm font-medium text-foreground">
                          {platform.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Agent will be available on:</strong> {' '}
                {allPlatformsEnabled 
                  ? "All platforms"
                  : selectedPlatforms.length > 0 
                    ? `${selectedPlatforms.length} selected platforms`
                    : "No platforms selected"
                }
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPlatformDialog(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPlatformSelection}
              disabled={!allPlatformsEnabled && selectedPlatforms.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="h-4 w-4 mr-2" />
              Add to My Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}