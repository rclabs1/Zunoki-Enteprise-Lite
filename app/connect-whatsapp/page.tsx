'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Phone,
  Shield,
  Zap,
  Users,
  BarChart3,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface WhatsAppProvider {
  id: 'twilio' | 'meta';
  name: string;
  description: string;
  features: string[];
  pricing: string;
  setupComplexity: 'Easy' | 'Medium' | 'Advanced';
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
}

const providers: WhatsAppProvider[] = [
  {
    id: 'twilio',
    name: 'Twilio WhatsApp',
    description: 'Enterprise-grade WhatsApp messaging through Twilio\'s Sandbox and Business API',
    features: ['Sandbox for testing', 'Production API', 'Media support', 'Message status tracking'],
    pricing: 'Pay per message',
    setupComplexity: 'Easy',
    icon: <MessageCircle className="h-6 w-6" />,
    pros: ['Quick sandbox setup', 'Reliable delivery', 'Excellent documentation', 'Global coverage'],
    cons: ['Higher cost per message', 'Requires verification for production']
  },
  {
    id: 'meta',
    name: 'Meta WhatsApp Business',
    description: 'Direct integration with WhatsApp Business API from Meta',
    features: ['Business API', 'Rich media', 'Templates', 'Analytics'],
    pricing: 'Conversation-based',
    setupComplexity: 'Medium',
    icon: <Shield className="h-6 w-6" />,
    pros: ['Lower cost per conversation', 'Rich features', 'Native WhatsApp experience'],
    cons: ['More complex setup', 'Business verification required']
  }
];

