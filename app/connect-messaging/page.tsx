'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Remove NavigationBar import since it depends on Maya context
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
  Globe,
  LogOut,
  Settings as SettingsIcon,
  CreditCard,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '@/lib/api-client';
import { useIntegrationStatus } from '@/hooks/use-integration-status';

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
    features: ['SMS messaging', 'Delivery reports', 'Global reach', 'Media support'],
    setupComplexity: 'Easy',
    category: 'messaging',
    color: 'bg-purple-500'
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect via Facebook Messenger',
    icon: <Users className="h-6 w-6" />,
    available: true,
    features: ['Page messaging', 'Rich media', 'Quick replies', 'Persistent menu'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-blue-600',
    providers: [
      { id: 'meta', name: 'Meta Business', description: 'Direct Facebook Messenger API' }
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'DMs and comment notifications',
    icon: <Shield className="h-6 w-6" />,
    available: true,
    features: ['Direct messages', 'Comment notifications', 'Story mentions'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-pink-500',
    providers: [
      { id: 'meta_sandbox', name: 'Meta Business Sandbox', description: 'Test with up to 5 users - no approval needed' },
      { id: 'meta', name: 'Meta Business Production', description: 'Full access - requires Meta app review approval' }
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and customer support',
    icon: <Hash className="h-6 w-6" />,
    available: true,
    features: ['Channel messaging', 'DMs', 'Slash commands', 'Interactive messages'],
    setupComplexity: 'Medium',
    category: 'business',
    color: 'bg-purple-500',
    providers: [
      { id: 'slack', name: 'Slack API', description: 'Direct Slack Bot and App API' }
    ]
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community engagement and support',
    icon: <Music className="h-6 w-6" />,
    available: true,
    features: ['Server messaging', 'Voice channels', 'Rich embeds', 'Slash commands'],
    setupComplexity: 'Medium',
    category: 'social',
    color: 'bg-indigo-500',
    providers: [
      { id: 'discord', name: 'Discord Bot API', description: 'Direct Discord Bot and Application API' }
    ]
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video comment management and creator engagement',
    icon: <Youtube className="h-6 w-6" />,
    available: true,
    features: ['Comment monitoring', 'Reply to comments', 'Video analytics', 'Creator engagement'],
    setupComplexity: 'Advanced',
    category: 'social',
    color: 'bg-red-500'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'DMs and comment engagement',
    icon: <Music className="h-6 w-6" />,
    available: false,
    features: ['Direct messages', 'Comment notifications', 'Video engagement'],
    setupComplexity: 'Advanced',
    category: 'social',
    color: 'bg-black'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails via Gmail SMTP + forwarding',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP sending', 'Email forwarding', 'Thread support', 'Auto-classification'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-red-600'
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Microsoft Outlook/Hotmail email integration',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP sending', 'Email forwarding', 'Thread support', 'Office 365 support'],
    setupComplexity: 'Medium',
    category: 'email',
    color: 'bg-blue-600'
  },
  {
    id: 'custom-email',
    name: 'Custom Email',
    description: 'Any email provider with IMAP/SMTP support',
    icon: <Mail className="h-6 w-6" />,
    available: true,
    features: ['SMTP sending', 'IMAP receiving', 'Custom server support', 'SSL/TLS encryption'],
    setupComplexity: 'Advanced',
    category: 'email',
    color: 'bg-gray-600'
  },
  {
    id: 'website-chat',
    name: 'Website Chat Widget',
    description: 'Embeddable chat widget for your website',
    icon: <Globe className="h-6 w-6" />,
    available: true,
    features: ['Live chat', 'Visitor tracking', 'File uploads', 'Offline messages', 'Custom styling'],
    setupComplexity: 'Easy',
    category: 'business',
    color: 'bg-green-600'
  },
  {
    id: 'live-chat',
    name: 'Live Chat',
    description: 'Real-time chat with website visitors and customers',
    icon: <MessageCircle className="h-6 w-6" />,
    available: true,
    features: ['Real-time messaging', 'Typing indicators', 'Agent presence', 'Chat routing', 'Analytics'],
    setupComplexity: 'Easy',
    category: 'business',
    color: 'bg-teal-600'
  }
];

const categories = [
  { id: 'all', name: 'All Platforms', icon: <Globe className="h-4 w-4" /> },
  { id: 'messaging', name: 'Messaging', icon: <MessageCircle className="h-4 w-4" /> },
  { id: 'social', name: 'Social Media', icon: <Users className="h-4 w-4" /> },
  { id: 'business', name: 'Business Tools', icon: <Shield className="h-4 w-4" /> },
  { id: 'email', name: 'Email', icon: <Mail className="h-4 w-4" /> }
];

// Custom navigation component for this page
const CustomNavigationBar = ({ currentModule, onModuleSelect }: { currentModule: string; onModuleSelect: (module: string) => void }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout().catch(error => {
      console.error('Logout error:', error);
    }).finally(() => {
      window.location.href = '/';
    });
  };

  const modules = [
    { id: 'executive', label: 'Overview', icon: '📈', description: 'Executive Summary' },
    { id: 'conversations', label: 'Conversations', icon: '💬', description: 'Live Messages' },
    { id: 'operational', label: 'Analytics', icon: '📊', description: 'Real-time Analytics & Monitoring' },
    { id: 'campaigns', label: 'Broadcasts', icon: '📱', description: 'Message Campaigns' },
    { id: 'platforms', label: 'Platforms', icon: '🔗', description: 'Connect Messaging Platforms' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒', description: 'Agent Marketplace' },
    { id: 'agent-builder', label: 'Builder', icon: '🔧', description: 'Agent Builder' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Configuration' }
  ];

  const handleModuleClick = (moduleId: string) => {
    onModuleSelect(moduleId);
  };

  return (
    <div className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-8">
              <Link href="/" className="block hover:opacity-80 transition-opacity">
                <h2 className="text-xl font-bold text-primary">
                  Admolabs
                </h2>
                <p className="text-xs italic text-muted-foreground -mt-1">
                  Agentic Intelligence. Unified Growth.
                </p>
              </Link>
            </div>
          </div>

          {/* Navigation Modules */}
          <nav className="flex space-x-3 ml-20">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentModule === module.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                title={module.description}
              >
                <span className="mr-2">{module.icon}</span>
                {module.label}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">User menu</span>
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plans & Billing</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => router.push('/connect-messaging')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Connect Messaging</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ConnectMessagingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    isConnected, 
    getIntegrationForPlatform, 
    disconnectIntegration, 
    refetch: refetchIntegrations 
  } = useIntegrationStatus();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [existingIntegrations, setExistingIntegrations] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Configuration states for different platforms
  const [configs, setConfigs] = useState<Record<string, any>>({
    whatsapp_twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: ''
    },
    whatsapp_twilio_sandbox: {
      accountSid: '',
      authToken: '',
      phoneNumber: '+14155238886', // Default Twilio sandbox number
      sandboxKeyword: ''
    },
    whatsapp_meta: {
      businessAccountId: '',
      accessToken: '',
      phoneNumber: '',
      verifyToken: ''
    },
    whatsapp_meta_sandbox: {
      businessAccountId: '',
      accessToken: '',
      phoneNumber: '',
      verifyToken: '',
      testPhoneNumbers: []
    },
    telegram: {
      botToken: '',
      botUsername: ''
    },
    gmail: {
      email: '',
      appPassword: '',
      displayName: ''
    },
    outlook: {
      email: '',
      appPassword: '',
      displayName: ''
    },
    'custom-email': {
      email: '',
      appPassword: '',
      displayName: '',
      smtpHost: '',
      smtpPort: '587',
      imapHost: '',
      imapPort: '993'
    },
    'twilio-sms': {
      accountSid: '',
      authToken: '',
      phoneNumber: ''
    },
    youtube: {
      channelId: '',
      accessToken: '',
      refreshToken: '',
      channelName: ''
    },
    'website-chat': {
      widgetId: '',
      websiteDomain: '',
      businessName: '',
      welcomeMessage: '',
      primaryColor: '#007bff'
    },
    'live-chat': {
      businessName: '',
      welcomeMessage: '',
      primaryColor: '#007bff',
      autoAssign: true
    }
  });

  useEffect(() => {
    loadExistingIntegrations();
  }, [user]);

  const loadExistingIntegrations = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet('/api/messaging/integrations');
      setExistingIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const filteredPlatforms = selectedCategory === 'all' 
    ? platforms 
    : platforms.filter(p => p.category === selectedCategory);

  const handlePlatformSelect = (platform: Platform) => {
    console.log('Platform selected:', platform);
    setSelectedPlatform(platform);
    setSelectedProvider(null);
    setCurrentStep(2);
  };

  const handleProviderSelect = (providerId: string) => {
    console.log('Provider selected:', providerId);
    setSelectedProvider(providerId);
    setCurrentStep(3);
  };

  const handleConfigChange = (field: string, value: string) => {
    const configKey = selectedPlatform === 'whatsapp' 
      ? `whatsapp_${selectedProvider}` 
      : selectedPlatform!;
    
    setConfigs(prev => ({
      ...prev,
      [configKey]: {
        ...prev[configKey],
        [field]: value
      }
    }));
  };

  const testConnection = async () => {
    console.log('=== TEST CONNECTION CLICKED ===');
    console.log('selectedPlatform:', selectedPlatform);
    console.log('selectedProvider:', selectedProvider);
    
    if (!selectedPlatform) {
      console.log('No platform selected, returning early');
      return;
    }
    
    console.log('Starting connection test...');
    setIsLoading(true);
    try {
      const configKey = selectedPlatform === 'whatsapp' 
        ? `whatsapp_${selectedProvider}` 
        : selectedPlatform;
      
      console.log('configKey:', configKey);
      console.log('config to send:', configs[configKey]);
      
      // Now that database tables exist, use the full test endpoint
      console.log('Making API call to /api/messaging/integrations/test...');
      
      try {
        const result = await apiPost('/api/messaging/integrations/test', {
          platform: selectedPlatform,
          provider: selectedProvider,
          config: configs[configKey]
        });
        
        console.log('API result:', result);
        
        if (result.success) {
          toast({
            title: "Connection successful!",
            description: `${selectedPlatform} integration is working correctly.`,
          });
          setTestResult(result);
          setCurrentStep(4);
        } else {
          toast({
            title: "Connection failed",
            description: result.error || "Please check your configuration.",
            variant: "destructive"
          });
        }
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        toast({
          title: "Connection error", 
          description: `API error: ${apiError.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Failed to test connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveIntegration = async () => {
    if (!selectedPlatform) return;
    
    setIsLoading(true);
    try {
      const configKey = selectedPlatform === 'whatsapp' 
        ? `whatsapp_${selectedProvider}` 
        : selectedPlatform;
      
      const result = await apiPost('/api/messaging/integrations', {
        platform: selectedPlatform,
        provider: selectedProvider,
        name: `${platforms.find(p => p.id === selectedPlatform)?.name} Integration`,
        config: configs[configKey]
      });
      
      if (result.success) {
        toast({
          title: "Integration saved!",
          description: `${selectedPlatform} has been successfully connected.`,
        });
        router.push('/dashboard');
      } else {
        toast({
          title: "Save failed",
          description: result.error || "Failed to save integration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Save error",
        description: "Failed to save integration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    const integration = getIntegrationForPlatform(platform);
    if (!integration) return;

    try {
      setIsLoading(true);
      const result = await disconnectIntegration(integration.id);
      if (result.success) {
        toast({
          title: "Integration disconnected",
          description: `${platform} has been successfully disconnected.`,
        });
        await refetchIntegrations();
      } else {
        toast({
          title: "Disconnect failed",
          description: result.error || "Failed to disconnect integration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Disconnect error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlatformSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connect Your Messaging Platforms</h2>
        <p className="text-gray-600">Choose which platforms you'd like to integrate with your CRM</p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlatforms.map((platform) => (
          <Card 
            key={platform.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              !platform.available ? 'opacity-60' : 'hover:scale-105'
            }`}
            onClick={() => platform.available && handlePlatformSelect(platform.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${platform.color}`}>
                  {platform.icon}
                </div>
                <div>
                  <span>{platform.name}</span>
                  {!platform.available && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>{platform.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  {isConnected(platform.id) ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Not Connected
                    </Badge>
                  )}
                </div>

                {/* Setup Complexity */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Setup:</span>
                  <Badge variant={
                    platform.setupComplexity === 'Easy' ? 'default' : 
                    platform.setupComplexity === 'Medium' ? 'secondary' : 'destructive'
                  }>
                    {platform.setupComplexity}
                  </Badge>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  {platform.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  {platform.available ? (
                    isConnected(platform.id) ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlatformSelect(platform.id);
                          }}
                          className="flex-1"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(platform.id);
                          }}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlatformSelect(platform.id);
                        }}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isLoading}
                      >
                        Connect Now
                      </Button>
                    )
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full" 
                      disabled
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );

  // Auto-advance to configuration step for platforms without multiple providers
  useEffect(() => {
    if (currentStep === 2 && selectedPlatform) {
      const platform = platforms.find(p => p.id === selectedPlatform);
      console.log('Step 2 auto-advance check:', { platform: platform?.name, hasProviders: platform?.providers?.length || 0 });
      if (!platform?.providers || platform.providers.length === 0) {
        // Skip to configuration for platforms without multiple providers
        console.log('Auto-advancing to step 3 for platform without providers');
        setCurrentStep(3);
      }
    }
  }, [currentStep, selectedPlatform]);

  const renderProviderSelection = () => {
    if (!selectedPlatform) return null;
    
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (!platform?.providers || platform.providers.length === 0) {
      // This will be handled by the useEffect above
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Choose Your {platform.name} Provider</h2>
          <p className="text-gray-600">Select how you'd like to connect to {platform.name}. Each provider has different features and pricing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {platform.providers.map((provider) => (
            <Card 
              key={provider.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleProviderSelect(provider.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    provider.id === 'twilio' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {provider.id === 'twilio' ? (
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {provider.name}
                </CardTitle>
                <CardDescription>{provider.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider-specific features */}
                {provider.id === 'twilio' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Quick sandbox setup for testing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Reliable enterprise-grade delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Excellent documentation & support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Higher cost per message</span>
                    </div>
                  </div>
                )}
                
                {provider.id === 'meta' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Lower cost per conversation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Rich media & template support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Native WhatsApp features</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Business verification required</span>
                    </div>
                  </div>
                )}

                <Button className="w-full">
                  Select {provider.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Platform Selection
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderConfiguration = () => {
    if (!selectedPlatform) return null;
    
    const platform = platforms.find(p => p.id === selectedPlatform);
    const configKey = selectedPlatform === 'whatsapp' 
      ? `whatsapp_${selectedProvider}` 
      : selectedPlatform;
    
    const config = configs[configKey] || {};

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Configure {platform?.name}</h2>
          <p className="text-gray-600">Enter your {platform?.name} credentials</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${platform?.color}`}>
                {platform?.icon}
              </div>
              {platform?.name} Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform-specific configuration fields */}
            {selectedPlatform === 'whatsapp' && selectedProvider === 'twilio' && (
              <>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Twilio Production Mode:</strong> Send WhatsApp messages to any number worldwide.
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <strong>🔧 Setup Required:</strong><br />
                      User needs to create a Twilio account and get the Account SID, Auth Token, and phone number associated with the account and paste it here.
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID</Label>
                  <Input
                    id="accountSid"
                    placeholder="Enter your Twilio Account SID"
                    value={config.accountSid || ''}
                    onChange={(e) => handleConfigChange('accountSid', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token</Label>
                  <Input
                    id="authToken"
                    type="password"
                    placeholder="Enter your Twilio Auth Token"
                    value={config.authToken || ''}
                    onChange={(e) => handleConfigChange('authToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter your WhatsApp phone number"
                    value={config.phoneNumber || ''}
                    onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'whatsapp' && selectedProvider === 'twilio_sandbox' && (
              <>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-amber-600">⚠️ Twilio Sandbox Mode - Development Only</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          This is for testing only. Every customer must send "join [keyword]" before receiving messages.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>🔧 Step 1: Get Twilio Credentials</strong>
                        <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                          <li>Create account at <a href="https://console.twilio.com" target="_blank" className="text-blue-600 underline">console.twilio.com</a></li>
                          <li>Go to Account → Account Info → Copy Account SID & Auth Token</li>
                          <li>Go to Messaging → Try it out → WhatsApp → Copy your sandbox keyword</li>
                        </ol>
                      </div>

                      {config.sandboxKeyword && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <strong>📱 Step 2: Customer Join Instructions</strong>
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Every customer must first send:</p>
                            <div className="bg-white p-2 rounded border mt-1">
                              <code className="text-green-700">join {config.sandboxKeyword}</code>
                              <br />
                              <span className="text-xs text-gray-500">to WhatsApp number: +1 415 523 8886</span>
                            </div>
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Not suitable for real business - customers won't understand this step
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <strong>🔗 Step 3: Configure Webhook URL (Required)</strong>
                        <div className="mt-2 text-sm space-y-2">
                          <p>1. Go to <a href="https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox" target="_blank" className="text-blue-600 underline">Twilio WhatsApp Sandbox Settings</a></p>
                          <p>2. In "When a message comes in" field, paste:</p>
                          <div className="bg-white p-2 rounded border break-all">
                            <code className="text-purple-700 text-xs">
                              {process.env.NEXT_PUBLIC_APP_URL}/api/messaging/webhooks/whatsapp
                            </code>
                            <button 
                              onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/api/messaging/webhooks/whatsapp`)}
                              className="ml-2 text-xs bg-purple-100 px-2 py-1 rounded hover:bg-purple-200"
                            >
                              📋 Copy
                            </button>
                          </div>
                          <p>3. Set Method to <strong>POST</strong></p>
                          <p>4. Click <strong>Save</strong></p>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                        <strong>🚀 Ready for Real Business?</strong>
                        <p className="text-sm mt-1">
                          Consider <strong>Twilio Production</strong> where customers can message you directly without the "join" step.
                          <br />
                          <span className="text-xs text-gray-600">Perfect for real customer acquisition and professional messaging.</span>
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID</Label>
                  <Input
                    id="accountSid"
                    placeholder="Enter your Twilio Account SID"
                    value={config.accountSid || ''}
                    onChange={(e) => handleConfigChange('accountSid', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token</Label>
                  <Input
                    id="authToken"
                    type="password"
                    placeholder="Enter your Twilio Auth Token"
                    value={config.authToken || ''}
                    onChange={(e) => handleConfigChange('authToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sandboxKeyword">Sandbox Keyword</Label>
                  <Input
                    id="sandboxKeyword"
                    placeholder="Your sandbox join keyword (e.g., 'having-hide')"
                    value={config.sandboxKeyword || ''}
                    onChange={(e) => handleConfigChange('sandboxKeyword', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.sandboxKeyword 
                      ? `Users text 'join ${config.sandboxKeyword}' to +1 415 523 8886`
                      : "Enter your Twilio sandbox keyword (found in Twilio Console → WhatsApp Sandbox)"
                    }
                  </p>
                </div>
              </>
            )}

            {selectedPlatform === 'whatsapp' && selectedProvider === 'meta' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessAccountId">Business Account ID</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="Enter your WhatsApp Business Account ID"
                    value={config.businessAccountId || ''}
                    onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Enter your Access Token"
                    value={config.accessToken || ''}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter your WhatsApp phone number"
                    value={config.phoneNumber || ''}
                    onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Enter your webhook verify token"
                    value={config.verifyToken || ''}
                    onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'whatsapp' && selectedProvider === 'meta_sandbox' && (
              <>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Meta Business Sandbox:</strong> Add test phone numbers in your Meta Business Manager dashboard for testing.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="businessAccountId">Test Business Account ID</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="Enter your test WhatsApp Business Account ID"
                    value={config.businessAccountId || ''}
                    onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Test Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Enter your test Access Token"
                    value={config.accessToken || ''}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Test Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter your test WhatsApp phone number"
                    value={config.phoneNumber || ''}
                    onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Enter your webhook verify token"
                    value={config.verifyToken || ''}
                    onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'telegram' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="Enter your Telegram Bot Token"
                    value={config.botToken || ''}
                    onChange={(e) => handleConfigChange('botToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botUsername">Bot Username (Optional)</Label>
                  <Input
                    id="botUsername"
                    placeholder="@your_bot_username"
                    value={config.botUsername || ''}
                    onChange={(e) => handleConfigChange('botUsername', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'facebook' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pageId">Page ID</Label>
                  <Input
                    id="pageId"
                    placeholder="Enter your Facebook Page ID"
                    value={config.pageId || ''}
                    onChange={(e) => handleConfigChange('pageId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageAccessToken">Page Access Token</Label>
                  <Input
                    id="pageAccessToken"
                    type="password"
                    placeholder="Enter your Page Access Token"
                    value={config.pageAccessToken || ''}
                    onChange={(e) => handleConfigChange('pageAccessToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appSecret">App Secret</Label>
                  <Input
                    id="appSecret"
                    type="password"
                    placeholder="Enter your Facebook App Secret"
                    value={config.appSecret || ''}
                    onChange={(e) => handleConfigChange('appSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Enter your webhook verify token"
                    value={config.verifyToken || ''}
                    onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'instagram' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pageId">Page ID</Label>
                  <Input
                    id="pageId"
                    placeholder="Enter your Instagram Business Page ID"
                    value={config.pageId || ''}
                    onChange={(e) => handleConfigChange('pageId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageAccessToken">Page Access Token</Label>
                  <Input
                    id="pageAccessToken"
                    type="password"
                    placeholder="Enter your Page Access Token"
                    value={config.pageAccessToken || ''}
                    onChange={(e) => handleConfigChange('pageAccessToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appSecret">App Secret</Label>
                  <Input
                    id="appSecret"
                    type="password"
                    placeholder="Enter your Facebook App Secret"
                    value={config.appSecret || ''}
                    onChange={(e) => handleConfigChange('appSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Enter your webhook verify token"
                    value={config.verifyToken || ''}
                    onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'slack' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teamId">Team ID</Label>
                  <Input
                    id="teamId"
                    placeholder="Enter your Slack Team ID"
                    value={config.teamId || ''}
                    onChange={(e) => handleConfigChange('teamId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="Enter your Slack Bot Token (xoxb-...)"
                    value={config.botToken || ''}
                    onChange={(e) => handleConfigChange('botToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signingSecret">Signing Secret</Label>
                  <Input
                    id="signingSecret"
                    type="password"
                    placeholder="Enter your Slack Signing Secret"
                    value={config.signingSecret || ''}
                    onChange={(e) => handleConfigChange('signingSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID (Optional)</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter your Slack Client ID"
                    value={config.clientId || ''}
                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret (Optional)</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Enter your Slack Client Secret"
                    value={config.clientSecret || ''}
                    onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'discord' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guildId">Guild (Server) ID</Label>
                  <Input
                    id="guildId"
                    placeholder="Enter your Discord Guild ID"
                    value={config.guildId || ''}
                    onChange={(e) => handleConfigChange('guildId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="Enter your Discord Bot Token"
                    value={config.botToken || ''}
                    onChange={(e) => handleConfigChange('botToken', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter your Discord Client ID"
                    value={config.clientId || ''}
                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input
                    id="publicKey"
                    placeholder="Enter your Discord Public Key"
                    value={config.publicKey || ''}
                    onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    placeholder="Enter your Discord Application ID"
                    value={config.applicationId || ''}
                    onChange={(e) => handleConfigChange('applicationId', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'gmail' && (
              <>
                <Alert className="mb-4">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-blue-600">📧 Gmail SMTP Integration</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Send and receive emails through your Gmail account using App Passwords and email forwarding.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>🔧 Step 1: Enable 2FA & Generate App Password</strong>
                        <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                          <li>Go to <a href="https://myaccount.google.com/security" target="_blank" className="text-blue-600 underline">Google Account Security</a></li>
                          <li>Enable <strong>2-Step Verification</strong> if not already enabled</li>
                          <li>Go to <strong>App passwords</strong> section</li>
                          <li>Generate a new app password for "Mail"</li>
                          <li>Copy the 16-character password (no spaces)</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <strong>📨 Step 2: Email Forwarding (After Connection)</strong>
                        <div className="mt-2 text-sm">
                          <p>After connecting, you'll get a unique forwarding address like:</p>
                          <div className="bg-white p-2 rounded border mt-1">
                            <code className="text-green-700">user-12345678@myapp.inbox.com</code>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Set up Gmail forwarding to this address to receive customer emails in your CRM
                          </p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="email">Gmail Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={config.email || ''}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appPassword">Gmail App Password</Label>
                  <Input
                    id="appPassword"
                    type="password"
                    placeholder="16-character app password (no spaces)"
                    value={config.appPassword || ''}
                    onChange={(e) => handleConfigChange('appPassword', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generated from Google Account → Security → App passwords → Mail
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    placeholder="Your Business Name"
                    value={config.displayName || ''}
                    onChange={(e) => handleConfigChange('displayName', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    How your name appears when sending emails
                  </p>
                </div>
              </>
            )}

            {selectedPlatform === 'outlook' && (
              <>
                <Alert className="mb-4">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-blue-600">📧 Microsoft Outlook Integration</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Send and receive emails through your Outlook/Hotmail account or Office 365.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>🔧 Outlook.com/Hotmail Setup</strong>
                        <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                          <li>Go to <a href="https://account.microsoft.com/security" target="_blank" className="text-blue-600 underline">Microsoft Account Security</a></li>
                          <li>Enable <strong>2-Step Verification</strong> if not already enabled</li>
                          <li>Go to <strong>App passwords</strong> section</li>
                          <li>Generate new app password for email</li>
                          <li>Use generated password below</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <strong>🏢 Office 365 Setup</strong>
                        <div className="text-sm mt-2">
                          <p>For Office 365 business accounts, use your regular login credentials.</p>
                          <p className="text-xs text-gray-600">Modern Authentication is supported automatically.</p>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <strong>📨 Email Forwarding (After Connection)</strong>
                        <div className="mt-2 text-sm">
                          <p>You'll get a unique forwarding address for receiving emails in your CRM.</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="email">Outlook Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@outlook.com or your.email@company.com"
                    value={config.email || ''}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appPassword">Password</Label>
                  <Input
                    id="appPassword"
                    type="password"
                    placeholder="App password (personal) or regular password (Office 365)"
                    value={config.appPassword || ''}
                    onChange={(e) => handleConfigChange('appPassword', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use app password for personal accounts, regular password for Office 365
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    placeholder="Your Business Name"
                    value={config.displayName || ''}
                    onChange={(e) => handleConfigChange('displayName', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'custom-email' && (
              <>
                <Alert className="mb-4">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-gray-600">📧 Custom Email Server Integration</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Connect any email provider that supports IMAP/SMTP (Yahoo, ProtonMail, custom domains, etc.).
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <strong>🔧 Required Information</strong>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• <strong>SMTP Server</strong>: Your email provider's outgoing server</p>
                          <p>• <strong>SMTP Port</strong>: Usually 587 (TLS) or 465 (SSL)</p>
                          <p>• <strong>IMAP Server</strong>: For receiving emails (optional)</p>
                          <p>• <strong>Security</strong>: TLS/SSL encryption settings</p>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>📝 Common Providers</strong>
                        <div className="text-xs mt-2 space-y-1">
                          <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587</p>
                          <p><strong>ProtonMail:</strong> mail.protonmail.ch:587</p>
                          <p><strong>Zoho:</strong> smtp.zoho.com:587</p>
                          <p><strong>Custom Domain:</strong> Check with your hosting provider</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@yourdomain.com"
                    value={config.email || ''}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appPassword">Email Password</Label>
                  <Input
                    id="appPassword"
                    type="password"
                    placeholder="Your email password or app password"
                    value={config.appPassword || ''}
                    onChange={(e) => handleConfigChange('appPassword', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Server</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.yourdomain.com"
                      value={config.smtpHost || ''}
                      onChange={(e) => handleConfigChange('smtpHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      placeholder="587"
                      value={config.smtpPort || '587'}
                      onChange={(e) => handleConfigChange('smtpPort', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imapHost">IMAP Server (Optional)</Label>
                    <Input
                      id="imapHost"
                      placeholder="imap.yourdomain.com"
                      value={config.imapHost || ''}
                      onChange={(e) => handleConfigChange('imapHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPort">IMAP Port</Label>
                    <Input
                      id="imapPort"
                      placeholder="993"
                      value={config.imapPort || '993'}
                      onChange={(e) => handleConfigChange('imapPort', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    placeholder="Your Business Name"
                    value={config.displayName || ''}
                    onChange={(e) => handleConfigChange('displayName', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedPlatform === 'twilio-sms' && (
              <>
                <Alert className="mb-4">
                  <MessageCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-purple-600">📱 Twilio SMS Integration</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Send and receive SMS messages using your Twilio account with global reach.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <strong>🔧 Step 1: Get Twilio Credentials</strong>
                        <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                          <li>Sign in to <a href="https://console.twilio.com" target="_blank" className="text-purple-600 underline">Twilio Console</a></li>
                          <li>Go to <strong>Account → API keys & tokens</strong></li>
                          <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong></li>
                          <li>Purchase a phone number in <strong>Phone Numbers → Manage → Buy a number</strong></li>
                          <li>Copy the purchased phone number (E.164 format)</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>📞 Step 2: Configure Webhook (After Connection)</strong>
                        <div className="mt-2 text-sm">
                          <p>After connecting, configure your webhook URL in Twilio Console:</p>
                          <div className="bg-white p-2 rounded border mt-1">
                            <code className="text-blue-700 text-xs">
                              {process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/api/messaging/webhooks/twilio-sms
                            </code>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Set this in Phone Numbers → Manage → [Your Number] → Messaging
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <strong>🚀 Features Available</strong>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• <strong>Send SMS:</strong> Reply to customers from your CRM</p>
                          <p>• <strong>Receive SMS:</strong> Customer messages appear as conversations</p>
                          <p>• <strong>Global Reach:</strong> SMS to 200+ countries and regions</p>
                          <p>• <strong>Delivery Reports:</strong> Track message delivery status</p>
                          <p>• <strong>Media Support:</strong> Send and receive images/files</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID</Label>
                  <Input
                    id="accountSid"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.accountSid || ''}
                    onChange={(e) => handleConfigChange('accountSid', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Twilio Console → Account → API keys & tokens
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token</Label>
                  <Input
                    id="authToken"
                    type="password"
                    placeholder="Your Twilio Auth Token"
                    value={config.authToken || ''}
                    onChange={(e) => handleConfigChange('authToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Twilio Console → Account → API keys & tokens
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Twilio Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+1234567890"
                    value={config.phoneNumber || ''}
                    onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your purchased Twilio phone number in E.164 format (+1234567890)
                  </p>
                </div>
              </>
            )}

            {selectedPlatform === 'youtube' && (
              <>
                <Alert className="mb-4">
                  <Youtube className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-red-600">📹 YouTube Creator Integration</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage video comments and engage with your audience directly from your CRM.
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <strong>🔧 Step 1: Enable YouTube Data API</strong>
                        <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
                          <li>Go to <a href="https://console.developers.google.com" target="_blank" className="text-red-600 underline">Google Cloud Console</a></li>
                          <li>Create or select a project</li>
                          <li>Enable the <strong>YouTube Data API v3</strong></li>
                          <li>Create credentials (OAuth 2.0 Client ID)</li>
                          <li>Add authorized redirect URI</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <strong>🎬 Step 2: Get Channel Information</strong>
                        <div className="mt-2 text-sm">
                          <p>You'll need your YouTube channel ID and OAuth tokens.</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Channel ID can be found in YouTube Studio → Settings → Channel → Advanced settings
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <strong>🚀 Features Available</strong>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• <strong>Comment Monitoring:</strong> Track comments on your videos</p>
                          <p>• <strong>Reply Management:</strong> Respond to comments from CRM</p>
                          <p>• <strong>Creator Analytics:</strong> Monitor engagement and growth</p>
                          <p>• <strong>Community Management:</strong> Organized viewer interactions</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="channelId">YouTube Channel ID</Label>
                  <Input
                    id="channelId"
                    placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.channelId || ''}
                    onChange={(e) => handleConfigChange('channelId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in YouTube Studio → Settings → Channel → Advanced settings
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    placeholder="Your Channel Name"
                    value={config.channelName || ''}
                    onChange={(e) => handleConfigChange('channelName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="OAuth Access Token"
                    value={config.accessToken || ''}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    OAuth 2.0 access token from Google Cloud Console
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refreshToken">Refresh Token</Label>
                  <Input
                    id="refreshToken"
                    type="password"
                    placeholder="OAuth Refresh Token"
                    value={config.refreshToken || ''}
                    onChange={(e) => handleConfigChange('refreshToken', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    OAuth 2.0 refresh token for long-term access
                  </p>
                </div>
              </>
            )}

            {selectedPlatform === 'website-chat' && (
              <>
                <Alert className="mb-4">
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-green-600">🌐 Website Chat Widget</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Add a live chat widget to your website for real-time customer support.
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <strong>🎨 Customizable Widget</strong>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• <strong>Custom Colors:</strong> Match your brand</p>
                          <p>• <strong>Position Control:</strong> Bottom-right, bottom-left, etc.</p>
                          <p>• <strong>Welcome Messages:</strong> Greet visitors automatically</p>
                          <p>• <strong>Offline Mode:</strong> Collect messages when offline</p>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <strong>🚀 After Setup</strong>
                        <div className="mt-2 text-sm">
                          <p>You'll receive embed code to add to your website.</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Simply paste the code before the closing &lt;/body&gt; tag
                          </p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={config.businessName || ''}
                    onChange={(e) => handleConfigChange('businessName', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Displayed to visitors in the chat widget
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteDomain">Website Domain</Label>
                  <Input
                    id="websiteDomain"
                    placeholder="example.com"
                    value={config.websiteDomain || ''}
                    onChange={(e) => handleConfigChange('websiteDomain', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Domain where the chat widget will be installed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Input
                    id="welcomeMessage"
                    placeholder="Hello! How can we help you today?"
                    value={config.welcomeMessage || ''}
                    onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.primaryColor || '#007bff'}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Widget theme color to match your brand
                  </p>
                </div>
              </>
            )}

            {selectedPlatform === 'live-chat' && (
              <>
                <Alert className="mb-4">
                  <MessageCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-teal-600">💬 Live Chat Platform</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Real-time chat system with advanced features for customer support teams.
                        </p>
                      </div>

                      <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                        <strong>⚡ Real-time Features</strong>
                        <div className="text-sm mt-2 space-y-1">
                          <p>• <strong>Live Messaging:</strong> Instant message delivery</p>
                          <p>• <strong>Typing Indicators:</strong> See when agents/customers are typing</p>
                          <p>• <strong>Agent Presence:</strong> Online/offline status</p>
                          <p>• <strong>Chat Routing:</strong> Automatic assignment to available agents</p>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <strong>📊 Advanced Analytics</strong>
                        <div className="mt-2 text-sm">
                          <p>Track response times, customer satisfaction, agent performance, and chat volume.</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={config.businessName || ''}
                    onChange={(e) => handleConfigChange('businessName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Input
                    id="welcomeMessage"
                    placeholder="Welcome! We're here to help you."
                    value={config.welcomeMessage || ''}
                    onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Theme Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.primaryColor || '#007bff'}
                    onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoAssign"
                    checked={config.autoAssign || false}
                    onChange={(e) => handleConfigChange('autoAssign', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="autoAssign" className="text-sm">
                    Auto-assign chats to available agents
                  </Label>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(selectedPlatform === 'whatsapp' ? 2 : 1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderSuccess = () => {
    const forwardingAddress = testResult?.info?.forwardingAddress;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-2">Connection Successful!</h2>
            <p className="text-gray-600">Your {selectedPlatform} integration is ready to use</p>
          </div>
        </div>

        {/* Gmail-specific setup instructions */}
        {selectedPlatform === 'gmail' && forwardingAddress && (
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Complete Your Gmail Setup
              </CardTitle>
              <CardDescription>
                Follow these steps to start receiving customer emails in your CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <strong>✅ Step 1: SMTP Connection (Complete)</strong>
                      <p className="text-sm text-gray-600 mt-1">
                        Your Gmail can now send emails through our system
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <strong>📨 Step 2: Set Up Email Forwarding</strong>
                      <div className="mt-2 space-y-2">
                        <p className="text-sm">Your unique forwarding address:</p>
                        <div className="bg-white p-3 rounded border flex items-center justify-between">
                          <code className="text-blue-700 font-mono text-sm break-all">
                            {forwardingAddress}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(forwardingAddress);
                              toast({
                                title: "Copied!",
                                description: "Forwarding address copied to clipboard"
                              });
                            }}
                          >
                            📋 Copy
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                      <strong>⚙️ Step 3: Configure Gmail Forwarding</strong>
                      <ol className="text-sm mt-2 space-y-2 ml-4 list-decimal">
                        <li>
                          Open <a href="https://mail.google.com/mail/u/0/#settings/fwdandpop" target="_blank" className="text-blue-600 underline">
                            Gmail Settings → Forwarding and POP/IMAP
                          </a>
                        </li>
                        <li>Click "Add a forwarding address"</li>
                        <li>Paste: <code className="bg-white px-1 rounded text-xs">{forwardingAddress}</code></li>
                        <li>Click "Next" and "Proceed"</li>
                        <li>Choose "Forward a copy of incoming mail to" and select the address</li>
                        <li>Click "Save Changes"</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <strong>🎉 You're All Set!</strong>
                      <p className="text-sm text-gray-600 mt-1">
                        • <strong>Send emails:</strong> Reply to customer emails from your CRM<br />
                        • <strong>Receive emails:</strong> Customer emails appear as conversations in your CRM<br />
                        • <strong>Threading:</strong> Email threads are automatically organized
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={saveIntegration} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save & Complete Setup'}
          </Button>
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Configuration
          </Button>
        </div>
      </motion.div>
    );
  };

  const handleModuleSelect = (module: string) => {
    // Handle navigation to different modules
    switch (module) {
      case 'executive':
        router.push('/dashboard');
        break;
      case 'conversations':
        router.push('/conversation');
        break;
      case 'operational':
        router.push('/dashboard');
        break;
      case 'campaigns':
        router.push('/dashboard');
        break;
      case 'platforms':
        // Stay on current page
        break;
      case 'marketplace':
        router.push('/marketplace');
        break;
      case 'agent-builder':
        router.push('/agent-builder');
        break;
      case 'settings':
        router.push('/settings');
        break;
      default:
        router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavigationBar 
        currentModule="platforms" 
        onModuleSelect={handleModuleSelect}
      />
      
      {/* KPI Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Platform Setup</span>
              </div>
              <div className="text-sm text-gray-600">
                Connect your messaging platforms to start receiving customer conversations
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Step:</span>
                <span className="font-medium text-gray-900">{currentStep} of 4</span>
              </div>
              {selectedPlatform && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Platform:</span>
                  <span className="font-medium text-gray-900 capitalize">{selectedPlatform}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderStepIndicator()}
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderPlatformSelection()}
            {currentStep === 2 && renderProviderSelection()}
            {currentStep === 3 && renderConfiguration()}
            {currentStep === 4 && renderSuccess()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}