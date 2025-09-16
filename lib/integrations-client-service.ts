import { signIn } from "next-auth/react"

export interface IntegrationConfig {
  id: string;
  name: string;
  category: string;
  authType: 'oauth' | 'api_key' | 'basic';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  accountInfo?: any;
  description?: string;
  icon?: string;
  features?: string[];
}

export interface IntegrationConnection {
  integrationId: string;
  status: 'connected' | 'disconnected' | 'error';
  accountInfo?: any;
  credentials?: any;
  lastSync?: string;
  errorMessage?: string;
}

export interface IntegrationsData {
  available: IntegrationConfig[];
  connected: IntegrationConnection[];
  message?: string;
}

export class IntegrationsClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/integrations';
  }

  /**
   * Get all available integrations
   */
  public async getAvailableIntegrations(): Promise<IntegrationConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/available`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for NextAuth session
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.integrations || [];
    } catch (error) {
      console.error("Error fetching available integrations:", error);
      return [];
    }
  }

  /**
   * Get user's connected integrations
   */
  public async getConnectedIntegrations(): Promise<IntegrationConnection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/connected`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.connections || [];
    } catch (error) {
      console.error("Error fetching connected integrations:", error);
      return [];
    }
  }

  /**
   * Get integration status for a specific integration
   */
  public async getIntegrationStatus(integrationId: string): Promise<IntegrationConnection | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status?id=${integrationId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.connection || null;
    } catch (error) {
      console.error("Error fetching integration status:", error);
      return null;
    }
  }

  /**
   * Connect to an integration
   */
  public async connectIntegration(integrationId: string, credentials?: any): Promise<{ success: boolean; message?: string; redirectUrl?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          integrationId,
          credentials
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to connect: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: data.message,
        redirectUrl: data.redirectUrl
      };
    } catch (error) {
      console.error("Error connecting integration:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect integration"
      };
    }
  }

  /**
   * Disconnect an integration
   */
  public async disconnectIntegration(integrationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          integrationId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to disconnect: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to disconnect integration"
      };
    }
  }

  /**
   * Test integration connection
   */
  public async testIntegration(integrationId: string): Promise<{ success: boolean; message?: string; accountInfo?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          integrationId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Test failed: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: data.message,
        accountInfo: data.accountInfo
      };
    } catch (error) {
      console.error("Error testing integration:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to test integration"
      };
    }
  }

  /**
   * Get agent's current integrations
   */
  public async getAgentIntegrations(agentId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/${agentId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.integrations || [];
    } catch (error) {
      console.error("Error fetching agent integrations:", error);
      return [];
    }
  }

  /**
   * Update agent's integrations
   */
  public async updateAgentIntegrations(agentId: string, integrations: string[]): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/${agentId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          integrations
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to update: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error("Error updating agent integrations:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update agent integrations"
      };
    }
  }
}

// Convenience functions for backward compatibility
export async function getAvailableIntegrations(userId: string): Promise<IntegrationConfig[]> {
  const service = new IntegrationsClientService(userId);
  return service.getAvailableIntegrations();
}

export async function connectIntegration(userId: string, integrationId: string, credentials?: any) {
  const service = new IntegrationsClientService(userId);
  return service.connectIntegration(integrationId, credentials);
}

export type { IntegrationsData, IntegrationConfig, IntegrationConnection };