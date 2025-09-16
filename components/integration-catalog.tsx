"use client"

import React, { useState, useEffect } from 'react';
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
  Brain,
  Target,
  TrendingUp,
  Mic,
  Code,
  Mail,
  Phone,
  Calendar,
  FileText,
  DollarSign,
  ShoppingCart,
  Video,
  Camera,
  Music,
  Map,
  Share2,
  Link2,
  Cloud,
  Smartphone,
  Wifi,
  Activity
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

// Comprehensive integration catalog based on discovered services
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
    capabilities: ['campaign_management', 'keyword_research', 'performance_analytics', 'bid_optimization']
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Facebook and Instagram advertising platform integration',
    category: 'Marketing',
    icon: <Share2 className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    popular: true,
    capabilities: ['facebook_ads', 'instagram_ads', 'audience_targeting', 'creative_optimization']
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
    capabilities: ['b2b_advertising', 'lead_generation', 'audience_insights', 'campaign_optimization']
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'Short-form video advertising on TikTok platform',
    category: 'Marketing',
    icon: <Video className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['video_ads', 'tiktok_campaigns', 'creative_tools', 'audience_targeting']
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
    capabilities: ['web_analytics', 'conversion_tracking', 'audience_analysis', 'goal_tracking']
  },
  {
    id: 'youtube_analytics',
    name: 'YouTube Analytics',
    description: 'Video performance and channel analytics for YouTube',
    category: 'Analytics',
    icon: <Video className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['video_analytics', 'channel_performance', 'subscriber_insights', 'revenue_tracking']
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
    capabilities: ['event_tracking', 'funnel_analysis', 'cohort_analysis', 'retention_tracking']
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
    capabilities: ['data_collection', 'customer_profiles', 'event_streaming', 'data_warehousing']
  },
  {
    id: 'branch_io',
    name: 'Branch.io',
    description: 'Mobile attribution and deep linking platform',
    category: 'Analytics',
    icon: <Smartphone className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['mobile_attribution', 'deep_linking', 'app_analytics', 'user_acquisition']
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
    capabilities: ['contact_management', 'deal_tracking', 'sales_pipeline', 'marketing_automation']
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
    capabilities: ['enterprise_crm', 'sales_automation', 'lead_management', 'opportunity_tracking']
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales-focused CRM with pipeline management',
    category: 'CRM',
    icon: <TrendingUp className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['sales_pipeline', 'deal_management', 'activity_tracking', 'sales_reporting']
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
    capabilities: ['messaging', 'broadcast_messages', 'media_sharing', 'customer_support']
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
    capabilities: ['team_messaging', 'channel_management', 'bot_integration', 'workflow_automation']
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
    capabilities: ['email_sending', 'template_management', 'delivery_tracking', 'bounce_handling']
  },
  {
    id: 'sms',
    name: 'SMS Service',
    description: 'SMS messaging and notifications',
    category: 'Communication',
    icon: <Phone className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['sms_sending', 'bulk_messaging', 'delivery_reports', 'two_way_messaging']
  },

  // AI & Technical Services
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Advanced language model for AI processing',
    category: 'AI',
    icon: <Brain className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['language_generation', 'text_analysis', 'code_generation', 'reasoning']
  },
  {
    id: 'llama',
    name: 'Llama Models',
    description: 'Open-source language models for AI tasks',
    category: 'AI',
    icon: <Brain className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['text_generation', 'conversation', 'summarization', 'translation']
  },
  {
    id: 'elevenlabs_tts',
    name: 'ElevenLabs TTS',
    description: 'High-quality text-to-speech conversion',
    category: 'AI',
    icon: <Mic className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['text_to_speech', 'voice_cloning', 'multilingual_support', 'custom_voices']
  },
  {
    id: 'sarvam_tts',
    name: 'Sarvam TTS',
    description: 'Regional language text-to-speech service',
    category: 'AI',
    icon: <Mic className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['regional_languages', 'text_to_speech', 'voice_synthesis', 'pronunciation']
  },
  {
    id: 'speech_recognition',
    name: 'Speech Recognition',
    description: 'Convert speech to text with high accuracy',
    category: 'AI',
    icon: <Mic className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['speech_to_text', 'real_time_transcription', 'language_detection', 'voice_commands']
  },

  // Business Tools
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and ticketing system',
    category: 'Support',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['ticket_management', 'customer_support', 'knowledge_base', 'live_chat']
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    description: 'Modern customer support platform',
    category: 'Support',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['helpdesk', 'ticket_routing', 'automation', 'reporting']
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Conversational customer engagement platform',
    category: 'Support',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['live_chat', 'customer_messaging', 'bot_automation', 'product_tours']
  },

  // E-commerce & Payments
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform integration',
    category: 'E-commerce',
    icon: <ShoppingCart className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['store_management', 'product_catalog', 'order_processing', 'inventory_tracking']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Online payments and financial services',
    category: 'Payments',
    icon: <DollarSign className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['payment_processing', 'subscription_billing', 'invoice_management', 'financial_reporting']
  },

  // Productivity & Collaboration
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar and scheduling integration',
    category: 'Productivity',
    icon: <Calendar className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['event_scheduling', 'calendar_management', 'meeting_coordination', 'availability_checking']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace and documentation',
    category: 'Productivity',
    icon: <FileText className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'oauth',
    capabilities: ['document_management', 'database_integration', 'team_collaboration', 'content_creation']
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Flexible database and project management',
    category: 'Productivity',
    icon: <Database className="h-4 w-4" />,
    status: 'disconnected',
    requiresAuth: true,
    authType: 'api_key',
    capabilities: ['database_management', 'project_tracking', 'collaboration', 'automation']
  }
];

