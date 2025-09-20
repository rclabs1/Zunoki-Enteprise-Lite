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
  ArrowLeft,
  Globe,
  Phone,
  Send,
  Search,
  Filter,
  Settings,
  Loader2,
  Layers,
  Monitor
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
    name: 'Zunoki Intelligent Chat Widget',
    description: 'Advanced AI customer support widget with sales automation, order tracking, and smart notifications for e-commerce, delivery, and service platforms',
    icon: <Bot className="h-6 w-6" />,
    available: true,
    features: ['AI customer support', 'Sales automation', 'Order tracking', 'Smart notifications', 'Lead capture', 'Multi-language support'],
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

// Platform Selection and Chat Widget Setup Flow
interface WebsiteChatSetupFlowProps {
  config: any;
  setConfig: (config: any) => void;
  onConnect: () => void;
  onCancel: () => void;
}

const platformOptions = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Add to WordPress site (functions.php or plugin)',
    icon: <Globe className="h-5 w-5" />,
    category: 'CMS'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress with e-commerce features',
    icon: <Bot className="h-5 w-5" />,
    category: 'E-commerce'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Leading e-commerce platform',
    icon: <Bot className="h-5 w-5" />,
    category: 'E-commerce'
  },
  {
    id: 'webflow',
    name: 'Webflow',
    description: 'Visual web design platform',
    icon: <Layers className="h-5 w-5" />,
    category: 'Website Builder'
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Popular website builder',
    icon: <Globe className="h-5 w-5" />,
    category: 'Website Builder'
  },
  {
    id: 'wix-ecommerce',
    name: 'Wix eCommerce',
    description: 'Wix with e-commerce features',
    icon: <Bot className="h-5 w-5" />,
    category: 'E-commerce'
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    description: 'Design-focused website builder',
    icon: <Globe className="h-5 w-5" />,
    category: 'Website Builder'
  },
  {
    id: 'squarespace-commerce',
    name: 'Squarespace Commerce',
    description: 'Squarespace with e-commerce',
    icon: <Bot className="h-5 w-5" />,
    category: 'E-commerce'
  },
  {
    id: 'bubble',
    name: 'Bubble',
    description: 'No-code app development platform',
    icon: <Zap className="h-5 w-5" />,
    category: 'No-Code'
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Design and interactive prototyping',
    icon: <Layers className="h-5 w-5" />,
    category: 'Design Tool'
  },
  {
    id: 'carrd',
    name: 'Carrd',
    description: 'Simple one-page sites',
    icon: <Globe className="h-5 w-5" />,
    category: 'Website Builder'
  },
  {
    id: 'custom-html',
    name: 'Custom HTML/JS',
    description: 'Direct JavaScript integration',
    icon: <Monitor className="h-5 w-5" />,
    category: 'Custom'
  }
];