export default function ConnectWhatsAppPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedProvider, setSelectedProvider] = useState<'twilio' | 'meta' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<any>(null);
  
  // Form states
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    webhookUrl: ''
  });
  
  const [metaConfig, setMetaConfig] = useState({
    businessAccountId: '',
    accessToken: '',
    phoneNumber: '',
    webhookUrl: '',
    verifyToken: ''
  });

  useEffect(() => {
    checkExistingIntegration();
  }, [user]);

  const checkExistingIntegration = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/whatsapp/integrations');
      const data = await response.json();
      
      if (data.success && data.integration) {
        setExistingIntegration(data.integration);
        setSelectedProvider(data.integration.provider);
        setCurrentStep(4); // Skip to success step
      }
    } catch (error) {
      console.error('Error checking existing integration:', error);
    }
  };

  const handleProviderSelect = (providerId: 'twilio' | 'meta') => {
    setSelectedProvider(providerId);
    setCurrentStep(2);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !user) return;

    setIsLoading(true);
    
    try {
      const config = selectedProvider === 'twilio' ? twilioConfig : metaConfig;
      
      const response = await fetch('/api/whatsapp/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          config
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(3);
        toast({
          title: 'Integration configured!',
          description: 'Your WhatsApp provider has been successfully connected.',
        });
      } else {
        throw new Error(data.error || 'Failed to configure integration');
      }
    } catch (error: any) {
      toast({
        title: 'Configuration failed',
        description: error.message || 'Failed to configure WhatsApp integration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(4);
        toast({
          title: 'Connection successful!',
          description: 'Your WhatsApp integration is working correctly.',
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error: any) {
      toast({
        title: 'Connection test failed',
        description: error.message || 'Unable to connect to WhatsApp provider.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const finishSetup = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to configure WhatsApp integration.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="p-3 bg-green-100 rounded-full">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Connect WhatsApp</h1>
          </motion.div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Set up your WhatsApp integration to start receiving and managing customer conversations 
            directly in your CRM dashboard.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-0.5 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Provider Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Choose Your WhatsApp Provider
                  </CardTitle>
                  <CardDescription>
                    Select the WhatsApp provider that best fits your business needs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providers.map((provider) => (
                    <Card 
                      key={provider.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProvider === provider.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              {provider.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{provider.name}</h3>
                                <Badge variant="outline">{provider.setupComplexity}</Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{provider.description}</p>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-green-600 mb-1">Pros</h4>
                                  <ul className="space-y-1">
                                    {provider.pros.map((pro, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-orange-600 mb-1">Considerations</h4>
                                  <ul className="space-y-1">
                                    {provider.cons.map((con, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{provider.pricing}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && selectedProvider && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configure {providers.find(p => p.id === selectedProvider)?.name}
                  </CardTitle>
                  <CardDescription>
                    Enter your {selectedProvider === 'twilio' ? 'Twilio' : 'Meta'} credentials and settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleConfigSubmit} className="space-y-4">
                    {selectedProvider === 'twilio' ? (
                      <Tabs defaultValue="sandbox" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="sandbox">Sandbox (Testing)</TabsTrigger>
                          <TabsTrigger value="production">Production</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="sandbox" className="space-y-4">
                          <Alert>
                            <Zap className="h-4 w-4" />
                            <AlertDescription>
                              Sandbox mode is perfect for testing. No business verification required!
                            </AlertDescription>
                          </Alert>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="accountSid">Account SID</Label>
                              <Input
                                id="accountSid"
                                value={twilioConfig.accountSid}
                                onChange={(e) => setTwilioConfig(prev => ({
                                  ...prev, accountSid: e.target.value
                                }))}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="authToken">Auth Token</Label>
                              <Input
                                id="authToken"
                                type="password"
                                value={twilioConfig.authToken}
                                onChange={(e) => setTwilioConfig(prev => ({
                                  ...prev, authToken: e.target.value
                                }))}
                                placeholder="Enter your auth token"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="phoneNumber">WhatsApp Number</Label>
                            <Input
                              id="phoneNumber"
                              value={twilioConfig.phoneNumber}
                              onChange={(e) => setTwilioConfig(prev => ({
                                ...prev, phoneNumber: e.target.value
                              }))}
                              placeholder="+14155238886 (Sandbox number)"
                              required
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="production" className="space-y-4">
                          <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                              Production mode requires WhatsApp Business Account approval from Twilio.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="accountSid">Account SID</Label>
                              <Input
                                id="accountSid"
                                value={twilioConfig.accountSid}
                                onChange={(e) => setTwilioConfig(prev => ({
                                  ...prev, accountSid: e.target.value
                                }))}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="authToken">Auth Token</Label>
                              <Input
                                id="authToken"
                                type="password"
                                value={twilioConfig.authToken}
                                onChange={(e) => setTwilioConfig(prev => ({
                                  ...prev, authToken: e.target.value
                                }))}
                                placeholder="Enter your auth token"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="phoneNumber">Business WhatsApp Number</Label>
                            <Input
                              id="phoneNumber"
                              value={twilioConfig.phoneNumber}
                              onChange={(e) => setTwilioConfig(prev => ({
                                ...prev, phoneNumber: e.target.value
                              }))}
                              placeholder="+1234567890"
                              required
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            Meta WhatsApp Business API requires business verification and app approval.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="businessAccountId">Business Account ID</Label>
                            <Input
                              id="businessAccountId"
                              value={metaConfig.businessAccountId}
                              onChange={(e) => setMetaConfig(prev => ({
                                ...prev, businessAccountId: e.target.value
                              }))}
                              placeholder="123456789012345"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="accessToken">Access Token</Label>
                            <Input
                              id="accessToken"
                              type="password"
                              value={metaConfig.accessToken}
                              onChange={(e) => setMetaConfig(prev => ({
                                ...prev, accessToken: e.target.value
                              }))}
                              placeholder="EAAxxxxxxxxxxxxxxxx"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phoneNumber">Phone Number ID</Label>
                            <Input
                              id="phoneNumber"
                              value={metaConfig.phoneNumber}
                              onChange={(e) => setMetaConfig(prev => ({
                                ...prev, phoneNumber: e.target.value
                              }))}
                              placeholder="123456789012345"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="verifyToken">Verify Token</Label>
                            <Input
                              id="verifyToken"
                              value={metaConfig.verifyToken}
                              onChange={(e) => setMetaConfig(prev => ({
                                ...prev, verifyToken: e.target.value
                              }))}
                              placeholder="your_verify_token"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep(1)}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Configuring...' : 'Save Configuration'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Test Connection */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Test Your Connection
                  </CardTitle>
                  <CardDescription>
                    Let's verify that your WhatsApp integration is working correctly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                      <MessageCircle className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Test</h3>
                    <p className="text-muted-foreground mb-6">
                      We'll send a test message to verify your WhatsApp integration is set up correctly.
                    </p>
                    
                    <Button onClick={testConnection} disabled={isLoading} size="lg">
                      {isLoading ? 'Testing Connection...' : 'Test Connection'}
                    </Button>
                  </div>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      This test will verify API connectivity and webhook configuration.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    WhatsApp Connected Successfully!
                  </CardTitle>
                  <CardDescription>
                    Your WhatsApp integration is now active and ready to receive messages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-semibold">Unified Inbox</h4>
                          <p className="text-sm text-muted-foreground">
                            All multi-platform messages will appear in your unified inbox
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-green-500" />
                        <div>
                          <h4 className="font-semibold">Analytics & Insights</h4>
                          <p className="text-sm text-muted-foreground">
                            Track message volume, response times, and engagement
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-8 w-8 text-purple-500" />
                        <div>
                          <h4 className="font-semibold">AI-Powered Routing</h4>
                          <p className="text-sm text-muted-foreground">
                            Messages are automatically classified and routed to the right agents
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={finishSetup} size="lg">
                      Go to Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => router.push('/conversation')}
                    >
                      View Conversations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}