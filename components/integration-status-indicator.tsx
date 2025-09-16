'use client';

import { useIntegrationStatus } from '@/hooks/use-integration-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  MessageCircle,
  Bot,
  Users,
  Mail,
  Youtube,
  Music,
  Hash,
  Globe,
  Phone
} from 'lucide-react';

const platformIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-3 w-3" />,
  telegram: <Bot className="h-3 w-3" />,
  facebook: <Users className="h-3 w-3" />,
  instagram: <Users className="h-3 w-3" />,
  slack: <Hash className="h-3 w-3" />,
  discord: <Music className="h-3 w-3" />,
  youtube: <Youtube className="h-3 w-3" />,
  tiktok: <Music className="h-3 w-3" />,
  gmail: <Mail className="h-3 w-3" />,
  'twilio-sms': <Phone className="h-3 w-3" />,
  'website-chat': <Globe className="h-3 w-3" />,
};

const platformNames: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  facebook: 'Facebook',
  instagram: 'Instagram',
  slack: 'Slack',
  discord: 'Discord',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  gmail: 'Gmail',
  'twilio-sms': 'SMS',
  'website-chat': 'Web Chat',
};

export function IntegrationStatusIndicator() {
  const { integrations, loading, lastUpdate, refreshStatus, getStatusSummary } = useIntegrationStatus();
  const summary = getStatusSummary();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <RefreshCw className="h-3 w-3 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (summary.hasErrors) return 'bg-red-500';
    if (summary.active === 0) return 'bg-gray-500';
    if (summary.active === summary.total) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (summary.total === 0) return 'No integrations';
    if (summary.hasErrors) return 'Issues detected';
    if (summary.active === summary.total) return 'All systems operational';
    return `${summary.active}/${summary.total} active`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm font-medium">Integrations</span>
            <Badge variant="secondary" className="text-xs">
              {summary.active}/{summary.total}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Platform Status</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStatus}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {integrations.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-gray-400" />
              <span>No integrations configured</span>
            </div>
          </DropdownMenuItem>
        ) : (
          integrations.map((integration) => (
            <DropdownMenuItem key={integration.platform} className="cursor-default">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  {platformIcons[integration.platform]}
                  <span className="text-sm">{platformNames[integration.platform] || integration.platform}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {integration.status === 'active' ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : integration.status === 'error' ? (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <Badge 
                    variant={integration.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {integration.status}
                  </Badge>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}