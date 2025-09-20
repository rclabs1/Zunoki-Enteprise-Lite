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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filter,
  Settings,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  status?: 'connected' | 'connecting' | 'error' | 'not_connected';
  accountInfo?: any;
  error?: string;
}

interface WhatsAppProvider {
  id: string;
  name: string;
  description: string;
  features: string[];
  limitations?: string[];
  cost: 'free' | 'paid' | 'usage';
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
    pricing: 'Included',
    status: 'not_connected'
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
    pricing: 'Pay per message',
    status: 'not_connected'
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
    pricing: 'Free testing',
    status: 'not_connected'
  },
  {
    id: 'whatsapp-meta-prod',
    name: 'WhatsApp Business (Meta)',
    description: 'Direct WhatsApp Business API integration with Meta for advanced features',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Direct Meta API', 'Advanced features', 'Higher limits', 'Rich media'],
    setupComplexity: 'Hard',
    category: 'messaging',
    color: 'bg-green-700',
    provider: 'Meta Business',
    setupTime: '30 minutes',
    pricing: 'Meta pricing',
    status: 'not_connected'
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Connect with customers via Telegram messaging and bot automation',
    icon: <Send className="h-6 w-6" />,
    available: true,
    features: ['Bot API', 'Group support', 'File sharing', 'Automation'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-blue-500',
    setupTime: '10 minutes',
    pricing: 'Free',
    status: 'not_connected'
  },
  {
    id: 'gmail',
    name: 'Gmail Integration',
    description: 'Connect Gmail for email customer support and automated responses',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['Gmail API', 'OAuth integration', 'Thread management', 'Auto-replies'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-red-500',
    setupTime: '15 minutes',
    pricing: 'Free',
    status: 'not_connected'
  },
  {
    id: 'custom-email',
    name: 'Custom Email Provider',
    description: 'Connect any custom email provider via SMTP/IMAP for universal email support',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP/IMAP support', 'Custom domains', 'Advanced routing', 'Filters'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-gray-600',
    setupTime: '20 minutes',
    pricing: 'Provider dependent',
    status: 'not_connected'
  },
  {
    id: 'sms',
    name: 'SMS/Text Messages',
    description: 'Send and receive SMS messages for direct customer communication',
    icon: <Phone className="h-6 w-6" />,
    available: true,
    features: ['Two-way SMS', 'Bulk messaging', 'Delivery reports', 'Templates'],
    setupComplexity: 'Medium',
    category: 'messaging',
    color: 'bg-purple-600',
    setupTime: '15 minutes',
    pricing: 'Pay per message',
    status: 'not_connected'
  },
  {
    id: 'slack',
    name: 'Slack Integration',
    description: 'Connect with your team and customers through Slack channels and direct messages',
    icon: <Hash className="h-6 w-6" />,
    available: true,
    features: ['Bot integration', 'Channel support', 'Direct messages', 'File sharing', 'Slash commands'],
    setupComplexity: 'Medium',
    category: 'business',
    color: 'bg-purple-500',
    setupTime: '15 minutes',
    pricing: 'Free with Slack workspace',
    status: 'not_connected'
  }
];

const whatsappProviders: WhatsAppProvider[] = [
  {
    id: 'twilio-sandbox',
    name: 'Twilio Sandbox',
    description: 'Free testing environment for WhatsApp development and prototyping',
    features: ['Instant setup', 'No approval needed', 'Test with sandbox number', 'Full API access'],
    limitations: ['Users must send "join [keyword]" first', 'Limited to 1 sandbox number', 'Development only'],
    cost: 'free'
  },
  {
    id: 'twilio-production',
    name: 'Twilio Production',
    description: 'Enterprise-grade WhatsApp Business API for production use',
    features: ['Global messaging', 'Template support', 'Media messaging', 'Reliable delivery'],
    limitations: ['Requires business verification', 'Template approval needed'],
    cost: 'usage'
  },
  {
    id: 'meta-business',
    name: 'Meta Business API',
    description: 'Direct integration with WhatsApp Business Platform from Meta',
    features: ['Native WhatsApp features', 'Advanced analytics', 'Rich media support', 'Interactive messages'],
    limitations: ['Complex setup process', 'Business verification required', 'App review process'],
    cost: 'usage'
  },
  {
    id: 'meta-sandbox',
    name: 'Meta Sandbox',
    description: 'Meta\'s testing environment for WhatsApp Business API development',
    features: ['Test environment', 'No message charges', 'Full API testing', 'Development tools'],
    limitations: ['Test numbers only', 'Limited features', 'Approval required'],
    cost: 'free'
  }
];

export default function PlatformsModule() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendMessage } = useMaya();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [platformsData, setPlatformsData] = useState(platforms);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [selectedWhatsappProvider, setSelectedWhatsappProvider] = useState<WhatsAppProvider | null>(null);
  const [configModal, setConfigModal] = useState<string | null>(null);
  const [connectionConfig, setConnectionConfig] = useState<Record<string, any>>({});
  const [currentSetup, setCurrentSetup] = useState<string | null>(null);

  useEffect(() => {
    loadPlatformStatuses();
  }, [user]);

  const loadPlatformStatuses = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load real integration statuses from your existing API
      const response = await fetch('/api/messaging/integrations', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      const result = await response.json();

      if (result.success && result.integrations) {
        // Map real integrations to platform statuses
        const integrationMap = new Map();
        result.integrations.forEach((integration: any) => {
          // Map integration types to platform IDs
          let platformId = '';
          switch (integration.type) {
            case 'whatsapp':
              if (integration.provider?.includes('twilio')) {
                platformId = integration.provider.includes('sandbox') ? 'whatsapp-twilio-sandbox' : 'whatsapp-twilio-prod';
              } else if (integration.provider?.includes('meta')) {
                platformId = integration.provider.includes('sandbox') ? 'whatsapp-meta-sandbox' : 'whatsapp-meta-prod';
              }
              break;
            case 'telegram':
              platformId = 'telegram';
              break;
            case 'gmail':
              platformId = 'gmail';
              break;
            case 'email':
              platformId = 'custom-email';
              break;
            case 'sms':
              platformId = 'sms';
              break;
            case 'slack':
              platformId = 'slack';
              break;
            case 'chat-widget':
              platformId = 'website-chat';
              break;
            default:
              platformId = integration.type;
          }

          if (platformId) {
            integrationMap.set(platformId, {
              status: integration.status === 'active' ? 'connected' :
                     integration.status === 'error' ? 'error' : 'not_connected',
              accountInfo: integration.configuration,
              error: integration.error_message
            });
          }
        });

        // Update platform data with real statuses
        setPlatformsData(prev => prev.map(platform => ({
          ...platform,
          ...(integrationMap.get(platform.id) || { status: 'not_connected' })
        })));
      } else {
        // No integrations found, all platforms are not connected
        setPlatformsData(prev => prev.map(platform => ({
          ...platform,
          status: 'not_connected'
        })));
      }
    } catch (error) {
      console.error('Error loading platform statuses:', error);
      // On error, show all as not connected
      setPlatformsData(prev => prev.map(platform => ({
        ...platform,
        status: 'not_connected'
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (platform: ConnectPlatform) => {
    if (platform.id.startsWith('whatsapp')) {
      setWhatsappModal(true);
      return;
    }

    if (platform.id === 'telegram' || platform.id === 'gmail' || platform.id === 'custom-email' || platform.id === 'sms') {
      setConfigModal(platform.id);
      return;
    }

    // For other platforms, you might redirect to OAuth or other flows
    toast({
      title: 'Integration Coming Soon',
      description: `${platform.name} integration will be available soon!`,
    });
  };

  const handleWhatsappConnect = async (provider: WhatsAppProvider, config: Record<string, any>) => {
    if (!user) return;

    setCurrentSetup('whatsapp');
    setWhatsappModal(false);

    // Update platform status to connecting
    setPlatformsData(prev =>
      prev.map(p =>
        p.id.startsWith('whatsapp')
          ? { ...p, status: 'connecting' }
          : p
      )
    );

    try {
      // Call your existing WhatsApp integration API
      const response = await fetch('/api/messaging/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          platform: 'whatsapp',
          provider: provider.id,
          name: `WhatsApp (${provider.name})`,
          config: config
        })
      });

      const result = await response.json();

      if (result.success) {
        setPlatformsData(prev =>
          prev.map(p =>
            p.id.startsWith('whatsapp')
              ? { ...p, status: 'connected', provider: provider.name }
              : p
          )
        );

        toast({
          title: 'WhatsApp Connected!',
          description: 'Your WhatsApp integration is now active.',
        });

        // Ask Maya to show insights
        sendMessage('Show me WhatsApp integration insights and next steps');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      setPlatformsData(prev =>
        prev.map(p =>
          p.id.startsWith('whatsapp')
            ? { ...p, status: 'error', error: error.message }
            : p
        )
      );

      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setCurrentSetup(null);
      setConnectionConfig({});
    }
  };

  const handleDirectConnection = async (platform: ConnectPlatform) => {
    if (!user) return;

    setCurrentSetup(platform.id);
    setConfigModal(null);

    setPlatformsData(prev =>
      prev.map(p =>
        p.id === platform.id
          ? { ...p, status: 'connecting' }
          : p
      )
    );

    try {
      // Use your existing integration API endpoints
      const integrationPayload = {
        type: platform.id === 'telegram' ? 'telegram' :
              platform.id === 'gmail' ? 'gmail' :
              platform.id === 'custom-email' ? 'email' :
              platform.id === 'sms' ? 'sms' :
              platform.id === 'slack' ? 'slack' :
              platform.id === 'website-chat' ? 'chat-widget' :
              platform.id,
        name: platform.name,
        configuration: connectionConfig,
        status: 'active'
      };

      const response = await fetch('/api/messaging/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(integrationPayload)
      });

      const result = await response.json();

      if (result.success) {
        setPlatformsData(prev =>
          prev.map(p =>
            p.id === platform.id
              ? { ...p, status: 'connected', accountInfo: result.integration }
              : p
          )
        );

        toast({
          title: 'Connected!',
          description: `${platform.name} has been connected successfully.`,
        });

        // Ask Maya for insights
        sendMessage(`Show me ${platform.name} integration insights and setup recommendations`);

        // Reload platform statuses to get updated data
        loadPlatformStatuses();
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      setPlatformsData(prev =>
        prev.map(p =>
          p.id === platform.id
            ? { ...p, status: 'error', error: error.message }
            : p
        )
      );

      toast({
        title: 'Connection Failed',
        description: error.message || `Failed to connect ${platform.name}`,
        variant: 'destructive',
      });
    } finally {
      setCurrentSetup(null);
      setConnectionConfig({});
    }
  };

  const filteredPlatforms = platformsData.filter(platform => {
    const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         platform.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'connected' && platform.status === 'connected') ||
                      (activeTab === 'available' && platform.status !== 'connected');

    return matchesSearch && matchesCategory && matchesTab;
  });

  const connectedCount = platformsData.filter(p => p.status === 'connected').length;
  const availableCount = platformsData.filter(p => p.status !== 'connected').length;

  return (
    <div className="p-6">
      {/* Module Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Connect Platforms</h1>
        <p className="text-muted-foreground">Connect your messaging platforms to enable unified customer communications in your Inbox</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Platforms</p>
                <p className="text-2xl font-bold">{platformsData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="connected">Connected ({connectedCount})</TabsTrigger>
              <TabsTrigger value="available">Available ({availableCount})</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search platforms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Platforms Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading platforms...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlatforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onConnect={() => handleConnect(platform)}
              isConnecting={currentSetup === platform.id}
            />
          ))}
        </div>
      )}

      {filteredPlatforms.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No platforms found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* WhatsApp Provider Selection Modal */}
      <Dialog open={whatsappModal} onOpenChange={setWhatsappModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Connect WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <WhatsAppProviderModal
              providers={whatsappProviders}
              onSelect={handleWhatsappConnect}
              onCancel={() => setWhatsappModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Platform Configuration Modal */}
      <Dialog open={!!configModal} onOpenChange={(open) => !open && setConfigModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {configModal}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PlatformConfigModal
              platform={configModal}
              config={connectionConfig}
              setConfig={setConnectionConfig}
              onConnect={() => {
                const platform = platformsData.find(p => p.id === configModal);
                if (platform) handleDirectConnection(platform);
              }}
              onCancel={() => {
                setConfigModal(null);
                setConnectionConfig({});
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Platform Card Component
function PlatformCard({
  platform,
  onConnect,
  isConnecting
}: {
  platform: ConnectPlatform;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const getStatusColor = () => {
    switch (platform.status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (platform.status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return platform.icon;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full transition-all duration-300 hover:shadow-md ${
        platform.status === 'connected' ? 'ring-2 ring-green-200 bg-green-50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div>
                <CardTitle className="text-lg">{platform.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {platform.category}
                  </Badge>
                  <Badge variant="outline" className={
                    platform.setupComplexity === 'Easy' ? 'text-green-600 border-green-200' :
                    platform.setupComplexity === 'Medium' ? 'text-yellow-600 border-yellow-200' :
                    'text-red-600 border-red-200'
                  }>
                    {platform.setupComplexity}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>

          {/* Show connected info */}
          {platform.status === 'connected' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-xs font-medium text-green-800 mb-2">✅ Connected</h4>
              <div className="text-xs text-green-700">
                Active integration receiving messages
              </div>
            </div>
          )}

          {/* Show error */}
          {platform.status === 'error' && platform.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-xs font-medium text-red-800 mb-1">❌ Connection Error</h4>
              <p className="text-xs text-red-700">{platform.error}</p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Features:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {platform.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>Setup: {platform.setupTime}</span>
            <span>{platform.pricing}</span>
          </div>

          <Button
            onClick={onConnect}
            disabled={isConnecting || platform.status === 'connected'}
            className={`w-full ${
              platform.status === 'connected'
                ? 'bg-green-500 hover:bg-green-600'
                : platform.status === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
            }`}
            size="sm"
          >
            {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {platform.status === 'connected' ? 'Connected' :
             platform.status === 'connecting' ? 'Connecting...' :
             platform.status === 'error' ? 'Retry' : 'Connect'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// WhatsApp Provider Modal Component
function WhatsAppProviderModal({
  providers,
  onSelect,
  onCancel
}: {
  providers: WhatsAppProvider[];
  onSelect: (provider: WhatsAppProvider, config: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});

  if (selectedProvider) {
    return (
      <WhatsAppProviderConfig
        provider={selectedProvider}
        config={config}
        setConfig={setConfig}
        onConnect={() => onSelect(selectedProvider, config)}
        onBack={() => setSelectedProvider(null)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Choose your preferred WhatsApp provider:</p>

      {providers.map((provider) => (
        <div
          key={provider.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
          onClick={() => setSelectedProvider(provider)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground">{provider.name}</h3>
            <Badge variant="outline" className={
              provider.cost === 'free' ? 'text-green-600 border-green-200' :
              provider.cost === 'paid' ? 'text-orange-600 border-orange-200' :
              'text-blue-600 border-blue-200'
            }>
              {provider.cost === 'free' ? 'Free' :
               provider.cost === 'paid' ? 'Paid' : 'Usage-based'}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{provider.description}</p>

          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-medium text-green-700 mb-1">✅ Features:</h4>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {provider.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {provider.limitations && (
              <div>
                <h4 className="text-xs font-medium text-orange-700 mb-1">⚠️ Limitations:</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {provider.limitations.map((limitation, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button className="w-full mt-4" size="sm">
            Connect with {provider.name}
          </Button>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// WhatsApp Provider Configuration Component
function WhatsAppProviderConfig({
  provider,
  config,
  setConfig,
  onConnect,
  onBack,
  onCancel
}: {
  provider: WhatsAppProvider;
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  onConnect: () => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const isValid = () => {
    switch (provider.id) {
      case 'twilio-sandbox':
        return config.accountSid && config.authToken && config.sandboxKeyword;
      case 'twilio-production':
        return config.accountSid && config.authToken && config.phoneNumber;
      case 'meta-business':
        return config.businessAccountId && config.accessToken && config.phoneNumber && config.verifyToken;
      case 'meta-sandbox':
        return config.businessAccountId && config.accessToken;
      default:
        return false;
    }
  };

  const renderConfigFields = () => {
    switch (provider.id) {
      case 'twilio-sandbox':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sandbox mode is for testing only. Users must send "join [keyword]" before receiving messages.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="accountSid">Account SID</Label>
                <Input
                  id="accountSid"
                  placeholder="Enter your Twilio Account SID"
                  value={config.accountSid || ''}
                  onChange={(e) => setConfig({...config, accountSid: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="authToken">Auth Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Enter your Twilio Auth Token"
                  value={config.authToken || ''}
                  onChange={(e) => setConfig({...config, authToken: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="sandboxKeyword">Sandbox Keyword</Label>
                <Input
                  id="sandboxKeyword"
                  placeholder="Your sandbox join keyword"
                  value={config.sandboxKeyword || ''}
                  onChange={(e) => setConfig({...config, sandboxKeyword: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find in Twilio Console → Messaging → Try it out → WhatsApp
                </p>
              </div>
            </div>
          </div>
        );

      case 'twilio-production':
        return (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Production mode requires WhatsApp Business Account approval from Twilio.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="accountSid">Account SID</Label>
                <Input
                  id="accountSid"
                  placeholder="Enter your Twilio Account SID"
                  value={config.accountSid || ''}
                  onChange={(e) => setConfig({...config, accountSid: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="authToken">Auth Token</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Enter your Twilio Auth Token"
                  value={config.authToken || ''}
                  onChange={(e) => setConfig({...config, authToken: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Business Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1234567890"
                  value={config.phoneNumber || ''}
                  onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 'meta-business':
        return (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Meta WhatsApp Business API requires business verification and app approval.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345"
                  value={config.businessAccountId || ''}
                  onChange={(e) => setConfig({...config, businessAccountId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxx"
                  value={config.accessToken || ''}
                  onChange={(e) => setConfig({...config, accessToken: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number ID</Label>
                <Input
                  id="phoneNumber"
                  placeholder="123456789012345"
                  value={config.phoneNumber || ''}
                  onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="verifyToken">Verify Token</Label>
                <Input
                  id="verifyToken"
                  placeholder="your_verify_token"
                  value={config.verifyToken || ''}
                  onChange={(e) => setConfig({...config, verifyToken: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 'meta-sandbox':
        return (
          <div className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Meta sandbox for testing. Add test phone numbers in Meta Business Manager.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345"
                  value={config.businessAccountId || ''}
                  onChange={(e) => setConfig({...config, businessAccountId: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxx"
                  value={config.accessToken || ''}
                  onChange={(e) => setConfig({...config, accessToken: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-1"
        >
          ←
        </Button>
        <h3 className="font-medium">Configure {provider.name}</h3>
      </div>

      {renderConfigFields()}

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={onConnect}
          disabled={!isValid()}
          className="flex-1"
        >
          Connect {provider.name}
        </Button>
      </div>
    </div>
  );
}

// Platform Configuration Modal
function PlatformConfigModal({
  platform,
  config,
  setConfig,
  onConnect,
  onCancel
}: {
  platform: string | null;
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  onConnect: () => void;
  onCancel: () => void;
}) {
  if (!platform) return null;

  const renderConfigFields = () => {
    switch (platform) {
      case 'telegram':
        return (
          <div className="space-y-4">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Create a Telegram bot by messaging @BotFather and get your bot token.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={config.botToken || ''}
                onChange={(e) => setConfig({...config, botToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="botUsername">Bot Username (Optional)</Label>
              <Input
                id="botUsername"
                placeholder="@your_bot_username"
                value={config.botUsername || ''}
                onChange={(e) => setConfig({...config, botUsername: e.target.value})}
              />
            </div>
          </div>
        );

      case 'gmail':
        return (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Use Gmail App Passwords for secure authentication (requires 2FA enabled).
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="email">Gmail Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={config.email || ''}
                onChange={(e) => setConfig({...config, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="appPassword">App Password</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="16-character app password"
                value={config.appPassword || ''}
                onChange={(e) => setConfig({...config, appPassword: e.target.value})}
              />
            </div>
          </div>
        );

      case 'custom-email':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                placeholder="smtp.yourdomain.com"
                value={config.smtpHost || ''}
                onChange={(e) => setConfig({...config, smtpHost: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                placeholder="587"
                value={config.smtpPort || ''}
                onChange={(e) => setConfig({...config, smtpPort: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@domain.com"
                value={config.email || ''}
                onChange={(e) => setConfig({...config, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Email account password"
                value={config.password || ''}
                onChange={(e) => setConfig({...config, password: e.target.value})}
              />
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-4">
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                Configure SMS using Twilio or another SMS provider.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="provider">SMS Provider</Label>
              <Select value={config.provider || 'twilio'} onValueChange={(value) => setConfig({...config, provider: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                  <SelectItem value="vonage">Vonage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountSid">Account SID / API Key</Label>
              <Input
                id="accountSid"
                placeholder="Enter your account identifier"
                value={config.accountSid || ''}
                onChange={(e) => setConfig({...config, accountSid: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token / Secret</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Enter your auth token"
                value={config.authToken || ''}
                onChange={(e) => setConfig({...config, authToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">SMS Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="+1234567890"
                value={config.phoneNumber || ''}
                onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
              />
            </div>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            <Alert>
              <Hash className="h-4 w-4" />
              <AlertDescription>
                Create a Slack app and bot in your workspace to get the bot token and signing secret.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="botToken">Bot User OAuth Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="xoxb-your-bot-token"
                value={config.botToken || ''}
                onChange={(e) => setConfig({...config, botToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="signingSecret">Signing Secret</Label>
              <Input
                id="signingSecret"
                type="password"
                placeholder="Your app's signing secret"
                value={config.signingSecret || ''}
                onChange={(e) => setConfig({...config, signingSecret: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="appId">App ID (Optional)</Label>
              <Input
                id="appId"
                placeholder="A1234567890"
                value={config.appId || ''}
                onChange={(e) => setConfig({...config, appId: e.target.value})}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Configuration not available for {platform}</p>
          </div>
        );
    }
  };

  const isValid = () => {
    switch (platform) {
      case 'telegram':
        return config.botToken;
      case 'gmail':
        return config.email && config.appPassword;
      case 'custom-email':
        return config.smtpHost && config.smtpPort && config.email && config.password;
      case 'sms':
        return config.accountSid && config.authToken && config.phoneNumber;
      case 'slack':
        return config.botToken && config.signingSecret;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      {renderConfigFields()}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onConnect}
          disabled={!isValid()}
        >
          Connect {platform}
        </Button>
      </div>
    </div>
  );
}