"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMaya } from '@/contexts/maya-context'
import { apiGet, apiDelete } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  Settings as SettingsIcon, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Plus,
  Trash2,
  Users
} from 'lucide-react'

export default function SettingsModule() {
  const { user, userProfile, updateUserProfile } = useAuth()
  const { sendMessage } = useMaya()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [messagingIntegrations, setMessagingIntegrations] = useState<any[]>([])
  const [integrationsLoading, setIntegrationsLoading] = useState(true)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💳' }
  ]

  // Load messaging integrations on component mount
  useEffect(() => {
    if (user) {
      loadMessagingIntegrations()
    }
  }, [user])

  const loadMessagingIntegrations = async () => {
    try {
      setIntegrationsLoading(true)
      const data = await apiGet('/api/messaging/integrations')
      
      if (data.success && data.integrations) {
        setMessagingIntegrations(data.integrations)
      } else {
        setMessagingIntegrations([])
      }
    } catch (error) {
      console.error('Error loading messaging integrations:', error)
      setMessagingIntegrations([])
    } finally {
      setIntegrationsLoading(false)
    }
  }

  const handleConnectMessaging = () => {
    router.push('/connect-messaging')
  }

  const handleDisconnectIntegration = async (integrationId: string, platformName: string) => {
    try {
      await apiDelete(`/api/messaging/integrations?id=${integrationId}`)
      setMessagingIntegrations(prev => prev.filter(integration => integration.id !== integrationId))
      sendMessage(`${platformName} integration has been disconnected successfully`)
    } catch (error) {
      console.error(`Error disconnecting ${platformName}:`, error)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      whatsapp: <MessageCircle className="h-6 w-6 text-green-600" />,
      telegram: <ExternalLink className="h-6 w-6 text-blue-600" />,
      facebook: <Users className="h-6 w-6 text-blue-700" />,
      instagram: <MessageCircle className="h-6 w-6 text-pink-600" />,
      slack: <MessageCircle className="h-6 w-6 text-purple-600" />,
      discord: <MessageCircle className="h-6 w-6 text-indigo-600" />,
      youtube: <MessageCircle className="h-6 w-6 text-red-600" />,
      tiktok: <MessageCircle className="h-6 w-6 text-black" />,
      gmail: <MessageCircle className="h-6 w-6 text-red-700" />
    }
    return icons[platform] || <MessageCircle className="h-6 w-6 text-gray-600" />
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      whatsapp: 'WhatsApp Business',
      telegram: 'Telegram',
      facebook: 'Facebook Messenger',
      instagram: 'Instagram',
      slack: 'Slack',
      discord: 'Discord',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      gmail: 'Gmail'
    }
    return names[platform] || platform
  }

  const renderIntegrations = () => (
    <div className="space-y-6">
      {/* Connected Integrations */}
      {messagingIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
            <CardDescription>
              Manage your active messaging integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {integrationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messagingIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(integration.platform)}
                        <div>
                          <h4 className="font-medium text-green-900">{integration.name}</h4>
                          <p className="text-sm text-green-700">
                            {getPlatformName(integration.platform)}
                            {integration.provider && ` • ${integration.provider}`}
                            {integration.config?.phoneNumber && ` • ${integration.config.phoneNumber}`}
                            {integration.config?.botUsername && ` • ${integration.config.botUsername}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        {integration.status === 'active' ? 'Active' : integration.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/conversation')}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDisconnectIntegration(integration.id, getPlatformName(integration.platform))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connect New Platform */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Messaging Platforms</CardTitle>
          <CardDescription>
            Add new platforms to expand your business communication capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messagingIntegrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Connect Your First Platform</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start by connecting a messaging platform to receive and manage customer conversations
              </p>
              <Button onClick={handleConnectMessaging} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Connect Messaging Platform
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">Add another messaging platform to reach more customers</p>
              <Button onClick={handleConnectMessaging} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Platform
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Platforms</CardTitle>
          <CardDescription>
            Platforms you can integrate with your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <h5 className="font-medium text-gray-900">WhatsApp</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">Business messaging via WhatsApp</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <ExternalLink className="h-6 w-6 text-blue-600" />
                <h5 className="font-medium text-gray-900">Telegram</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">Bot messaging and channels</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-6 w-6 text-blue-700" />
                <h5 className="font-medium text-gray-900">Facebook</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">Messenger and page messaging</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="h-6 w-6 text-pink-600" />
                <h5 className="font-medium text-gray-900">Instagram</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">DMs and comment notifications</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="h-6 w-6 text-purple-600" />
                <h5 className="font-medium text-gray-900">Slack</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">Team and customer support</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="h-6 w-6 text-indigo-600" />
                <h5 className="font-medium text-gray-900">Discord</h5>
              </div>
              <p className="text-sm text-gray-600 mb-3">Community and support</p>
              <Badge variant="default" className="text-xs">Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-900">User Profile</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-sm"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={userProfile?.displayName || ''}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              value={userProfile?.company || ''}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={userProfile?.role || 'User'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-6">App Preferences</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Agent Maya Voice</h4>
              <p className="text-sm text-gray-600">Enable voice interactions with Agent Maya</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-optimization</h4>
              <p className="text-sm text-gray-600">Allow Agent Maya to automatically optimize campaigns</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive performance alerts and insights</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
            </button>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Currency</h4>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Timezone</h4>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="PST">Pacific Standard Time</option>
              <option value="EST">Eastern Standard Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-900">Team Management</h3>
          <button
            onClick={() => sendMessage("Help me add a new team member")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            ➕ Invite Member
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-medium text-blue-600">JS</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">John Smith (You)</h4>
                <p className="text-sm text-gray-600">john@startup.com • Admin</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Owner</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="font-medium text-purple-600">SM</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Sarah Miller</h4>
                <p className="text-sm text-gray-600">sarah@startup.com • Editor</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">⚙️</button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Team at 40% capacity.</strong> Agent Maya suggests adding a specialist for TikTok campaigns.
          </p>
          <button
            onClick={() => sendMessage("What team roles should I add to optimize my marketing efforts?")}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Get Team Recommendations →
          </button>
        </div>
      </div>
    </div>
  )

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-6">Billing & Usage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Current Plan</h4>
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-900">Pro Plan</span>
                <span className="text-blue-600 font-semibold">$99/month</span>
              </div>
              <p className="text-sm text-blue-700">Next billing: February 15, 2024</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Usage This Month</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">API Calls</span>
                <span className="font-medium">1,247 / 10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage</span>
                <span className="font-medium">2.3GB / 10GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team Seats</span>
                <span className="font-medium">2 / 5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            📈 Upgrade Plan
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
            💳 Manage Billing
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile, preferences, and account settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'integrations' && renderIntegrations()}
        {activeTab === 'preferences' && renderPreferences()}
        {activeTab === 'team' && renderTeam()}
        {activeTab === 'billing' && renderBilling()}
      </div>
    </div>
  )
}