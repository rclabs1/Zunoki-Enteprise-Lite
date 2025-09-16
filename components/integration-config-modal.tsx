"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Key,
  Shield,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Info,
  ArrowRight,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  requiresAuth: boolean;
  authType: 'oauth' | 'api_key' | 'basic';
  capabilities: string[];
}

interface IntegrationConfigModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (integrationId: string, config: any) => Promise<void>;
}

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

// Configuration templates for different integrations
const getConfigTemplate = (integrationId: string) => {
  const templates: Record<string, any> = {
    google_ads: {
      fields: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'refresh_token', label: 'Refresh Token', type: 'password', required: false },
        { name: 'developer_token', label: 'Developer Token', type: 'password', required: true }
      ],
      docs: 'https://developers.google.com/google-ads/api/docs/first-call/overview',
      instructions: [
        'Create a Google Ads API application in Google Cloud Console',
        'Enable the Google Ads API',
        'Create OAuth 2.0 credentials',
        'Add your domain to authorized redirect URIs',
        'Generate a developer token in your Google Ads account'
      ]
    },
    meta_ads: {
      fields: [
        { name: 'app_id', label: 'App ID', type: 'text', required: true },
        { name: 'app_secret', label: 'App Secret', type: 'password', required: true },
        { name: 'access_token', label: 'Access Token', type: 'password', required: true },
        { name: 'ad_account_id', label: 'Ad Account ID', type: 'text', required: true }
      ],
      docs: 'https://developers.facebook.com/docs/marketing-api/get-started',
      instructions: [
        'Create a Facebook App in Facebook Developers',
        'Add Marketing API permissions',
        'Generate a long-lived access token',
        'Get your Ad Account ID from Ads Manager',
        'Ensure your app is approved for Marketing API access'
      ]
    },
    hubspot_crm: {
      fields: [
        { name: 'client_id', label: 'Client ID', type: 'text', required: true },
        { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { name: 'access_token', label: 'Access Token', type: 'password', required: false },
        { name: 'portal_id', label: 'Portal ID', type: 'text', required: false }
      ],
      docs: 'https://developers.hubspot.com/docs/api/overview',
      instructions: [
        'Create a HubSpot app in your developer account',
        'Configure OAuth scopes (contacts, deals, companies)',
        'Set up redirect URI for OAuth flow',
        'Note your Portal ID from HubSpot settings',
        'Test the connection with sample API calls'
      ]
    },
    mixpanel: {
      fields: [
        { name: 'project_token', label: 'Project Token', type: 'password', required: true },
        { name: 'api_secret', label: 'API Secret', type: 'password', required: true },
        { name: 'project_id', label: 'Project ID', type: 'text', required: true }
      ],
      docs: 'https://developer.mixpanel.com/docs',
      instructions: [
        'Find your Project Token in Mixpanel project settings',
        'Generate an API Secret in the Service Accounts section',
        'Copy your Project ID from the project URL',
        'Ensure you have the necessary permissions for data export'
      ]
    },
    whatsapp: {
      fields: [
        { name: 'phone_number_id', label: 'Phone Number ID', type: 'text', required: true },
        { name: 'access_token', label: 'Access Token', type: 'password', required: true },
        { name: 'webhook_verify_token', label: 'Webhook Verify Token', type: 'password', required: true },
        { name: 'business_account_id', label: 'Business Account ID', type: 'text', required: false }
      ],
      docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
      instructions: [
        'Set up WhatsApp Business API in Meta for Developers',
        'Create a WhatsApp Business Account',
        'Add phone numbers to your WhatsApp Business Account',
        'Generate permanent access token',
        'Configure webhooks for message delivery'
      ]
    },
    default: {
      fields: [
        { name: 'api_key', label: 'API Key', type: 'password', required: true },
        { name: 'api_secret', label: 'API Secret', type: 'password', required: false },
        { name: 'endpoint_url', label: 'Endpoint URL', type: 'text', required: false }
      ],
      docs: '',
      instructions: [
        'Obtain API credentials from the service provider',
        'Check the service documentation for required parameters',
        'Ensure your API key has necessary permissions',
        'Test the connection before saving'
      ]
    }
  };

  return templates[integrationId] || templates.default;
};

