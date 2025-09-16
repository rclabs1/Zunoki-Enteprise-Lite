import { supabase } from './supabase/client';

// Import all available service classes
import { GoogleAdsService } from './google-ads-service';
import { MetaAdsService } from './meta-ads-service';
import { LinkedInAdsService } from './linkedin-ads-service';
import { HubSpotService } from './hubspot-service';
import { YoutubeAnalyticsService } from './youtube-analytics-service';
import { MixpanelService } from './mixpanel-service';
import { SegmentService } from './segment-service';
import { BranchService } from './branch-service';

export interface IntegrationConfig {
  id: string;
  name: string;
  category: string;
  serviceClass: any;
  authType: 'oauth' | 'api_key' | 'basic';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  credentials?: any;
  accountInfo?: any;
}

export interface IntegrationCredentials {
  [key: string]: string;
}

export interface ConnectionValidationResult {
  valid: boolean;
  error?: string;
  accountInfo?: any;
}

/**
 * Centralized integration management service
 * Handles all external service connections, credentials, and validations
 */
export class IntegrationManager {
  private userId: string;
  private integrationRegistry: Map<string, IntegrationConfig>;

  constructor(userId: string) {
    this.userId = userId;
    this.integrationRegistry = new Map();
    this.initializeIntegrations();
  }

  /**
   * Initialize all available integrations with their service classes
   */
  private initializeIntegrations() {
    const integrations: IntegrationConfig[] = [
      // Marketing & Advertising
      {
        id: 'google_ads',
        name: 'Google Ads',
        category: 'Marketing',
        serviceClass: GoogleAdsService,
        authType: 'oauth',
        status: 'disconnected'
      },
      {
        id: 'meta_ads',
        name: 'Meta Ads',
        category: 'Marketing',
        serviceClass: MetaAdsService,
        authType: 'oauth',
        status: 'disconnected'
      },
      {
        id: 'linkedin_ads',
        name: 'LinkedIn Ads',
        category: 'Marketing',
        serviceClass: LinkedInAdsService,
        authType: 'oauth',
        status: 'disconnected'
      },

      // Analytics & Data
      {
        id: 'youtube_analytics',
        name: 'YouTube Analytics',
        category: 'Analytics',
        serviceClass: YoutubeAnalyticsService,
        authType: 'oauth',
        status: 'disconnected'
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel',
        category: 'Analytics',
        serviceClass: MixpanelService,
        authType: 'api_key',
        status: 'disconnected'
      },
      {
        id: 'segment',
        name: 'Segment',
        category: 'Analytics',
        serviceClass: SegmentService,
        authType: 'api_key',
        status: 'disconnected'
      },
      {
        id: 'branch_io',
        name: 'Branch.io',
        category: 'Analytics',
        serviceClass: BranchService,
        authType: 'api_key',
        status: 'disconnected'
      },

      // CRM & Business
      {
        id: 'hubspot_crm',
        name: 'HubSpot CRM',
        category: 'CRM',
        serviceClass: HubSpotService,
        authType: 'oauth',
        status: 'disconnected'
      }
    ];

    integrations.forEach(integration => {
      this.integrationRegistry.set(integration.id, integration);
    });
  }

