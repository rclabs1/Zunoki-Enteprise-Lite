"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Star, 
  Bot, 
  Users, 
  MessageSquare, 
  Download, 
  Zap, 
  Globe, 
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  Award
} from "lucide-react"
import { AgentTemplate, Agent } from "@/lib/agent-marketplace-service"

interface AgentMarketplaceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: (AgentTemplate | Agent) | null
  onPurchase: (item: AgentTemplate | Agent) => void
}

export function AgentMarketplaceDetailModal({
  isOpen,
  onClose,
  item,
  onPurchase
}: AgentMarketplaceDetailModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)

  if (!item) return null

  const isTemplate = 'templateConfig' in item
  const rating = 'rating' in item ? item.rating : 'marketplaceRating' in item ? item.marketplaceRating : 0
  const reviewsCount = 'reviewsCount' in item ? item.reviewsCount : 'marketplaceReviewsCount' in item ? item.marketplaceReviewsCount : 0
  const price = 'price' in item ? item.price : 'marketplacePrice' in item ? item.marketplacePrice || 0 : 0
  const capabilities = 'capabilities' in item ? item.capabilities : 'specialization' in item ? item.specialization : []
  const usageMetric = 'usageCount' in item ? item.usageCount : 'conversationsHandled' in item ? item.conversationsHandled : 0

  const handlePurchase = async () => {
    setIsPurchasing(true)
    try {
      await onPurchase(item)
    } finally {
      setIsPurchasing(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "support": return "🎧"
      case "sales": return "💼"
      case "technical": return "⚙️"
      case "marketing": return "📢"
      case "general": return "🤖"
      default: return "🤖"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#333333] text-white">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {getCategoryIcon('category' in item ? item.category : 'general')}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  {item.name}
                  <Badge className="bg-[hsl(var(--primary))] text-white">
                    {isTemplate ? 'Template' : 'Agent'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[#cccccc] text-base mt-1">
                  {item.description}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#cccccc] hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-[#262626] border-[#404040]">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-lg">{rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#cccccc]">{reviewsCount} reviews</p>
                </CardContent>
              </Card>

              <Card className="bg-[#262626] border-[#404040]">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    {isTemplate ? <Download className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    <span className="font-bold text-lg">{usageMetric}</span>
                  </div>
                  <p className="text-xs text-[#cccccc]">
                    {isTemplate ? 'downloads' : 'conversations'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#262626] border-[#404040]">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold text-lg">${price}</span>
                  </div>
                  <p className="text-xs text-[#cccccc]">
                    {isTemplate ? 'one-time' : 'per month'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
                Capabilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((capability) => (
                  <Badge 
                    key={capability}
                    variant="outline" 
                    className="border-[#404040] text-[#cccccc] bg-[#2a2a2a]"
                  >
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Configuration Details */}
            {isTemplate && 'templateConfig' in item && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#262626] border-[#404040]">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">AI Model</h4>
                      <p className="text-sm text-[#cccccc]">
                        {item.templateConfig.model || 'GPT-4'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#262626] border-[#404040]">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Response Style</h4>
                      <p className="text-sm text-[#cccccc]">
                        Temperature: {item.templateConfig.temperature || 0.7}
                      </p>
                    </CardContent>
                  </Card>

                  {item.templateConfig.voiceConfig && (
                    <Card className="bg-[#262626] border-[#404040]">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Voice Enabled</h4>
                        <p className="text-sm text-[#cccccc]">
                          {item.templateConfig.voiceConfig.voice || 'Default Voice'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-[#262626] border-[#404040]">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Max Response</h4>
                      <p className="text-sm text-[#cccccc]">
                        {item.templateConfig.maxTokens || 500} tokens
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Agent Performance */}
            {!isTemplate && 'avgResponseTimeSeconds' in item && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#262626] border-[#404040]">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Avg Response Time</h4>
                      <p className="text-sm text-[#cccccc]">
                        {Math.round(item.avgResponseTimeSeconds / 60)} minutes
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#262626] border-[#404040]">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Satisfaction Score</h4>
                      <p className="text-sm text-[#cccccc]">
                        {(item.customerSatisfactionScore * 100).toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>

                  {'languages' in item && (
                    <Card className="bg-[#262626] border-[#404040] col-span-2">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {item.languages.map((lang) => (
                            <Badge 
                              key={lang}
                              variant="outline" 
                              className="border-[#404040] text-[#cccccc] bg-[#2a2a2a] text-xs"
                            >
                              {lang.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* System Prompt Preview */}
            {isTemplate && 'templateConfig' in item && item.templateConfig.systemPrompt && (
              <div>
                <h3 className="text-lg font-semibold mb-3">System Prompt Preview</h3>
                <Card className="bg-[#262626] border-[#404040]">
                  <CardContent className="p-4">
                    <p className="text-sm text-[#cccccc] font-mono leading-relaxed">
                      {item.templateConfig.systemPrompt.slice(0, 200)}
                      {item.templateConfig.systemPrompt.length > 200 && '...'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="bg-[#262626] border-[#404040]">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    ${price}
                  </div>
                  <p className="text-sm text-[#cccccc]">
                    {isTemplate ? 'One-time purchase' : 'Per month'}
                  </p>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full netflix-btn-primary"
                  size="lg"
                >
                  {isPurchasing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : isTemplate ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Create Agent
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Hire Agent
                    </>
                  )}
                </Button>

                <div className="mt-4 space-y-2 text-sm text-[#cccccc]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {isTemplate ? 'Instant deployment' : 'Immediate access'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {isTemplate ? 'Customizable' : '24/7 availability'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Full support included
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <Card className="bg-[#262626] border-[#404040]">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Creator</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {'creatorName' in item ? item.creatorName || 'Anonymous' : 'Marketplace Agent'}
                    </p>
                    <p className="text-sm text-[#cccccc]">
                      {'category' in item ? `${item.category} Specialist` : 'Professional Agent'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-[#262626] border-[#404040]">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Created</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#cccccc]">Last Updated</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {'category' in item && (
                    <div className="flex justify-between">
                      <span className="text-[#cccccc]">Category</span>
                      <Badge variant="outline" className="border-[#404040] text-[#cccccc]">
                        {item.category}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}