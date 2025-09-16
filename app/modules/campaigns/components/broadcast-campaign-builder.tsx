"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CalendarIcon, 
  Send, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import { broadcastService, type BroadcastCampaign } from '@/lib/broadcast-service'
import { complianceEngine, type ComplianceCheckResult, type ComplianceWarning } from '@/lib/compliance-engine'

interface Platform {
  id: string
  name: string
  icon: string
  enabled: boolean
  connected: boolean
  estimatedReach?: number
}

interface Audience {
  id: string
  name: string
  size: number
  platform: string[]
  description: string
}

interface CampaignForm {
  name: string
  message: string
  platforms: string[]
  audience: string[]
  scheduledFor?: Date
  sendImmediately: boolean
  mediaUrl?: string
  personalizeMessage: boolean
}

export function BroadcastCampaignBuilder() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [campaign, setCampaign] = useState<CampaignForm>({
    name: '',
    message: '',
    platforms: [],
    audience: [],
    sendImmediately: true,
    personalizeMessage: false
  })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null)
  const [showWarnings, setShowWarnings] = useState(false)

  // Mock data for platforms
  const availablePlatforms: Platform[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💚', enabled: true, connected: true, estimatedReach: 2450 },
    { id: 'telegram', name: 'Telegram', icon: '✈️', enabled: true, connected: true, estimatedReach: 890 },
    { id: 'twilio-sms', name: 'SMS', icon: '💬', enabled: true, connected: true, estimatedReach: 3200 },
    { id: 'facebook', name: 'Facebook', icon: '📘', enabled: true, connected: true, estimatedReach: 1800 },
    { id: 'instagram', name: 'Instagram', icon: '📸', enabled: true, connected: false, estimatedReach: 0 },
    { id: 'slack', name: 'Slack', icon: '💼', enabled: false, connected: false, estimatedReach: 0 }
  ]

  // Mock data for audiences
  const availableAudiences: Audience[] = [
    { id: 'all-customers', name: 'All Customers', size: 4200, platform: ['whatsapp', 'telegram', 'twilio-sms'], description: 'All active customers' },
    { id: 'premium-users', name: 'Premium Users', size: 890, platform: ['whatsapp', 'twilio-sms'], description: 'Users with premium subscription' },
    { id: 'newsletter-subs', name: 'Newsletter Subscribers', size: 2100, platform: ['telegram', 'facebook'], description: 'Newsletter subscribers' },
    { id: 'recent-signups', name: 'Recent Signups', size: 450, platform: ['whatsapp', 'twilio-sms'], description: 'Users who signed up in last 30 days' }
  ]

  useEffect(() => {
    setPlatforms(availablePlatforms)
    setAudiences(availableAudiences)
  }, [])

  const handlePlatformToggle = (platformId: string) => {
    setCampaign(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  const handleAudienceToggle = (audienceId: string) => {
    setCampaign(prev => ({
      ...prev,
      audience: prev.audience.includes(audienceId)
        ? prev.audience.filter(a => a !== audienceId)
        : [...prev.audience, audienceId]
    }))
  }

  const getEstimatedReach = () => {
    const selectedAudiences = audiences.filter(a => campaign.audience.includes(a.id))
    const selectedPlatforms = campaign.platforms
    
    if (selectedAudiences.length === 0 || selectedPlatforms.length === 0) return 0
    
    // Calculate reach based on audience size and platform availability
    return selectedAudiences.reduce((total, audience) => {
      const availablePlatforms = audience.platform.filter(p => selectedPlatforms.includes(p))
      return availablePlatforms.length > 0 ? total + audience.size : total
    }, 0)
  }

  const checkCompliance = async () => {
    if (!user?.id || campaign.platforms.length === 0 || !campaign.message) {
      setComplianceResult(null)
      return
    }

    try {
      const result = await complianceEngine.checkCompliance({
        user_id: user.id,
        platforms: campaign.platforms,
        message_content: campaign.message,
        audience_size: getEstimatedReach(),
        message_type: 'text',
        has_media: !!campaign.mediaUrl,
        template_used: false, // Could be enhanced to detect template usage
        contact_identifiers: [] // Could be populated with actual contact data
      })

      setComplianceResult(result)
      setShowWarnings(result.warnings.length > 0)
    } catch (error) {
      console.error('Error checking compliance:', error)
      setComplianceResult(null)
    }
  }

  // Check compliance when relevant fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkCompliance()
    }, 1000) // Debounce compliance checking

    return () => clearTimeout(timer)
  }, [campaign.message, campaign.platforms, user?.id])

  const handleSendCampaign = async () => {
    setLoading(true)
    try {
      // Create broadcast campaign object
      const broadcastCampaign: BroadcastCampaign = {
        campaignName: campaign.name,
        platforms: campaign.platforms,
        audienceSegments: campaign.audience,
        message: {
          content: campaign.message,
          messageType: 'text', // Default to text, could be enhanced to detect media
          mediaUrl: campaign.mediaUrl
        },
        personalizeMessage: campaign.personalizeMessage,
        scheduledFor: scheduledDate?.toISOString(),
        sendImmediately: campaign.sendImmediately
      }

      // Send campaign using broadcast service
      const result = await broadcastService.createBroadcast(broadcastCampaign)
      
      if (result.success) {
        alert(`Broadcast campaign ${campaign.sendImmediately ? 'sent' : 'scheduled'} successfully! Job ID: ${result.jobId}`)
        
        // Reset form
        setCampaign({
          name: '',
          message: '',
          platforms: [],
          audience: [],
          sendImmediately: true,
          personalizeMessage: false
        })
        setScheduledDate(undefined)
        setCurrentStep(1)
      } else {
        throw new Error(result.error || 'Failed to create broadcast')
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error)
      alert(`Failed to send campaign: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return campaign.name && campaign.message
      case 2:
        return campaign.platforms.length > 0
      case 3:
        return campaign.audience.length > 0
      default:
        return true
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { step: 1, title: 'Message', icon: MessageSquare },
          { step: 2, title: 'Platforms', icon: Send },
          { step: 3, title: 'Audience', icon: Users },
          { step: 4, title: 'Schedule', icon: Clock }
        ].map(({ step, title, icon: Icon }) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            <span className={`ml-2 ${currentStep >= step ? 'text-blue-600' : 'text-gray-500'}`}>
              {title}
            </span>
            {step < 4 && <div className="w-16 h-0.5 bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Create Your Message'}
            {currentStep === 2 && 'Select Platforms'}
            {currentStep === 3 && 'Choose Audience'}
            {currentStep === 4 && 'Schedule & Send'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Craft your broadcast message and add media if needed'}
            {currentStep === 2 && 'Choose which platforms to send your message to'}
            {currentStep === 3 && 'Select your target audience segments'}
            {currentStep === 4 && 'Review and schedule your broadcast campaign'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Message */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Product Launch Announcement"
                  value={campaign.name}
                  onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Write your broadcast message here..."
                  value={campaign.message}
                  onChange={(e) => setCampaign(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {campaign.message.length}/2000 characters
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="personalize"
                  checked={campaign.personalizeMessage}
                  onCheckedChange={(checked) => setCampaign(prev => ({ ...prev, personalizeMessage: checked }))}
                />
                <Label htmlFor="personalize">Personalize with contact name</Label>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload media (images, videos, documents)</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose File
                </Button>
              </div>

              {/* Compliance Warnings */}
              {complianceResult && showWarnings && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-amber-700">Compliance Check</span>
                      <Badge variant={complianceResult.overall_score >= 80 ? "default" : "destructive"}>
                        Score: {complianceResult.overall_score}%
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowWarnings(!showWarnings)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {complianceResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      {complianceResult.warnings.map((warning, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border-l-4 ${
                            warning.severity === 'error' 
                              ? 'bg-red-50 border-red-400' 
                              : warning.severity === 'warning'
                              ? 'bg-amber-50 border-amber-400'
                              : 'bg-blue-50 border-blue-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {warning.platform.toUpperCase()}: {warning.rule_name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">{warning.message}</p>
                              {warning.suggested_action && (
                                <p className="text-xs text-blue-600 mt-2">
                                  💡 {warning.suggested_action}
                                </p>
                              )}
                            </div>
                            {warning.auto_fix_available && (
                              <Button variant="outline" size="sm" className="text-xs">
                                Auto-fix
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {complianceResult.suggestions.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 mb-2">Suggestions:</p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {complianceResult.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Platforms */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      campaign.platforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!platform.connected ? 'opacity-50' : ''}`}
                    onClick={() => platform.connected && handlePlatformToggle(platform.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          {platform.connected ? (
                            <p className="text-sm text-green-600">
                              Connected • ~{platform.estimatedReach?.toLocaleString()} reach
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">Not connected</p>
                          )}
                        </div>
                      </div>
                      {campaign.platforms.includes(platform.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {campaign.platforms.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map(platformId => {
                      const platform = platforms.find(p => p.id === platformId)
                      return (
                        <Badge key={platformId} variant="secondary" className="bg-blue-100">
                          {platform?.icon} {platform?.name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Audience */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {audiences.map((audience) => {
                  const compatiblePlatforms = audience.platform.filter(p => campaign.platforms.includes(p))
                  const isCompatible = compatiblePlatforms.length > 0
                  
                  return (
                    <div
                      key={audience.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        campaign.audience.includes(audience.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!isCompatible ? 'opacity-50' : ''}`}
                      onClick={() => isCompatible && handleAudienceToggle(audience.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{audience.name}</h3>
                            <Badge variant="outline">{audience.size.toLocaleString()} contacts</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{audience.description}</p>
                          {isCompatible ? (
                            <div className="flex items-center space-x-1 mt-2">
                              <span className="text-xs text-green-600">Available on:</span>
                              {compatiblePlatforms.map(platformId => {
                                const platform = platforms.find(p => p.id === platformId)
                                return (
                                  <span key={platformId} className="text-xs bg-green-100 px-2 py-1 rounded">
                                    {platform?.icon} {platform?.name}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-red-600 mt-2">
                              Not available on selected platforms
                            </p>
                          )}
                        </div>
                        {campaign.audience.includes(audience.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {campaign.audience.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Estimated Reach</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {getEstimatedReach().toLocaleString()} contacts
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Across {campaign.platforms.length} platform{campaign.platforms.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Campaign Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Campaign Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {campaign.name}</div>
                  <div><strong>Message:</strong> {campaign.message.substring(0, 100)}...</div>
                  <div><strong>Platforms:</strong> {campaign.platforms.length} selected</div>
                  <div><strong>Estimated Reach:</strong> {getEstimatedReach().toLocaleString()} contacts</div>
                </div>
              </div>

              {/* Compliance Summary */}
              {complianceResult && (
                <div className={`p-4 rounded-lg border-l-4 ${
                  complianceResult.overall_score >= 80 
                    ? 'bg-green-50 border-green-400'
                    : complianceResult.overall_score >= 60 
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Compliance Status</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={complianceResult.overall_score >= 80 ? "default" : "destructive"}
                        className="text-sm"
                      >
                        {complianceResult.overall_score}% Compliant
                      </Badge>
                      {complianceResult.can_send && (
                        <Badge variant="outline" className="text-green-600">
                          ✓ Can Send
                        </Badge>
                      )}
                    </div>
                  </div>

                  {complianceResult.warnings.length > 0 && (
                    <div className="text-sm mb-3">
                      <p className="font-medium text-gray-700 mb-2">
                        {complianceResult.warnings.length} warning{complianceResult.warnings.length !== 1 ? 's' : ''} detected:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {complianceResult.warnings.slice(0, 3).map((warning, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            • {warning.platform.toUpperCase()}: {warning.rule_name}
                          </div>
                        ))}
                        {complianceResult.warnings.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{complianceResult.warnings.length - 3} more warnings
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {Object.entries(complianceResult.platform_scores).map(([platform, score]) => (
                      <div key={platform} className="flex justify-between">
                        <span className="capitalize">{platform}:</span>
                        <span className={score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}>
                          {score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduling Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-now"
                    checked={campaign.sendImmediately}
                    onCheckedChange={(checked) => setCampaign(prev => ({ ...prev, sendImmediately: checked }))}
                  />
                  <Label htmlFor="send-now">Send immediately</Label>
                </div>

                {!campaign.sendImmediately && (
                  <div>
                    <Label>Schedule for later</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        <div className="space-x-2">
          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSendCampaign}
              disabled={loading || (!campaign.sendImmediately && !scheduledDate)}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                'Sending...'
              ) : campaign.sendImmediately ? (
                'Send Now'
              ) : (
                'Schedule Broadcast'
              )}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}