  /**
   * Get all available integrations
   */
  getAvailableIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrationRegistry.values());
  }

  /**
   * Get a specific integration by ID
   */
  getIntegration(integrationId: string): IntegrationConfig | undefined {
    return this.integrationRegistry.get(integrationId);
  }

  /**
   * Get user's connected integrations
   */
  async getConnectedIntegrations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('provider')
        .eq('user_id', this.userId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching connected integrations:', error);
        return [];
      }

      return data.map(integration => integration.provider);
    } catch (error) {
      console.error('Error fetching connected integrations:', error);
      return [];
    }
  }

  /**
   * Create service instance for a specific integration
   */
  async createServiceInstance(integrationId: string): Promise<any | null> {
    const integration = this.integrationRegistry.get(integrationId);
    if (!integration?.serviceClass) {
      console.error(`No service class found for integration: ${integrationId}`);
      return null;
    }

    try {
      // Try to create service from stored tokens first
      if (integration.serviceClass.createFromUserTokens) {
        const service = await integration.serviceClass.createFromUserTokens(this.userId);
        if (service) {
          return service;
        }
      }

      // Fallback: get credentials manually and create service
      const credentials = await this.getIntegrationCredentials(integrationId);
      if (!credentials) {
        console.warn(`No credentials found for integration: ${integrationId}`);
        return null;
      }

      return new integration.serviceClass(credentials);
    } catch (error) {
      console.error(`Error creating service instance for ${integrationId}:`, error);
      return null;
    }
  }

  /**
   * Save integration credentials securely
   */
  async saveIntegrationCredentials(
    integrationId: string, 
    credentials: IntegrationCredentials,
    accountInfo?: any
  ): Promise<boolean> {
    try {
      // Save to user_tokens table
      const tokenData = {
        user_id: this.userId,
        platform: integrationId,
        access_token: credentials.access_token || credentials.api_key || '',
        refresh_token: credentials.refresh_token || null,
        token_type: 'Bearer',
        expires_at: credentials.expires_at ? new Date(credentials.expires_at).toISOString() : null,
        scope: credentials.scope || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: tokenError } = await supabase
        .from('user_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,platform',
          ignoreDuplicates: false
        });

      if (tokenError) {
        console.error('Error saving token data:', tokenError);
        return false;
      }

      // Save to user_integrations table
      const integrationData = {
        user_id: this.userId,
        provider: integrationId,
        status: 'active',
        account_info: accountInfo || {},
        credentials_encrypted: JSON.stringify(credentials), // In production, encrypt this
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: integrationError } = await supabase
        .from('user_integrations')
        .upsert(integrationData, {
          onConflict: 'user_id,provider',
          ignoreDuplicates: false
        });

      if (integrationError) {
        console.error('Error saving integration data:', integrationError);
        return false;
      }

      // Update local registry
      const integration = this.integrationRegistry.get(integrationId);
      if (integration) {
        integration.status = 'connected';
        integration.credentials = credentials;
        integration.accountInfo = accountInfo;
        this.integrationRegistry.set(integrationId, integration);
      }

      // Log the connection activity
      await this.logIntegrationActivity(integrationId, 'connected', 'Integration successfully connected');

      return true;
    } catch (error) {
      console.error('Error saving integration credentials:', error);
      return false;
    }
  }

  /**
   * Get integration credentials from storage
   */
  async getIntegrationCredentials(integrationId: string): Promise<IntegrationCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('credentials_encrypted, account_info')
        .eq('user_id', this.userId)
        .eq('provider', integrationId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        console.warn(`No credentials found for integration: ${integrationId}`);
        return null;
      }

      // In production, decrypt the credentials
      const credentials = JSON.parse(data.credentials_encrypted || '{}');
      return credentials;
    } catch (error) {
      console.error('Error fetching integration credentials:', error);
      return null;
    }
  }

  /**
   * Test connection for an integration
   */
  async testIntegrationConnection(
    integrationId: string, 
    credentials?: IntegrationCredentials
  ): Promise<ConnectionValidationResult> {
    try {
      const integration = this.integrationRegistry.get(integrationId);
      if (!integration) {
        return {
          valid: false,
          error: 'Integration not found'
        };
      }

      let service;

      if (credentials) {
        // Test with provided credentials
        if (!integration.serviceClass) {
          return {
            valid: false,
            error: 'Service class not available'
          };
        }
        service = new integration.serviceClass(credentials);
      } else {
        // Test with stored credentials
        service = await this.createServiceInstance(integrationId);
      }

      if (!service) {
        return {
          valid: false,
          error: 'Could not create service instance'
        };
      }

      // Call the service's validation method if available
      if (service.validateConnection) {
        const result = await service.validateConnection();
        
        // Update integration status
        if (integration) {
          integration.status = result.valid ? 'connected' : 'error';
          integration.lastSync = new Date().toISOString();
          if (result.accountInfo) {
            integration.accountInfo = result.accountInfo;
          }
          this.integrationRegistry.set(integrationId, integration);
        }

        return result;
      }

      // Fallback: try a basic method call
      const testMethods = ['getAccountInfo', 'getProfile', 'getAccounts', 'validateConnection'];
      
      for (const method of testMethods) {
        if (service[method]) {
          try {
            const result = await service[method]();
            return {
              valid: true,
              accountInfo: result
            };
          } catch (methodError: any) {
            console.warn(`Test method ${method} failed:`, methodError.message);
            continue;
          }
        }
      }

      return {
        valid: false,
        error: 'No test method available for this integration'
      };

    } catch (error: any) {
      console.error(`Error testing connection for ${integrationId}:`, error);
      
      // Update integration status to error
      const integration = this.integrationRegistry.get(integrationId);
      if (integration) {
        integration.status = 'error';
        this.integrationRegistry.set(integrationId, integration);
      }

      return {
        valid: false,
        error: error.message || 'Connection test failed'
      };
    }
  }

  /**
   * Remove an integration
   */
  async removeIntegration(integrationId: string): Promise<boolean> {
    try {
      // Remove from user_integrations
      const { error: integrationError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', this.userId)
        .eq('provider', integrationId);

      if (integrationError) {
        console.error('Error removing integration:', integrationError);
        return false;
      }

      // Remove from user_tokens
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', this.userId)
        .eq('platform', integrationId);

      if (tokenError) {
        console.warn('Error removing tokens:', tokenError);
        // Don't fail the operation for token cleanup errors
      }

      // Update local registry
      const integration = this.integrationRegistry.get(integrationId);
      if (integration) {
        integration.status = 'disconnected';
        integration.credentials = undefined;
        integration.accountInfo = undefined;
        this.integrationRegistry.set(integrationId, integration);
      }

      // Log the disconnection activity
      await this.logIntegrationActivity(integrationId, 'disconnected', 'Integration disconnected');

      return true;
    } catch (error) {
      console.error('Error removing integration:', error);
      return false;
    }
  }

  /**
   * Get integration status with connection health
   */
  async getIntegrationStatus(integrationId: string): Promise<IntegrationConfig | null> {
    const integration = this.integrationRegistry.get(integrationId);
    if (!integration) {
      return null;
    }

    try {
      // Check if we have stored credentials
      const credentials = await this.getIntegrationCredentials(integrationId);
      if (credentials) {
        // Update status based on credential availability
        integration.status = 'connected';
        integration.credentials = credentials;
      } else {
        integration.status = 'disconnected';
      }

      // Optionally, test the connection for real-time status
      // This could be expensive, so maybe only do it periodically
      
      return integration;
    } catch (error) {
      console.error(`Error getting status for ${integrationId}:`, error);
      integration.status = 'error';
      return integration;
    }
  }

  /**
   * Refresh all integration statuses
   */
  async refreshAllIntegrationStatuses(): Promise<IntegrationConfig[]> {
    const integrations = Array.from(this.integrationRegistry.keys());
    const refreshPromises = integrations.map(id => this.getIntegrationStatus(id));
    
    const results = await Promise.allSettled(refreshPromises);
    
    return results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
        
        // Return fallback for failed refreshes
        const integration = this.integrationRegistry.get(integrations[index]);
        if (integration) {
          integration.status = 'error';
          return integration;
        }
        
        return null;
      })
      .filter(Boolean) as IntegrationConfig[];
  }

  /**
   * Log integration activity for audit and debugging
   */
  private async logIntegrationActivity(
    integrationId: string, 
    action: string, 
    details: string
  ): Promise<void> {
    try {
      await supabase.from('user_activities').insert({
        user_id: this.userId,
        action,
        platform: integrationId,
        details: { integration: integrationId, message: details },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log integration activity:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Get integration activity logs
   */
  async getIntegrationLogs(integrationId?: string, limit = 50): Promise<any[]> {
    try {
      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (integrationId) {
        query = query.eq('platform', integrationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching integration logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching integration logs:', error);
      return [];
    }
  }

  /**
   * Bulk enable/disable integrations for an agent
   */
  async updateAgentIntegrations(
    agentId: string, 
    integrationIds: string[]
  ): Promise<boolean> {
    try {
      // Update the agent's enabled integrations
      const { error } = await supabase
        .from('agents')
        .update({ 
          enabled_integrations: integrationIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error updating agent integrations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating agent integrations:', error);
      return false;
    }
  }

  /**
   * Get agent's enabled integrations
   */
  async getAgentIntegrations(agentId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('enabled_integrations')
        .eq('id', agentId)
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        console.warn('No integrations found for agent:', agentId);
        return [];
      }

      return data.enabled_integrations || [];
    } catch (error) {
      console.error('Error fetching agent integrations:', error);
      return [];
    }
  }
}