export function IntegrationCatalog({ agentIntegrations, onIntegrationToggle, onConfigureIntegration }: IntegrationCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);

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

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(AVAILABLE_INTEGRATIONS.map(i => i.category)))];

  // Filter integrations based on search and category
  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    
    const matchesConnectionFilter = !showConnectedOnly || agentIntegrations.includes(integration.id);
    
    return matchesSearch && matchesCategory && matchesConnectionFilter;
  });

  // Group integrations by category for display
  const integrationsByCategory = categories.reduce((acc, category) => {
    if (category === 'all') return acc;
    
    acc[category] = filteredIntegrations.filter(i => i.category === category);
    return acc;
  }, {} as Record<string, Integration[]>);

  const handleIntegrationToggle = (integration: Integration, enabled: boolean) => {
    if (enabled && integration.requiresAuth && !agentIntegrations.includes(integration.id)) {
      // If enabling and requires auth, open config modal first
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
            Connect your agent to {AVAILABLE_INTEGRATIONS.length}+ external services and platforms
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={showConnectedOnly}
              onCheckedChange={setShowConnectedOnly}
              id="connected-only"
            />
            <Label htmlFor="connected-only" className="text-sm">
              Show connected only
            </Label>
          </div>
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
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Marketing">Marketing</TabsTrigger>
          <TabsTrigger value="Analytics">Analytics</TabsTrigger>
          <TabsTrigger value="CRM">CRM</TabsTrigger>
          <TabsTrigger value="Communication">Communication</TabsTrigger>
          <TabsTrigger value="AI">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Popular Integrations */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Popular Integrations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_INTEGRATIONS.filter(i => i.popular).map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isEnabled={agentIntegrations.includes(integration.id)}
                  onToggle={(enabled) => handleIntegrationToggle(integration, enabled)}
                  onConfigure={() => onConfigureIntegration(integration)}
                />
              ))}
            </div>
          </div>

          {/* All Categories */}
          {Object.entries(integrationsByCategory).map(([category, integrations]) => (
            integrations.length > 0 && (
              <div key={category}>
                <h4 className="font-medium mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      isEnabled={agentIntegrations.includes(integration.id)}
                      onToggle={(enabled) => handleIntegrationToggle(integration, enabled)}
                      onConfigure={() => onConfigureIntegration(integration)}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </TabsContent>

        {/* Category-specific tabs */}
        {categories.slice(1).map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrationsByCategory[category]?.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isEnabled={agentIntegrations.includes(integration.id)}
                  onToggle={(enabled) => handleIntegrationToggle(integration, enabled)}
                  onConfigure={() => onConfigureIntegration(integration)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Individual Integration Card Component
function IntegrationCard({ 
  integration, 
  isEnabled, 
  onToggle, 
  onConfigure 
}: {
  integration: Integration;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
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
        
        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {integration.capabilities.slice(0, 3).map((capability) => (
            <Badge key={capability} variant="outline" className="text-xs">
              {capability.replace(/_/g, ' ')}
            </Badge>
          ))}
          {integration.capabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{integration.capabilities.length - 3} more
            </Badge>
          )}
        </div>
        
        {/* Status and Actions */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 text-xs ${
            integration.status === 'connected' ? 'text-green-600' : 
            integration.status === 'error' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {integration.status === 'connected' ? <CheckCircle className="h-4 w-4" /> : 
             integration.status === 'error' ? <AlertCircle className="h-4 w-4" /> : 
             <Globe className="h-4 w-4" />}
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