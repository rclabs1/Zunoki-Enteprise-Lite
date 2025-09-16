'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

export interface IntegrationStatus {
  id: string;
  platform: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  name: string;
  provider?: string;
  lastSync?: string;
  errorMessage?: string;
  created_at: string;
  updated_at: string;
}

export function useIntegrationStatus() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchIntegrationStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiGet('/api/messaging/integrations');
      const statusList: IntegrationStatus[] = (data.integrations || []).map((integration: any) => ({
        id: integration.id,
        platform: integration.platform,
        status: integration.status || 'inactive',
        name: integration.name,
        provider: integration.provider,
        lastSync: integration.last_sync_at,
        errorMessage: integration.error_message,
        created_at: integration.created_at,
        updated_at: integration.updated_at
      }));
      
      setIntegrations(statusList);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchIntegrationStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIntegrationStatus, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const refreshStatus = () => {
    fetchIntegrationStatus();
  };

  const getStatusSummary = () => {
    const active = integrations.filter(i => i.status === 'active').length;
    const total = integrations.length;
    const hasErrors = integrations.some(i => i.status === 'error');
    
    return {
      active,
      total,
      hasErrors,
      percentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  };

  const getIntegrationForPlatform = (platform: string) => {
    return integrations.find(integration => integration.platform === platform);
  };

  const isConnected = (platform: string) => {
    const integration = getIntegrationForPlatform(platform);
    return integration?.status === 'active';
  };

  const getConnectedPlatforms = () => {
    return integrations
      .filter(integration => integration.status === 'active')
      .map(integration => {
        // For WhatsApp, show provider details with clear sandbox/production distinction
        if (integration.platform === 'whatsapp' && integration.provider) {
          const providerMap: Record<string, string> = {
            'twilio': 'WhatsApp Twilio Production',
            'twilio_sandbox': 'WhatsApp Twilio Sandbox',
            'whatsapp_business': 'WhatsApp Meta Production',
            'whatsapp_business_sandbox': 'WhatsApp Meta Sandbox',
            'meta': 'WhatsApp Meta Production',
            'meta_sandbox': 'WhatsApp Meta Sandbox'
          };
          return providerMap[integration.provider] || `WhatsApp ${integration.provider}`;
        }
        
        // For other platforms, just capitalize the platform name
        return integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1);
      });
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      // Get Firebase token for authentication
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const response = await fetch(`/api/messaging/integrations?id=${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh integrations after successful deletion
        await fetchIntegrationStatus();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to disconnect' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to disconnect' };
    }
  };

  return {
    integrations,
    loading,
    lastUpdate,
    refreshStatus,
    getStatusSummary,
    getIntegrationForPlatform,
    isConnected,
    getConnectedPlatforms,
    disconnectIntegration
  };
}