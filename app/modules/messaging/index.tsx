'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Shield,
  Zap,
  Users,
  Mail,
  Youtube,
  Music,
  Bot,
  Hash,
  ArrowRight,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '@/lib/api-client';
import { useIntegrationStatus } from '@/hooks/use-integration-status';
import { useMaya } from '@/contexts/maya-context';

type Platform = 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'outlook' | 'custom-email' | 'twilio-sms' | 'website-chat' | 'live-chat';

interface MessagingPlatform {
  id: Platform;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  features: string[];
  setupComplexity: 'Easy' | 'Medium' | 'Advanced';
  category: 'messaging' | 'social' | 'business' | 'email';
  color: string;
  providers?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

const platforms: MessagingPlatform[] = [
  {
    id: 'website-chat',
    name: 'AI-Powered Chat Widget',
    description: 'AI-powered website chat widget for instant customer engagement and conversions',
    icon: <Bot className="h-6 w-6" />,
    available: true,
    features: ['AI conversations', 'Lead capture', 'Real-time chat', 'Analytics'],
    setupComplexity: 'Easy',
    category: 'business',
    color: 'bg-primary',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect with customers via WhatsApp messaging',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Direct messaging', 'Media sharing', 'Business profiles', 'Templates'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-green-500',
    providers: [
      { id: 'twilio', name: 'Twilio Production', description: 'Enterprise-grade WhatsApp API - message any number worldwide' },
      { id: 'twilio_sandbox', name: 'Twilio Sandbox', description: 'Free testing - users must join first' },
      { id: 'meta', name: 'Meta Business Production', description: 'Direct WhatsApp Business API - message any number worldwide' },
      { id: 'meta_sandbox', name: 'Meta Business Sandbox', description: 'Free testing environment' }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Reach customers through Telegram bots',
    icon: <Bot className="h-6 w-6" />,
    available: true,
    features: ['Bot messaging', 'Groups & channels', 'Media support', 'Inline keyboards'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-blue-500'
  },
  {
    id: 'twilio-sms',
    name: 'Twilio SMS',
    description: 'Send and receive SMS messages via Twilio API',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['SMS messaging', 'MMS support', 'Global reach', 'Delivery receipts'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-purple-500'
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect with customers on Facebook Messenger',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Messenger chat', 'Rich media', 'Quick replies', 'Persistent menu'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-blue-600'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Manage Instagram direct messages and comments',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Direct messages', 'Comment notifications', 'Story mentions', 'Media sharing'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-pink-500'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect Slack for team and customer support',
    icon: <Hash className="h-6 w-6" />,
    available: true,
    features: ['Channel messaging', 'Slash commands', 'Workflows', 'File sharing'],
    setupComplexity: 'Medium',
    category: 'business',
    color: 'bg-purple-600'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Engage with communities on Discord',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Server messaging', 'Voice channels', 'Rich embeds', 'Bot commands'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-indigo-500'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Monitor and respond to YouTube comments',
    icon: <Youtube className="h-6 w-6" />,
    available: true,
    features: ['Comment monitoring', 'Like notifications', 'Analytics', 'Creator tools'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-red-500'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect with TikTok audience through comments',
    icon: <Music className="h-6 w-6" />,
    available: true,
    features: ['Comment monitoring', 'Hashtag tracking', 'Creator tools', 'Analytics'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-black'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Integrate Gmail for customer email support',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['Email threads', 'Auto-replies', 'Labels & filters', 'Rich formatting'],
    setupComplexity: 'Easy',
    category: 'email',
    color: 'bg-red-400'
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Connect Microsoft Outlook for email management',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['Email integration', 'Calendar sync', 'Contact management', 'Rules'],
    setupComplexity: 'Easy',
    category: 'email',
    color: 'bg-blue-700'
  },
  {
    id: 'custom-email',
    name: 'Custom Email',
    description: 'Connect any custom email provider via SMTP/IMAP',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP/IMAP support', 'Custom domains', 'Advanced routing', 'Email automation'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-gray-600'
  }
];

export default function MessagingModule() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendMessage } = useMaya();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    getConnectedCount,
    isConnected,
    getConnectedPlatforms,
    getStatusSummary
  } = useIntegrationStatus();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/messaging/integrations');
      if (data.success) {
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platformId: Platform, provider?: string) => {
    try {
      setIsLoading(true);
      const response = await apiPost('/api/messaging/connect', {
        platform: platformId,
        provider: provider || 'default'
      });

      if (response.success) {
        if (response.authUrl) {
          window.location.href = response.authUrl;
        } else {
          toast({
            title: "Connected!",
            description: `${platforms.find(p => p.id === platformId)?.name} has been connected successfully.`,
          });
          loadIntegrations();
        }
      } else {
        throw new Error(response.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect platform. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectedCount = getConnectedCount();
  const statusSummary = getStatusSummary();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{platforms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
          <CardDescription>
            Connect your most important messaging platforms to start engaging with customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.slice(0, 6).map((platform) => (
              <div
                key={platform.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.color} bg-opacity-10`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.setupComplexity} setup</p>
                  </div>
                  {isConnected(platform.id) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlatforms = () => (
    <div className="space-y-6">
      {['messaging', 'social', 'business', 'email'].map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{category} Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms
              .filter((platform) => platform.category === category)
              .map((platform) => (
                <Card key={platform.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${platform.color} bg-opacity-10`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{platform.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {platform.setupComplexity}
                          </Badge>
                        </div>
                      </div>
                      {isConnected(platform.id) && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                    <div className="space-y-2 mb-4">
                      {platform.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {platform.providers ? (
                        platform.providers.map((provider) => (
                          <Button
                            key={provider.id}
                            onClick={() => handleConnect(platform.id, provider.id)}
                            disabled={isLoading}
                            variant={isConnected(platform.id) ? "outline" : "default"}
                            className="w-full text-sm"
                          >
                            {isConnected(platform.id) ? 'Reconnect' : 'Connect'} via {provider.name}
                          </Button>
                        ))
                      ) : (
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          disabled={isLoading || !platform.available}
                          variant={isConnected(platform.id) ? "outline" : "default"}
                          className="w-full"
                        >
                          {!platform.available
                            ? 'Coming Soon'
                            : isConnected(platform.id)
                            ? 'Reconnect'
                            : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderConnected = () => (
    <div className="space-y-6">
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No platforms connected</h3>
            <p className="text-gray-600 mb-4">
              Connect your first messaging platform to start engaging with customers
            </p>
            <Button onClick={() => setActiveTab('platforms')}>
              Browse Platforms
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{integration.platform}</h3>
                      <p className="text-sm text-gray-600">
                        Connected {new Date(integration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Active
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(`Show me insights for my ${integration.platform} integration`)}
                    >
                      View Insights
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Platforms</h1>
        <p className="text-gray-600">
          Connect your messaging platforms to enable unified customer communications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">All Platforms</TabsTrigger>
          <TabsTrigger value="connected">Connected ({connectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="platforms">
          {renderPlatforms()}
        </TabsContent>

        <TabsContent value="connected">
          {renderConnected()}
        </TabsContent>
      </Tabs>
    </div>
  );
}