export function IntegrationConfigModal({ integration, isOpen, onClose, onSave }: IntegrationConfigModalProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'idle' });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const template = integration ? getConfigTemplate(integration.id) : null;

  // Reset form when integration changes
  useEffect(() => {
    if (integration) {
      setConfig({});
      setConnectionStatus({ status: 'idle' });
      setShowSecrets({});
    }
  }, [integration?.id]);

  const handleInputChange = (fieldName: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error status when user starts typing
    if (connectionStatus.status === 'error') {
      setConnectionStatus({ status: 'idle' });
    }
  };

  const toggleSecretVisibility = (fieldName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The value has been copied to your clipboard."
    });
  };

  const testConnection = async () => {
    if (!integration || !template) return;

    setConnectionStatus({ status: 'testing' });

    try {
      // Validate required fields
      const missingFields = template.fields
        .filter((field: any) => field.required && !config[field.name])
        .map((field: any) => field.label);

      if (missingFields.length > 0) {
        setConnectionStatus({
          status: 'error',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      // Mock API call to test connection
      const response = await fetch('/api/integrations/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_id: integration.id,
          config
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConnectionStatus({
            status: 'success',
            message: result.message || 'Connection successful!'
          });
        } else {
          setConnectionStatus({
            status: 'error',
            message: result.error || 'Connection failed'
          });
        }
      } else {
        setConnectionStatus({
          status: 'error',
          message: 'Failed to test connection. Please check your credentials.'
        });
      }
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: 'Network error. Please try again.'
      });
    }
  };

  const handleSave = async () => {
    if (!integration || !template) return;

    setIsLoading(true);

    try {
      // Validate required fields
      const missingFields = template.fields
        .filter((field: any) => field.required && !config[field.name])
        .map((field: any) => field.label);

      if (missingFields.length > 0) {
        toast({
          title: "Missing required fields",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      await onSave(integration.id, config);
      
      toast({
        title: "Integration configured",
        description: `${integration.name} has been successfully configured.`
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Configuration failed",
        description: error.message || "Failed to save integration configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthFlow = () => {
    if (!integration) return;

    // Redirect to OAuth endpoint
    const oauthUrl = `/api/auth/${integration.id}/authorize?redirect_uri=${encodeURIComponent(window.location.href)}`;
    window.location.href = oauthUrl;
  };

  if (!integration || !template) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background border">
              {integration.icon}
            </div>
            <div>
              <DialogTitle>Configure {integration.name}</DialogTitle>
              <DialogDescription>
                Set up authentication and connection settings for {integration.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {/* OAuth Flow for OAuth integrations */}
            {integration.authType === 'oauth' && (
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This integration uses OAuth authentication. Click the button below to securely authenticate with {integration.name}.
                  </AlertDescription>
                </Alert>
                
                <Button onClick={handleOAuthFlow} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Authenticate with {integration.name}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or configure manually
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Fields */}
            <div className="space-y-4">
              {template.fields.map((field: any) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  <div className="relative">
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={config[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type === 'password' && !showSecrets[field.name] ? 'password' : 'text'}
                        value={config[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    
                    {field.type === 'password' && config[field.name] && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(config[field.name])}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(field.name)}
                          className="h-8 w-8 p-0"
                        >
                          {showSecrets[field.name] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Connection Test */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Test Connection</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={connectionStatus.status === 'testing'}
                >
                  {connectionStatus.status === 'testing' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>

              {connectionStatus.message && (
                <Alert className={connectionStatus.status === 'success' ? 'border-green-200 bg-green-50' : connectionStatus.status === 'error' ? 'border-red-200 bg-red-50' : ''}>
                  {connectionStatus.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : connectionStatus.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertDescription>{connectionStatus.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Setup Instructions</h4>
                <div className="space-y-3">
                  {template.instructions.map((instruction: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5 text-xs">
                        {index + 1}
                      </Badge>
                      <p className="text-sm text-muted-foreground flex-1">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {template.docs && (
                <div className="space-y-2">
                  <h4 className="font-medium">Documentation</h4>
                  <Button variant="outline" asChild>
                    <a href={template.docs} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Official Documentation
                    </a>
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {integration.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs">
                      {capability.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || connectionStatus.status === 'testing'}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}