"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Globe,
  BarChart3,
  MessageSquare,
  Users,
  Zap,
  Database,
  Target,
  Mail,
  Phone,
  DollarSign,
  FileText,
  Cloud,
  Activity,
  Link2
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  requiresAuth: boolean;
  authType: 'oauth' | 'api_key' | 'basic';
  popular?: boolean;
  capabilities: string[];
}

interface IntegrationCatalogProps {
  agentIntegrations: string[];
  onIntegrationToggle: (integrationId: string, enabled: boolean) => void;
  onConfigureIntegration: (integration: Integration) => void;
}

// Simplified integration list with all major services
const AVAILABLE_INTEGRATIONS: Integration[] = [
  // Marketing & Advertising
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Manage Google Ads campaigns, keywords, and performance metrics',
    category: 'Marketing',
    icon: <Target className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    popular: true,
    capabilities: ['campaign_management', 'keyword_research', 'performance_analytics']
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Facebook and Instagram advertising platform integration',
    category: 'Marketing',
    icon: <Users className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    popular: true,
    capabilities: ['facebook_ads', 'instagram_ads', 'audience_targeting']
  },
  {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    description: 'Professional advertising and lead generation on LinkedIn',
    category: 'Marketing',
    icon: <Users className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['b2b_advertising', 'lead_generation', 'audience_insights']
  },

  // Analytics & Data
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Web analytics and user behavior tracking',
    category: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    popular: true,
    capabilities: ['web_analytics', 'conversion_tracking', 'audience_analysis']
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics and user behavior tracking',
    category: 'Analytics',
    icon: <Activity className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['event_tracking', 'funnel_analysis', 'cohort_analysis']
  },
  {
    id: 'segment',
    name: 'Segment',
    description: 'Customer data platform for unified data collection',
    category: 'Analytics',
    icon: <Database className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['data_collection', 'customer_profiles', 'event_streaming']
  },

  // CRM & Business
  {
    id: 'hubspot_crm',
    name: 'HubSpot CRM',
    description: 'Complete CRM with contacts, deals, and sales pipeline',
    category: 'CRM',
    icon: <Users className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    popular: true,
    capabilities: ['contact_management', 'deal_tracking', 'sales_pipeline']
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM and sales automation platform',
    category: 'CRM',
    icon: <Cloud className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['enterprise_crm', 'sales_automation', 'lead_management']
  },

  // Communication & Messaging
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'WhatsApp messaging for customer communication',
    category: 'Communication',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    popular: true,
    capabilities: ['messaging', 'broadcast_messages', 'customer_support']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration platform',
    category: 'Communication',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['team_messaging', 'channel_management', 'bot_integration']
  },
  {
    id: 'email',
    name: 'Email Service',
    description: 'SMTP email sending and management',
    category: 'Communication',
    icon: <Mail className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'basic',
    capabilities: ['email_sending', 'template_management', 'delivery_tracking']
  },

  // Business Tools
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Online payments and financial services',
    category: 'Payments',
    icon: <DollarSign className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['payment_processing', 'subscription_billing', 'invoice_management']
  }
];

export function IntegrationCatalog({ agentIntegrations, onIntegrationToggle, onConfigureIntegration }: IntegrationCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(AVAILABLE_INTEGRATIONS.map(i => i.category)))];

  // Filter integrations based on search and category
  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const handleIntegrationToggle = (integration: Integration, enabled: boolean) => {
    if (enabled && integration.requiresAuth && !agentIntegrations.includes(integration.id)) {
      onConfigureIntegration(integration);
    } else {
      onIntegrationToggle(integration.id, enabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Integration Marketplace</h3>
          <p className="text-sm text-muted-foreground">
            Connect your agent to {AVAILABLE_INTEGRATIONS.length}+ external services
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filteredIntegrations.length} integrations available</span>
          <span>•</span>
          <span>{agentIntegrations.length} connected to this agent</span>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Marketing">Marketing</TabsTrigger>
          <TabsTrigger value="Analytics">Analytics</TabsTrigger>
          <TabsTrigger value="CRM">CRM</TabsTrigger>
          <TabsTrigger value="Communication">Communication</TabsTrigger>
          <TabsTrigger value="Payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          {/* Popular Integrations */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Popular Integrations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_INTEGRATIONS.filter(i => i.popular).map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isEnabled={agentIntegrations.includes(integration.id)}
                  onToggle={(enabled) => handleIntegrationToggle(integration, enabled)}
                  onConfigure={() => onConfigureIntegration(integration)}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </div>

          {/* All Integrations */}
          <div>
            <h4 className="font-medium mb-3">All Integrations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isEnabled={agentIntegrations.includes(integration.id)}
                  onToggle={(enabled) => handleIntegrationToggle(integration, enabled)}
                  onConfigure={() => onConfigureIntegration(integration)}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual Integration Card Component
function IntegrationCard({ 
  integration, 
  isEnabled, 
  onToggle, 
  onConfigure,
  getStatusColor,
  getStatusIcon
}: {
  integration: Integration;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  getStatusColor: (status: Integration['status']) => string;
  getStatusIcon: (status: Integration['status']) => React.ReactNode;
}) {
  return (
    <Card className={`relative transition-all hover:shadow-md ${isEnabled ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-background border ${isEnabled ? 'bg-primary text-primary-foreground' : ''}`}>
              {integration.icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {integration.category}
                </Badge>
                {integration.popular && (
                  <Badge variant="default" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            size="sm"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">
          {integration.description}
        </p>
        
        {/* Status and Actions */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 text-xs ${getStatusColor(integration.status)}`}>
            {getStatusIcon(integration.status)}
            <span className="capitalize">{integration.status}</span>
          </div>
          
          {isEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigure}
              className="text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          )}
        </div>
        
        {integration.requiresAuth && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Requires {integration.authType.replace('_', ' ')} authentication
          </div>
        )}
      </CardContent>
    </Card>
  );
}