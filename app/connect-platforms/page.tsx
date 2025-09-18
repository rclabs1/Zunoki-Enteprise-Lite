'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Globe,
  Phone,
  Send,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '@/lib/api-client';
// Removed old integration status dependency
import { useMaya } from '@/contexts/maya-context';

type Platform = 'website-chat' | 'whatsapp-twilio-prod' | 'whatsapp-twilio-sandbox' | 'whatsapp-meta-prod' | 'whatsapp-meta-sandbox' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord' | 'youtube' | 'tiktok' | 'gmail' | 'outlook' | 'custom-email' | 'sms' | 'twilio-sms';

interface ConnectPlatform {
  id: Platform;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  features: string[];
  setupComplexity: 'Easy' | 'Medium' | 'Hard';
  category: 'messaging' | 'social' | 'business' | 'email';
  color: string;
  provider?: string;
  setupTime: string;
  pricing: string;
}

const platforms: ConnectPlatform[] = [
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
    setupTime: '5 minutes',
    pricing: 'Included'
  },
  {
    id: 'whatsapp-twilio-prod',
    name: 'WhatsApp Business (Twilio)',
    description: 'Production WhatsApp Business API through Twilio for reliable messaging',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Business API', 'Template messages', 'Media support', 'Webhooks'],
    setupComplexity: 'Medium',
    category: 'messaging',
    color: 'bg-green-600',
    provider: 'Twilio Production',
    setupTime: '15 minutes',
    pricing: 'Pay per message'
  },
  {
    id: 'whatsapp-twilio-sandbox',
    name: 'WhatsApp Sandbox (Twilio)',
    description: 'Testing WhatsApp integration with Twilio Sandbox for development',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Sandbox testing', 'Quick setup', 'Development mode', 'Limited features'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-green-500',
    provider: 'Twilio Sandbox',
    setupTime: '5 minutes',
    pricing: 'Free testing'
  },
  {
    id: 'whatsapp-meta-prod',
    name: 'WhatsApp Business (Meta)',
    description: 'Direct WhatsApp Business API integration with Meta for advanced features',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Direct Meta API', 'Advanced features', 'Higher limits', 'Full control'],
    setupComplexity: 'Hard',
    category: 'messaging',
    color: 'bg-green-700',
    provider: 'Meta Production',
    setupTime: '30 minutes',
    pricing: 'Meta pricing'
  },
  {
    id: 'whatsapp-meta-sandbox',
    name: 'WhatsApp Sandbox (Meta)',
    description: 'Testing environment for Meta WhatsApp Business API development',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Meta sandbox', 'Testing environment', 'Development tools', 'API exploration'],
    setupComplexity: 'Medium',
    category: 'messaging',
    color: 'bg-green-400',
    provider: 'Meta Sandbox',
    setupTime: '10 minutes',
    pricing: 'Free testing'
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Connect with customers via Telegram messaging and bot automation',
    icon: <Send className="h-6 w-6" />,
    available: true,
    features: ['Bot API', 'Group support', 'File sharing', 'Inline keyboards'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-sky-500',
    setupTime: '10 minutes',
    pricing: 'Free'
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect with customers on Facebook Messenger for social engagement',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Messenger chat', 'Rich media', 'Quick replies', 'Persistent menu'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-blue-600',
    setupTime: '20 minutes',
    pricing: 'Free'
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Manage Instagram direct messages and comments for social customer service',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Direct messages', 'Comment notifications', 'Story mentions', 'Media sharing'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-pink-500',
    setupTime: '20 minutes',
    pricing: 'Free'
  },
  {
    id: 'slack',
    name: 'Slack Integration',
    description: 'Connect Slack for team communication and customer support workflows',
    icon: <Hash className="h-6 w-6" />,
    available: true,
    features: ['Slack API', 'Channel support', 'Direct messages', 'Bot commands'],
    setupComplexity: 'Easy',
    category: 'business',
    color: 'bg-purple-600',
    setupTime: '10 minutes',
    pricing: 'Free'
  },
  {
    id: 'discord',
    name: 'Discord Bot',
    description: 'Engage with communities on Discord for community management',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Server messaging', 'Voice channels', 'Rich embeds', 'Bot commands'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-indigo-500',
    setupTime: '15 minutes',
    pricing: 'Free'
  },
  {
    id: 'gmail',
    name: 'Gmail Integration',
    description: 'Connect Gmail for email customer support and automated responses',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['Gmail API', 'OAuth integration', 'Thread management', 'Label support'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-red-600',
    setupTime: '15 minutes',
    pricing: 'Free'
  },
  {
    id: 'custom-email',
    name: 'Custom Email Provider',
    description: 'Connect any custom email provider via SMTP/IMAP for universal email support',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP/IMAP support', 'Custom domains', 'Advanced routing', 'Email automation'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-gray-600',
    setupTime: '20 minutes',
    pricing: 'Provider dependent'
  },
  {
    id: 'sms',
    name: 'SMS/Text Messages',
    description: 'Send and receive SMS messages for direct customer communication',
    icon: <Phone className="h-6 w-6" />,
    available: true,
    features: ['Two-way SMS', 'Bulk messaging', 'Delivery reports', 'Short codes'],
    setupComplexity: 'Medium',
    category: 'messaging',
    color: 'bg-orange-600',
    setupTime: '15 minutes',
    pricing: 'Pay per message'
  }
];

export default function ConnectPlatformsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendMessage } = useMaya();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [platformStats, setPlatformStats] = useState({
    connected: 0,
    total: platforms.length,
    categories: 4,
    messagesTotal: 0
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/messaging/integrations');
      if (data.success) {
        const integrationsList = data.integrations || [];
        setIntegrations(integrationsList);

        // Update connected platforms set
        const connected = new Set(integrationsList.map((integration: any) => integration.platform));
        setConnectedPlatforms(connected);

        // Update stats
        setPlatformStats(prev => ({
          ...prev,
          connected: connected.size,
          messagesTotal: integrationsList.reduce((total: number, integration: any) =>
            total + (integration.messageCount || 0), 0
          )
        }));
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      // Set empty state on error
      setConnectedPlatforms(new Set());
      setPlatformStats(prev => ({ ...prev, connected: 0, messagesTotal: 0 }));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to replace old hook functionality
  const isConnected = (platformId: string) => {
    return connectedPlatforms.has(platformId);
  };

  const getConnectedCount = () => {
    return platformStats.connected;
  };

  const handleConnect = async (platformId: Platform) => {
    try {
      setIsLoading(true);
      const platform = platforms.find(p => p.id === platformId);

      // Route to specific connection pages based on platform
      if (platformId.includes('whatsapp')) {
        router.push('/connect-whatsapp');
      } else if (platformId === 'website-chat') {
        router.push('/connect-chat-widget');
      } else {
        // Generic connection flow
        const response = await apiPost('/api/messaging/connect', {
          platform: platformId,
          provider: platform?.provider || 'default'
        });

        if (response.success) {
          if (response.authUrl) {
            window.location.href = response.authUrl;
          } else {
            toast({
              title: "Connected!",
              description: `${platform?.name} has been connected successfully. Messages will now appear in your Inbox.`,
            });
            loadIntegrations();

            // Optional: Navigate to Inbox to show the integration
            setTimeout(() => {
              router.push('/shell?module=conversations');
            }, 2000);
          }
        } else {
          throw new Error(response.error || 'Connection failed');
        }
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

  const filteredPlatforms = platforms.filter(platform => {
    const matchesSearch = platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         platform.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Platforms', count: platforms.length },
    { id: 'messaging', label: 'Messaging', count: platforms.filter(p => p.category === 'messaging').length },
    { id: 'social', label: 'Social Media', count: platforms.filter(p => p.category === 'social').length },
    { id: 'business', label: 'Business', count: platforms.filter(p => p.category === 'business').length },
    { id: 'email', label: 'Email', count: platforms.filter(p => p.category === 'email').length }
  ];

  const connectedCount = platformStats.connected;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900">{platformStats.connected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{platformStats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{platformStats.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-gray-900">{platformStats.messagesTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Connect</CardTitle>
          <CardDescription>
            Get started with the most popular messaging platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.filter(p => ['website-chat', 'whatsapp-twilio-sandbox', 'telegram', 'gmail', 'slack', 'sms'].includes(p.id)).map((platform) => (
              <div
                key={platform.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleConnect(platform.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.color} bg-opacity-10`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.setupTime} • {platform.setupComplexity}</p>
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

  const renderAllPlatforms = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredPlatforms.map((platform) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${platform.color} bg-opacity-10`}>
                        {platform.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {platform.setupComplexity}
                          </Badge>
                          <span className="text-xs text-gray-500">{platform.setupTime}</span>
                        </div>
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
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Pricing: {platform.pricing}</span>
                    <Badge variant="secondary" className="capitalize">
                      {platform.category}
                    </Badge>
                  </div>

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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No platforms found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
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
            <div className="flex gap-3">
              <Button onClick={() => setActiveTab('platforms')}>
                Browse Platforms
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/shell?module=conversations')}
              >
                View Inbox
              </Button>
            </div>
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
                      onClick={() => router.push('/shell?module=conversations')}
                    >
                      View Messages
                    </Button>
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
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Connect your messaging platforms to enable unified customer communications in your Inbox
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/shell?module=conversations')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            View Inbox
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
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
          {renderAllPlatforms()}
        </TabsContent>

        <TabsContent value="connected">
          {renderConnected()}
        </TabsContent>
      </Tabs>
    </div>
  );
}