function WebsiteChatSetupFlow({ config, setConfig, onConnect, onCancel }: WebsiteChatSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState<'platform' | 'config' | 'embed'>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setConfig({ ...config, deploymentPlatform: platformId });
    setCurrentStep('config');
  };

  const handleConfigComplete = () => {
    setCurrentStep('embed');
  };

  const renderPlatformSelection = () => (
    <div className="space-y-6">
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription>
          Where would you like to deploy your Zunoki Intelligent Chat Widget? Choose your platform for customized integration instructions.
        </AlertDescription>
      </Alert>

      <div>
        <h4 className="font-medium text-sm mb-4">Select Your Platform</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl">
          {platformOptions.map((platform) => (
            <div
              key={platform.id}
              onClick={() => handlePlatformSelect(platform.id)}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-green-600 mt-0.5 flex-shrink-0">
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm truncate">{platform.name}</h5>
                    <Badge variant="outline" className="text-xs flex-shrink-0 bg-green-50 text-green-700 border-green-200">
                      {platform.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {platform.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('platform')}
          className="p-1 h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert className="flex-1">
          <Bot className="h-4 w-4" />
          <AlertDescription>
            Configure your Zunoki Intelligent Chat Widget for{' '}
            <strong>{platformOptions.find(p => p.id === selectedPlatform)?.name}</strong>
          </AlertDescription>
        </Alert>
      </div>

      {/* Basic Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Basic Settings</h4>
        <div>
          <Label htmlFor="widgetName">Widget Name</Label>
          <Input
            id="widgetName"
            placeholder="Zunoki Customer Support"
            value={config.widgetName || ''}
            onChange={(e) => setConfig({...config, widgetName: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="domainWhitelist">Allowed Domains (Optional)</Label>
          <Input
            id="domainWhitelist"
            placeholder="yoursite.com, subdomain.yoursite.com"
            value={config.domainWhitelist || ''}
            onChange={(e) => setConfig({...config, domainWhitelist: e.target.value})}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to allow all domains
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Appearance</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={config.primaryColor || '#3b82f6'}
              onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="position">Widget Position</Label>
            <Select value={config.position || 'bottom-right'} onValueChange={(value) => setConfig({...config, position: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Messages & Automation</h4>
        <div>
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Input
            id="welcomeMessage"
            placeholder="Hi! I'm your AI assistant. How can I help you today?"
            value={config.welcomeMessage || ''}
            onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="businessType">Business Type</Label>
          <Select value={config.businessType || 'ecommerce'} onValueChange={(value) => setConfig({...config, businessType: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ecommerce">E-commerce Store</SelectItem>
              <SelectItem value="delivery">Food/Delivery Service</SelectItem>
              <SelectItem value="saas">SaaS Platform</SelectItem>
              <SelectItem value="support">Customer Support</SelectItem>
              <SelectItem value="sales">Sales & Lead Gen</SelectItem>
              <SelectItem value="booking">Booking & Appointments</SelectItem>
              <SelectItem value="fintech">Fintech & Investment</SelectItem>
              <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
              <SelectItem value="aif-funds">AIF & Alternative Funds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleConfigComplete} className="flex-1">
          Generate Integration Code
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderPlatformInstructions = () => {
    const platform = platformOptions.find(p => p.id === selectedPlatform);

    const getPlatformInstructions = () => {
      switch (selectedPlatform) {
        case 'wordpress':
          return {
            title: 'WordPress Integration',
            steps: [
              'Copy the JavaScript code below',
              'Go to your WordPress admin → Appearance → Theme Editor',
              'Edit functions.php and paste the code before the closing ?> tag',
              'Or use a plugin like "Insert Headers and Footers" and paste in the footer section',
              'Save and the widget will appear on your site'
            ]
          };
        case 'woocommerce':
          return {
            title: 'WooCommerce Integration',
            steps: [
              'Copy the JavaScript code below',
              'Go to WordPress admin → Appearance → Customize → Additional CSS',
              'Or add to your theme\'s footer.php file before </body>',
              'The widget will include e-commerce features for order tracking',
              'Save and test the widget on your store'
            ]
          };
        case 'shopify':
          return {
            title: 'Shopify Integration',
            steps: [
              'Copy the JavaScript code below',
              'Go to Shopify admin → Online Store → Themes',
              'Click "Actions" → "Edit code"',
              'Open theme.liquid and paste before </body>',
              'Save and the widget will appear on your store'
            ]
          };
        case 'webflow':
          return {
            title: 'Webflow Integration',
            steps: [
              'Copy the JavaScript code below',
              'In Webflow Designer, go to Project Settings',
              'Go to Custom Code → Footer Code',
              'Paste the code and publish',
              'Widget will appear on your published site'
            ]
          };
        case 'custom-html':
          return {
            title: 'Custom HTML Integration',
            steps: [
              'Copy the JavaScript code below',
              'Paste it before the closing </body> tag of your HTML',
              'Upload your files to your web server',
              'The widget will appear on your website',
              'Test the integration'
            ]
          };
        default:
          return {
            title: `${platform?.name} Integration`,
            steps: [
              'Copy the JavaScript code below',
              'Add it to your website\'s footer or custom code section',
              'Follow your platform\'s documentation for adding custom JavaScript',
              'Save and publish your changes',
              'The widget will appear on your site'
            ]
          };
      }
    };

    const instructions = getPlatformInstructions();
    const embedCode = `<!-- Zunoki Intelligent Chat Widget -->
<script>
  window.ZunokiChatWidget = {
    widgetId: '${config.widgetId || 'widget_' + Date.now()}',
    widgetName: '${config.widgetName || 'Customer Support'}',
    primaryColor: '${config.primaryColor || '#3b82f6'}',
    position: '${config.position || 'bottom-right'}',
    welcomeMessage: '${config.welcomeMessage || 'Hi! How can I help you today?'}',
    businessType: '${config.businessType || 'ecommerce'}',
    webhookUrl: '${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/chat-widget'
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/zunoki-widget.js" async></script>
<!-- End Zunoki Widget -->`;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('config')}
            className="p-1 h-auto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Alert className="flex-1">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your {platform?.name} integration code is ready!
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-sm">{instructions.title}</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-sm text-blue-800 mb-2">Integration Steps:</h5>
            <ol className="text-sm text-blue-700 space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Integration Code</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                // toast success
              }}
            >
              Copy Code
            </Button>
          </div>
          <div className="bg-gray-50 border rounded-lg p-3">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {embedCode}
            </pre>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Close
          </Button>
          <Button onClick={onConnect} className="flex-1">
            Save Integration
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {currentStep === 'platform' && renderPlatformSelection()}
      {currentStep === 'config' && renderConfiguration()}
      {currentStep === 'embed' && renderPlatformInstructions()}
    </div>
  );
}

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
  const [embedCodeModal, setEmbedCodeModal] = useState<{ integration: any; embedCode: string } | null>(null);

  useEffect(() => {
    loadPlatformStatuses();
  }, [user]);

  const generateEmbedCode = (integration: any) => {
    const config = integration.config || {};
    const organizationId = integration.organization_id;
    const widgetId = config.widgetId;

    return `<!-- Zunoki Intelligent Chat Widget -->
<script>
  window.ZunokiWidget = {
    orgId: "${organizationId}",
    widgetId: "${widgetId}",
    apiUrl: "${window.location.origin}/api/webhooks/chat-widget",
    config: {
      widgetName: "${config.widgetName || 'Customer Support'}",
      primaryColor: "${config.primaryColor || '#3b82f6'}",
      position: "${config.position || 'bottom-right'}",
      welcomeMessage: "${config.welcomeMessage || 'Hi! How can I help you today?'}",
      businessType: "${config.businessType || 'support'}",
      features: ${JSON.stringify(config.features || {})}
    }
  };
</script>
<script async src="${window.location.origin}/widget/zunoki-widget.js"></script>
<!-- End Zunoki Widget -->`;
  };

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

    if (platform.id === 'telegram' || platform.id === 'gmail' || platform.id === 'custom-email' || platform.id === 'sms' || platform.id === 'slack' || platform.id === 'website-chat') {
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
      // Use messaging_integrations API for proper SaaS setup
      const integrationPayload = {
        platform: platform.id === 'telegram' ? 'telegram' :
                  platform.id === 'gmail' ? 'gmail' :
                  platform.id === 'custom-email' ? 'email' :
                  platform.id === 'sms' ? 'sms' :
                  platform.id === 'slack' ? 'slack' :
                  platform.id === 'website-chat' ? 'website-chat' :
                  platform.id,
        name: platform.name,
        config: {
          ...connectionConfig,
          // Generate unique widget ID for chat widget
          ...(platform.id === 'website-chat' && {
            widgetId: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            webhookUrl: `${window.location.origin}/api/webhooks/chat-widget`
          })
        },
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

        // Special handling for chat widget - show embed code
        if (platform.id === 'website-chat' && result.integration) {
          const embedCode = generateEmbedCode(result.integration);
          toast({
            title: 'Chat Widget Connected!',
            description: 'Your Zunoki Intelligent Chat Widget is ready! Copy the embed code to add it to your website.',
          });

          // Show embed code modal
          setEmbedCodeModal({
            integration: result.integration,
            embedCode: embedCode
          });
        } else {
          toast({
            title: 'Connected!',
            description: `${platform.name} has been connected successfully.`,
          });
        }

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

      {/* Embed Code Modal */}
      <Dialog open={!!embedCodeModal} onOpenChange={(open) => !open && setEmbedCodeModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              Zunoki Intelligent Chat Widget - Embed Code
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <EmbedCodeModal
              integration={embedCodeModal?.integration}
              embedCode={embedCodeModal?.embedCode || ''}
              onClose={() => setEmbedCodeModal(null)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Embed Code Modal Component
function EmbedCodeModal({
  integration,
  embedCode,
  onClose
}: {
  integration: any;
  embedCode: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('html');

  const copyToClipboard = (code?: string) => {
    const textToCopy = code || embedCode;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateWordPressCode = () => {
    return `<?php
// Add this to your theme's functions.php file
function add_zunoki_chat_widget() {
    ?>
    ${embedCode}
    <?php
}
add_action('wp_footer', 'add_zunoki_chat_widget');
?>`;
  };

  const generateShopifyCode = () => {
    return `<!-- Add this to your theme.liquid file, just before </body> -->
${embedCode}`;
  };

  const platformInstructions = {
    html: {
      title: 'HTML/JavaScript (Any Website)',
      code: embedCode,
      steps: [
        'Copy the embed code below',
        'Paste it into your website\'s HTML, just before the closing </body> tag',
        'Save and publish your website',
        'The chat widget will appear automatically'
      ]
    },
    wordpress: {
      title: 'WordPress Integration',
      code: generateWordPressCode(),
      steps: [
        'Copy the PHP code below',
        'Go to your WordPress admin → Appearance → Theme Editor',
        'Edit your theme\'s functions.php file',
        'Paste the code at the end of the file',
        'Save the file',
        'The widget will appear on all pages'
      ]
    },
    shopify: {
      title: 'Shopify Integration',
      code: generateShopifyCode(),
      steps: [
        'Copy the code below',
        'Go to Shopify Admin → Online Store → Themes',
        'Click "Actions" → "Edit code" on your active theme',
        'Find and edit the theme.liquid file',
        'Paste the code just before the closing </body> tag',
        'Save the file'
      ]
    },
    squarespace: {
      title: 'Squarespace Integration',
      code: embedCode,
      steps: [
        'Copy the embed code below',
        'Go to Settings → Advanced → Code Injection',
        'Paste the code in the "Footer" section',
        'Save your changes',
        'The widget will appear on all pages'
      ]
    },
    webflow: {
      title: 'Webflow Integration',
      code: embedCode,
      steps: [
        'Copy the embed code below',
        'Go to your Webflow project settings',
        'Navigate to Custom Code → Footer Code',
        'Paste the code in the footer section',
        'Publish your site'
      ]
    }
  };

  const currentPlatform = platformInstructions[selectedPlatform as keyof typeof platformInstructions];

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-800 font-medium mb-2">🎉 Chat Widget Successfully Created!</h3>
        <p className="text-green-700 text-sm">
          Your Zunoki Intelligent Chat Widget is ready! Choose your platform below for specific integration instructions.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Integration Details:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Widget ID:</span>
            <div className="font-mono bg-gray-100 p-2 rounded text-xs">{integration?.config?.widgetId}</div>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <div className="text-green-600 font-medium">Active</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Select Your Platform:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(platformInstructions).map(([key, platform]) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key)}
              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                selectedPlatform === key
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {platform.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{currentPlatform.title}:</h4>
          <Button onClick={() => copyToClipboard(currentPlatform.code)} size="sm" className="flex items-center gap-2">
            {copied ? <CheckCircle className="w-4 h-4" /> : '📋'}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
            <code>{currentPlatform.code}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Installation Steps:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          {currentPlatform.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-blue-800 font-medium mb-2">💡 What happens next?</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Visitors to your website can chat with your AI assistant</li>
          <li>• All conversations will appear in your Zunoki inbox</li>
          <li>• You can assign conversations to AI agents or human agents</li>
          <li>• Seamless handoff to WhatsApp or Email when needed</li>
          <li>• Full conversation history and analytics</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => window.open(`${window.location.origin}/shell`, '_blank')}>
          Go to Inbox
        </Button>
      </div>
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

      case 'website-chat':
        return (
          <WebsiteChatSetupFlow
            config={config}
            setConfig={setConfig}
            onConnect={onConnect}
            onCancel={onCancel}
          />
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
      case 'website-chat':
        return config.widgetName;
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